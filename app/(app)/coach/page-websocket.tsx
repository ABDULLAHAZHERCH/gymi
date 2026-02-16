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
} from 'lucide-react';
import CameraView from '@/components/features/CameraView';
import { usePoseWebSocket, type FormCorrectionResponse } from '@/lib/hooks/usePoseWebSocket';
import { useToast } from '@/lib/contexts/ToastContext';
import { useAuth } from '@/components/providers/AuthProvider';
import AppLayout from '@/components/layout/AppLayout';

/**
 * Coach Page — Spacious, fullscreen-ready, icon-driven UI
 */
export default function CoachPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [feedback, setFeedback] = useState<FormCorrectionResponse | null>(null);
  const [exerciseMode, setExerciseMode] = useState<'live' | 'upload'>('live');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [sessionStats, setSessionStats] = useState({
    totalReps: 0,
    validReps: 0,
    startTime: 0,
    duration: 0,
  });

  // Initialize WebSocket connection
  const { isConnected, sendLandmarks, lastResponse, resetSession } = usePoseWebSocket({
    clientId: user?.uid || `guest-${Date.now()}`,
    enabled: isStreaming,
    onMessage: (response) => {
      setFeedback(response);
      setSessionStats((prev) => {
        const newStats = { ...prev };
        if (response.rep_count > newStats.totalReps) {
          newStats.totalReps = response.rep_count;
          if (response.is_rep_valid) {
            newStats.validReps += 1;
          }
        }
        return newStats;
      });
    },
    onConnect: () => showToast('Connected to form analysis', 'success'),
    onError: () => showToast('Connection error. Please try again.', 'error'),
    onDisconnect: () => showToast('Disconnected from form analysis', 'warning'),
  });

  // Handle pose detection from CameraView
  const handlePoseDetected = useCallback(
    (landmarks: Array<{ x: number; y: number; z: number; visibility: number }>) => {
      if (isConnected) {
        sendLandmarks(landmarks);
      }
      if (canvasRef.current && videoRef.current) {
        drawPoseOnCanvas(canvasRef.current, videoRef.current, landmarks, feedback?.joint_colors || {});
      }
    },
    [isConnected, sendLandmarks, feedback?.joint_colors]
  );

  const handleStartSession = () => {
    setIsStreaming(true);
    setSessionStats({ totalReps: 0, validReps: 0, startTime: Date.now(), duration: 0 });
  };

  const handleStopSession = () => {
    setIsStreaming(false);
  };

  const handleReset = async () => {
    await resetSession();
    setFeedback(null);
    setSessionStats({ totalReps: 0, validReps: 0, startTime: 0, duration: 0 });
    showToast('Session reset', 'info');
  };

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

  // Listen for fullscreen exit via Escape
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // Update session duration
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setSessionStats((prev) => ({ ...prev, duration: Math.floor((Date.now() - prev.startTime) / 1000) }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  const accuracyPercent =
    sessionStats.totalReps > 0
      ? Math.round((sessionStats.validReps / sessionStats.totalReps) * 100)
      : 0;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Fullscreen layout
  if (isFullscreen) {
    return (
      <div ref={containerRef} className="relative h-screen w-screen bg-black">
        {/* Camera fills screen */}
        <div className="absolute inset-0">
          <CameraView
            isActive={isStreaming}
            facingMode={facingMode}
            className="h-full w-full"
            onFrameCapture={() => {}}
          />
        </div>

        {/* Top overlay — status bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs font-medium text-white/80">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {isStreaming && (
            <div className="flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              <span className="text-xs font-semibold text-white">{formatTime(sessionStats.duration)}</span>
            </div>
          )}
        </div>

        {/* Bottom overlay — controls + stats */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent pb-6 pt-12">
          {/* Feedback banner */}
          {feedback?.correction_message && (
            <div className="mx-4 mb-4 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-md">
              <p className="text-center text-sm text-white">{feedback.correction_message}</p>
            </div>
          )}

          {/* Stats row */}
          {feedback && (
            <div className="mx-4 mb-4 flex justify-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{feedback.rep_count}</p>
                <p className="text-[10px] uppercase tracking-wider text-white/60">Reps</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{accuracyPercent}%</p>
                <p className="text-[10px] uppercase tracking-wider text-white/60">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{(feedback.confidence * 100).toFixed(0)}%</p>
                <p className="text-[10px] uppercase tracking-wider text-white/60">Confidence</p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button onClick={handleReset} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-colors hover:bg-white/25" title="Reset">
              <RotateCcw className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={isStreaming ? handleStopSession : handleStartSession}
              className={`flex h-16 w-16 items-center justify-center rounded-full transition-all active:scale-95 ${
                isStreaming ? 'bg-red-500 hover:bg-red-600' : 'bg-white hover:bg-zinc-200'
              }`}
            >
              {isStreaming ? <Square className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-black ml-0.5" />}
            </button>
            <button onClick={toggleFullscreen} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-colors hover:bg-white/25" title="Exit fullscreen">
              <Minimize className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal layout
  return (
    <AppLayout title="AI Form Coach">
      <section className="space-y-5">
        {/* Minimal header */}
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
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-[color:var(--muted-foreground)]">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Mode toggle — icon pills */}
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
        <div ref={containerRef} className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-sm dark:border-zinc-800">
          {exerciseMode === 'live' && isStreaming ? (
            <CameraView
              isActive={isStreaming}
              facingMode={facingMode}
              className="aspect-[4/3] w-full sm:aspect-video"
              onFrameCapture={() => {}}
            />
          ) : exerciseMode === 'live' && !isStreaming ? (
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 sm:aspect-video">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <Video className="h-6 w-6 text-white/60" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/80">Live Camera</p>
                <p className="text-xs text-white/40 mt-1">Press play to start</p>
              </div>
            </div>
          ) : (
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 sm:aspect-video">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <Upload className="h-6 w-6 text-white/60" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/80">Upload a video</p>
                <p className="text-xs text-white/40 mt-1">MP4, MOV supported</p>
              </div>
              <input type="file" accept="video/*" className="hidden" id="video-upload" />
              <label
                htmlFor="video-upload"
                className="cursor-pointer rounded-xl bg-white/10 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                Choose File
              </label>
            </div>
          )}

          {/* Live recording indicator */}
          {isStreaming && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-red-500/90 px-2.5 py-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              <span className="text-[10px] font-semibold text-white">{formatTime(sessionStats.duration)}</span>
            </div>
          )}

          {/* Feedback overlay on camera */}
          {feedback?.correction_message && isStreaming && (
            <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/60 px-3 py-2 backdrop-blur-sm">
              <p className="text-center text-xs text-white sm:text-sm">{feedback.correction_message}</p>
            </div>
          )}
        </div>

        {/* Controls — icon buttons bar */}
        <div className="flex items-center justify-center gap-3">
          {exerciseMode === 'live' && (
            <button
              onClick={() => setFacingMode(facingMode === 'user' ? 'environment' : 'user')}
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

        {/* Stats cards — only show when there's data */}
        {feedback && (
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <div className="rounded-xl border border-zinc-200 bg-[color:var(--background)] p-3 text-center dark:border-zinc-800">
              <Target className="mx-auto mb-1 h-4 w-4 text-[color:var(--muted-foreground)]" />
              <p className="text-lg font-bold text-[color:var(--foreground)]">{feedback.rep_count}</p>
              <p className="text-[10px] text-[color:var(--muted-foreground)]">Reps</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-[color:var(--background)] p-3 text-center dark:border-zinc-800">
              <TrendingUp className="mx-auto mb-1 h-4 w-4 text-[color:var(--muted-foreground)]" />
              <p className="text-lg font-bold text-[color:var(--foreground)]">{accuracyPercent}%</p>
              <p className="text-[10px] text-[color:var(--muted-foreground)]">Accuracy</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-[color:var(--background)] p-3 text-center dark:border-zinc-800">
              <Timer className="mx-auto mb-1 h-4 w-4 text-[color:var(--muted-foreground)]" />
              <p className="text-lg font-bold text-[color:var(--foreground)]">{formatTime(sessionStats.duration)}</p>
              <p className="text-[10px] text-[color:var(--muted-foreground)]">Time</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-[color:var(--background)] p-3 text-center dark:border-zinc-800">
              <Wifi className="mx-auto mb-1 h-4 w-4 text-[color:var(--muted-foreground)]" />
              <p className="text-lg font-bold text-[color:var(--foreground)]">{(feedback.confidence * 100).toFixed(0)}%</p>
              <p className="text-[10px] text-[color:var(--muted-foreground)]">Confidence</p>
            </div>
          </div>
        )}

        {/* Violations */}
        {feedback && feedback.violations.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Form Issues</p>
            </div>
            <ul className="space-y-1">
              {feedback.violations.map((v, i) => (
                <li key={i} className="text-xs text-red-600 dark:text-red-300">• {v}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty state — before session starts */}
        {!feedback && !isStreaming && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-10 dark:border-zinc-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <Play className="h-5 w-5 text-[color:var(--muted-foreground)] ml-0.5" />
            </div>
            <p className="mt-3 text-sm font-medium text-[color:var(--foreground)]">Ready to train</p>
            <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
              Hit play to start AI form analysis
            </p>
          </div>
        )}

        {/* Detecting state */}
        {!feedback && isStreaming && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 py-4 dark:border-zinc-800">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            <p className="text-sm text-[color:var(--muted-foreground)]">Detecting pose...</p>
          </div>
        )}
      </section>
    </AppLayout>
  );
}

/**
 * Draw pose skeleton on canvas with joint color feedback
 */
function drawPoseOnCanvas(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  landmarks: Array<{ x: number; y: number; z: number; visibility: number }>,
  jointColors: Record<string, string>
) {
  const ctx = canvas.getContext('2d');
  if (!ctx || !video.videoWidth || !video.videoHeight) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  const connections = [
    [11, 13, 15],
    [12, 14, 16],
    [11, 23, 25, 27],
    [12, 24, 26, 28],
    [11, 12, 23, 24],
  ];

  ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
  ctx.lineWidth = 3;

  connections.forEach((chain) => {
    for (let i = 0; i < chain.length - 1; i++) {
      const from = landmarks[chain[i]];
      const to = landmarks[chain[i + 1]];
      if (from && to && from.visibility > 0.5 && to.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
        ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
        ctx.stroke();
      }
    }
  });

  landmarks.forEach((landmark, index) => {
    if (landmark.visibility > 0.5) {
      const jointKey = `landmark_${index}`;
      const color = jointColors[jointKey] || '#00ff00';
      const rgbaColor = color.startsWith('#') ? hexToRgba(color, 0.8) : 'rgba(0, 255, 0, 0.8)';

      ctx.fillStyle = rgbaColor;
      ctx.beginPath();
      ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
