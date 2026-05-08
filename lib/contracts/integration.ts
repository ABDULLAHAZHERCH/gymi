export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface JointAngle {
  name: string;
  angle: number;
  status: 'good' | 'warning' | 'poor';
}

export interface FormFeedback {
  exercise: string;
  overallScore: number;
  angles: JointAngle[];
  posture: string;
  suggestions: string[];
  timestamp: number;
}

export interface WsPoseRequest {
  landmarks: PoseLandmark[];
  timestamp: number;
}

export type SystemState = 'idle' | 'stationary' | 'scanning' | 'active';
export type RepPhase = 'idle' | 'setup' | 'eccentric' | 'concentric' | 'hold';

export interface WsFormCorrectionResponse {
  state: SystemState;
  current_exercise: string | null;
  exercise_display: string;
  rep_count: number;
  rep_phase: RepPhase;
  phase_display: string;
  is_rep_valid: boolean;
  violations: string[];
  corrections: string[];
  correction_message: string;
  joint_colors: Record<string, string>;
  confidence: number;
  is_stationary: boolean;
  timestamp: number;
  exercise_confidence?: number;
  form_confidence?: number;
  signal_quality?: string;
  exercise_variant?: string | null;
  exercise_source?: string;
}

export interface CoachRepDetail {
  repNumber: number;
  isValid: boolean;
  violations: string[];
  confidence: number;
  timestamp: number;
}

export interface CoachSession {
  id?: string;
  detectedExercise: string;
  totalReps: number;
  validReps: number;
  accuracy: number;
  duration: number;
  avgConfidence: number;
  violationCounts: Record<string, number>;
  repBreakdown: CoachRepDetail[];
  date: Date;
  createdAt?: Date;
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
