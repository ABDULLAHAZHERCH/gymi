'use client';

import { useState, useCallback, useRef } from 'react';
import { config } from '@/lib/config';

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

interface UseChunkedVideoUploadOptions {
  chunkSize?: number;
  maxRetries?: number;
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (result: {
    filename: string;
    file_path: string;
    size: number;
  }) => void;
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

  const uploadChunk = async (
    uploadId: string,
    chunk: Blob,
    chunkIndex: number,
    retries = 0
  ): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('chunk', chunk);

      const res = await fetch(
        `${apiBaseUrl}${config.api.endpoints.uploadChunk}/${uploadId}?chunk_index=${chunkIndex}`,
        {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current?.signal,
        }
      );

      if (!res.ok) throw new Error(`Chunk upload failed: ${res.statusText}`);
      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error;

      if (retries < maxRetries) {
        await new Promise((r) =>
          setTimeout(r, 1000 * Math.pow(2, retries))
        );
        return uploadChunk(uploadId, chunk, chunkIndex, retries + 1);
      }
      throw error;
    }
  };

  /* ---- main upload ---- */

  const upload = useCallback(
    async (file: File) => {
      abortControllerRef.current = new AbortController();
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
        const initRes = await fetch(
          `${apiBaseUrl}${config.api.endpoints.uploadInit}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              total_size: file.size,
              total_chunks: totalChunks,
            }),
            signal: abortControllerRef.current.signal,
          }
        );
        if (!initRes.ok)
          throw new Error(`Init failed: ${initRes.statusText}`);

        const { upload_id } = await initRes.json();
        updateProgress({ status: 'uploading', uploadId: upload_id });

        // 2. Check already-uploaded chunks (resume support)
        let uploaded = new Set<number>();
        try {
          const statusRes = await fetch(
            `${apiBaseUrl}${config.api.endpoints.uploadStatus}/${upload_id}`
          );
          if (statusRes.ok) {
            const status = await statusRes.json();
            uploaded = new Set(status.uploaded_chunks || []);
          }
        } catch {
          /* ignore */
        }

        // 3. Upload chunks sequentially
        for (let i = 0; i < totalChunks; i++) {
          if (isPausedRef.current) {
            updateProgress({ status: 'paused' });
            return;
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
          await uploadChunk(upload_id, file.slice(start, end), i);
          uploaded.add(i);

          updateProgress({
            uploadedChunks: uploaded.size,
            progress: Math.round((uploaded.size / totalChunks) * 100),
          });
        }

        // 4. Complete
        updateProgress({ status: 'completing' });
        const completeRes = await fetch(
          `${apiBaseUrl}${config.api.endpoints.uploadComplete}/${upload_id}`,
          { method: 'POST', signal: abortControllerRef.current.signal }
        );
        if (!completeRes.ok)
          throw new Error('Failed to complete upload');

        const result = await completeRes.json();
        updateProgress({
          status: 'complete',
          progress: 100,
          filePath: result.file_path,
        });
        onComplete?.(result);
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Upload failed');
        updateProgress({ status: 'error', error: err.message });
        onError?.(err);
      }
    },
    [apiBaseUrl, chunkSize, updateProgress, onComplete, onError]
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

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setProgress({
      progress: 0,
      uploadedChunks: 0,
      totalChunks: 0,
      status: 'idle',
    });
  }, []);

  return {
    upload,
    pause,
    resume,
    cancel,
    progress,
    isUploading: progress.status === 'uploading',
  };
}
