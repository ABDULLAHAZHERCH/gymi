'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Maximize,
  Minimize,
  Video,
  Upload,
  Wifi,
  Timer,
  Target,
  TrendingUp,
  AlertTriangle,
  SwitchCamera,
  Loader,
  Camera,
  AlertCircle,
} from 'lucide-react';
import {
  usePoseWebSocket,
  type FormCorrectionResponse,
  type PoseLandmark,
} from '@/lib/hooks/usePoseWebSocket';
import { useChunkedVideoUpload } from '@/lib/hooks/useChunkedVideoUpload';
import { useToast } from '@/lib/contexts/ToastContext';
import { useAuth } from '@/components/providers/AuthProvider';
import AppLayout from '@/components/layout/AppLayout';
import { config } from '@/lib/config';
import {
  getPoseLandmarker,
  extractLandmarks,
  resetPoseLandmarker,
} from '@/lib/mediapipe';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Minimum interval (ms) between MediaPipe detections (~20 fps). */
const DETECTION_INTERVAL_MS = 50;

/** Joint-name mapping for skeleton overlay colors from backend */
const JOINT_NAMES: Record<number, string> = {
  11: 'left_shoulder',
  12: 'right_shoulder',
  13: 'left_elbow',
  14: 'right_elbow',
  15: 'left_wrist',
  16: 'right_wrist',
  23: 'left_hip',
  24: 'right_hip',
  25: 'left_knee',
  26: 'right_knee',
  27: 'left_ankle',
  28: 'right_ankle',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Coach Page — AI-powered real-time exercise form analysis.
 *
 * Pipeline:
 *   Camera ─► MediaPipe PoseLandmarker ─► WebSocket ─► Backend
 *   Backend ──────────────────────────────────────────► UI Feedback
 */
export default function CoachPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mediapipeReady, setMediapipeReady] = useState(false);
  const [mediapipeLoading, setMediapipeLoading] = useState(false);

  const [feedback, setFeedback] = useState<FormCorrectionResponse | null>(null);
  const [exerciseMode, setExerciseMode] = useState<'live' | 'upload'>('live');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    'environment'
  );
  const [sessionStats, setSessionStats] = useState({
    totalReps: 0,
    validReps: 0,
    startTime: 0,
    duration: 0,
  });

  // Pose detection ref
  const poseLandmarkerRef = useRef<any>(null);
  const lastDetectTimeRef = useRef(0);

  // WebSocket hook
  const {
    isConnected,
    isConnecting,
    sendLandmarks,
    lastResponse,
    resetSession,
    connect: wsConnect,
    disconnect: wsDisconnect,
  } = usePoseWebSocket({
    clientId: user?.uid || `guest-${Date.now()}`,
    enabled: false, // manual connect/disconnect
    onMessage: (response) => {
      setFeedback(response);
      setSessionStats((prev) => {
        const next = { ...prev };
        if (response.rep_count > next.totalReps) {
          next.totalReps = response.rep_count;
          if (response.is_rep_valid) {
            next.validReps += 1;
          }
        }
        return next;
      });
    },
    onConnect: () => showToast('Connected to form analysis', 'success'),
    onError: () =>
      showToast('Connection error. Please try again.', 'error'),
    onDisconnect: () =>
      showToast('Disconnected from form analysis', 'warning'),
  });

  // Video upload hook
  const {
    upload: uploadVideo,
    progress: uploadProgress,
    isUploading,
    cancel: cancelUpload,
  } = useChunkedVideoUpload({
    onComplete: (result) =>
      showToast(`Video uploaded: ${result.filename}`, 'success'),
    onError: (err) => showToast(`Upload failed: ${err.message}`, 'error'),
  });

  /* --------------------------------------------------------------- */
  /*  MediaPipe initialisation                                        */
  /* --------------------------------------------------------------- */

  const initMediaPipe = useCallback(async () => {
    if (poseLandmarkerRef.current) return;
    setMediapipeLoading(true);
    try {
      poseLandmarkerRef.current = await getPoseLandmarker(
        config.pose.modelPath
      );
      setMediapipeReady(true);
    } catch (err) {
      console.error('[Coach] MediaPipe init failed:', err);
      showToast('Failed to load pose detection model', 'error');
      resetPoseLandmarker();
    } finally {
      setMediapipeLoading(false);
    }
  }, [showToast]);

  /* --------------------------------------------------------------- */
  /*  Camera management                                               */
  /* --------------------------------------------------------------- */

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      const e = err as Error;
      if (e.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please enable camera access.');
      } else if (e.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Camera error. Please check permissions and try again.');
      }
    }
  }, [facingMode]);

  /* --------------------------------------------------------------- */
  /*  Frame processing loop (MediaPipe → WebSocket)                   */
  /* --------------------------------------------------------------- */

  const processFrame = useCallback(() => {
    if (!videoRef.current || !poseLandmarkerRef.current) return;

    const video = videoRef.current;
    if (video.readyState < 2) {
      // video not ready yet
      animFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const now = performance.now();
    if (now - lastDetectTimeRef.current >= DETECTION_INTERVAL_MS) {
      lastDetectTimeRef.current = now;

      try {
        const result = poseLandmarkerRef.current.detectForVideo(video, now);
        const landmarks: PoseLandmark[] = extractLandmarks(result);

        if (landmarks.length > 0) {
          // Send to backend
          sendLandmarks(landmarks, now);

          // Draw skeleton overlay
          drawSkeleton(
            overlayCanvasRef.current,
            video,
            landmarks,
            feedback?.joint_colors ?? {}
          );
        }
      } catch {
        // Occasional detection failures are expected — skip frame
      }
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [sendLandmarks, feedback?.joint_colors]);

  /* --------------------------------------------------------------- */
  /*  Session controls                                                */
  /* --------------------------------------------------------------- */

  const handleStartSession = useCallback(async () => {
    setIsStreaming(true);
    setSessionStats({
      totalReps: 0,
      validReps: 0,
      startTime: Date.now(),
      duration: 0,
    });

    // 1. Init MediaPipe (lazy, singleton)
    await initMediaPipe();

    // 2. Start camera
    await startCamera();

    // 3. Connect WebSocket
    wsConnect();
  }, [initMediaPipe, startCamera, wsConnect]);

  const handleStopSession = useCallback(() => {
    setIsStreaming(false);
    stopCamera();
    wsDisconnect();
  }, [stopCamera, wsDisconnect]);

  const handleReset = useCallback(async () => {
    await resetSession();
    setFeedback(null);
    setSessionStats({ totalReps: 0, validReps: 0, startTime: 0, duration: 0 });
    showToast('Session reset', 'info');
  }, [resetSession, showToast]);

  /* --------------------------------------------------------------- */
  /*  Start detection loop once camera + mediapipe + ws are ready     */
  /* --------------------------------------------------------------- */

  useEffect(() => {
    if (isStreaming && cameraReady && mediapipeReady && isConnected) {
      animFrameRef.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isStreaming, cameraReady, mediapipeReady, isConnected, processFrame]);

  /* --------------------------------------------------------------- */
  /*  Fullscreen                                                      */
  /* --------------------------------------------------------------- */

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      showToast('Fullscreen not supported', 'warning');
    }
  };

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  /* --------------------------------------------------------------- */
  /*  Session timer                                                   */
  /* --------------------------------------------------------------- */

  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setSessionStats((prev) => ({
        ...prev,
        duration: Math.floor((Date.now() - prev.startTime) / 1000),
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  /* --------------------------------------------------------------- */
  /*  Cleanup on unmount                                              */
  /* --------------------------------------------------------------- */

  useEffect(() => {
    return () => {
      stopCamera();
      wsDisconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------------------------------------- */
  /*  File upload handler                                             */
  /* --------------------------------------------------------------- */

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadVideo(file);
      }
    },
    [uploadVideo]
  );

  /* --------------------------------------------------------------- */
  /*  Derived values                                                  */
  /* --------------------------------------------------------------- */

  const accuracyPercent =
    sessionStats.totalReps > 0
      ? Math.round((sessionStats.validReps / sessionStats.totalReps) * 100)
      : 0;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const isInitializing =
    isStreaming && (!cameraReady || mediapipeLoading || isConnecting);

  /* ================================================================ */
  /*  RENDER — Fullscreen                                             */
  /* ================================================================ */

  if (isFullscreen) {
    return (
      <div ref={containerRef} className="relative h-screen w-screen bg-black">
        {/* Camera */}
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          <canvas
            ref={overlayCanvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* Top status bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
            />
            <span className="text-xs font-medium text-white/80">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {isStreaming && (
            <div className="flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              <span className="text-xs font-semibold text-white">
                {formatTime(sessionStats.duration)}
              </span>
            </div>
          )}
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent pb-6 pt-12">
          {feedback?.correction_message && (
            <div className="mx-4 mb-4 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-md">
              <p className="text-center text-sm text-white">
                {feedback.correction_message}
              </p>
            </div>
          )}

          {feedback && (
            <div className="mx-4 mb-4 flex justify-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {feedback.rep_count}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-white/60">
                  Reps
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {accuracyPercent}%
                </p>
                <p className="text-[10px] uppercase tracking-wider text-white/60">
                  Accuracy
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {(feedback.confidence * 100).toFixed(0)}%
                </p>
                <p className="text-[10px] uppercase tracking-wider text-white/60">
                  Confidence
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleReset}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-colors hover:bg-white/25"
              title="Reset"
            >
              <RotateCcw className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={isStreaming ? handleStopSession : handleStartSession}
              className={`flex h-16 w-16 items-center justify-center rounded-full transition-all active:scale-95 ${
                isStreaming
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-white hover:bg-zinc-200'
              }`}
            >
              {isStreaming ? (
                <Square className="h-6 w-6 text-white" />
              ) : (
                <Play className="h-6 w-6 text-black ml-0.5" />
              )}
            </button>
            <button
              onClick={toggleFullscreen}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-colors hover:bg-white/25"
              title="Exit fullscreen"
            >
              <Minimize className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  RENDER — Normal layout                                          */
  /* ================================================================ */

  return (
    <AppLayout title="AI Form Coach">
      <section className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--foreground)] sm:text-2xl">
              Form Coach
            </h2>
            <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
              AI-powered exercise analysis
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-xs text-[color:var(--muted-foreground)]">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setExerciseMode('live')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
              exerciseMode === 'live'
                ? 'bg-[color:var(--foreground)] text-[color:var(--background)]'
                : 'border border-zinc-200 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] dark:border-zinc-800'
            }`}
          >
            <Video className="h-4 w-4" />
            Live
          </button>
          <button
            onClick={() => setExerciseMode('upload')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
              exerciseMode === 'upload'
                ? 'bg-[color:var(--foreground)] text-[color:var(--background)]'
                : 'border border-zinc-200 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] dark:border-zinc-800'
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
        </div>

        {/* Camera / Upload area */}
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-sm dark:border-zinc-800"
        >
          {exerciseMode === 'live' && isStreaming ? (
            <div className="relative aspect-[4/3] w-full sm:aspect-video">
              {/* Native video element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />

              {/* Skeleton overlay canvas */}
              <canvas
                ref={overlayCanvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              />

              {/* Initializing indicator */}
              {isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50">
                  <Loader className="h-8 w-8 animate-spin text-white" />
                  <p className="text-sm text-white/80">
                    {mediapipeLoading
                      ? 'Loading pose model…'
                      : !cameraReady
                        ? 'Starting camera…'
                        : 'Connecting…'}
                  </p>
                </div>
              )}

              {/* Camera error */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black p-4">
                  <AlertCircle className="h-12 w-12 text-red-400" />
                  <p className="text-center text-sm text-red-300">
                    {cameraError}
                  </p>
                </div>
              )}
            </div>
          ) : exerciseMode === 'live' && !isStreaming ? (
            /* Placeholder */
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 sm:aspect-video">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <Video className="h-6 w-6 text-white/60" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/80">
                  Live Camera
                </p>
                <p className="text-xs text-white/40 mt-1">
                  Press play to start
                </p>
              </div>
            </div>
          ) : (
            /* Upload mode */
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 sm:aspect-video">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <Upload className="h-6 w-6 text-white/60" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/80">
                  Upload a video
                </p>
                <p className="text-xs text-white/40 mt-1">
                  MP4, MOV supported
                </p>
              </div>

              {/* Upload progress bar */}
              {isUploading && (
                <div className="mx-6 w-full max-w-xs">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-center text-xs text-white/50">
                    {uploadProgress.progress}%
                  </p>
                </div>
              )}

              <input
                type="file"
                accept="video/*"
                className="hidden"
                id="video-upload"
                onChange={handleFileSelect}
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer rounded-xl bg-white/10 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                {isUploading ? 'Uploading…' : 'Choose File'}
              </label>
            </div>
          )}

          {/* Live recording badge */}
          {isStreaming && !isInitializing && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-red-500/90 px-2.5 py-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              <span className="text-[10px] font-semibold text-white">
                {formatTime(sessionStats.duration)}
              </span>
            </div>
          )}

          {/* Feedback overlay on camera */}
          {feedback?.correction_message && isStreaming && (
            <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/60 px-3 py-2 backdrop-blur-sm">
              <p className="text-center text-xs text-white sm:text-sm">
                {feedback.correction_message}
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {exerciseMode === 'live' && (
            <button
              onClick={() => {
                const next =
                  facingMode === 'user' ? 'environment' : 'user';
                setFacingMode(next);
                if (isStreaming) {
                  // Restart camera with new facing mode
                  stopCamera();
                  // startCamera will use the updated facingMode after re-render
                  setTimeout(() => startCamera(), 100);
                }
              }}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)] dark:border-zinc-800"
              title="Switch camera"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={handleReset}
            disabled={!feedback && sessionStats.totalReps === 0}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)] disabled:opacity-30 dark:border-zinc-800"
            title="Reset session"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          <button
            onClick={isStreaming ? handleStopSession : handleStartSession}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white transition-all active:scale-95 ${
              isStreaming
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-[color:var(--foreground)] hover:opacity-90'
            }`}
            title={isStreaming ? 'Stop' : 'Start'}
          >
            {isStreaming ? (
              <Square className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 text-[color:var(--background)] ml-0.5" />
            )}
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)] dark:border-zinc-800"
            title="Fullscreen"
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>

        {/* Stats cards */}
        {feedback && (
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <div className="rounded-xl border border-zinc-200 bg-[color:var(--background)] p-3 text-center dark:border-zinc-800">
              <Target className="mx-auto mb-1 h-4 w-4 text-[color:var(--muted-foreground)]" />
              <p className="text-lg font-bold text-[color:var(--foreground)]">
                {feedback.rep_count}
              </p>
              <p className="text-[10px] text-[color:var(--muted-foreground)]">
                Reps
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-[color:var(--background)] p-3 text-center dark:border-zinc-800">
              <TrendingUp className="mx-auto mb-1 h-4 w-4 text-[color:var(--muted-foreground)]" />
              <p className="text-lg font-bold text-[color:var(--foreground)]">
                {accuracyPercent}%
              </p>
              <p className="text-[10px] text-[color:var(--muted-foreground)]">
                Accuracy
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-[color:var(--background)] p-3 text-center dark:border-zinc-800">
              <Timer className="mx-auto mb-1 h-4 w-4 text-[color:var(--muted-foreground)]" />
              <p className="text-lg font-bold text-[color:var(--foreground)]">
                {formatTime(sessionStats.duration)}
              </p>
              <p className="text-[10px] text-[color:var(--muted-foreground)]">
                Time
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-[color:var(--background)] p-3 text-center dark:border-zinc-800">
              <Wifi className="mx-auto mb-1 h-4 w-4 text-[color:var(--muted-foreground)]" />
              <p className="text-lg font-bold text-[color:var(--foreground)]">
                {(feedback.confidence * 100).toFixed(0)}%
              </p>
              <p className="text-[10px] text-[color:var(--muted-foreground)]">
                Confidence
              </p>
            </div>
          </div>
        )}

        {/* Exercise detected */}
        {feedback?.exercise_display && (
          <div className="flex items-center justify-center rounded-xl border border-zinc-200 py-3 dark:border-zinc-800">
            <p className="text-sm font-medium text-[color:var(--foreground)]">
              {feedback.exercise_display}
            </p>
          </div>
        )}

        {/* Violations */}
        {feedback && feedback.violations.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Form Issues
              </p>
            </div>
            <ul className="space-y-1">
              {feedback.violations.map((v, i) => (
                <li
                  key={i}
                  className="text-xs text-red-600 dark:text-red-300"
                >
                  • {v}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty state */}
        {!feedback && !isStreaming && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-10 dark:border-zinc-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <Play className="h-5 w-5 text-[color:var(--muted-foreground)] ml-0.5" />
            </div>
            <p className="mt-3 text-sm font-medium text-[color:var(--foreground)]">
              Ready to train
            </p>
            <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
              Hit play to start AI form analysis
            </p>
          </div>
        )}

        {/* Detecting state */}
        {!feedback && isStreaming && !isInitializing && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 py-4 dark:border-zinc-800">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            <p className="text-sm text-[color:var(--muted-foreground)]">
              Detecting exercise…
            </p>
          </div>
        )}
      </section>
    </AppLayout>
  );
}

/* ================================================================== */
/*  Skeleton drawing helpers                                           */
/* ================================================================== */

function drawSkeleton(
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement,
  landmarks: PoseLandmark[],
  jointColors: Record<string, string>
) {
  if (!canvas || !video.videoWidth || !video.videoHeight) return;

  const w = video.videoWidth;
  const h = video.videoHeight;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);

  // Draw connections
  const chains = [
    [11, 13, 15], // left arm
    [12, 14, 16], // right arm
    [11, 23, 25, 27], // left body/leg
    [12, 24, 26, 28], // right body/leg
    [11, 12], // shoulders
    [23, 24], // hips
  ];

  ctx.lineWidth = 3;

  chains.forEach((chain) => {
    for (let i = 0; i < chain.length - 1; i++) {
      const from = landmarks[chain[i]];
      const to = landmarks[chain[i + 1]];
      if (from && to && from.visibility > 0.5 && to.visibility > 0.5) {
        // Use joint color if available, default green
        const key = JOINT_NAMES[chain[i]] || JOINT_NAMES[chain[i + 1]];
        ctx.strokeStyle =
          jointColors[key] || 'rgba(34, 197, 94, 0.7)';
        ctx.beginPath();
        ctx.moveTo(from.x * w, from.y * h);
        ctx.lineTo(to.x * w, to.y * h);
        ctx.stroke();
      }
    }
  });

  // Draw joints
  landmarks.forEach((lm, idx) => {
    if (lm.visibility > 0.5) {
      const key = JOINT_NAMES[idx];
      const color = (key && jointColors[key]) || '#22c55e';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
}
