'use client';

import { useEffect, useRef } from 'react';
import { PoseLandmark } from '@/lib/services/poseDetection';

interface PoseCanvasProps {
  landmarks: PoseLandmark[];
  videoWidth: number;
  videoHeight: number;
  isVisible?: boolean;
  exerciseName?: string;
  confidenceThreshold?: number;
  className?: string;
}

// Connection pairs for drawing skeleton
const SKELETON_CONNECTIONS = [
  [11, 13], // left shoulder to left elbow
  [13, 15], // left elbow to left wrist
  [12, 14], // right shoulder to right elbow
  [14, 16], // right elbow to right wrist
  [11, 23], // left shoulder to left hip
  [12, 24], // right shoulder to right hip
  [23, 25], // left hip to left knee
  [24, 26], // right hip to right knee
  [25, 27], // left knee to left ankle
  [26, 28], // right knee to right ankle
  [11, 12], // shoulders
  [23, 24], // hips
  [9, 10], // mouth
];

export default function PoseCanvas({
  landmarks,
  videoWidth,
  videoHeight,
  isVisible = true,
  exerciseName = '',
  confidenceThreshold = 0.5,
  className = '',
}: PoseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !isVisible || landmarks.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw skeleton connections
    SKELETON_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const startLandmark = landmarks[startIdx];
      const endLandmark = landmarks[endIdx];

      if (!startLandmark || !endLandmark) return;

      // Check visibility
      if (startLandmark.visibility < confidenceThreshold || endLandmark.visibility < confidenceThreshold) {
        return;
      }

      const startX = startLandmark.x * canvas.width;
      const startY = startLandmark.y * canvas.height;
      const endX = endLandmark.x * canvas.width;
      const endY = endLandmark.y * canvas.height;

      // Draw line
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = '#3B82F6'; // Blue
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    // Draw joints (circles at landmarks)
    landmarks.forEach((landmark, idx) => {
      if (!landmark || landmark.visibility < confidenceThreshold) return;

      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;

      // Determine color based on visibility/confidence
      let color = '#10B981'; // Green for good visibility
      if (landmark.visibility < 0.7) {
        color = '#F59E0B'; // Amber for medium visibility
      }
      if (landmark.visibility < 0.5) {
        color = '#EF4444'; // Red for low visibility
      }

      // Draw circle
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Draw outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw exercise name if provided
    if (exerciseName) {
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 4;
      ctx.strokeText(exerciseName, 20, 40);
      ctx.fillText(exerciseName, 20, 40);
    }
  }, [landmarks, videoWidth, videoHeight, isVisible, exerciseName, confidenceThreshold]);

  if (!isVisible) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 ${className}`}
      style={{ touchAction: 'none' }}
    />
  );
}
