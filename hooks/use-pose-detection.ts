"use client"

import { useRef, useState, useCallback, useEffect } from "react"

// Pose landmark indices based on MediaPipe Pose
export const POSE_LANDMARKS = {
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
}

export interface Landmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface PoseData {
  landmarks: Landmark[]
  timestamp: number
}

export interface PoseDetectionState {
  isLoading: boolean
  isDetecting: boolean
  error: string | null
  poseData: PoseData | null
}

// Calculate angle between three points
export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let angle = Math.abs((radians * 180.0) / Math.PI)
  if (angle > 180) {
    angle = 360 - angle
  }
  return angle
}

// Calculate distance between two points
export function calculateDistance(a: Landmark, b: Landmark): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
}

export function usePoseDetection() {
  const [state, setState] = useState<PoseDetectionState>({
    isLoading: true,
    isDetecting: false,
    error: null,
    poseData: null,
  })
  
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const poseRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastPoseDataRef = useRef<PoseData | null>(null)

  // Initialize MediaPipe Pose
  const initializePose = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // Dynamically import MediaPipe
      const { Pose } = await import("@mediapipe/pose")
      const { Camera } = await import("@mediapipe/camera_utils")
      
      const pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        },
      })

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      pose.onResults((results: any) => {
        if (results.poseLandmarks) {
          const poseData: PoseData = {
            landmarks: results.poseLandmarks.map((lm: any) => ({
              x: lm.x,
              y: lm.y,
              z: lm.z,
              visibility: lm.visibility,
            })),
            timestamp: Date.now(),
          }
          lastPoseDataRef.current = poseData
          setState(prev => ({ ...prev, poseData }))
        }
        
        // Draw pose on canvas
        if (canvasRef.current && results.poseLandmarks) {
          const ctx = canvasRef.current.getContext("2d")
          if (ctx && videoRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
            
            // Draw landmarks
            drawLandmarks(ctx, results.poseLandmarks, canvasRef.current.width, canvasRef.current.height)
            drawConnections(ctx, results.poseLandmarks, canvasRef.current.width, canvasRef.current.height)
          }
        }
      })

      poseRef.current = pose
      setState(prev => ({ ...prev, isLoading: false }))
      
      return { pose, Camera }
    } catch (error) {
      console.error("Failed to initialize pose detection:", error)
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: "Khong the khoi tao AI. Vui long thu lai." 
      }))
      return null
    }
  }, [])

  // Start camera and detection
  const startDetection = useCallback(async () => {
    if (!videoRef.current) {
      setState(prev => ({ ...prev, error: "Video element not found" }))
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        }
      })
      
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      const result = await initializePose()
      if (!result) return

      const { pose, Camera } = result

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && poseRef.current) {
            await poseRef.current.send({ image: videoRef.current })
          }
        },
        width: 640,
        height: 480,
      })

      await camera.start()
      setState(prev => ({ ...prev, isDetecting: true }))
    } catch (error) {
      console.error("Failed to start detection:", error)
      setState(prev => ({ 
        ...prev, 
        error: "Khong the truy cap camera. Vui long cap quyen camera." 
      }))
    }
  }, [initializePose])

  // Stop detection
  const stopDetection = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    setState(prev => ({ ...prev, isDetecting: false, poseData: null }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection()
    }
  }, [stopDetection])

  return {
    ...state,
    videoRef,
    canvasRef,
    startDetection,
    stopDetection,
    lastPoseData: lastPoseDataRef.current,
  }
}

// Draw landmarks on canvas
function drawLandmarks(
  ctx: CanvasRenderingContext2D, 
  landmarks: any[], 
  width: number, 
  height: number
) {
  ctx.fillStyle = "#22c55e"
  landmarks.forEach((landmark: any) => {
    const x = landmark.x * width
    const y = landmark.y * height
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, 2 * Math.PI)
    ctx.fill()
  })
}

// Draw connections between landmarks
function drawConnections(
  ctx: CanvasRenderingContext2D, 
  landmarks: any[], 
  width: number, 
  height: number
) {
  const connections = [
    // Torso
    [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
    [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
    [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
    [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
    // Left arm
    [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
    [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
    // Right arm
    [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
    [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
    // Left leg
    [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
    [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
    // Right leg
    [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
    [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
  ]

  ctx.strokeStyle = "#22c55e"
  ctx.lineWidth = 2

  connections.forEach(([startIdx, endIdx]) => {
    const start = landmarks[startIdx]
    const end = landmarks[endIdx]
    
    ctx.beginPath()
    ctx.moveTo(start.x * width, start.y * height)
    ctx.lineTo(end.x * width, end.y * height)
    ctx.stroke()
  })
}
