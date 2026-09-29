"use client";

import { useEffect, useRef, useState } from "react";
import {
  MarbleDrawSim,
  GOAL_Y,
  WORLD_WIDTH,
  VIEW_TOP,
  VIEW_BOTTOM,
  MARBLE_RADIUS,
  FINAL_ZONE_CENTER_Y,
  computeSpawnPosition,
  type MarbleSpec,
  type ObstacleState,
} from "@/lib/roulette/physics";
import { CanvasVideoRecorder } from "@/lib/roulette/videoRecorder";
import { getMarbleColor } from "@/lib/roulette/marbleColor";

const SHUFFLE_COUNT = 3;
const SHUFFLE_INTERVAL_MS = 450;

// 마지막 몇 개가 남았을 때부터 카메라를 확대하고 슬로모션으로 전환할지
const FINAL_ZOOM_THRESHOLD = 3;
const FINAL_ZOOM_LEVEL = 1.8;
const FINAL_TIME_SCALE = 0.3;
const CAMERA_LERP = 0.08;

const CANVAS_WIDTH = 640;
const BASE_SCALE = CANVAS_WIDTH / WORLD_WIDTH;
const CANVAS_HEIGHT = Math.round(BASE_SCALE * (VIEW_BOTTOM - VIEW_TOP));
const DEFAULT_CENTER_Y = (VIEW_TOP + VIEW_BOTTOM) / 2;

interface Camera {
  zoom: number;
  cx: number;
  cy: number;
}

function project(cam: Camera, x: number, y: number) {
  const scale = BASE_SCALE * cam.zoom;
  return {
    px: (x - cam.cx) * scale + CANVAS_WIDTH / 2,
    py: (y - cam.cy) * scale + CANVAS_HEIGHT / 2,
    scale,
  };
}

interface Entrant {
  entry_number: number;
  ticket_count: number;
}

interface RaffleDrawCanvasProps {
  entrants: Entrant[];
  onComplete: (winnerEntryNumber: number, video: Blob) => void;
}

type Phase = "loading" | "lineup" | "shuffling" | "running" | "done";

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  o: ObstacleState,
) {
  const { px, py, scale } = project(cam, o.x, o.y);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(o.angle);
  ctx.fillStyle = o.color;
  ctx.shadowColor = o.color;
  ctx.shadowBlur = scale * 0.35;
  if (o.kind === "circle" && o.radius) {
    ctx.beginPath();
    ctx.arc(0, 0, o.radius * scale, 0, Math.PI * 2);
    ctx.fill();
  } else if (o.kind === "box" && o.halfWidth && o.halfHeight) {
    ctx.fillRect(
      -o.halfWidth * scale,
      -o.halfHeight * scale,
      o.halfWidth * 2 * scale,
      o.halfHeight * 2 * scale,
    );
  }
  ctx.restore();
}

function drawMarble(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  scale: number,
  color: string,
  label: string,
) {
  const r = MARBLE_RADIUS * scale;

  ctx.beginPath();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.ellipse(px, py + r * 0.6, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = scale * 0.55;
  const gradient = ctx.createRadialGradient(
    px - r * 0.35,
    py - r * 0.35,
    r * 0.1,
    px,
    py,
    r,
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.25, color);
  gradient.addColorStop(1, color);
  ctx.beginPath();
  ctx.fillStyle = gradient;
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.stroke();

  // 숫자가 원 안에 꽉 차게 들어가도록, 큰 폰트로 시작해서 너비가 넘치면 줄여서 맞춘다
  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let fontSize = r * 1.6;
  ctx.font = `bold ${fontSize}px sans-serif`;
  const maxTextWidth = r * 1.5;
  const textWidth = ctx.measureText(label).width;
  if (textWidth > maxTextWidth) {
    fontSize *= maxTextWidth / textWidth;
    ctx.font = `bold ${fontSize}px sans-serif`;
  }
  ctx.fillText(label, px, py + fontSize * 0.03);
}

function drawBackgroundAndStage(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  cam: Camera,
  sim: MarbleDrawSim,
) {
  // --bg-subtle → --bg 그라데이션 — 사이트 다른 곳의 엘리베이션 규칙(sunken/elevated)과 같은 방향
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, "#1a1c24");
  bg.addColorStop(1, "#14151a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 무대 좌우 경계 — 구조용 선이라 튀지 않게 --border-strong로
  const leftTop = project(cam, 0, VIEW_TOP);
  const leftBottom = project(cam, 0, VIEW_BOTTOM);
  const rightTop = project(cam, WORLD_WIDTH, VIEW_TOP);
  const rightBottom = project(cam, WORLD_WIDTH, VIEW_BOTTOM);
  ctx.save();
  ctx.strokeStyle = "#3a3d4a";
  ctx.lineWidth = Math.max(1, 1.5 * cam.zoom);
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(leftTop.px, leftTop.py);
  ctx.lineTo(leftBottom.px, leftBottom.py);
  ctx.moveTo(rightTop.px, rightTop.py);
  ctx.lineTo(rightBottom.px, rightBottom.py);
  ctx.stroke();
  ctx.restore();

  sim.getObstacleStates().forEach((o) => drawObstacle(ctx, cam, o));

  // 골라인 — --gold, 사이트 전체에서 "보상/당첨"을 뜻하는 색과 통일
  const goal = project(cam, 0, GOAL_Y);
  const goalRight = project(cam, WORLD_WIDTH, GOAL_Y);
  ctx.save();
  ctx.strokeStyle = "#d4af6a";
  ctx.shadowColor = "#d4af6a";
  ctx.shadowBlur = 12 * cam.zoom;
  ctx.lineWidth = Math.max(1.5, 2 * cam.zoom);
  ctx.setLineDash([8 * cam.zoom, 6 * cam.zoom]);
  ctx.beginPath();
  ctx.moveTo(goal.px, goal.py);
  ctx.lineTo(goalRight.px, goalRight.py);
  ctx.stroke();
  ctx.restore();
}

export default function RaffleDrawCanvas({
  entrants,
  onComplete,
}: RaffleDrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<MarbleDrawSim | null>(null);
  const recorderRef = useRef(new CanvasVideoRecorder());
  const rafRef = useRef<number>(0);
  const finishedRef = useRef(false);
  const celebrationTriggeredRef = useRef(false);
  const stopLoopRef = useRef(false);
  const specsRef = useRef<MarbleSpec[]>([]);
  const cameraRef = useRef<Camera>({
    zoom: 1,
    cx: WORLD_WIDTH / 2,
    cy: DEFAULT_CENTER_Y,
  });

  const [phase, setPhase] = useState<Phase>("loading");
  const [shuffleStep, setShuffleStep] = useState(0);
  const [lineup, setLineup] = useState<MarbleSpec[]>([]);
  const [remaining, setRemaining] = useState(0);
  const [winner, setWinner] = useState<number | null>(null);
  const [slowMo, setSlowMo] = useState(false);
  const [celebration, setCelebration] = useState<number | null>(null);

  // 대기 줄(셔플 전/중) 렌더링 — 실제 낙하 시작 위치와 같은 자리에 정지 상태로 그려준다
  const drawLineup = (specs: MarbleSpec[]) => {
    const canvas = canvasRef.current;
    const sim = simRef.current;
    if (!canvas || !sim) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cam = cameraRef.current;
    drawBackgroundAndStage(ctx, canvas, cam, sim);
    specs.forEach((spec, i) => {
      const { x, y } = computeSpawnPosition(i, specs.length);
      const { px, py, scale } = project(cam, x, y);
      drawMarble(ctx, px, py, scale, spec.color, String(spec.entryNumber));
    });
  };

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const sim = new MarbleDrawSim();
    sim.init().then(() => {
      if (cancelled) return;
      simRef.current = sim;
      const specs: MarbleSpec[] = [];
      let id = 0;
      entrants.forEach((e) => {
        for (let i = 0; i < e.ticket_count; i++) {
          specs.push({
            id: id++,
            entryNumber: e.entry_number,
            color: getMarbleColor(e.entry_number),
          });
        }
      });
      specsRef.current = specs;
      setLineup(specs);
      setRemaining(specs.length);
      setPhase("lineup");
      drawLineup(specs);
    });

    return () => {
      cancelled = true;
      stopLoopRef.current = true;
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrants]);

  useEffect(() => {
    if (phase === "lineup" || phase === "shuffling") drawLineup(lineup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineup, phase]);

  const runPhysics = () => {
    const sim = simRef.current;
    const canvas = canvasRef.current;
    if (!sim || !canvas) return;

    sim.spawnMarbles(specsRef.current);
    setPhase("running");
    finishedRef.current = false;
    celebrationTriggeredRef.current = false;
    stopLoopRef.current = false;
    sim.start();

    const loop = () => {
      if (stopLoopRef.current) return;

      const remainingCount = sim.getRemainingCount();
      const isFinalStretch = remainingCount <= FINAL_ZOOM_THRESHOLD;
      sim.step((1 / 60) * (isFinalStretch ? FINAL_TIME_SCALE : 1));

      // 마지막 몇 개가 남으면 결승선 직전 구간으로 카메라를 부드럽게 확대한다
      const cam = cameraRef.current;
      const targetZoom = isFinalStretch ? FINAL_ZOOM_LEVEL : 1;
      const targetCy = isFinalStretch ? FINAL_ZONE_CENTER_Y : DEFAULT_CENTER_Y;
      cam.zoom += (targetZoom - cam.zoom) * CAMERA_LERP;
      cam.cy += (targetCy - cam.cy) * CAMERA_LERP;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawBackgroundAndStage(ctx, canvas, cam, sim);
        sim.getMarbleStates().forEach((m) => {
          const { px, py, scale } = project(cam, m.x, m.y);
          drawMarble(ctx, px, py, scale, m.color, String(m.entryNumber));
        });
      }
      setRemaining(remainingCount);
      setSlowMo(isFinalStretch);

      // 딱 하나 남으면 이미 결과가 정해진 것 — 실제로 골라인을 넘기 전에 미리 축하 문구를 띄운다
      if (!celebrationTriggeredRef.current && remainingCount === 1) {
        const last = sim.getMarbleStates()[0];
        if (last) {
          celebrationTriggeredRef.current = true;
          setCelebration(last.entryNumber);
        }
      }

      if (!finishedRef.current && sim.isComplete()) {
        finishedRef.current = true;
        const order = sim.getFinishOrder();
        const winnerEntryNumber = order[order.length - 1];
        setWinner(winnerEntryNumber);
        setTimeout(async () => {
          stopLoopRef.current = true;
          const video = await recorderRef.current.stop();
          setPhase("done");
          onComplete(winnerEntryNumber, video);
        }, 1500);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  // 시작 전 대기 줄을 3번 섞어서 긴장감을 준 다음 실제 낙하를 시작한다.
  // 녹화는 셔플 시작 시점부터 걸어서 영상에 셔플 과정도 함께 남긴다.
  const startShuffleThenRun = () => {
    const canvas = canvasRef.current;
    if (canvas) recorderRef.current.start(canvas);
    setPhase("shuffling");
    let step = 0;
    const doShuffle = () => {
      const shuffled = shuffleArray(specsRef.current);
      specsRef.current = shuffled;
      setLineup(shuffled);
      step += 1;
      setShuffleStep(step);
      if (step < SHUFFLE_COUNT) {
        setTimeout(doShuffle, SHUFFLE_INTERVAL_MS);
      } else {
        setTimeout(runPhysics, SHUFFLE_INTERVAL_MS);
      }
    };
    doShuffle();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ position: "relative", width: "100%", maxWidth: 360 }}>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
            background: "#14151a",
            borderRadius: 12,
            border: "1px solid #3a3d4a",
            boxShadow:
              "0 0 16px rgba(224,56,76,0.25), 0 0 40px rgba(212,175,106,0.15)",
            display: "block",
          }}
        />
        {celebration !== null && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "rgba(0,0,0,0.6)",
              borderRadius: 12,
              textAlign: "center",
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
                textShadow: "0 0 10px #d4af6a, 0 0 20px #d4af6a",
              }}
            >
              🎉 축하합니다! 🎉
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: "#d4af6a",
                textShadow:
                  "0 0 8px #d4af6a, 0 0 20px #e0384c, 0 0 36px #e0384c",
              }}
            >
              당첨번호 {celebration}번 !!
            </div>
          </div>
        )}
      </div>
      {phase === "loading" && (
        <div style={{ color: "var(--text-tertiary)", fontSize: 13 }}>
          물리 엔진 불러오는 중...
        </div>
      )}
      {phase === "lineup" && (
        <button
          onClick={startShuffleThenRun}
          style={{
            padding: "11px 24px",
            borderRadius: 10,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          추첨 시작
        </button>
      )}
      {phase === "shuffling" && (
        <div style={{ color: "var(--gold)", fontSize: 13, fontWeight: 600 }}>
          🔀 순서를 섞는 중... ({shuffleStep}/{SHUFFLE_COUNT})
        </div>
      )}
      {phase === "running" && winner === null && (
        <div
          style={{
            color: slowMo ? "var(--danger)" : "var(--text-secondary)",
            fontSize: 13,
            fontWeight: slowMo ? 700 : 400,
          }}
        >
          {slowMo
            ? `🎬 마지막 ${remaining}개! 슬로모션으로 결승선을 확대합니다...`
            : `추첨 진행 중... (남은 구슬 ${remaining}개 · 마지막에 떨어지는 구슬이 당첨)`}
        </div>
      )}
      {winner !== null && (
        <div style={{ color: "var(--gold)", fontSize: 15, fontWeight: 700 }}>
          당첨 응모 번호: #{winner}
          {phase === "done" ? " (영상 업로드 준비 완료)" : ""}
        </div>
      )}
    </div>
  );
}
