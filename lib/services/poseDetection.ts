/**
 * Pose Detection Service
 * Handles real-time pose detection and analysis using MediaPipe
 */

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseDetectionResult {
  landmarks: PoseLandmark[];
  worldLandmarks?: PoseLandmark[];
  timestamp: number;
}

export interface JointAngle {
  name: string;
  angle: number;
  status: 'good' | 'warning' | 'poor';
}

export interface FormFeedback {
  exercise: string;
  overallScore: number; // 0-100
  angles: JointAngle[];
  posture: string;
  suggestions: string[];
  timestamp: number;
}

// Standard landmark indices for common joints
export const LANDMARKS = {
  // Body
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

/**
 * Calculate distance between two points
 */
export function getDistance(p1: PoseLandmark, p2: PoseLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate angle between three points (in degrees)
 * Angle at the middle point (b)
 */
export function getAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
  const ax = a.x - b.x;
  const ay = a.y - b.y;
  const cx = c.x - b.x;
  const cy = c.y - b.y;

  const dotProduct = ax * cx + ay * cy;
  const magnitudeA = Math.sqrt(ax * ax + ay * ay);
  const magnitudeC = Math.sqrt(cx * cx + cy * cy);

  if (magnitudeA === 0 || magnitudeC === 0) return 0;

  const cosAngle = dotProduct / (magnitudeA * magnitudeC);
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  return Math.acos(clampedCos) * (180 / Math.PI);
}

/**
 * Calculate if two sides are aligned (for posture checks)
 */
export function areAligned(p1: PoseLandmark, p2: PoseLandmark, tolerance: number = 0.15): boolean {
  const xDiff = Math.abs(p1.x - p2.x);
  return xDiff < tolerance;
}

/**
 * Check if a landmark has sufficient visibility
 */
export function isVisibleAndConfident(landmark: PoseLandmark, threshold: number = 0.5): boolean {
  return landmark && landmark.visibility >= threshold;
}

/**
 * Exercise-specific form analyzers
 */

interface BenchPressForm {
  score: number;
  elbowBend: number;
  backArch: number;
  isReady: boolean;
  feedback: string[];
}

export function analyzeBenchPress(landmarks: PoseLandmark[]): BenchPressForm {
  const feedback: string[] = [];
  let score = 100;

  // Check landmarks visibility
  const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
  const leftElbow = landmarks[LANDMARKS.LEFT_ELBOW];
  const rightElbow = landmarks[LANDMARKS.RIGHT_ELBOW];
  const leftWrist = landmarks[LANDMARKS.LEFT_WRIST];
  const rightWrist = landmarks[LANDMARKS.RIGHT_WRIST];

  if (
    !isVisibleAndConfident(leftShoulder) ||
    !isVisibleAndConfident(rightShoulder) ||
    !isVisibleAndConfident(leftElbow) ||
    !isVisibleAndConfident(rightElbow)
  ) {
    return {
      score: 0,
      elbowBend: 0,
      backArch: 0,
      isReady: false,
      feedback: ['Position yourself in front of the camera with full body visible'],
    };
  }

  // Elbow bend angle - should be around 90 degrees at bottom
  const leftElbowAngle = getAngle(leftShoulder, leftElbow, leftWrist);
  const rightElbowAngle = getAngle(rightShoulder, rightElbow, rightWrist);
  const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

  if (avgElbowAngle < 60) {
    feedback.push('Elbows need more bend - aim for 90 degrees');
    score -= 15;
  } else if (avgElbowAngle > 110) {
    feedback.push('Elbows bent too much - keep them at 90 degrees');
    score -= 10;
  }

  // Check if shoulders are aligned (not shrugged)
  const shoulderHeight = (leftShoulder.y + rightShoulder.y) / 2;
  const elbowHeight = (leftElbow.y + rightElbow.y) / 2;

  if (elbowHeight > shoulderHeight + 0.1) {
    feedback.push('Keep elbows lower, do not shrug shoulders');
    score -= 10;
  }

  // Check wrist alignment with elbow
  const leftWristAboveElbow = leftWrist.y < leftElbow.y;
  const rightWristAboveElbow = rightWrist.y < rightElbow.y;

  if (!leftWristAboveElbow || !rightWristAboveElbow) {
    feedback.push('Keep wrists aligned with elbows, avoid bending back');
    score -= 15;
  }

  if (feedback.length === 0) {
    feedback.push('Excellent form! Ready to press.');
  }

  return {
    score: Math.max(0, score),
    elbowBend: avgElbowAngle,
    backArch: 0, // Would need hip data for full analysis
    isReady: score > 70,
    feedback,
  };
}

interface SquatForm {
  score: number;
  kneeAngle: number;
  torsoAngle: number;
  isReady: boolean;
  feedback: string[];
}

export function analyzeSquat(landmarks: PoseLandmark[]): SquatForm {
  const feedback: string[] = [];
  let score = 100;

  const leftHip = landmarks[LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
  const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
  const rightKnee = landmarks[LANDMARKS.RIGHT_KNEE];
  const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];
  const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];

  if (
    !isVisibleAndConfident(leftHip) ||
    !isVisibleAndConfident(rightHip) ||
    !isVisibleAndConfident(leftKnee) ||
    !isVisibleAndConfident(rightKnee)
  ) {
    return {
      score: 0,
      kneeAngle: 0,
      torsoAngle: 0,
      isReady: false,
      feedback: ['Ensure full body is visible - position yourself in front of camera'],
    };
  }

  // Knee angle analysis
  const leftKneeAngle = getAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = getAngle(rightHip, rightKnee, rightAnkle);
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  if (avgKneeAngle > 120) {
    feedback.push('Squat deeper - knees should be closer to 90 degrees');
    score -= 20;
  } else if (avgKneeAngle < 70) {
    feedback.push('Be careful not to squat too deep - 90 degrees is sufficient');
    score -= 10;
  }

  // Check knee alignment (knees should track over toes)
  const leftKneeX = leftKnee.x;
  const leftAnkleX = leftAnkle.x;
  const rightKneeX = rightKnee.x;
  const rightAnkleX = rightAnkle.x;

  if (Math.abs(leftKneeX - leftAnkleX) > 0.15) {
    feedback.push('Keep knees aligned over toes - avoid caving inward');
    score -= 15;
  }

  if (Math.abs(rightKneeX - rightAnkleX) > 0.15) {
    feedback.push('Keep knees aligned over toes - avoid caving inward');
    score -= 15;
  }

  // Torso angle - should stay relatively upright
  const avgShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
  const avgHipX = (leftHip.x + rightHip.x) / 2;
  const torsoLean = Math.abs(avgShoulderX - avgHipX);

  if (torsoLean > 0.2) {
    feedback.push('Keep your torso more upright - avoid excessive forward lean');
    score -= 15;
  }

  if (feedback.length === 0) {
    feedback.push('Perfect squat form! Ready to perform.');
  }

  return {
    score: Math.max(0, score),
    kneeAngle: avgKneeAngle,
    torsoAngle: 0,
    isReady: score > 70,
    feedback,
  };
}

interface DeadliftForm {
  score: number;
  backAngle: number;
  kneeAngle: number;
  isReady: boolean;
  feedback: string[];
}

export function analyzeDeadlift(landmarks: PoseLandmark[]): DeadliftForm {
  const feedback: string[] = [];
  let score = 100;

  const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
  const leftKnee = landmarks[LANDMARKS.LEFT_KNEE];
  const rightKnee = landmarks[LANDMARKS.RIGHT_KNEE];
  const leftAnkle = landmarks[LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[LANDMARKS.RIGHT_ANKLE];

  if (!isVisibleAndConfident(leftShoulder) || !isVisibleAndConfident(leftHip) || !isVisibleAndConfident(leftKnee)) {
    return {
      score: 0,
      backAngle: 0,
      kneeAngle: 0,
      isReady: false,
      feedback: ['Position your body side-on to the camera for proper form analysis'],
    };
  }

  // Back angle at the hip - should be neutral (relatively straight)
  const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const avgHipY = (leftHip.y + rightHip.y) / 2;
  const avgShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
  const avgHipX = (leftHip.x + rightHip.x) / 2;

  const backVector = { x: avgHipX - avgShoulderX, y: avgHipY - avgShoulderY };
  const backAngle = Math.atan2(backVector.y, backVector.x) * (180 / Math.PI);

  if (Math.abs(backAngle) > 45) {
    feedback.push('Keep your back straight - avoid excessive rounding');
    score -= 20;
  }

  // Knee angle - should be slightly bent
  const leftKneeAngle = getAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = getAngle(rightHip, rightKnee, rightAnkle);
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  if (avgKneeAngle > 110) {
    feedback.push('Knees should be slightly bent - not locked straight');
    score -= 10;
  } else if (avgKneeAngle < 70) {
    feedback.push('Knees are too bent - keep them at 10-15 degrees');
    score -= 15;
  }

  // Shoulders should be over the bar (above hips)
  const shoulderAboveHip = avgShoulderY < avgHipY;
  if (!shoulderAboveHip) {
    feedback.push('Keep shoulders above the bar - position them better');
    score -= 15;
  }

  if (feedback.length === 0) {
    feedback.push('Excellent deadlift setup! You are ready.');
  }

  return {
    score: Math.max(0, score),
    backAngle: Math.abs(backAngle),
    kneeAngle: avgKneeAngle,
    isReady: score > 70,
    feedback,
  };
}

/**
 * Generate comprehensive form feedback for an exercise
 */
export function generateFormFeedback(
  exercise: string,
  landmarks: PoseLandmark[],
  previousScore?: number,
): FormFeedback {
  let analysis: any = {};
  let angles: JointAngle[] = [];

  switch (exercise.toLowerCase()) {
    case 'bench press':
    case 'push-up':
      analysis = analyzeBenchPress(landmarks);
      angles = [{ name: 'Elbow Angle', angle: analysis.elbowBend, status: 'good' }];
      break;
    case 'squat':
      analysis = analyzeSquat(landmarks);
      angles = [{ name: 'Knee Angle', angle: analysis.kneeAngle, status: 'good' }];
      break;
    case 'deadlift':
      analysis = analyzeDeadlift(landmarks);
      angles = [
        { name: 'Back Angle', angle: analysis.backAngle, status: 'good' },
        { name: 'Knee Angle', angle: analysis.kneeAngle, status: 'good' },
      ];
      break;
    default:
      // Generic feedback for other exercises
      return {
        exercise,
        overallScore: 80,
        angles: [],
        posture: 'Posture analysis not available for this exercise',
        suggestions: ['Ensure you are fully visible in the camera frame', 'Maintain good balance and control'],
        timestamp: Date.now(),
      };
  }

  // Determine status based on angle
  angles = angles.map((angle) => {
    let status: 'good' | 'warning' | 'poor' = 'good';
    if (angle.angle < 60 || angle.angle > 120) {
      status = 'warning';
    }
    if (angle.angle < 45 || angle.angle > 135) {
      status = 'poor';
    }
    return { ...angle, status };
  });

  return {
    exercise,
    overallScore: analysis.score || 80,
    angles,
    posture: analysis.feedback?.[0] || 'Neutral posture',
    suggestions: analysis.feedback?.slice(1) || [],
    timestamp: Date.now(),
  };
}

/**
 * Compare two form scores to track improvement
 */
export function getImprovement(previousScore: number, currentScore: number): { improvement: number; message: string } {
  const improvement = currentScore - previousScore;
  let message = '';

  if (improvement > 10) {
    message = '🎉 Great improvement!';
  } else if (improvement > 0) {
    message = '✅ Slightly better';
  } else if (improvement < -10) {
    message = '⚠️ Form has worsened';
  } else if (improvement < 0) {
    message = '↘️ Slight decline';
  } else {
    message = '➡️ Consistent form';
  }

  return { improvement, message };
}
