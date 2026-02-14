'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import CameraView from '@/components/features/CameraView';
import { usePoseWebSocket, type FormCorrectionResponse } from '@/lib/hooks/usePoseWebSocket';
import { useToast } from '@/lib/contexts/ToastContext';
import { useAuth } from '@/components/providers/AuthProvider';
import AppLayout from '@/components/layout/AppLayout';

/**
 * Coach Page with FastAPI Backend Integration
 * 
 * Real-time exercise form correction via WebSocket.
 */
export default function CoachPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [feedback, setFeedback] = useState<FormCorrectionResponse | null>(null);
  const [exerciseMode, setExerciseMode] = useState<'live' | 'upload'>('live');
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
      
      // Track statistics
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
    onConnect: () => {
      showToast('Connected to form analysis', 'success');
    },
    onError: () => {
      showToast('Connection error. Please try again.', 'error');
    },
    onDisconnect: () => {
      showToast('Disconnected from form analysis', 'warning');
    },
  });

  // Handle pose detection from CameraView
  const handlePoseDetected = useCallback(
    (landmarks: Array<{ x: number; y: number; z: number; visibility: number }>) => {
      if (isConnected) {
        sendLandmarks(landmarks);
      }

      // Draw pose on canvas for visualization
      if (canvasRef.current && videoRef.current) {
        drawPoseOnCanvas(
          canvasRef.current,
          videoRef.current,
          landmarks,
          feedback?.joint_colors || {}
        );
      }
    },
    [isConnected, sendLandmarks, feedback?.joint_colors]
  );

  const handleStartSession = () => {
    setIsStreaming(true);
    setSessionStats({
      totalReps: 0,
      validReps: 0,
      startTime: Date.now(),
      duration: 0,
    });
    showToast('Starting form analysis...', 'info');
  };

  const handleStopSession = () => {
    setIsStreaming(false);
    showToast('Form analysis stopped', 'info');
  };

  const handleReset = async () => {
    await resetSession();
    setFeedback(null);
    setSessionStats({
      totalReps: 0,
      validReps: 0,
      startTime: 0,
      duration: 0,
    });
    showToast('Session reset', 'info');
  };

  // Update session duration
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

  const accuracyPercent =
    sessionStats.totalReps > 0
      ? Math.round((sessionStats.validReps / sessionStats.totalReps) * 100)
      : 0;

  return (
    <AppLayout title="AI Form Coach">
      <section className="space-y-6">
        {/* Intro */}
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
            Real-time analysis
          </p>
          <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
            Exercise Form Coach
          </h2>
          <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
            Get instant feedback on your exercise form with AI-powered analysis
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setExerciseMode('live')}
            className={`flex-1 rounded-lg px-4 py-2 font-medium transition-colors ${
              exerciseMode === 'live'
                ? 'bg-[color:var(--foreground)] text-[color:var(--background)]'
                : 'border border-zinc-200 bg-[color:var(--background)] text-[color:var(--foreground)] hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900'
            }`}
          >
            📹 Live Camera
          </button>
          <button
            onClick={() => setExerciseMode('upload')}
            className={`flex-1 rounded-lg px-4 py-2 font-medium transition-colors ${
              exerciseMode === 'upload'
                ? 'bg-[color:var(--foreground)] text-[color:var(--background)]'
                : 'border border-zinc-200 bg-[color:var(--background)] text-[color:var(--foreground)] hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900'
            }`}
          >
            📁 Upload Video
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Video/Camera Section */}
          <div className="md:col-span-2 space-y-3">
            <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-[color:var(--background)] shadow-sm dark:border-zinc-800">
              {exerciseMode === 'live' ? (
                <CameraView
                  isActive={isStreaming}
                  onFrameCapture={(canvas) => {
                    // Handle camera frame
                    // In a real implementation, this would detect pose and send landmarks
                  }}
                />
              ) : (
                <div className="w-full h-80 md:h-96 bg-[color:var(--muted-foreground)]/10 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <p className="text-2xl">📁</p>
                    <p className="text-sm font-medium text-[color:var(--foreground)]">Upload Video</p>
                    <input type="file" accept="video/*" className="hidden" id="video-upload" />
                    <label htmlFor="video-upload" className="inline-block cursor-pointer rounded-lg border border-zinc-200 bg-[color:var(--background)] px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                      Select Video
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={handleStartSession}
                disabled={isStreaming}
                className="flex-1 rounded-lg border border-zinc-200 bg-[color:var(--background)] px-4 py-2 font-medium text-[color:var(--foreground)] transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-800 dark:hover:bg-zinc-900 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start
              </button>
              <button
                onClick={handleStopSession}
                disabled={!isStreaming}
                className="flex-1 rounded-lg border border-zinc-200 bg-[color:var(--background)] px-4 py-2 font-medium text-[color:var(--foreground)] transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-800 dark:hover:bg-zinc-900 flex items-center justify-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Stop
              </button>
            </div>
          </div>

          {/* Feedback & Stats Section */}
          <div className="space-y-3">
            {/* Connection Status Card */}
            <div className="border border-zinc-200 rounded-2xl p-4 bg-[color:var(--background)] shadow-sm dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-xs font-medium text-[color:var(--muted-foreground)]">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Feedback Card */}
            {feedback ? (
              <div className="border border-zinc-200 rounded-2xl p-4 bg-[color:var(--background)] shadow-sm space-y-3 dark:border-zinc-800">
                <h3 className="font-semibold text-[color:var(--foreground)]">
                  {feedback.exercise_display}
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[color:var(--muted-foreground)]">Rep Count:</span>
                    <span className="text-xl font-bold text-[color:var(--foreground)]">
                      {feedback.rep_count}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[color:var(--muted-foreground)]">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      feedback.is_rep_valid
                        ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                        : 'bg-red-500/20 text-red-700 dark:text-red-400'
                    }`}>
                      {feedback.is_rep_valid ? '✅ Valid' : '⚠️ Invalid'}
                    </span>
                  </div>

                  {feedback.violations.length > 0 && (
                    <div className="text-xs space-y-1 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                      <p className="font-semibold text-red-700 dark:text-red-400">Issues:</p>
                      <ul className="text-red-600 dark:text-red-300 space-y-0.5">
                        {feedback.violations.map((v, i) => (
                          <li key={i}>• {v}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {feedback.correction_message && (
                    <p className="text-xs text-[color:var(--muted-foreground)] pt-2 border-t border-zinc-200 dark:border-zinc-700">
                      💡 {feedback.correction_message}
                    </p>
                  )}

                  <div className="flex justify-between text-xs text-[color:var(--muted-foreground)] pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <span>Confidence: {(feedback.confidence * 100).toFixed(0)}%</span>
                    <span>Phase: {feedback.rep_phase}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Session Stats */}
            {feedback ? (
              <div className="border border-zinc-200 rounded-2xl p-4 bg-[color:var(--background)] shadow-sm space-y-3 dark:border-zinc-800">
                <h3 className="font-semibold text-[color:var(--foreground)]">Session</h3>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-[color:var(--muted-foreground)]">Reps</span>
                    <span className="font-bold text-[color:var(--foreground)]">
                      {sessionStats.totalReps}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[color:var(--muted-foreground)]">Valid</span>
                    <span className="font-bold text-[color:var(--foreground)]">
                      {sessionStats.validReps}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[color:var(--muted-foreground)]">Accuracy</span>
                    <span className="font-bold text-[color:var(--foreground)]">
                      {accuracyPercent}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[color:var(--muted-foreground)]">Time</span>
                    <span className="font-bold text-[color:var(--foreground)]">
                      {sessionStats.duration}s
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Empty State */}
            {!feedback && (
              <div className="border border-zinc-200 rounded-2xl p-6 bg-[color:var(--background)] shadow-sm text-center flex flex-col items-center justify-center space-y-2 dark:border-zinc-800">
                <p className="text-2xl">✨</p>
                <p className="text-xs font-medium text-[color:var(--muted-foreground)]">
                  {isStreaming ? 'Detecting pose...' : 'Start session to begin'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="border border-zinc-200 rounded-2xl p-4 bg-[color:var(--background)] shadow-sm space-y-2 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-[color:var(--foreground)]">How it works</h3>
          <ul className="text-xs text-[color:var(--muted-foreground)] space-y-1">
            <li>• Choose live camera or upload video</li>
            <li>• AI analyzes your exercise form in real-time</li>
            <li>• Get instant feedback and rep counting</li>
          </ul>
        </div>
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

  // Draw video frame
  ctx.drawImage(video, 0, 0);

  // Skeleton connections (MediaPipe 33-point format)
  const connections = [
    // Right arm
    [11, 13, 15],
    // Left arm
    [12, 14, 16],
    // Right leg
    [11, 23, 25, 27],
    // Left leg
    [12, 24, 26, 28],
    // Spine
    [11, 12, 23, 24],
  ];

  // Draw connections
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

  // Draw joints with color feedback
  landmarks.forEach((landmark, index) => {
    if (landmark.visibility > 0.5) {
      // Get color from server feedback or default to green
      const jointKey = `landmark_${index}`;
      const color = jointColors[jointKey] || '#00ff00';

      // Convert color string to RGBA
      const rgbaColor = color.startsWith('#')
        ? hexToRgba(color, 0.8)
        : 'rgba(0, 255, 0, 0.8)';

      ctx.fillStyle = rgbaColor;
      ctx.beginPath();
      ctx.arc(
        landmark.x * canvas.width,
        landmark.y * canvas.height,
        6,
        0,
        2 * Math.PI
      );
      ctx.fill();

      // Draw border for visibility
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
}

/**
 * Convert hex color to RGBA
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
