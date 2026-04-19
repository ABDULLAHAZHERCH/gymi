export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface WsPoseRequest {
  landmarks: PoseLandmark[];
  timestamp: number;
}

export interface WsFormCorrectionResponse {
  state: 'idle' | 'scanning' | 'active';
  current_exercise: string | null;
  exercise_display: string;
  rep_count: number;
  rep_phase: string;
  is_rep_valid: boolean;
  violations: string[];
  corrections: string[];
  correction_message: string;
  joint_colors: Record<string, string>;
  confidence: number;
  timestamp: number;
}

export interface UploadInitRequest {
  filename: string;
  total_size: number;
  total_chunks: number;
  file_hash?: string;
}

export interface UploadInitResponse {
  upload_id: string;
  chunk_size: number;
}

export interface UploadChunkResponse {
  chunk_index: number;
  uploaded_chunks: number;
  total_chunks: number;
  progress: number;
}

export interface UploadStatusResponse {
  upload_id: string;
  uploaded_chunks: number[];
  total_chunks: number;
  progress: number;
  status: string;
}

export interface UploadCompleteResponse {
  status: string;
  filename: string;
  file_path: string;
  size: number;
}

export interface UploadCancelResponse {
  status: string;
  upload_id?: string;
  message?: string;
}

export interface UploadedFileEntry {
  filename: string;
  file_path: string;
  size?: number;
  created_at?: string;
}

export type UploadListResponse =
  | UploadedFileEntry[]
  | string[]
  | {
      files: UploadedFileEntry[] | string[];
    };
