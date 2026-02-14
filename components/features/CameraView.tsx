'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, Loader } from 'lucide-react';

interface CameraViewProps {
  onFrameCapture?: (canvas: HTMLCanvasElement) => void;
  isActive?: boolean;
  facingMode?: 'user' | 'environment';
  className?: string;
}

export default function CameraView({
  onFrameCapture,
  isActive = true,
  facingMode = 'user',
  className = '',
}: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  // Initialize camera
  useEffect(() => {
    if (!isActive) return;

    const initCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if camera permission is available
        const permission = await navigator.permissions.query({ name: 'camera' as any });
        setCameraPermission(permission.state as 'granted' | 'denied' | 'prompt');

        if (permission.state === 'denied') {
          setError('Camera permission denied. Please enable camera access in settings.');
          setIsLoading(false);
          return;
        }

        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Wait for video to load
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play();
              setIsLoading(false);
              startFrameCapture();
            }
          };
        }
      } catch (err) {
        const error = err as Error;
        if (error.name === 'NotAllowedError') {
          setError('Camera permission denied. Please enable camera access.');
        } else if (error.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Camera error. Please check permissions and try again.');
        }
        setIsLoading(false);
      }
    };

    initCamera();

    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, facingMode]);

  const startFrameCapture = () => {
    const captureFrame = () => {
      if (!videoRef.current || !canvasRef.current || !isActive) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match video
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Trigger frame capture callback
      if (onFrameCapture) {
        onFrameCapture(canvas);
      }

      animationFrameRef.current = requestAnimationFrame(captureFrame);
    };

    animationFrameRef.current = requestAnimationFrame(captureFrame);
  };

  return (
    <div className={`relative w-full overflow-hidden bg-black ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black bg-opacity-50">
          <Loader className="h-8 w-8 animate-spin text-white" />
          <p className="text-sm text-white">Initializing camera...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black p-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="text-center text-sm text-red-300">{error}</p>
          <p className="text-xs text-gray-400">
            Check your camera connection and browser permissions
          </p>
        </div>
      )}

      {/* Camera Permission Denied */}
      {cameraPermission === 'denied' && !isLoading && !error && (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-gray-900 p-6">
          <Camera className="h-12 w-12 text-gray-500" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-300">Camera Access Denied</p>
            <p className="mt-2 text-xs text-gray-500">
              Please enable camera access in your browser settings to use the AI Coach
            </p>
          </div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
        style={{ display: isLoading || error || cameraPermission === 'denied' ? 'none' : 'block' }}
      />

      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
