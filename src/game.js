import {
  WORLD,
  createInitialState,
  pauseGame,
  restartGame,
  startGame,
  stepGame,
  summarizeState
} from "./gameLogic.js";

const COLORS = {
  background: "#111827",
  grid: "#2a3d4f",
  lane: "#435466",
  player: "#f7c948",
  playerTrim: "#f97316",
  signal: "#33d6a6",
  blocker: "#e5506d",
  text: "#f8fafc",
  muted: "#9fb3c8",
  gate: "#7dd3fc"
};

export function mountGame(canvas, ui) {
  const ctx = canvas.getContext("2d");
  const keys = new Set();
  let state = createInitialState(20260424);
  let last = performance.now();
  let touchTarget = null;

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(bounds.width * ratio);
    canvas.height = Math.round(bounds.width * (WORLD.height / WORLD.width) * ratio);
    canvas.style.height = `${bounds.width * (WORLD.height / WORLD.width)}px`;
    ctx.setTransform(canvas.width / WORLD.width, 0, 0, canvas.height / WORLD.height, 0, 0);
  };

  const updateUi = () => {
    const summary = summarizeState(state);
    ui.score.textContent = String(summary.score);
    ui.handoffs.textContent = String(summary.handoffs);
    ui.readiness.textContent = `${summary.readiness}/${summary.readinessTarget}`;
    ui.health.textContent = String(summary.health);
    ui.status.textContent = statusText(summary.status);
    ui.readinessBar.style.width = `${(summary.readiness / summary.readinessTarget) * 100}%`;
    ui.eventLog.replaceChildren(
      ...summary.events.map((event) => {
        const li = document.createElement("li");
        li.textContent = event;
        return li;
      })
    );
  };

  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    stepGame(state, readInput(keys, touchTarget, state), dt);
    draw(ctx, state);
    updateUi();
    requestAnimationFrame(frame);
  };

  ui.start.addEventListener("click", () => startGame(state));
  ui.pause.addEventListener("click", () => pauseGame(state));
  ui.restart.addEventListener("click", () => {
    state = restartGame(Date.now() % 100000);
  });

  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "w", "s", "W", "S", " "].includes(event.key)) {
      event.preventDefault();
    }
    if (event.key === " ") {
      state.status === "running" ? pauseGame(state) : startGame(state);
      return;
    }
    keys.add(event.key.toLowerCase());
  });
  window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture(event.pointerId);
    touchTarget = pointerToWorld(canvas, event);
    startGame(state);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (event.buttons > 0) {
      touchTarget = pointerToWorld(canvas, event);
    }
  });
  canvas.addEventListener("pointerup", () => {
    touchTarget = null;
  });
  window.addEventListener("resize", resize);

  resize();
  updateUi();
  requestAnimationFrame(frame);
}

function readInput(keys, touchTarget, state) {
  if (touchTarget) {
    return {
      up: touchTarget.y < state.player.y - 8,
      down: touchTarget.y > state.player.y + 8
    };
  }
  return {
    up: keys.has("arrowup") || keys.has("w"),
    down: keys.has("arrowdown") || keys.has("s")
  };
}

function draw(ctx, state) {
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);
  drawBackground(ctx);
  drawGate(ctx, state);
  drawPlayer(ctx, state.player);
  for (const object of state.objects) {
    drawObject(ctx, object);
  }
  if (state.status === "idle" || state.status === "paused" || state.status === "won" || state.status === "failed") {
    drawOverlay(ctx, state.status);
  }
}

function drawBackground(ctx) {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x < WORLD.width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 96, WORLD.height);
    ctx.stroke();
  }
  for (const lane of WORLD.lanes) {
    ctx.strokeStyle = COLORS.lane;
    ctx.setLineDash([12, 18]);
    ctx.beginPath();
    ctx.moveTo(0, lane);
    ctx.lineTo(WORLD.width, lane);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawGate(ctx, state) {
  const gateX = WORLD.width - 92;
  ctx.fillStyle = "rgba(125, 211, 252, 0.13)";
  ctx.fillRect(gateX, 54, 18, WORLD.height - 108);
  ctx.fillStyle = COLORS.gate;
  ctx.font = "700 15px Inter, system-ui, sans-serif";
  ctx.fillText(`LIVE GATE ${state.readiness}/${WORLD.readinessTarget}`, gateX - 36, 42);
}

function drawPlayer(ctx, player) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = COLORS.playerTrim;
  ctx.beginPath();
  ctx.moveTo(32, 0);
  ctx.lineTo(-22, -24);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-22, 24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(-7, -6, 14, 12);
  ctx.restore();
}

function drawObject(ctx, object) {
  const color = object.type === "signal" ? COLORS.signal : COLORS.blocker;
  ctx.save();
  ctx.translate(object.x, object.y);
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(248, 250, 252, 0.76)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (object.type === "signal") {
    ctx.roundRect(-24, -16, 48, 32, 8);
  } else {
    ctx.moveTo(0, -26);
    ctx.lineTo(25, 18);
    ctx.lineTo(-25, 18);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.background;
  ctx.font = "700 10px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(object.label.slice(0, 8), 0, 4);
  ctx.restore();
}

function drawOverlay(ctx, status) {
  const text = {
    idle: "Press Start, Space, or tap to begin",
    paused: "Paused. Pane captured.",
    won: "Ready. Three handoffs complete.",
    failed: "Failed closed. Recreate and retry."
  }[status];
  ctx.fillStyle = "rgba(17, 24, 39, 0.72)";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.fillStyle = COLORS.text;
  ctx.font = "800 34px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, WORLD.width / 2, WORLD.height / 2);
}

function pointerToWorld(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * WORLD.width,
    y: ((event.clientY - rect.top) / rect.height) * WORLD.height
  };
}

function statusText(status) {
  switch (status) {
    case "running":
      return "Prompt is live. Collect signals and avoid blockers.";
    case "paused":
      return "Paused for pane capture.";
    case "won":
      return "Ready: three bounded handoffs completed.";
    case "failed":
      return "Failed closed: blockers exhausted the run.";
    default:
      return "Route prompt packets through the handoff gate.";
  }
}

