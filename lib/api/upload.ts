import { config } from '@/lib/config';
import type {
  UploadCancelResponse,
  UploadChunkResponse,
  UploadCompleteResponse,
  UploadInitRequest,
  UploadInitResponse,
  UploadListResponse,
  UploadStatusResponse,
} from '@/lib/contracts/integration';

interface UploadApiOptions {
  signal?: AbortSignal;
  apiBaseUrl?: string;
}

function getBaseUrl(apiBaseUrl?: string): string {
  return (apiBaseUrl || config.api.baseUrl).replace(/\/$/, '');
}

async function parseOrThrow<T>(response: Response, context: string): Promise<T> {
  if (!response.ok) {
    throw new Error(`${context} failed: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return { status: text } as T;
  }
}

export async function initUploadSession(
  request: UploadInitRequest,
  options: UploadApiOptions = {}
): Promise<UploadInitResponse> {
  const response = await fetch(
    `${getBaseUrl(options.apiBaseUrl)}${config.api.endpoints.uploadInit}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: options.signal,
    }
  );

  return parseOrThrow<UploadInitResponse>(response, 'Upload init');
}

export async function uploadChunkPart(
  uploadId: string,
  chunk: Blob,
  chunkIndex: number,
  options: UploadApiOptions = {}
): Promise<UploadChunkResponse> {
  const formData = new FormData();
  formData.append('chunk', chunk);

  const response = await fetch(
    `${getBaseUrl(options.apiBaseUrl)}${config.api.endpoints.uploadChunk}/${uploadId}?chunk_index=${chunkIndex}`,
    {
      method: 'POST',
      body: formData,
      signal: options.signal,
    }
  );

  return parseOrThrow<UploadChunkResponse>(response, 'Chunk upload');
}

export async function getUploadStatus(
  uploadId: string,
  options: UploadApiOptions = {}
): Promise<UploadStatusResponse> {
  const response = await fetch(
    `${getBaseUrl(options.apiBaseUrl)}${config.api.endpoints.uploadStatus}/${uploadId}`,
    {
      method: 'GET',
      signal: options.signal,
    }
  );

  return parseOrThrow<UploadStatusResponse>(response, 'Upload status');
}

export async function completeUploadSession(
  uploadId: string,
  options: UploadApiOptions = {}
): Promise<UploadCompleteResponse> {
  const response = await fetch(
    `${getBaseUrl(options.apiBaseUrl)}${config.api.endpoints.uploadComplete}/${uploadId}`,
    {
      method: 'POST',
      signal: options.signal,
    }
  );

  return parseOrThrow<UploadCompleteResponse>(response, 'Upload complete');
}

export async function cancelUploadSession(
  uploadId: string,
  options: UploadApiOptions = {}
): Promise<UploadCancelResponse> {
  const response = await fetch(
    `${getBaseUrl(options.apiBaseUrl)}${config.api.endpoints.uploadCancel}/${uploadId}`,
    {
      method: 'DELETE',
      signal: options.signal,
    }
  );

  return parseOrThrow<UploadCancelResponse>(response, 'Upload cancel');
}

export async function listUploadedFiles(
  options: UploadApiOptions = {}
): Promise<UploadListResponse> {
  const response = await fetch(
    `${getBaseUrl(options.apiBaseUrl)}${config.api.endpoints.uploadFiles}`,
    {
      method: 'GET',
      signal: options.signal,
    }
  );

  return parseOrThrow<UploadListResponse>(response, 'Upload list files');
}
