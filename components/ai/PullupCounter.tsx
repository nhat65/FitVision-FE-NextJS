import { useEffect, useRef, useState, useCallback, FC } from "react";

// ==================== TYPES ====================
const PHASE = { IDLE: "idle", UP: "up", DOWN: "down" } as const;
type Phase = typeof PHASE[keyof typeof PHASE];

const COLORS = {
  bg: "#0a0a0f",
  surface: "#13131a",
  card: "#1a1a24",
  border: "#2a2a3a",
  accent: "#7c6ff7",
  accentLight: "#a89ef9",
  green: "#4ade80",
  amber: "#fbbf24",
  text: "#e8e8f0",
  muted: "#6b6b8a",
} as const;

interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

interface PoseResults {
  poseLandmarks: Landmark[] | null;
}

interface AngleGaugeProps {
  angle: number;
  label: string;
  color: string;
}

interface StatCardProps {
  value: string | number;
  label: string;
  color?: string;
}

// MediaPipe types (basic)
declare global {
  interface Window {
    Pose: any;
    Camera: any;
  }
}

const MEDIAPIPE_VERSION = "0.5.1675469404";
const CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${MEDIAPIPE_VERSION}`;

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

const AngleGauge: FC<AngleGaugeProps> = ({ angle, label, color }) => {
  const pct = Math.min(100, Math.max(0, (angle / 180) * 100));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.muted }}>
        <span>{label}</span>
        <span style={{ color: COLORS.text, fontFamily: "monospace" }}>{Math.round(angle)}°</span>
      </div>
      <div style={{ height: 4, background: COLORS.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 2, transition: "width 0.1s" }} />
      </div>
    </div>
  );
};

const StatCard: FC<StatCardProps> = ({ value, label, color }) => {
  return (
    <div style={{ background: COLORS.card, border: "1px solid " + COLORS.border, borderRadius: 12, padding: "14px 16px", flex: 1 }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: color || COLORS.text, fontFamily: "monospace", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
};

export default function PullupCounter() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ phase: Phase; reps: number }>({ phase: PHASE.IDLE, reps: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const [status, setStatus] = useState<"idle" | "loading" | "running" | "error">("idle");
  const [reps, setReps] = useState(0);
  const [phase, setPhase] = useState<Phase>(PHASE.IDLE);
  const [angles, setAngles] = useState<{ left: number; right: number }>({ left: 0, right: 0 });
  const [feedback, setFeedback] = useState("Bắt đầu camera để đếm rep");
  const [elapsed, setElapsed] = useState(0);

  const calcAngle = useCallback((a: Landmark | null, b: Landmark | null, c: Landmark | null): number => {
    if (!a || !b || !c) return 0;
    const ab = [a.x - b.x, a.y - b.y];
    const cb = [c.x - b.x, c.y - b.y];
    const dot = ab[0] * cb[0] + ab[1] * cb[1];
    const magAB = Math.sqrt(ab[0] ** 2 + ab[1] ** 2);
    const magCB = Math.sqrt(cb[0] ** 2 + cb[1] ** 2);
    if (magAB === 0 || magCB === 0) return 0;
    const cos = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
    return (Math.acos(cos) * 180) / Math.PI;
  }, []);

  const drawSkeleton = useCallback((
    landmarks: Landmark[],
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    currentPhase: Phase
  ) => {
    const vis = (idx: number) => landmarks[idx] && landmarks[idx].visibility! > 0.25;
    const px = (idx: number) => landmarks[idx].x * w;
    const py = (idx: number) => landmarks[idx].y * h;

    const boneColor =
      currentPhase === PHASE.UP ? "#4ade80" :
      currentPhase === PHASE.DOWN ? "#fbbf24" : COLORS.accent;

    // Bones and Joints drawing logic (giữ nguyên như cũ)
    const bones = [
      { from: 11, to: 12, width: 3, alpha: 0.9 },
      { from: 11, to: 23, width: 2.5, alpha: 0.7 },
      { from: 12, to: 24, width: 2.5, alpha: 0.7 },
      { from: 23, to: 24, width: 2.5, alpha: 0.7 },
      { from: 11, to: 13, width: 3, alpha: 1.0 },
      { from: 13, to: 15, width: 2.5, alpha: 1.0 },
      { from: 12, to: 14, width: 3, alpha: 1.0 },
      { from: 14, to: 16, width: 2.5, alpha: 1.0 },
    ];

    bones.forEach(({ from, to, width, alpha }) => {
      if (!vis(from) || !vis(to)) return;
      const x1 = px(from), y1 = py(from);
      const x2 = px(to), y2 = py(to);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = boneColor + "33";
      ctx.lineWidth = width + 4;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = boneColor + Math.round(alpha * 255).toString(16).padStart(2, "0");
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.stroke();
    });

    const joints = [
      { idx: 11, r: 7, label: "L.Vai", primary: true },
      { idx: 12, r: 7, label: "R.Vai", primary: true },
      { idx: 13, r: 6, label: "L.Khuỷu", primary: false },
      { idx: 14, r: 6, label: "R.Khuỷu", primary: false },
      { idx: 15, r: 5, label: "L.Cổ tay", primary: false },
      { idx: 16, r: 5, label: "R.Cổ tay", primary: false },
      { idx: 23, r: 5.5, label: "L.Hông", primary: true },
      { idx: 24, r: 5.5, label: "R.Hông", primary: true },
    ];

    joints.forEach(({ idx, r, label, primary }) => {
      if (!vis(idx)) return;
      const x = px(idx), y = py(idx);

      ctx.beginPath();
      ctx.arc(x, y, r + 3, 0, Math.PI * 2);
      ctx.fillStyle = boneColor + "22";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = primary ? boneColor : COLORS.accentLight;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff99";
      ctx.fill();

      ctx.font = "bold 10px monospace";
      ctx.fillStyle = "#ffffffcc";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 3;
      const offsetX = (idx === 12 || idx === 14 || idx === 16 || idx === 24) ? r + 4 : -(r + 4);
      const anchor = (idx === 12 || idx === 14 || idx === 16 || idx === 24) ? "left" : "right";
      ctx.textAlign = anchor;
      ctx.fillText(label, x + offsetX, y + 4);
      ctx.shadowBlur = 0;
    });

    ctx.textAlign = "left";
  }, []);

  const processResults = useCallback((results: PoseResults) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const lm = results.poseLandmarks;
    if (!lm || lm.length < 17) return;

    drawSkeleton(lm, ctx, w, h, stateRef.current.phase);

    const leftAngle = calcAngle(lm[11], lm[13], lm[15]);
    const rightAngle = calcAngle(lm[12], lm[14], lm[16]);
    const avgAngle = (leftAngle + rightAngle) / 2;

    setAngles({ left: Math.round(leftAngle), right: Math.round(rightAngle) });

    const s = stateRef.current;
    const UP_THRESHOLD = 70;
    const DOWN_THRESHOLD = 140;

    if (s.phase === PHASE.IDLE || s.phase === PHASE.DOWN) {
      if (avgAngle < UP_THRESHOLD) {
        s.phase = PHASE.UP;
        setPhase(PHASE.UP);
        setFeedback("⬆ Đang kéo lên — giữ đỉnh!");
      }
    } else if (s.phase === PHASE.UP) {
      if (avgAngle > DOWN_THRESHOLD) {
        s.phase = PHASE.DOWN;
        s.reps += 1;
        const count = s.reps;
        setPhase(PHASE.DOWN);
        setReps(count);
        setFeedback("✅ Rep " + count + " hoàn thành! Tiếp tục!");
        setTimeout(() => setFeedback("⬇ Hạ xuống hoàn toàn..."), 800);
      }
    }

    ctx.fillStyle = COLORS.accent + "cc";
    ctx.fillRect(w - 130, 10, 120, 22);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px monospace";
    ctx.fillText("∠ " + Math.round(avgAngle) + "°", w - 120, 25);
  }, [drawSkeleton, calcAngle]);

  const startCamera = useCallback(async () => {
    setStatus("loading");
    setFeedback("Đang tải thư viện MediaPipe...");
    try {
      await loadScript(CDN + "/pose.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js");

      const PoseClass = window.Pose;
      const CameraClass = window.Camera;

      if (!PoseClass || !CameraClass) {
        throw new Error("MediaPipe chưa load xong, vui lòng thử lại.");
      }

      setFeedback("Đang khởi tạo model AI...");

      const pose = new PoseClass({
        locateFile: (file: string) => CDN + "/" + file,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      pose.onResults(processResults);

      const video = videoRef.current;
      if (!video) throw new Error("Không tìm thấy video element.");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      video.srcObject = stream;
      await video.play();

      const camera = new CameraClass(video, {
        onFrame: async () => { await pose.send({ image: video }); },
        width: 640,
        height: 480,
      });
      await camera.start();

      setStatus("running");
      setFeedback("✨ Sẵn sàng! Hãy bắt đầu kéo xà.");
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(err);
      setStatus("error");
      setFeedback("❌ Lỗi: " + msg);
    }
  }, [processResults]);

  const reset = useCallback(() => {
    stateRef.current = { phase: PHASE.IDLE, reps: 0 };
    setReps(0);
    setPhase(PHASE.IDLE);
    setElapsed(0);
    startTimeRef.current = Date.now();
    setFeedback("✨ Đã reset — hãy bắt đầu!");
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const video = videoRef.current;
      if (video && video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const fmtTime = (s: number): string =>
    String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

  const phaseColor =
    phase === PHASE.UP ? COLORS.green : phase === PHASE.DOWN ? COLORS.amber : COLORS.muted;
  const phaseLabel =
    phase === PHASE.UP ? "ĐANG KÉO LÊN" : phase === PHASE.DOWN ? "ĐANG HẠ XUỐNG" : "CHỜ...";

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "20px 16px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: status === "running" ? COLORS.green : COLORS.muted,
              boxShadow: status === "running" ? "0 0 8px " + COLORS.green : "none",
            }} />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Pull-up Counter AI</h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.muted }}>
            Phân tích góc khuỷu tay theo thời gian thực · MediaPipe Pose
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <StatCard value={reps} label="Tổng rep" color={COLORS.accentLight} />
          <StatCard value={fmtTime(elapsed)} label="Thời gian" />
          <StatCard
            value={reps > 0 && elapsed > 0 ? (reps / (elapsed / 60)).toFixed(1) : "0.0"}
            label="Rep/phút"
            color={COLORS.amber}
          />
        </div>

        {/* Camera */}
        <div style={{ background: COLORS.card, border: "1px solid " + COLORS.border, borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ position: "relative", aspectRatio: "4/3", background: "#000" }}>
            <video
              ref={videoRef}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: status === "running" ? 1 : 0.3, transform: "scaleX(-1)" }}
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
            />
            {status !== "running" && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <div style={{ fontSize: 48, opacity: 0.3 }}>🏋️</div>
                <p style={{ color: COLORS.muted, fontSize: 14, textAlign: "center", maxWidth: 240 }}>
                  {status === "loading" ? "Đang khởi tạo model..." : "Nhấn nút bên dưới để bắt đầu"}
                </p>
              </div>
            )}
            {status === "running" && (
              <div style={{ position: "absolute", top: 10, left: 10, background: phaseColor + "22", border: "1px solid " + phaseColor + "66", borderRadius: 6, padding: "4px 10px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: phaseColor, letterSpacing: "0.08em" }}>{phaseLabel}</span>
              </div>
            )}
          </div>

          {status === "running" && (
            <div style={{ padding: "12px 16px", borderTop: "1px solid " + COLORS.border, display: "flex", flexDirection: "column", gap: 8 }}>
              <AngleGauge angle={angles.left}  label="Góc khuỷu tay TRÁI" color={COLORS.accent} />
              <AngleGauge angle={angles.right} label="Góc khuỷu tay PHẢI" color={COLORS.accentLight} />
            </div>
          )}
        </div>

        {/* Feedback */}
        <div style={{ background: COLORS.surface, border: "1px solid " + COLORS.border, borderRadius: 10, padding: "10px 14px", marginBottom: 14, minHeight: 38, display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: COLORS.text }}>{feedback}</span>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          {(status === "idle" || status === "error") ? (
            <button
              onClick={startCamera}
              style={{ flex: 1, padding: "12px 0", background: COLORS.accent, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              🎥 Bắt đầu Camera
            </button>
          ) : status === "loading" ? (
            <div style={{ flex: 1, padding: "12px 0", background: COLORS.card, border: "1px solid " + COLORS.border, borderRadius: 10, fontSize: 14, color: COLORS.muted, textAlign: "center" }}>
              ⏳ Đang tải...
            </div>
          ) : (
            <button
              onClick={reset}
              style={{ flex: 1, padding: "12px 0", background: "transparent", color: COLORS.text, border: "1px solid " + COLORS.border, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              🔄 Reset Bộ Đếm
            </button>
          )}
        </div>

        {/* Guide */}
        <div style={{ marginTop: 20, background: COLORS.surface, border: "1px solid " + COLORS.border, borderRadius: 10, padding: "14px 16px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Hướng dẫn</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
            {[
              ["📐", "Đứng thẳng trước camera"],
              ["👀", "Camera thấy rõ toàn thân"],
              ["⬆",  "Kéo lên: góc khuỷu < 70°"],
              ["⬇",  "Hạ xuống: góc khuỷu > 140°"],
              ["💡", "Ánh sáng tốt, nền đơn giản"],
              ["📏", "Giữ khoảng cách 2–3 mét"],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: COLORS.muted }}>
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}