'use client';

import { useState, useCallback, useRef } from 'react';
import { config } from '@/lib/config';
import {
  cancelUploadSession,
  completeUploadSession,
  getUploadStatus,
  initUploadSession,
  uploadChunkPart,
} from '@/lib/api/upload';
import type { UploadCompleteResponse } from '@/lib/contracts/integration';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface UploadProgress {
  progress: number;
  uploadedChunks: number;
  totalChunks: number;
  status:
    | 'idle'
    | 'initializing'
    | 'uploading'
    | 'paused'
    | 'completing'
    | 'complete'
    | 'error';
  error?: string;
  uploadId?: string;
  filePath?: string;
}

export type UploadCompleteResult = UploadCompleteResponse;

interface UseChunkedVideoUploadOptions {
  chunkSize?: number;
  maxRetries?: number;
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (result: UploadCompleteResult) => void;
  onError?: (error: Error) => void;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useChunkedVideoUpload(
  options: UseChunkedVideoUploadOptions = {}
) {
  const {
    chunkSize = config.upload.chunkSize,
    maxRetries = config.upload.maxRetries,
    onProgress,
    onComplete,
    onError,
  } = options;

  const apiBaseUrl = config.api.baseUrl;

  const [progress, setProgress] = useState<UploadProgress>({
    progress: 0,
    uploadedChunks: 0,
    totalChunks: 0,
    status: 'idle',
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadIdRef = useRef<string | null>(null);
  const isPausedRef = useRef(false);

  /* ---- helpers ---- */

  const updateProgress = useCallback(
    (update: Partial<UploadProgress>) => {
      setProgress((prev) => {
        const next = { ...prev, ...update };
        onProgress?.(next);
        return next;
      });
    },
    [onProgress]
  );

  const uploadChunkWithRetry = useCallback(
    async function uploadChunkWithRetryFn(
      uploadId: string,
      chunk: Blob,
      chunkIndex: number,
      retries = 0
    ): Promise<void> {
      try {
        await uploadChunkPart(uploadId, chunk, chunkIndex, {
          apiBaseUrl,
          signal: abortControllerRef.current?.signal,
        });
      } catch (error) {
        if ((error as Error).name === 'AbortError') throw error;

        if (retries < maxRetries) {
          await new Promise((r) =>
            setTimeout(r, 1000 * Math.pow(2, retries))
          );
          return uploadChunkWithRetryFn(
            uploadId,
            chunk,
            chunkIndex,
            retries + 1
          );
        }
        throw error;
      }
    },
    [apiBaseUrl, maxRetries]
  );

  /* ---- main upload ---- */

  const upload = useCallback(
    async (file: File): Promise<UploadCompleteResult | null> => {
      abortControllerRef.current = new AbortController();
      uploadIdRef.current = null;
      isPausedRef.current = false;

      const totalChunks = Math.ceil(file.size / chunkSize);
      updateProgress({
        status: 'initializing',
        totalChunks,
        uploadedChunks: 0,
        progress: 0,
      });

      try {
        // 1. Init
        const { upload_id } = await initUploadSession(
          {
            filename: file.name,
            total_size: file.size,
            total_chunks: totalChunks,
          },
          {
            apiBaseUrl,
            signal: abortControllerRef.current.signal,
          }
        );

        uploadIdRef.current = upload_id;
        updateProgress({ status: 'uploading', uploadId: upload_id });

        // 2. Check already-uploaded chunks (resume support)
        let uploaded = new Set<number>();
        try {
          const status = await getUploadStatus(upload_id, { apiBaseUrl });
          uploaded = new Set(status.uploaded_chunks || []);
        } catch {
          /* ignore */
        }

        // 3. Upload chunks sequentially
        for (let i = 0; i < totalChunks; i++) {
          if (isPausedRef.current) {
            updateProgress({ status: 'paused' });
            return null;
          }

          if (uploaded.has(i)) {
            updateProgress({
              uploadedChunks: uploaded.size,
              progress: Math.round((uploaded.size / totalChunks) * 100),
            });
            continue;
          }

          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          await uploadChunkWithRetry(upload_id, file.slice(start, end), i);
          uploaded.add(i);

          updateProgress({
            uploadedChunks: uploaded.size,
            progress: Math.round((uploaded.size / totalChunks) * 100),
          });
        }

        // 4. Complete
        updateProgress({ status: 'completing' });
        const result = await completeUploadSession(upload_id, {
          apiBaseUrl,
          signal: abortControllerRef.current.signal,
        });

        updateProgress({
          status: 'complete',
          progress: 100,
          filePath: result.file_path,
        });
        onComplete?.(result);
        return result;
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Upload failed');
        updateProgress({ status: 'error', error: err.message });
        onError?.(err);
        return null;
      }
    },
    [
      apiBaseUrl,
      chunkSize,
      updateProgress,
      onComplete,
      onError,
      uploadChunkWithRetry,
    ]
  );

  /* ---- controls ---- */

  const pause = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const resume = useCallback(
    async (file: File) => {
      isPausedRef.current = false;
      await upload(file);
    },
    [upload]
  );

  const cancel = useCallback(async () => {
    const uploadId = uploadIdRef.current;

    abortControllerRef.current?.abort();
    uploadIdRef.current = null;

    if (uploadId) {
      try {
        await cancelUploadSession(uploadId, { apiBaseUrl });
      } catch {
        // Ignore cancel endpoint failures to keep local UI responsive.
      }
    }

    setProgress({
      progress: 0,
      uploadedChunks: 0,
      totalChunks: 0,
      status: 'idle',
    });
  }, [apiBaseUrl]);

  return {
    upload,
    pause,
    resume,
    cancel,
    progress,
    isUploading: progress.status === 'uploading',
  };
}
