'use client';

import { useCallback, useRef, useEffect, useState, useId } from 'react';
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
  AlertCircle,
  Activity,
  Save,
  Pause,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  usePoseWebSocket,
  type FormCorrectionResponse,
  type PoseLandmark,
} from '@/lib/hooks/usePoseWebSocket';
import { useToast } from '@/lib/contexts/ToastContext';
import { useAuth } from '@/components/providers/AuthProvider';
import AppLayout from '@/components/layout/AppLayout';
import CoachAgentPanel from '@/components/features/CoachAgentPanel';
import { config } from '@/lib/config';
import {
  getPoseLandmarker,
  extractLandmarks,
  resetPoseLandmarker,
} from '@/lib/mediapipe';
import { saveCoachSession } from '@/lib/coachSessions';
import type { CameraViewPreference, CoachRepDetail } from '@/lib/contracts/integration';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Minimum interval (ms) between MediaPipe detections (~20 fps). */
const DETECTION_INTERVAL_MS = 50;

/** Minimum landmark visibility for drawing joints/segments. */
const MIN_DRAW_VISIBILITY = 0.2;

function formatLoadError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error instanceof Event) {
    const target = error.target as HTMLScriptElement | null;
    return target?.src
      ? `Failed to load ${target.src}`
      : `Browser ${error.type} event`;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

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

interface PoseLandmarkerLike {
  detectForVideo: (video: HTMLVideoElement, now: number) => unknown;
}

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
  const guestId = useId().replace(/[:]/g, '_');
  const stableClientId = user?.uid || `guest_${guestId}`;

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

  const [formResponse, setFormResponse] = useState<FormCorrectionResponse | null>(null);
  const [currentLandmarks, setCurrentLandmarks] = useState<PoseLandmark[]>([]);
  const [exerciseMode, setExerciseMode] = useState<'live' | 'upload'>('live');
  const [cameraView, setCameraView] = useState<CameraViewPreference>('auto');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [isPreparingUploadVideo, setIsPreparingUploadVideo] = useState(false);
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
  const poseLandmarkerRef = useRef<PoseLandmarkerLike | null>(null);
  const lastDetectTimeRef = useRef(0);
  const lastFrameTimestampRef = useRef(0);
  const uploadObjectUrlRef = useRef<string | null>(null);
  const jointColorsRef = useRef<Record<string, string>>({});
  const uploadPlayStartingRef = useRef(false);

  // Per-rep aggregation buffers (refs to avoid 20fps state churn)
  const repBreakdownRef = useRef<CoachRepDetail[]>([]);
  const violationCountsRef = useRef<Record<string, number>>({});
  const confidenceSumRef = useRef(0);
  const confidenceFramesRef = useRef(0);

  const [isSaving, setIsSaving] = useState(false);
  const [connectingTooLong, setConnectingTooLong] = useState(false);

  // WebSocket hook
  const {
    isConnected,
    isConnecting,
    sendLandmarks,
    resetSession,
    connect: wsConnect,
    disconnect: wsDisconnect,
  } = usePoseWebSocket({
    clientId: stableClientId,
    enabled: false, // manual connect/disconnect
    cameraView,
    onMessage: (response) => {
      setFormResponse(response);

      // Track confidence across all frames
      if (typeof response.confidence === 'number' && response.confidence > 0) {
        confidenceSumRef.current += response.confidence;
        confidenceFramesRef.current += 1;
      }

      // Track violation occurrences (frame-level approximation; aggregated per
      // session, not per rep — gives us a good "what kept going wrong" view).
      response.violations?.forEach((violation) => {
        violationCountsRef.current[violation] =
          (violationCountsRef.current[violation] ?? 0) + 1;
      });

      setSessionStats((prev) => {
        if (response.rep_count > prev.totalReps) {
          // Append per-rep detail for this newly-counted rep.
          repBreakdownRef.current.push({
            repNumber: response.rep_count,
            isValid: response.is_rep_valid,
            violations: [...(response.violations ?? [])],
            confidence: response.confidence ?? 0,
            timestamp: Date.now(),
          });
          return {
            ...prev,
            totalReps: response.rep_count,
            validReps: response.is_rep_valid ? prev.validReps + 1 : prev.validReps,
          };
        }
        return prev;
      });
    },
    onConnect: () => showToast('Connected to form analysis', 'success'),
    onError: () =>
      showToast('Connection error. Please try again.', 'error'),
    onDisconnect: () =>
      showToast('Disconnected from form analysis', 'warning'),
  });

  /* --------------------------------------------------------------- */
  /*  MediaPipe initialisation                                        */
  /* --------------------------------------------------------------- */

  const initMediaPipe = useCallback(async () => {
    if (poseLandmarkerRef.current) return;
    setMediapipeLoading(true);
    try {
      poseLandmarkerRef.current = (await getPoseLandmarker(
        config.pose.modelPath
      )) as PoseLandmarkerLike;
      setMediapipeReady(true);
    } catch (err) {
      console.error('[Coach] MediaPipe init failed:', formatLoadError(err), err);
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
      videoRef.current.pause();
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
      throw e;
    }
  }, [facingMode]);

  const loadUploadedFile = useCallback((file: File) => {
    if (uploadObjectUrlRef.current) {
      URL.revokeObjectURL(uploadObjectUrlRef.current);
      uploadObjectUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    uploadObjectUrlRef.current = objectUrl;

    setUploadedVideoUrl(objectUrl);
    setUploadedFilename(file.name);
    setIsPreparingUploadVideo(true);
    setCameraError(null);
    setCameraReady(false);
    setCurrentLandmarks([]);
    setFormResponse(null);
  }, []);

  /* --------------------------------------------------------------- */
  /*  Frame processing loop (MediaPipe → landmarks state)             */
  /* --------------------------------------------------------------- */

  const processFrame = useCallback(() => {
    if (!videoRef.current || !poseLandmarkerRef.current) return;

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;

    const clearOverlay = () => {
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    if (video.readyState < 2) {
      // video not ready yet
      clearOverlay();
      animFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    if (video.paused || video.ended) {
      animFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const now = performance.now();
    if (now - lastDetectTimeRef.current >= DETECTION_INTERVAL_MS) {
      lastDetectTimeRef.current = now;

      // MediaPipe expects timestamps to be globally monotonic for a landmarker instance.
      // Do not use video.currentTime here, because replaying upload/live sources resets it.
      const monotonicNowMs = Math.floor(now);
      const frameTimestampMs = Math.max(
        monotonicNowMs,
        lastFrameTimestampRef.current + 1
      );
      lastFrameTimestampRef.current = frameTimestampMs;

      try {
        const result = poseLandmarkerRef.current.detectForVideo(
          video,
          frameTimestampMs
        );
        const landmarks: PoseLandmark[] = extractLandmarks(result);

        if (landmarks.length === 33) {
          setCurrentLandmarks(landmarks);
          drawSkeleton(
            canvas,
            video,
            landmarks,
            jointColorsRef.current
          );
        } else {
          setCurrentLandmarks([]);
          clearOverlay();
        }
      } catch {
        // Occasional detection failures are expected — skip frame
        clearOverlay();
      }
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  }, []);

  /* --------------------------------------------------------------- */
  /*  Session controls                                                */
  /* --------------------------------------------------------------- */

  const handleStartSession = useCallback(async () => {
    if (exerciseMode === 'upload' && isPreparingUploadVideo) {
      showToast('Please wait while the uploaded video is preparing', 'info');
      return;
    }

    if (exerciseMode === 'upload' && !uploadedVideoUrl) {
      showToast('Upload a video before starting analysis', 'warning');
      return;
    }

    if (exerciseMode === 'upload') {
      const video = videoRef.current;
      if (!video) {
        showToast('Uploaded video is not ready', 'warning');
        return;
      }

      setCameraError(null);
      if (video.ended) {
        video.currentTime = 0;
      }

      try {
        await video.play();
      } catch {
        showToast('Unable to play uploaded video', 'error');
      }
      return;
    }

    setFormResponse(null);
    setCurrentLandmarks([]);
    setCameraError(null);
    setIsStreaming(true);
    repBreakdownRef.current = [];
    violationCountsRef.current = {};
    confidenceSumRef.current = 0;
    confidenceFramesRef.current = 0;
    setSessionStats({
      totalReps: 0,
      validReps: 0,
      startTime: Date.now(),
      duration: 0,
    });

    try {
      // 1. Init MediaPipe (lazy, singleton)
      await initMediaPipe();

      // 2. Start live camera input
      await startCamera();
    } catch {
      setIsStreaming(false);
      stopCamera();
      showToast('Unable to start analysis session', 'error');
    }
  }, [
    exerciseMode,
    isPreparingUploadVideo,
    uploadedVideoUrl,
    showToast,
    initMediaPipe,
    startCamera,
    stopCamera,
  ]);

  const handleUploadVideoPlay = useCallback(async () => {
    if (exerciseMode !== 'upload') return;
    if (isStreaming || uploadPlayStartingRef.current) return;
    if (isPreparingUploadVideo || !uploadedVideoUrl) return;

    uploadPlayStartingRef.current = true;
    setCameraError(null);
    setFormResponse(null);
    setCurrentLandmarks([]);
    repBreakdownRef.current = [];
    violationCountsRef.current = {};
    confidenceSumRef.current = 0;
    confidenceFramesRef.current = 0;
    setSessionStats({
      totalReps: 0,
      validReps: 0,
      startTime: Date.now(),
      duration: 0,
    });
    setIsStreaming(true);

    try {
      await initMediaPipe();
      setCameraReady(true);
    } catch {
      setIsStreaming(false);
      showToast('Unable to start analysis session', 'error');
    } finally {
      uploadPlayStartingRef.current = false;
    }
  }, [
    exerciseMode,
    isStreaming,
    isPreparingUploadVideo,
    uploadedVideoUrl,
    initMediaPipe,
    showToast,
  ]);

  const handleUploadVideoPause = useCallback(() => {
    if (exerciseMode !== 'upload') return;
    if (uploadPlayStartingRef.current) return;

    setIsStreaming(false);
    setCurrentLandmarks([]);
  }, [exerciseMode]);

  const handleUploadVideoEnded = useCallback(() => {
    if (exerciseMode !== 'upload') return;

    setIsStreaming(false);
    setCurrentLandmarks([]);
    showToast('Uploaded video analysis complete', 'success');
  }, [exerciseMode, showToast]);

  const handleStopSession = useCallback(() => {
    setIsStreaming(false);
    setCurrentLandmarks([]);
    stopCamera();
    wsDisconnect();
  }, [stopCamera, wsDisconnect]);

  const handleClearUpload = useCallback(() => {
    if (isStreaming) {
      handleStopSession();
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        /* ignore */
      }
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }

    if (uploadObjectUrlRef.current) {
      URL.revokeObjectURL(uploadObjectUrlRef.current);
      uploadObjectUrlRef.current = null;
    }

    setUploadedVideoUrl(null);
    setUploadedFilename(null);
    setIsPreparingUploadVideo(false);
    setCurrentLandmarks([]);
    setFormResponse(null);
    uploadPlayStartingRef.current = false;
  }, [isStreaming, handleStopSession]);

  const handleModeChange = useCallback(
    (nextMode: 'live' | 'upload') => {
      if (nextMode === exerciseMode) return;

      if (isStreaming) {
        handleStopSession();
      } else {
        stopCamera();
      }

      setCurrentLandmarks([]);
      setFormResponse(null);
      setExerciseMode(nextMode);
    },
    [exerciseMode, isStreaming, handleStopSession, stopCamera]
  );

  const handleReset = useCallback(async () => {
    await resetSession();
    setCurrentLandmarks([]);
    setFormResponse(null);
    repBreakdownRef.current = [];
    violationCountsRef.current = {};
    confidenceSumRef.current = 0;
    confidenceFramesRef.current = 0;
    setSessionStats({ totalReps: 0, validReps: 0, startTime: 0, duration: 0 });
    showToast('Session reset', 'info');
  }, [resetSession, showToast]);

  const handleSaveSession = useCallback(async () => {
    if (!user?.uid) {
      showToast('Sign in to save coach sessions', 'warning');
      return;
    }
    if (sessionStats.totalReps === 0) {
      showToast('Complete at least one rep before saving', 'info');
      return;
    }

    setIsSaving(true);
    try {
      const detectedExercise =
        formResponse?.current_exercise ?? 'unknown_exercise';
      const avgConfidence =
        confidenceFramesRef.current > 0
          ? confidenceSumRef.current / confidenceFramesRef.current
          : 0;

      await saveCoachSession(user.uid, {
        detectedExercise,
        totalReps: sessionStats.totalReps,
        validReps: sessionStats.validReps,
        duration: sessionStats.duration,
        avgConfidence,
        violationCounts: { ...violationCountsRef.current },
        repBreakdown: [...repBreakdownRef.current],
      });

      showToast('Session saved to your workouts', 'success');

      // After save, end the live session and clear local state.
      if (isStreaming) {
        setIsStreaming(false);
        stopCamera();
        wsDisconnect();
      }
      setCurrentLandmarks([]);
      setFormResponse(null);
      repBreakdownRef.current = [];
      violationCountsRef.current = {};
      confidenceSumRef.current = 0;
      confidenceFramesRef.current = 0;
      setSessionStats({ totalReps: 0, validReps: 0, startTime: 0, duration: 0 });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save session';
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [
    user?.uid,
    sessionStats.totalReps,
    sessionStats.validReps,
    sessionStats.duration,
    formResponse?.current_exercise,
    isStreaming,
    showToast,
    stopCamera,
    wsDisconnect,
  ]);

  // Cold-start UX: Render's free tier sleeps after ~15min idle. The first
  // connection can take 30-60s; surface that to the user instead of leaving
  // them watching a silent spinner.
  useEffect(() => {
    if (!isConnecting) {
      setConnectingTooLong(false);
      return;
    }
    const t = setTimeout(() => setConnectingTooLong(true), 5000);
    return () => clearTimeout(t);
  }, [isConnecting]);

  useEffect(() => {
    if (isStreaming && cameraReady && mediapipeReady) {
      wsConnect();
      return;
    }

    wsDisconnect();
  }, [isStreaming, cameraReady, mediapipeReady, wsConnect, wsDisconnect]);

  useEffect(() => {
    if (!isStreaming || currentLandmarks.length !== 33) {
      return;
    }

    sendLandmarks(currentLandmarks, lastFrameTimestampRef.current);
  }, [isStreaming, currentLandmarks, sendLandmarks]);

  useEffect(() => {
    jointColorsRef.current = formResponse?.joint_colors ?? {};
  }, [formResponse?.joint_colors]);

  /* --------------------------------------------------------------- */
  /*  Start detection loop once camera + mediapipe are ready           */
  /* --------------------------------------------------------------- */

  useEffect(() => {
    if (isStreaming && cameraReady && mediapipeReady) {
      animFrameRef.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isStreaming, cameraReady, mediapipeReady, processFrame]);

  /* --------------------------------------------------------------- */
  /*  Fullscreen                                                      */
  /* --------------------------------------------------------------- */

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    type WebkitDocument = Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };

    type WebkitElement = HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };

    const fullscreenElement =
      document.fullscreenElement ??
      (document as WebkitDocument).webkitFullscreenElement ??
      null;

    try {
      if (!fullscreenElement) {
        const target = containerRef.current as WebkitElement;
        if (target.requestFullscreen) {
          await target.requestFullscreen();
        } else if (target.webkitRequestFullscreen) {
          await target.webkitRequestFullscreen();
        } else {
          throw new Error('Fullscreen API unavailable');
        }
      } else {
        const webkitDocument = document as WebkitDocument;
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (webkitDocument.webkitExitFullscreen) {
          await webkitDocument.webkitExitFullscreen();
        } else {
          throw new Error('Fullscreen exit API unavailable');
        }
      }
    } catch {
      showToast('Fullscreen not supported', 'warning');
    }
  };

  useEffect(() => {
    type WebkitDocument = Document & {
      webkitFullscreenElement?: Element | null;
    };

    const handleChange = () => {
      const fullScreenElement =
        document.fullscreenElement ??
        (document as WebkitDocument).webkitFullscreenElement ??
        null;
      setIsFullscreen(!!fullScreenElement);
    };

    handleChange();
    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
    };
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

  useEffect(() => {
    if (exerciseMode !== 'upload' || !uploadedVideoUrl) return;
    const video = videoRef.current;
    if (!video) return;

    if (video.readyState >= 1) {
      setIsPreparingUploadVideo(false);
      setCameraError(null);
    }

    const onLoadedMetadata = () => {
      setIsPreparingUploadVideo(false);
      setCameraError(null);
    };

    const onCanPlay = () => {
      setIsPreparingUploadVideo(false);
    };

    const onError = () => {
      setIsPreparingUploadVideo(false);
      setCameraError('Unable to load the uploaded video. Please try another file.');
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
    };
  }, [exerciseMode, uploadedVideoUrl]);

  /* --------------------------------------------------------------- */
  /*  Cleanup on unmount                                              */
  /* --------------------------------------------------------------- */

  useEffect(() => {
    return () => {
      stopCamera();
      wsDisconnect();

      if (uploadObjectUrlRef.current) {
        URL.revokeObjectURL(uploadObjectUrlRef.current);
        uploadObjectUrlRef.current = null;
      }
    };
  }, [stopCamera, wsDisconnect]);

  /* --------------------------------------------------------------- */
  /*  File upload handler                                             */
  /* --------------------------------------------------------------- */

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;

      if (isStreaming) {
        handleStopSession();
      }

      loadUploadedFile(file);
      showToast(`Loaded video: ${file.name}`, 'success');
    },
    [isStreaming, handleStopSession, loadUploadedFile, showToast]
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

  const isStartDisabled =
    !isStreaming &&
    exerciseMode === 'upload' &&
    (!uploadedVideoUrl || isPreparingUploadVideo);

  /* ================================================================ */
  /*  RENDER — Normal layout                                          */
  /* ================================================================ */

  const playerContainerClass = isFullscreen
    ? 'relative h-screen w-screen overflow-hidden bg-black'
    : 'relative overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-sm dark:border-zinc-800';

  const playerSurfaceClass = isFullscreen
    ? 'relative h-full w-full'
    : 'relative aspect-[4/3] w-full sm:aspect-video';

  const playerPlaceholderClass = isFullscreen
    ? 'flex h-full w-full flex-col items-center justify-center p-6 relative overflow-hidden'
    : 'flex aspect-[4/3] w-full flex-col items-center justify-center p-6 sm:aspect-video relative overflow-hidden';

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
            onClick={() => handleModeChange('live')}
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
            onClick={() => handleModeChange('upload')}
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

        {/* Camera perspective */}
        <div className="grid grid-cols-4 gap-2 rounded-2xl border border-zinc-200 p-2 dark:border-zinc-800">
          {[
            ['auto', 'Auto'],
            ['front', 'Front'],
            ['side', 'Side'],
            ['three_quarter', '3/4'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setCameraView(value as CameraViewPreference)}
              className={`rounded-xl px-2 py-2 text-xs font-medium transition-colors ${
                cameraView === value
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'text-[color:var(--muted-foreground)] hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Camera / Upload area */}
        <div
          ref={containerRef}
          className={playerContainerClass}
        >
          {exerciseMode === 'live' && isStreaming ? (
            <div className={playerSurfaceClass}>
              {/* Native video element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-contain"
              />

              {/* Skeleton overlay canvas */}
              <canvas
                ref={overlayCanvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              />

              {/* Initializing indicator */}
              {isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 px-4">
                  <Loader className="h-8 w-8 animate-spin text-white" />
                  <p className="text-sm text-white/80 text-center">
                    {mediapipeLoading
                      ? 'Loading pose model…'
                      : !cameraReady
                        ? 'Starting camera…'
                        : connectingTooLong
                          ? 'Waking up the coach — first start can take up to a minute…'
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
            /* Placeholder / How it works */
            <div className={playerPlaceholderClass}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
              <div className="z-10 flex flex-col items-center max-w-md w-full gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-lg backdrop-blur-md mb-2">
                  <Activity className="h-8 w-8 text-blue-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    AI Form Coach
                  </h3>
                  <p className="text-sm text-zinc-300">
                    Real-time pose detection analyzes your reps, tracks accuracy, and spots form errors instantly.
                  </p>
                </div>
                
                <div className="w-full grid grid-cols-2 gap-3 mt-4 text-left">
                  <div className="rounded-xl bg-white/5 p-3 backdrop-blur-md border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Video className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-semibold text-white">Full Body</span>
                    </div>
                    <p className="text-[10px] text-zinc-400">Step back so your whole body is visible in frame.</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 backdrop-blur-md border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-white">Auto-Track</span>
                    </div>
                    <p className="text-[10px] text-zinc-400">Once recording, the AI automatically counts reps.</p>
                  </div>
                </div>
                <div className="mt-4 text-xs font-medium text-white/50 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                  <span className="animate-pulse mr-2 inline-block">●</span> Press play below to start
                </div>
              </div>
            </div>
          ) : exerciseMode === 'upload' && uploadedVideoUrl ? (
            <div className={playerSurfaceClass}>
              <video
                ref={videoRef}
                src={uploadedVideoUrl}
                controls
                playsInline
                muted
                crossOrigin="anonymous"
                onPlay={() => {
                  void handleUploadVideoPlay();
                }}
                onPause={handleUploadVideoPause}
                onEnded={handleUploadVideoEnded}
                className="h-full w-full object-contain"
              />

              <canvas
                ref={overlayCanvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              />

              {isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 px-4">
                  <Loader className="h-8 w-8 animate-spin text-white" />
                  <p className="text-sm text-white/80 text-center">
                    {mediapipeLoading
                      ? 'Loading pose model…'
                      : connectingTooLong
                        ? 'Waking up the coach — first start can take up to a minute…'
                        : 'Connecting…'}
                  </p>
                </div>
              )}

              {cameraError && !isStreaming && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-4">
                  <AlertCircle className="h-10 w-10 text-red-400" />
                  <p className="max-w-xs text-center text-sm text-red-200">
                    {cameraError}
                  </p>
                </div>
              )}

              {!isStreaming && uploadedFilename && (
                <div className="pointer-events-none absolute left-3 top-3 max-w-[55%] rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                  <p className="truncate text-[10px] font-medium text-white/80">
                    {uploadedFilename}
                  </p>
                </div>
              )}

              {!isStreaming && (
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    id="video-upload-replace"
                    onChange={handleFileSelect}
                  />
                  <label
                    htmlFor="video-upload-replace"
                    className="flex cursor-pointer items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-black/75 hover:text-white"
                    title="Replace video"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Replace
                  </label>
                  <button
                    type="button"
                    onClick={handleClearUpload}
                    className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-red-500/80 hover:text-white"
                    title="Remove video"
                    aria-label="Remove uploaded video"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Upload mode */
            <div className={`${playerPlaceholderClass} gap-4`}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <Upload className="h-6 w-6 text-white/60" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/80">
                  {isPreparingUploadVideo
                    ? 'Preparing uploaded video'
                    : 'Upload a video'}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  {isPreparingUploadVideo
                    ? 'Loading video into the player...'
                    : 'Press the video play button to start AI analysis'}
                </p>
              </div>

              {isPreparingUploadVideo && (
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                  <Loader className="h-3.5 w-3.5 animate-spin text-white/80" />
                  <span className="text-xs text-white/80">
                    Almost ready...
                  </span>
                </div>
              )}

              <input
                type="file"
                accept="video/*"
                className="hidden"
                id="video-upload"
                onChange={handleFileSelect}
                disabled={isPreparingUploadVideo}
              />
              <label
                htmlFor="video-upload"
                className={`rounded-xl bg-white/10 px-5 py-2 text-sm font-medium text-white transition-colors ${
                  isPreparingUploadVideo
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-pointer hover:bg-white/20'
                }`}
              >
                {isPreparingUploadVideo ? 'Preparing…' : 'Choose File'}
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
          {formResponse?.correction_message && isStreaming && (
            <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/60 px-3 py-2 backdrop-blur-sm">
              <p className="text-center text-xs text-white sm:text-sm">
                {formResponse.correction_message}
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
                  setTimeout(() => {
                    void startCamera();
                  }, 100);
                }
              }}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)] dark:border-zinc-800"
              title="Switch camera"
              aria-label="Switch camera"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={handleReset}
            disabled={!formResponse && sessionStats.totalReps === 0}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)] disabled:opacity-30 dark:border-zinc-800"
            title="Reset session"
            aria-label="Reset session"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          <button
            onClick={isStreaming ? handleStopSession : handleStartSession}
            disabled={isStartDisabled}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white transition-all active:scale-95 ${
              isStreaming
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-[color:var(--foreground)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40'
            }`}
            title={isStreaming ? 'Stop' : 'Start'}
            aria-label={isStreaming ? 'Stop session' : 'Start session'}
          >
            {isStreaming ? (
              <Square className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 text-[color:var(--background)] ml-0.5" />
            )}
          </button>

          <button
            onClick={handleSaveSession}
            disabled={sessionStats.totalReps === 0 || isSaving}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-30 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
            title="End session and save"
            aria-label="End session and save"
          >
            {isSaving ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)] dark:border-zinc-800"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Exercise feedback */}
        {formResponse && (
          <ExerciseDisplay
            formResponse={formResponse}
            accuracyPercent={accuracyPercent}
            elapsedTime={formatTime(sessionStats.duration)}
          />
        )}

        {/* Empty state */}
        {!formResponse && !isStreaming && (
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

        {/* Status banner — uses backend state to give clear UX cues */}
        {isStreaming && !isInitializing && (
          <StatusBanner formResponse={formResponse} />
        )}

        <CoachAgentPanel
          uid={user?.uid}
          liveExercise={formResponse?.current_exercise}
          liveViolations={formResponse?.violations}
          liveCorrections={formResponse?.corrections}
        />
      </section>
    </AppLayout>
  );
}

/**
 * Renders the current pipeline state (idle/stationary/scanning/active) as a
 * single explicit banner. Backed by the `state` field on the WS response;
 * "stationary" is emitted when the body is motionless for ~1 second so the
 * user gets clear UX feedback instead of guessing why nothing is counting.
 */
function StatusBanner({
  formResponse,
}: {
  formResponse: FormCorrectionResponse | null;
}) {
  const state = formResponse?.state ?? 'scanning';

  if (state === 'stationary') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-4 dark:border-amber-900/50 dark:bg-amber-950/20">
        <Pause className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
          Hold still — start your reps when ready
        </p>
      </div>
    );
  }

  if (state === 'idle') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 py-4 dark:border-zinc-800">
        <div className="h-2 w-2 rounded-full bg-zinc-400" />
        <p className="text-sm text-[color:var(--muted-foreground)]">
          Step into frame so we can see you
        </p>
      </div>
    );
  }

  if (state === 'scanning' || !formResponse) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 py-4 dark:border-zinc-800">
        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
        <p className="text-sm text-[color:var(--muted-foreground)]">
          Detecting exercise…
        </p>
      </div>
    );
  }

  // state === 'active'
  if (formResponse.is_rep_valid === false && formResponse.violations.length > 0) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 py-4 dark:border-orange-900/50 dark:bg-orange-950/20">
        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
          Form needs adjustment
        </p>
      </div>
    );
  }

  return null;
}

interface ExerciseDisplayProps {
  formResponse: FormCorrectionResponse;
  accuracyPercent: number;
  elapsedTime: string;
}

function ExerciseDisplay({
  formResponse,
  accuracyPercent,
  elapsedTime,
}: ExerciseDisplayProps) {
  const hasViolations = formResponse.violations.length > 0;
  const hasCorrections = formResponse.corrections.length > 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <div className="rounded-xl border border-zinc-200 bg-[color:var(--background)] p-3 text-center dark:border-zinc-800">
          <Target className="mx-auto mb-1 h-4 w-4 text-[color:var(--muted-foreground)]" />
          <p className="text-lg font-bold text-[color:var(--foreground)]">
            {formResponse.rep_count}
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
            {elapsedTime}
          </p>
          <p className="text-[10px] text-[color:var(--muted-foreground)]">
            Time
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-[color:var(--background)] p-3 text-center dark:border-zinc-800">
          <Wifi className="mx-auto mb-1 h-4 w-4 text-[color:var(--muted-foreground)]" />
          <p className="text-lg font-bold text-[color:var(--foreground)]">
            {(formResponse.confidence * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-[color:var(--muted-foreground)]">
            Confidence
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-[color:var(--background)] p-3 dark:border-zinc-800">
        <p className="text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">
          Exercise
        </p>
        <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]">
          {formResponse.exercise_display || formResponse.current_exercise || 'Detecting'}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
          <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-900">
            State: {formResponse.state}
          </span>
          {formResponse.phase_display && (
            <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-900">
              {formResponse.phase_display}
            </span>
          )}
          {formResponse.camera_view && (
            <span className="rounded-full bg-zinc-100 px-2 py-1 dark:bg-zinc-900">
              View: {formResponse.camera_view.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>

      {hasViolations && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Violations
            </p>
          </div>
          <ul className="space-y-1">
            {formResponse.violations.map((violation, idx) => (
              <li key={`violation-${idx}`} className="text-xs text-red-600 dark:text-red-300">
                • {violation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasCorrections && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <p className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Corrections
          </p>
          <ul className="space-y-1">
            {formResponse.corrections.map((correction, idx) => (
              <li
                key={`correction-${idx}`}
                className="text-xs text-emerald-700 dark:text-emerald-200"
              >
                • {correction}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
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
      if (
        from &&
        to &&
        from.visibility > MIN_DRAW_VISIBILITY &&
        to.visibility > MIN_DRAW_VISIBILITY
      ) {
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
    if (lm.visibility > MIN_DRAW_VISIBILITY) {
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
