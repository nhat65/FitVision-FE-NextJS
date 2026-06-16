// lib/exercise-analyzer.ts
export interface Landmark {
  x: number;
  y: number;
  confidence?: number;
}

export interface ExerciseAnalysis {
  phase: 'up' | 'down' | 'neutral';
  confidence: number;
  formFeedback?: string;
  angle?: number;
}

// COCO 17 Keypoints indices (YOLO Pose)
export const COCO_KEYPOINTS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
} as const;

// Helper functions
function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return Math.round(angle);
}

function calculateDistance(a: Landmark, b: Landmark): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

// Main analyzer
export function analyzeExercise(exerciseId: string, landmarks: Landmark[]): ExerciseAnalysis {
  if (!landmarks || landmarks.length < 17) {
    return { phase: 'neutral', confidence: 0, formFeedback: 'Không phát hiện tư thế' };
  }

  switch (exerciseId.toLowerCase()) {
    case 'push-up':
    case 'hít đất':
      return analyzePushUp(landmarks);
    case 'squat':
    case 'ngồi xổm':
      return analyzeSquat(landmarks);
    case 'pull-up':
    case 'kéo xà':
      return analyzePullUp(landmarks);
    case 'plank':
      return analyzePlank(landmarks);
    default:
      return { phase: 'neutral', confidence: 0.5 };
  }
}

// === PUSH-UP ANALYSIS ===
function analyzePushUp(landmarks: Landmark[]): ExerciseAnalysis {
  const leftShoulder = landmarks[COCO_KEYPOINTS.LEFT_SHOULDER];
  const leftElbow = landmarks[COCO_KEYPOINTS.LEFT_ELBOW];
  const leftWrist = landmarks[COCO_KEYPOINTS.LEFT_WRIST];
  const leftHip = landmarks[COCO_KEYPOINTS.LEFT_HIP];

  const elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  const bodyAngle = calculateAngle(leftShoulder, leftHip, landmarks[COCO_KEYPOINTS.LEFT_ANKLE]);

  let phase: 'up' | 'down' | 'neutral' = 'neutral';
  let feedback = '';

  if (elbowAngle < 90) {
    phase = 'up';
  } else if (elbowAngle > 140) {
    phase = 'down';
  }

  // Form feedback
  if (bodyAngle > 170) feedback = "Giữ thân thẳng hơn!";
  else if (bodyAngle < 150) feedback = "Không cong lưng!";

  return {
    phase,
    confidence: 0.85,
    formFeedback: feedback || "Form tốt",
    angle: elbowAngle
  };
}

// === SQUAT ANALYSIS ===
function analyzeSquat(landmarks: Landmark[]): ExerciseAnalysis {
  const leftHip = landmarks[COCO_KEYPOINTS.LEFT_HIP];
  const leftKnee = landmarks[COCO_KEYPOINTS.LEFT_KNEE];
  const leftAnkle = landmarks[COCO_KEYPOINTS.LEFT_ANKLE];

  const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);

  let phase: 'up' | 'down' | 'neutral' = 'neutral';

  if (kneeAngle < 100) phase = 'down';
  else if (kneeAngle > 160) phase = 'up';

  let feedback = '';
  if (kneeAngle < 70) feedback = "Ngồi sâu hơn một chút!";
  if (calculateDistance(leftHip, leftKnee) > 0.4) feedback = "Giữ đầu gối không vượt quá mũi chân";

  return {
    phase,
    confidence: 0.82,
    formFeedback: feedback || "Form squat tốt",
    angle: kneeAngle
  };
}

// === PULL-UP ANALYSIS ===
function analyzePullUp(landmarks: Landmark[]): ExerciseAnalysis {
  const leftShoulder = landmarks[COCO_KEYPOINTS.LEFT_SHOULDER];
  const leftElbow = landmarks[COCO_KEYPOINTS.LEFT_ELBOW];
  const leftWrist = landmarks[COCO_KEYPOINTS.LEFT_WRIST];

  const elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);

  let phase: 'up' | 'down' | 'neutral' = 'neutral';

  if (elbowAngle < 80) phase = 'up';
  else if (elbowAngle > 150) phase = 'down';

  return {
    phase,
    confidence: 0.8,
    formFeedback: elbowAngle < 60 ? "Kéo ngực chạm xà!" : "Giữ vai ổn định",
    angle: elbowAngle
  };
}

// === PLANK ANALYSIS ===
function analyzePlank(landmarks: Landmark[]): ExerciseAnalysis {
  const leftShoulder = landmarks[COCO_KEYPOINTS.LEFT_SHOULDER];
  const leftHip = landmarks[COCO_KEYPOINTS.LEFT_HIP];
  const leftAnkle = landmarks[COCO_KEYPOINTS.LEFT_ANKLE];

  const bodyAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);

  return {
    phase: 'neutral',
    confidence: bodyAngle > 165 ? 0.9 : 0.6,
    formFeedback: bodyAngle > 165 ? "Giữ thân thẳng tuyệt vời!" : "Giữ hông không xệ xuống",
    angle: bodyAngle
  };
}

// Rep Counter
export interface RepCounter {
  count: number;
  phase: 'up' | 'down' | 'neutral';
  lastPhase: 'up' | 'down' | 'neutral';
}

export function createRepCounter(): RepCounter {
  return { count: 0, phase: 'neutral', lastPhase: 'neutral' };
}

export function updateRepCounter(
  counter: RepCounter,
  currentPhase: 'up' | 'down' | 'neutral',
  exerciseId: string
): RepCounter {
  const newCounter = { ...counter, phase: currentPhase };

  if (currentPhase === 'up' && counter.lastPhase === 'down') {
    newCounter.count += 1;
  }

  newCounter.lastPhase = currentPhase;
  return newCounter;
}