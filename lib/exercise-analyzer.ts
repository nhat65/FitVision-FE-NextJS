import { Landmark, POSE_LANDMARKS, calculateAngle } from "@/hooks/use-pose-detection"

export type ExercisePhase = "up" | "down" | "hold" | "neutral"

export interface ExerciseAnalysis {
  phase: ExercisePhase
  repCompleted: boolean
  formFeedback: FormFeedback[]
  confidence: number
}

export interface FormFeedback {
  type: "good" | "warning" | "error"
  message: string
  bodyPart?: string
}

export interface RepCounter {
  count: number
  lastPhase: ExercisePhase
  phaseHistory: ExercisePhase[]
}

// Initialize rep counter
export function createRepCounter(): RepCounter {
  return {
    count: 0,
    lastPhase: "neutral",
    phaseHistory: [],
  }
}

// Update rep counter based on phase
export function updateRepCounter(
  counter: RepCounter,
  currentPhase: ExercisePhase,
  exerciseType: string
): RepCounter {
  const newCounter = { ...counter }
  
  // Add to phase history (keep last 5)
  newCounter.phaseHistory = [...counter.phaseHistory, currentPhase].slice(-5)
  
  // Count rep based on exercise type
  if (exerciseType === "push-up" || exerciseType === "squat" || exerciseType === "lunge") {
    // Rep completed when going from "down" to "up"
    if (counter.lastPhase === "down" && currentPhase === "up") {
      newCounter.count = counter.count + 1
    }
  } else if (exerciseType === "plank" || exerciseType === "mountain-climber") {
    // Time-based exercises don't count reps the same way
    // Could add time tracking here
  }
  
  newCounter.lastPhase = currentPhase
  return newCounter
}

// Analyze push-up form
export function analyzePushUp(landmarks: Landmark[]): ExerciseAnalysis {
  const feedback: FormFeedback[] = []
  let phase: ExercisePhase = "neutral"
  
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER]
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
  const leftElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW]
  const rightElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW]
  const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST]
  const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST]
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP]
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP]
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE]
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE]
  
  // Calculate elbow angles
  const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist)
  const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist)
  const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2
  
  // Calculate body alignment (hip-shoulder angle)
  const hipY = (leftHip.y + rightHip.y) / 2
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2
  const kneeY = (leftKnee.y + rightKnee.y) / 2
  
  // Determine phase based on elbow angle
  if (avgElbowAngle < 100) {
    phase = "down"
  } else if (avgElbowAngle > 150) {
    phase = "up"
  } else {
    phase = "hold"
  }
  
  // Check form
  // 1. Check if body is straight
  const bodyAlignment = Math.abs(shoulderY - hipY)
  const hipKneeAlignment = Math.abs(hipY - kneeY)
  
  if (bodyAlignment > 0.1 && hipY < shoulderY) {
    feedback.push({
      type: "warning",
      message: "Ha hong xuong, giu co the thang",
      bodyPart: "hip"
    })
  } else if (hipY > shoulderY + 0.05) {
    feedback.push({
      type: "warning", 
      message: "Nang hong len, dung de hong tu xuong",
      bodyPart: "hip"
    })
  } else {
    feedback.push({
      type: "good",
      message: "Co the thang tot",
      bodyPart: "hip"
    })
  }
  
  // 2. Check elbow position (should be ~45 degrees from body)
  const elbowSpread = Math.abs(leftElbow.x - rightElbow.x)
  const shoulderSpread = Math.abs(leftShoulder.x - rightShoulder.x)
  
  if (elbowSpread > shoulderSpread * 1.8) {
    feedback.push({
      type: "warning",
      message: "Khuy tay qua rong, ep khuy tay gan nguoi hon",
      bodyPart: "elbow"
    })
  } else {
    feedback.push({
      type: "good",
      message: "Vi tri khuy tay tot",
      bodyPart: "elbow"
    })
  }
  
  // 3. Check depth
  if (phase === "down" && avgElbowAngle > 90) {
    feedback.push({
      type: "warning",
      message: "Ha nguoi xuong them de tang hieu qua",
      bodyPart: "depth"
    })
  }
  
  const confidence = calculateConfidence(landmarks)
  
  return {
    phase,
    repCompleted: false, // This is determined by the rep counter
    formFeedback: feedback,
    confidence
  }
}

// Analyze squat form
export function analyzeSquat(landmarks: Landmark[]): ExerciseAnalysis {
  const feedback: FormFeedback[] = []
  let phase: ExercisePhase = "neutral"
  
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP]
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP]
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE]
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE]
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE]
  const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER]
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
  
  // Calculate knee angles
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle)
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle)
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2
  
  // Determine phase
  if (avgKneeAngle < 110) {
    phase = "down"
  } else if (avgKneeAngle > 160) {
    phase = "up"
  } else {
    phase = "hold"
  }
  
  // Check form
  // 1. Check knee position relative to toes
  const leftKneeX = leftKnee.x
  const leftAnkleX = leftAnkle.x
  const rightKneeX = rightKnee.x
  const rightAnkleX = rightAnkle.x
  
  if (leftKneeX < leftAnkleX - 0.05 || rightKneeX > rightAnkleX + 0.05) {
    feedback.push({
      type: "good",
      message: "Goi khong vuot qua mui chan, tot!",
      bodyPart: "knee"
    })
  } else {
    feedback.push({
      type: "warning",
      message: "Giu goi khong vuot qua mui chan",
      bodyPart: "knee"
    })
  }
  
  // 2. Check if back is straight
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2
  const hipY = (leftHip.y + rightHip.y) / 2
  const shoulderX = (leftShoulder.x + rightShoulder.x) / 2
  const hipX = (leftHip.x + rightHip.x) / 2
  
  // Back should be relatively vertical
  if (Math.abs(shoulderX - hipX) < 0.1) {
    feedback.push({
      type: "good",
      message: "Lung thang tot",
      bodyPart: "back"
    })
  } else {
    feedback.push({
      type: "warning",
      message: "Giu lung thang hon, ngo ve phia truoc",
      bodyPart: "back"
    })
  }
  
  // 3. Check depth
  if (phase === "down") {
    if (avgKneeAngle < 90) {
      feedback.push({
        type: "good",
        message: "Do sau tuyet voi!",
        bodyPart: "depth"
      })
    } else if (avgKneeAngle < 110) {
      feedback.push({
        type: "good",
        message: "Do sau tot",
        bodyPart: "depth"
      })
    }
  }
  
  const confidence = calculateConfidence(landmarks)
  
  return {
    phase,
    repCompleted: false,
    formFeedback: feedback,
    confidence
  }
}

// Analyze plank form
export function analyzePlank(landmarks: Landmark[]): ExerciseAnalysis {
  const feedback: FormFeedback[] = []
  const phase: ExercisePhase = "hold"
  
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER]
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP]
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP]
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE]
  const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
  
  // Check body alignment
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2
  const hipY = (leftHip.y + rightHip.y) / 2
  const ankleY = (leftAnkle.y + rightAnkle.y) / 2
  
  // Hip should be roughly in line with shoulders and ankles
  const expectedHipY = (shoulderY + ankleY) / 2
  const hipDeviation = hipY - expectedHipY
  
  if (hipDeviation > 0.05) {
    feedback.push({
      type: "warning",
      message: "Hong bi tu xuong, nang hong len",
      bodyPart: "hip"
    })
  } else if (hipDeviation < -0.05) {
    feedback.push({
      type: "warning",
      message: "Hong qua cao, ha hong xuong",
      bodyPart: "hip"
    })
  } else {
    feedback.push({
      type: "good",
      message: "Tu the plank tuyet voi!",
      bodyPart: "hip"
    })
  }
  
  // Check shoulders over wrists
  const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST]
  const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST]
  const shoulderX = (leftShoulder.x + rightShoulder.x) / 2
  const wristX = (leftWrist.x + rightWrist.x) / 2
  
  if (Math.abs(shoulderX - wristX) > 0.1) {
    feedback.push({
      type: "warning",
      message: "Dieu chinh vi tri vai tren co tay",
      bodyPart: "shoulder"
    })
  } else {
    feedback.push({
      type: "good",
      message: "Vi tri vai tot",
      bodyPart: "shoulder"
    })
  }
  
  const confidence = calculateConfidence(landmarks)
  
  return {
    phase,
    repCompleted: false,
    formFeedback: feedback,
    confidence
  }
}

// Generic exercise analyzer
export function analyzeExercise(
  exerciseId: string,
  landmarks: Landmark[]
): ExerciseAnalysis {
  switch (exerciseId) {
    case "push-up":
    case "diamond-pushup":
      return analyzePushUp(landmarks)
    case "squat":
    case "jump-squat":
      return analyzeSquat(landmarks)
    case "plank":
      return analyzePlank(landmarks)
    case "lunge":
      return analyzeSquat(landmarks) // Similar analysis
    default:
      return {
        phase: "neutral",
        repCompleted: false,
        formFeedback: [{
          type: "good",
          message: "Dang phan tich tu the...",
        }],
        confidence: calculateConfidence(landmarks)
      }
  }
}

// Calculate detection confidence
function calculateConfidence(landmarks: Landmark[]): number {
  const visibilities = landmarks.map(l => l.visibility || 0)
  return visibilities.reduce((a, b) => a + b, 0) / visibilities.length
}
