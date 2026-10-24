"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createRepCounter,
  type RepCounter,
} from "@/lib/exercise-analyzer";
import { workoutPrograms, exercises, Exercise } from "@/lib/workout-data";
import { getCurrentUser } from "@/lib/user-store";
import { AICoachPaywall } from "./AICoachPaywall";
import {
  Play,
  Pause,
  ArrowLeft,
  CheckCircle2,
  Timer,
  Dumbbell,
  CameraOff,
} from "lucide-react";
import { getAccessToken } from "@/lib/auth-store";

// ---------------------------------------------------------------------------
// Kiểu bài tập được hỗ trợ
// ---------------------------------------------------------------------------
type ExerciseType = "pullup" | "pushup" | "squat" | "unknown";

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

// Map tên bài tập từ API sang ExerciseType
function detectExerciseType(name: string): ExerciseType {
  const n = name.toLowerCase();
  if (n.includes("pull") || n.includes("chin") || n.includes("xà"))
    return "pullup";
  if (
    n.includes("push") ||
    n.includes("press") ||
    n.includes("hít đất") ||
    n.includes("hit dat")
  )
    return "pushup";
  if (n.includes("squat") || n.includes("lunge") || n.includes("squat"))
    return "squat";
  return "unknown";
}

// Config góc + skeleton theo bài
const EXERCISE_CONFIG: Record<
  ExerciseType,
  {
    upThreshold: number;
    downThreshold: number;
    skeleton: "upper" | "lower" | "none";
    angleLabel: string;
    getAngles: (lm: Landmark[]) => { left: number; right: number };
  }
> = {
  pullup: {
    upThreshold: 70,
    downThreshold: 140,
    skeleton: "upper",
    angleLabel: "Góc khuỷu tay",
    getAngles: (lm) => ({
      left: calcAngle(lm[11], lm[13], lm[15]),
      right: calcAngle(lm[12], lm[14], lm[16]),
    }),
  },
  pushup: {
    upThreshold: 80,
    downThreshold: 145,
    skeleton: "upper",
    angleLabel: "Góc khuỷu tay",
    getAngles: (lm) => ({
      left: calcAngle(lm[11], lm[13], lm[15]),
      right: calcAngle(lm[12], lm[14], lm[16]),
    }),
  },
  squat: {
    upThreshold: 100,
    downThreshold: 160,
    skeleton: "lower",
    angleLabel: "Góc đầu gối",
    getAngles: (lm) => ({
      left: calcAngle(lm[23], lm[25], lm[27]),
      right: calcAngle(lm[24], lm[26], lm[28]),
    }),
  },
  unknown: {
    upThreshold: 80,
    downThreshold: 145,
    skeleton: "upper",
    angleLabel: "Góc khuỷu tay",
    getAngles: (lm) => ({
      left: calcAngle(lm[11], lm[13], lm[15]),
      right: calcAngle(lm[12], lm[14], lm[16]),
    }),
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// Phát âm thanh "beep" ngắn bằng Web Audio API — không cần file âm thanh ngoài
function playRepSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode   = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type      = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);          // A5
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch (_) { /* ignore nếu browser block */ }
}

function calcAngle(a: Landmark, b: Landmark, c: Landmark): number {
  if (!a || !b || !c) return 0;
  const ab = [a.x - b.x, a.y - b.y];
  const cb = [c.x - b.x, c.y - b.y];
  const dot = ab[0] * cb[0] + ab[1] * cb[1];
  const magAB = Math.sqrt(ab[0] ** 2 + ab[1] ** 2);
  const magCB = Math.sqrt(cb[0] ** 2 + cb[1] ** 2);
  if (magAB === 0 || magCB === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load: " + src));
    document.head.appendChild(s);
  });
}

const MEDIAPIPE_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404";

// ---------------------------------------------------------------------------
// Skeleton drawing
// ---------------------------------------------------------------------------
function drawSkeleton(
  landmarks: Landmark[],
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  skeletonType: "upper" | "lower" | "none",
  phase: "idle" | "up" | "down"
) {
  const BONE_COLOR =
    phase === "up" ? "#4ade80" : phase === "down" ? "#fbbf24" : "#7c6ff7";

  const vis = (i: number) => landmarks[i]?.visibility > 0.25;
  const px = (i: number) => landmarks[i].x * w;
  const py = (i: number) => landmarks[i].y * h;

  const drawBone = (from: number, to: number, width: number, alpha: number) => {
    if (!vis(from) || !vis(to)) return;
    ctx.lineCap = "round";
    // glow
    ctx.beginPath();
    ctx.moveTo(px(from), py(from));
    ctx.lineTo(px(to), py(to));
    ctx.strokeStyle = BONE_COLOR + "33";
    ctx.lineWidth = width + 5;
    ctx.stroke();
    // bone
    ctx.beginPath();
    ctx.moveTo(px(from), py(from));
    ctx.lineTo(px(to), py(to));
    ctx.strokeStyle =
      BONE_COLOR + Math.round(alpha * 255).toString(16).padStart(2, "0");
    ctx.lineWidth = width;
    ctx.stroke();
  };

  const drawJoint = (
    i: number,
    r: number,
    primary: boolean,
    label: string,
    side: "left" | "right"
  ) => {
    if (!vis(i)) return;
    const x = px(i),
      y = py(i);
    // glow ring
    ctx.beginPath();
    ctx.arc(x, y, r + 3, 0, Math.PI * 2);
    ctx.fillStyle = BONE_COLOR + "22";
    ctx.fill();
    // fill
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = primary ? BONE_COLOR : "#a89ef9";
    ctx.fill();
    // inner dot
    ctx.beginPath();
    ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff99";
    ctx.fill();
    // label
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = "#ffffffcc";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 3;
    ctx.textAlign = side === "right" ? "left" : "right";
    ctx.fillText(label, x + (side === "right" ? r + 4 : -(r + 4)), y + 4);
    ctx.shadowBlur = 0;
  };

  if (skeletonType === "upper") {
    drawBone(11, 12, 3, 0.9);
    drawBone(11, 23, 2.5, 0.7);
    drawBone(12, 24, 2.5, 0.7);
    drawBone(23, 24, 2.5, 0.7);
    drawBone(11, 13, 3, 1.0);
    drawBone(13, 15, 2.5, 1.0);
    drawBone(12, 14, 3, 1.0);
    drawBone(14, 16, 2.5, 1.0);

    drawJoint(11, 7, true, "L.Vai", "left");
    drawJoint(12, 7, true, "R.Vai", "right");
    drawJoint(13, 6, false, "L.Khuỷu", "left");
    drawJoint(14, 6, false, "R.Khuỷu", "right");
    drawJoint(15, 5, false, "L.Cổ tay", "left");
    drawJoint(16, 5, false, "R.Cổ tay", "right");
    drawJoint(23, 5.5, true, "L.Hông", "left");
    drawJoint(24, 5.5, true, "R.Hông", "right");
  } else if (skeletonType === "lower") {
    drawBone(23, 24, 3, 0.9);
    drawBone(23, 25, 3, 1.0);
    drawBone(25, 27, 2.5, 1.0);
    drawBone(24, 26, 3, 1.0);
    drawBone(26, 28, 2.5, 1.0);
    drawBone(27, 31, 2, 0.7);
    drawBone(28, 32, 2, 0.7);

    drawJoint(23, 7, true, "L.Hông", "left");
    drawJoint(24, 7, true, "R.Hông", "right");
    drawJoint(25, 6, false, "L.Gối", "left");
    drawJoint(26, 6, false, "R.Gối", "right");
    drawJoint(27, 5, false, "L.Mắt cá", "left");
    drawJoint(28, 5, false, "R.Mắt cá", "right");
  }

  ctx.textAlign = "left";
}

// ---------------------------------------------------------------------------
// Hook: useMediaPipePose  (thay thế useYOLOPose)
// ---------------------------------------------------------------------------
function useMediaPipePose() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Callback được gọi mỗi frame — component truyền vào qua setter
  const onResultsRef = useRef<((lm: Landmark[]) => void) | null>(null);

  const setOnResults = useCallback((fn: (lm: Landmark[]) => void) => {
    onResultsRef.current = fn;
  }, []);

  const startDetection = useCallback(async () => {
    setError(null);
    try {
      await loadScript(`${MEDIAPIPE_CDN}/pose.js`);
      await loadScript(
        "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js"
      );

      const win = window as any;
      if (!win.Pose || !win.Camera)
        throw new Error("MediaPipe chưa load xong, thử lại.");

      const pose = new win.Pose({
        locateFile: (file: string) => `${MEDIAPIPE_CDN}/${file}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
      pose.onResults((results: any) => {
        const lm: Landmark[] = results.poseLandmarks;
        if (lm && onResultsRef.current) onResultsRef.current(lm);
      });
      poseRef.current = pose;

      const video = videoRef.current!;
      // Điện thoại dùng camera trước (environment), desktop dùng webcam (user)
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width:      { ideal: 640 },
          height:     { ideal: 480 },
          facingMode: isMobile ? "environment" : "user",
        },
      });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      const camera = new win.Camera(video, {
        onFrame: async () => {
          await pose.send({ image: video });
        },
        width: 640,
        height: 480,
      });
      await camera.start();

      setIsDetecting(true);
    } catch (err) {
      console.error("[MediaPipe]", err);
      setIsDetecting(false);
    }
  }, []);

  const stopDetection = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    poseRef.current = null;
    setIsDetecting(false);
  }, []);

  return {
    videoRef,
    canvasRef,
    isDetecting,
    error,
    startDetection,
    stopDetection,
    setOnResults,
  };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function AICoachContent() {
  const searchParams = useSearchParams();
  const workoutId = searchParams.get("workout");
  const dayParam = searchParams.get("day");
  const dayOfWeekParam = searchParams.get("dayOfWeek");
  const noCamera = searchParams.get("mode") === "no-camera";

  const user = getCurrentUser();
  const [hasAIMonitoring, setHasAIMonitoring] = useState<boolean | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const workout = workoutId
    ? workoutPrograms.find((w) => w.id === workoutId)
    : null;
  const currentDay = dayParam ? parseInt(dayParam) : 1;
  const dayWorkout = workout?.schedule.find((d) => d.day === currentDay);

  const [programExercises, setProgramExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    dayWorkout?.exercises[0] || exercises[0]
  );
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isExercisesLoading, setIsExercisesLoading] = useState(true);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [repCounter, setRepCounter] = useState<RepCounter>(createRepCounter());
  const [workoutTime, setWorkoutTime] = useState(0);
  const [totalCalories, setTotalCalories] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [restTimer, setRestTimer] = useState<number | null>(null); // rest countdown between sets

  // Phase tracking
  const phaseRef = useRef<"idle" | "up" | "down">("idle");
  const [currentPhase, setCurrentPhase] = useState<"idle" | "up" | "down">("idle");
  const [currentAngles, setCurrentAngles] = useState({ left: 0, right: 0 });

  const isWorkoutActiveRef = useRef(false);
  const isPausedRef = useRef(false);
  const countdownActiveRef = useRef(false);
  const restActiveRef = useRef(false);        // true during rest — blocks AI rep counting
  const selectedExerciseRef = useRef<Exercise | null>(selectedExercise);

  useEffect(() => {
    const checkAIMonitoring = async () => {
      if (!user) {
        setHasAIMonitoring(false);
        setCheckingSubscription(false);
        return;
      }

      try {
        const token = getAccessToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/check-validity`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setHasAIMonitoring(false);
        } else {
          const result = await res.json();
          console.log(result)
          setHasAIMonitoring(result.data?.isValid === true);
        }
      } catch (error) {
        console.error("Failed to check AI subscription:", error);
        setHasAIMonitoring(false);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkAIMonitoring();
  }, [user]);
  // Sync refs
  useEffect(() => { isWorkoutActiveRef.current = isWorkoutActive; }, [isWorkoutActive]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { selectedExerciseRef.current = selectedExercise; }, [selectedExercise]);

  const token = getAccessToken()
  const {
    videoRef,
    canvasRef,
    isDetecting,
    error,
    startDetection,
    stopDetection,
    setOnResults,
  } = useMediaPipePose();

  // Xử lý mỗi frame pose
  const handlePoseFrame = useCallback(
    (lm: Landmark[]) => {
      if (!isWorkoutActiveRef.current || isPausedRef.current || countdownActiveRef.current || restActiveRef.current) return;

      const ex = selectedExerciseRef.current;
      const exType: ExerciseType = ex
        ? detectExerciseType(ex.name)
        : "unknown";
      const cfg = EXERCISE_CONFIG[exType];

      // Vẽ video frame + skeleton lên canvas
      const canvas = canvasRef.current;
      const video  = videoRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // 1. Vẽ video frame đã mirror (selfie view)
          if (video && video.readyState >= 2) {
            ctx.save();
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            ctx.restore();
          }

          // 2. Mirror tọa độ landmark x = 1 - x để khớp với video đã mirror
          //    MediaPipe trả tọa độ gốc (chưa mirror), phải flip trước khi vẽ
          if (lm.length >= 29) {
            const mirroredLm = lm.map((pt) => ({ ...pt, x: 1 - pt.x }));
            drawSkeleton(mirroredLm, ctx, canvas.width, canvas.height, cfg.skeleton, phaseRef.current);
          }
        }
      }

      if (lm.length < 29) return;

      const { left: leftAngle, right: rightAngle } = cfg.getAngles(lm);
      const avg = (leftAngle + rightAngle) / 2;
      setCurrentAngles({ left: Math.round(leftAngle), right: Math.round(rightAngle) });

      const phase = phaseRef.current;
      if (phase === "idle" || phase === "down") {
        if (avg < cfg.upThreshold) {
          phaseRef.current = "up";
          setCurrentPhase("up");
        }
      } else if (phase === "up") {
        if (avg > cfg.downThreshold) {
          phaseRef.current = "down";
          setCurrentPhase("down");
          playRepSound();
          setRepCounter((prev) => {
            const newCount = prev.count + 1;
            const tReps = (selectedExerciseRef.current?.reps as number | undefined);
            const tSets = (selectedExerciseRef.current?.sets as number | undefined);
            if (tReps && newCount >= tReps) {
              const newSets = completedSetsRef.current + 1;
              completedSetsRef.current = newSets;
              setCompletedSets(newSets);
              if (!tSets || newSets < tSets) {
                // More sets remaining — trigger rest timer then reset rep
                const rest = (selectedExerciseRef.current?.restTime as number | undefined) ?? 0;
                if (rest > 0) {
                  startRestTimer(rest, () => {
                    setRepCounter(createRepCounter());
                    phaseRef.current = "idle";
                  });
                } else {
                  // No rest time — reset immediately
                  return { ...prev, count: 0 };
                }
                return { ...prev, count: newCount }; // keep count during rest display
              }
              return { ...prev, count: newCount };
            }
            return { ...prev, count: newCount };
          });
          setTotalCalories((prev) => prev + 5);
        }
      }
    },
    [canvasRef]
  );

  // Đăng ký callback vào hook
  useEffect(() => {
    setOnResults(handlePoseFrame);
  }, [handlePoseFrame, setOnResults]);

  // Auto-start workout timer for manual mode (no AI = no Start button flow)
  useEffect(() => {
    if (!hasAIMonitoring) {
      setIsWorkoutActive(true);
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Workout timer — runs for both AI and manual mode
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isWorkoutActive && !isPaused) {
      interval = setInterval(() => setWorkoutTime((p) => p + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isWorkoutActive, isPaused]);

  const handleStartWorkout = useCallback(async () => {
    phaseRef.current = "idle";
    setCurrentPhase("idle");
    setCompletedSets(0);
    completedSetsRef.current = 0;
    setRepCounter(createRepCounter());
    setIsWorkoutActive(true);
    setIsPaused(false);

    if (!hasAIMonitoring) {
      // Manual mode — no camera, no countdown, just mark as active
      return;
    }

    if (!noCamera) {
      await startDetection();
    }

    // 5-second countdown before AI starts counting reps
    countdownActiveRef.current = true;
    setCountdown(5);
    let count = 5;
    const cdInterval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(cdInterval);
        setCountdown(null);
        countdownActiveRef.current = false;
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, [noCamera, hasAIMonitoring, startDetection]);

  const handleStopWorkout = useCallback(() => {
    if (hasAIMonitoring) stopDetection();
    setIsWorkoutActive(false);
    setIsPaused(false);
    setCountdown(null);
    countdownActiveRef.current = false;
    phaseRef.current = "idle";
    setCurrentPhase("idle");
    setCompletedSets(0);
    completedSetsRef.current = 0;
    setRepCounter(createRepCounter());
    setRestTimer(null);
    restActiveRef.current = false;
    // Mark current exercise as completed
    const current = selectedExerciseRef.current;
    if (current) {
      setCompletedExercises((prev) => new Set(prev).add(current.id));
    }
    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }, [stopDetection, canvasRef]);

  const handleSelectExercise = useCallback((ex: Exercise, index: number) => {
    setSelectedExercise(ex);
    setCurrentExerciseIndex(index);
    setRepCounter(createRepCounter());
    setCompletedSets(0);
    completedSetsRef.current = 0;
    setRestTimer(null);
    restActiveRef.current = false;
    setIsWorkoutActive(false);
    phaseRef.current = "idle";
    setCurrentPhase("idle");
    setVideoDemoUrl(null);
    if (hasAIMonitoring) stopDetection();
  }, [stopDetection]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const [isCompletingDay, setIsCompletingDay] = useState(false);

  const startRestTimer = useCallback((seconds: number, onDone: () => void) => {
    restActiveRef.current = true;
    countdownActiveRef.current = true;
    setRestTimer(seconds);
    let remaining = seconds;
    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        restActiveRef.current = false;
        countdownActiveRef.current = false;
        setRestTimer(null);
        phaseRef.current = "idle";
        onDone();
      } else {
        setRestTimer(remaining);
      }
    }, 1000);
  }, []);
  const [videoDemoUrl, setVideoDemoUrl] = useState<string | null>(null);
  const [completedSets, setCompletedSets] = useState(0);
  const completedSetsRef = useRef(0);

  const targetReps = selectedExercise?.reps as number | undefined;
  const targetSets = selectedExercise?.sets as number | undefined;
  const currentReps = repCounter.count;
  const currentSetRepsDone = !targetReps || currentReps >= targetReps;
  const allSetsDone = !targetSets || completedSets >= targetSets;
  const repGoalMet = allSetsDone;

  const handleCompleteDay = useCallback(async () => {
    if (!workoutId || !currentDay) return;
    setIsCompletingDay(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user-enrollment/complete-day`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dayNumber:     currentDay,
            planId:        workoutId,
            totalCalories: hasAIMonitoring ? totalCalories : 0,
            totalTime:     workoutTime,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to complete day");
      window.location.href = workoutId ? `/workouts/${workoutId}` : "/workouts";
    } catch (err) {
      console.error("[CompleteDay]", err);
    } finally {
      setIsCompletingDay(false);
    }
  }, [workoutId, currentDay, totalCalories, workoutTime]);

  // Fetch exercises từ API
  useEffect(() => {
    const fetchProgramExercises = async () => {
      if (!workoutId) return;
      setIsExercisesLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/plan-exercise/${workoutId}?dayOfWeek=${dayOfWeekParam}`
        );
        if (!res.ok) throw new Error("Failed to fetch program exercises");
        const payload = await res.json();
        const exerciseData: any[] = payload.data || [];

        const mappedExercises: Exercise[] = exerciseData.map((item, index) => ({
          id: `${workoutId}-${item.order ?? index}`,
          name: item.exercise?.name ?? "Exercise",
          description: item.exercise?.description ?? "",
          muscleGroups: item.exercise?.muscleGroup ? [item.exercise.muscleGroup] : [],
          difficulty: item.exercise?.difficulty ?? "beginner",
          instructions: item.exercise?.instructions ? [item.exercise.instructions] : [],
          reps: item.reps ?? undefined,
          sets: item.sets ?? undefined,
          duration: undefined,
          restTime: item.restTime ?? 0,
          videoUrl: item.exercise?.video_demo_url ?? undefined,
          thumbnailUrl: undefined,
        }));

        setProgramExercises(mappedExercises);
        if (mappedExercises.length) {
          setSelectedExercise(mappedExercises[0]);
          setCurrentExerciseIndex(0);
        }
      } catch (err) {
        console.error("Error loading program exercises:", err);
        setProgramExercises([]);
      } finally {
        setIsExercisesLoading(false);
      }
    };
    fetchProgramExercises();
  }, [workoutId]);

  // Phase badge color
  const phaseColor =
    currentPhase === "up"
      ? "text-green-400 border-green-400/40 bg-green-400/10"
      : currentPhase === "down"
      ? "text-yellow-400 border-yellow-400/40 bg-yellow-400/10"
      : "text-muted-foreground border-border bg-secondary";
  const phaseLabel =
    currentPhase === "up" ? "↑ GOING UP" : currentPhase === "down" ? "↓ GOING DOWN" : "WAITING...";

  const exType = selectedExercise ? detectExerciseType(selectedExercise.name) : "unknown";
  const exCfg = EXERCISE_CONFIG[exType];


  if (checkingSubscription) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Checking AI Coach access...</p>
          </div>
        </main>
      </div>
    );
  }
  // Paywall
  if (!hasAIMonitoring && !noCamera) {
    return (
      <AICoachPaywall
        workoutId={workoutId ?? undefined}
        currentDay={currentDay}
        dayOfWeek={dayOfWeekParam ?? undefined}
        token={token ?? ""}
        onTrainWithoutAI={() => {
          if (workoutId)
            window.location.href = `/ai-coach?workout=${workoutId}&day=${currentDay}&dayOfWeek=${dayOfWeekParam}&mode=no-camera`;
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          {/* Back */}
          <Link
            href={workoutId ? `/workouts/${workoutId}` : "/workouts"}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to program
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main area */}
            <div className="lg:col-span-2 space-y-6">

              {/* Camera feed — only shown when AI monitoring is enabled */}
              {hasAIMonitoring && <Card className="bg-black">
                <CardContent className="p-0 relative">
                  {hasAIMonitoring && !noCamera ? (
                    <>
                      {/* Video ẩn — chỉ dùng để feed vào MediaPipe */}
                      <video ref={videoRef} style={{ display: "none" }} muted playsInline />
                      {/* Canvas hiển thị skeleton (mirror) */}
                      <canvas
                        ref={canvasRef}
                        className="w-full aspect-video bg-black rounded-lg"
                        width={640}
                        height={480}
                      />
                      {/* Phase badge overlay */}
                      {isDetecting && (
                        <div className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-md border ${phaseColor}`}>
                          {phaseLabel}
                        </div>
                      )}
                      {/* Angle badge overlay */}
                      {isDetecting && (
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur text-xs text-white font-mono px-3 py-1 rounded-md">
                          {exCfg.angleLabel}: L {currentAngles.left}° / R {currentAngles.right}°
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="aspect-video bg-linear-to-br from-secondary to-background flex items-center justify-center rounded-lg">
                      <div className="text-center">
                        <CameraOff className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Camera mode disabled</p>
                      </div>
                    </div>
                  )}

                  {/* Start countdown overlay */}
                  {countdown !== null && restTimer === null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <div className="text-center">
                        <div className="text-8xl font-black text-primary drop-shadow-lg animate-pulse">
                          {countdown}
                        </div>
                        <p className="text-white text-lg font-semibold mt-2">Get ready...</p>
                      </div>
                    </div>
                  )}

                  {/* Rest timer overlay */}
                  {restTimer !== null && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg"
                      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(2px)" }}>
                      <div className="text-center px-8 py-6 rounded-2xl border border-white/10 bg-white/5">
                        <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-2">Rest</p>
                        {/* Circular countdown */}
                        <div className="relative inline-flex items-center justify-center mb-3">
                          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                            <circle cx="60" cy="60" r="50" fill="none" stroke="#4ade80" strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 50}`}
                              strokeDashoffset={`${2 * Math.PI * 50 * (1 - restTimer / ((selectedExercise?.restTime as number) || restTimer))}`}
                              style={{ transition: "stroke-dashoffset 0.9s linear" }}
                            />
                          </svg>
                          <span className="absolute text-5xl font-black text-white">{restTimer}</span>
                        </div>
                        <p className="text-green-400 font-semibold text-base">
                          Set {completedSets} done! Next set in {restTimer}s
                        </p>
                        <p className="text-white/50 text-xs mt-1">Stay in position</p>
                      </div>
                    </div>
                  )}

                  {/* Workout timer */}
                  {isWorkoutActive && countdown === null && restTimer === null && (
                    <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur px-4 py-2 rounded-lg flex gap-2">
                      <Timer className="w-5 h-5 text-primary" />
                      <span className="text-white font-mono">{formatTime(workoutTime)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>}

              {/* Exercise info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-primary" />
                      {selectedExercise?.name || "Exercise"}
                    </div>
                    {/* Nút xem video demo */}
                    {selectedExercise?.videoUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1.5 text-xs"
                        onClick={() => setVideoDemoUrl(
                          videoDemoUrl ? null : selectedExercise.videoUrl!
                        )}
                      >
                        <Play className="w-3.5 h-3.5" />
                        {videoDemoUrl ? "Close video" : "Watch demo"}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{selectedExercise?.description}</p>

                  {/* Video demo player */}
                  {videoDemoUrl && (
                    <div className="rounded-xl overflow-hidden bg-black border border-border">
                      <video key={videoDemoUrl} src={videoDemoUrl} controls autoPlay loop playsInline
                        className="w-full max-h-64 object-contain" />
                    </div>
                  )}

                  {hasAIMonitoring ? (
                    /* ── AI MODE: live rep/set tracking ── */
                    <>
                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className={`rounded-lg p-3 text-center transition-colors ${currentSetRepsDone && isWorkoutActive ? "bg-green-500/20" : "bg-primary/10"}`}>
                          <div className={`text-2xl font-bold ${currentSetRepsDone && isWorkoutActive ? "text-green-400" : "text-primary"}`}>
                            {repCounter.count}
                            {targetReps ? <span className="text-xs font-normal text-muted-foreground">/{targetReps}</span> : null}
                          </div>
                          <div className="text-xs text-muted-foreground">Reps</div>
                          {targetReps && isWorkoutActive && (
                            <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100,(currentReps/targetReps)*100)}%`, background: currentSetRepsDone ? "#4ade80" : "hsl(var(--primary))" }} />
                            </div>
                          )}
                        </div>
                        <div className={`rounded-lg p-3 text-center transition-colors ${allSetsDone && isWorkoutActive ? "bg-green-500/20" : "bg-purple-500/10"}`}>
                          <div className={`text-2xl font-bold ${allSetsDone && isWorkoutActive ? "text-green-400" : "text-purple-400"}`}>
                            {completedSets}
                            {targetSets ? <span className="text-xs font-normal text-muted-foreground">/{targetSets}</span> : null}
                          </div>
                          <div className="text-xs text-muted-foreground">Sets</div>
                          {targetSets && isWorkoutActive && (
                            <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100,(completedSets/targetSets)*100)}%`, background: allSetsDone ? "#4ade80" : "#a78bfa" }} />
                            </div>
                          )}
                        </div>
                        <div className="bg-accent/10 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-accent">{totalCalories}</div>
                          <div className="text-xs text-muted-foreground">Calories</div>
                        </div>
                        <div className="bg-secondary rounded-lg p-3 text-center">
                          <div className="text-xl font-bold">{formatTime(workoutTime)}</div>
                          <div className="text-xs text-muted-foreground">Time</div>
                        </div>
                      </div>

                      {/* Status banner */}
                      {isWorkoutActive && (targetReps || targetSets) && (
                        <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border ${
                          allSetsDone ? "text-green-400 bg-green-500/10 border-green-500/20"
                          : currentSetRepsDone ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                          : "text-amber-400 bg-amber-400/10 border-amber-400/20"
                        }`}>
                          {allSetsDone ? (
                            <><CheckCircle2 className="w-4 h-4 shrink-0" /><span>All sets completed — you can finish now!</span></>
                          ) : currentSetRepsDone ? (
                            <><span>✅</span><span>Set {completedSets + 1} done! Rest up, then start the next set.</span></>
                          ) : (
                            <><span>⚠️</span><span>
                              {targetReps
                                ? <><strong>{targetReps - currentReps}</strong> more rep{targetReps - currentReps !== 1 ? "s" : ""} to finish set {completedSets + 1}{targetSets ? ` of ${targetSets}` : ""}</>
                                : <>Complete all sets to finish</>}
                            </span></>
                          )}
                        </div>
                      )}

                      {/* AI Controls */}
                      <div className="flex gap-3 pt-2">
                        {!isWorkoutActive ? (
                          <Button onClick={handleStartWorkout} disabled={isDetecting} className="flex-1">
                            <Play className="w-4 h-4 mr-2" />Start Exercise
                          </Button>
                        ) : (
                          <>
                            <Button onClick={() => setIsPaused(!isPaused)} variant="secondary" className="flex-1">
                              {isPaused ? <><Play className="w-4 h-4 mr-2" />Resume</> : <><Pause className="w-4 h-4 mr-2" />Pause</>}
                            </Button>
                            <Button
                              onClick={handleStopWorkout}
                              variant="default"
                              disabled={!allSetsDone}
                              className={`flex-1 ${allSetsDone ? "bg-green-500 hover:bg-green-600 text-white" : "opacity-50 cursor-not-allowed"}`}
                              title={!allSetsDone ? `Complete ${targetSets ? targetSets - completedSets + " more set(s)" : "all sets"} first` : ""}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Finish{targetSets ? ` (${completedSets}/${targetSets} sets)` : ""}
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    /* ── MANUAL MODE: show exercise info + mark done button ── */
                    <>
                      {/* Exercise details */}
                      <div className="grid grid-cols-3 gap-3">
                        {targetReps && (
                          <div className="bg-primary/10 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-primary">{targetReps}</div>
                            <div className="text-xs text-muted-foreground">Reps</div>
                          </div>
                        )}
                        {targetSets && (
                          <div className="bg-purple-500/10 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-purple-400">{targetSets}</div>
                            <div className="text-xs text-muted-foreground">Sets</div>
                          </div>
                        )}
                        {selectedExercise?.restTime ? (
                          <div className="bg-amber-500/10 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-amber-400">{selectedExercise.restTime}s</div>
                            <div className="text-xs text-muted-foreground">Rest</div>
                          </div>
                        ) : null}
                      </div>

                      {/* Instructions */}
                      {selectedExercise?.instructions && selectedExercise.instructions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Instructions</p>
                          <ol className="space-y-1.5 list-decimal list-inside">
                            {selectedExercise.instructions.map((step, i) => (
                              <li key={i} className="text-sm text-muted-foreground">{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Manual mark-done button */}
                      <div className="pt-2">
                        {!completedExercises.has(selectedExercise?.id ?? "") ? (
                          <Button
                            onClick={handleStopWorkout}
                            className="w-full bg-green-500 hover:bg-green-600 text-white"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Mark as Done
                          </Button>
                        ) : (
                          <div className="flex items-center justify-center gap-2 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Exercise completed!
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              {/* Exercise list */}
              <Card>
                <CardHeader>
                  <CardTitle>Program Exercises</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {programExercises.length > 0 ? (
                    programExercises.map((ex, index) => {
                      const isDone = completedExercises.has(ex.id);
                      const isActive = selectedExercise?.id === ex.id;
                      return (
                        <button
                          key={ex.id}
                          onClick={() => handleSelectExercise(ex, index)}
                          className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : isDone
                              ? "bg-green-500/10 border border-green-500/30"
                              : "hover:bg-secondary"
                          }`}
                        >
                          {/* Icon trạng thái */}
                          <div className="shrink-0">
                            {isDone ? (
                              <CheckCircle2 className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-green-400"}`} />
                            ) : (
                              <div className={`w-5 h-5 rounded-full border-2 ${isActive ? "border-primary-foreground" : "border-muted-foreground"}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm ${isDone && !isActive ? "line-through text-muted-foreground" : ""}`}>
                              {ex.name}
                            </div>
                            <div className={`flex flex-wrap gap-x-2 mt-0.5 text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {ex.reps && <span>{ex.reps} reps</span>}
                              {ex.sets && <span>· {ex.sets} sets</span>}
                              {ex.restTime ? <span>· rest {ex.restTime}s</span> : null}
                              {ex.duration && !ex.reps && <span>{ex.duration}</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : isExercisesLoading ? (
                    <div className="text-sm text-muted-foreground">Loading exercises...</div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No exercises for this program</div>
                  )}
                </CardContent>
              </Card>

              {/* Complete Workout button — hiện khi tất cả exercise đã done */}
              {programExercises.length > 0 &&
                completedExercises.size >= programExercises.length && (
                <Card className="border-2 border-green-500/50 bg-green-500/5">
                  <CardContent className="pt-6 text-center space-y-4">
                    <div className="text-4xl">🎉</div>
                    <div>
                      <p className="font-bold text-lg text-green-400">Workout Complete!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {completedExercises.size} exercises · {formatTime(workoutTime)}
                        {hasAIMonitoring ? ` · ${totalCalories} cal` : ""}
                      </p>
                    </div>
                    <Button
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
                      onClick={handleCompleteDay}
                      disabled={isCompletingDay}
                    >
                      {isCompletingDay ? (
                        <>
                          <svg className="animate-spin w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Complete Workout
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Session summary */}
              <Card className="bg-linear-to-br from-primary/10 to-accent/10">
                <CardHeader>
                  <CardTitle className="text-lg">Session Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {/* Workout Time — shown for both modes */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Workout Time:</span>
                    <span className="font-semibold font-mono">{formatTime(workoutTime)}</span>
                  </div>
                  {/* AI-only stats */}
                  {hasAIMonitoring && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Reps:</span>
                        <span className="font-semibold">{repCounter.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Calories:</span>
                        <span className="font-semibold">{totalCalories}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Exercise Type:</span>
                        <span className="font-semibold capitalize">{exType}</span>
                      </div>
                    </>
                  )}
                  {/* Exercises progress — shown for both modes */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exercises Done:</span>
                    <span className="font-semibold">{completedExercises.size}/{programExercises.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AICoachPage() {
  return (
    <Suspense>
      <AICoachContent />
    </Suspense>
  );
}