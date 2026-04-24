export const WORLD = Object.freeze({
  width: 960,
  height: 540,
  playerX: 128,
  lanes: [108, 190, 272, 354, 436],
  readinessTarget: 6
});

const SIGNAL_LABELS = [
  "host",
  "docker",
  "workspace",
  "ssh",
  "tmux",
  "live-prompt"
];

const BLOCKER_LABELS = [
  "auth",
  "stale-db",
  "wrong-cwd",
  "trust",
  "timeout"
];

export function createRng(seed = 42) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

export function createInitialState(seed = 42) {
  return {
    seed,
    rng: createRng(seed),
    status: "idle",
    time: 0,
    spawnClock: 0,
    score: 0,
    handoffs: 0,
    readiness: 0,
    combo: 0,
    health: 3,
    player: {
      x: WORLD.playerX,
      y: WORLD.lanes[2],
      radius: 22,
      speed: 330
    },
    objects: [],
    events: ["ready: devcontainer game loop waiting for prompt"]
  };
}

export function normalizeInput(input = {}) {
  const dx = Number(input.right || 0) - Number(input.left || 0);
  const dy = Number(input.down || 0) - Number(input.up || 0);
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: dx / length,
    y: dy / length,
    active: dx !== 0 || dy !== 0
  };
}

export function addEvent(state, message) {
  state.events.unshift(message);
  state.events = state.events.slice(0, 8);
}

export function spawnObject(state) {
  const isSignal = state.rng() > 0.34;
  const lane = WORLD.lanes[Math.floor(state.rng() * WORLD.lanes.length)];
  const labelSet = isSignal ? SIGNAL_LABELS : BLOCKER_LABELS;
  const label = labelSet[Math.floor(state.rng() * labelSet.length)];
  state.objects.push({
    id: `${Math.round(state.time * 1000)}-${label}-${state.objects.length}`,
    type: isSignal ? "signal" : "blocker",
    label,
    x: WORLD.width + 40,
    y: lane,
    radius: isSignal ? 18 : 24,
    speed: isSignal ? 210 + state.rng() * 90 : 250 + state.rng() * 120
  });
}

export function injectObject(state, object) {
  state.objects.push({
    id: object.id || `manual-${state.objects.length}`,
    type: object.type,
    label: object.label || object.type,
    x: object.x,
    y: object.y,
    radius: object.radius || 20,
    speed: object.speed || 0
  });
}

export function stepGame(state, input = {}, dt = 1 / 60) {
  if (state.status !== "running") {
    return state;
  }

  const movement = normalizeInput(input);
  if (movement.active) {
    state.player.y += movement.y * state.player.speed * dt;
    state.player.y = clamp(state.player.y, 62, WORLD.height - 62);
  }

  state.time += dt;
  state.spawnClock += dt;
  const spawnEvery = Math.max(0.58, 1.08 - state.handoffs * 0.08);
  if (state.spawnClock >= spawnEvery) {
    state.spawnClock = 0;
    spawnObject(state);
  }

  for (const object of state.objects) {
    object.x -= object.speed * dt;
  }

  const kept = [];
  for (const object of state.objects) {
    if (collides(state.player, object)) {
      applyCollision(state, object);
      continue;
    }
    if (object.x > -80) {
      kept.push(object);
    }
  }
  state.objects = kept;

  if (state.health <= 0) {
    state.status = "failed";
    addEvent(state, "failed: prompt chain exhausted by blockers");
  } else if (state.handoffs >= 3) {
    state.status = "won";
    addEvent(state, "ready: three live handoffs completed");
  }
  return state;
}

export function startGame(state) {
  if (state.status === "idle" || state.status === "paused") {
    state.status = "running";
    addEvent(state, "running: model prompt accepted by workflow");
  }
  return state;
}

export function pauseGame(state) {
  if (state.status === "running") {
    state.status = "paused";
    addEvent(state, "paused: operator captured pane state");
  }
  return state;
}

export function restartGame(seed = 42) {
  const state = createInitialState(seed);
  state.status = "running";
  addEvent(state, "running: workflow recreated from clean state");
  return state;
}

export function summarizeState(state) {
  return {
    status: state.status,
    score: state.score,
    handoffs: state.handoffs,
    readiness: state.readiness,
    readinessTarget: WORLD.readinessTarget,
    health: state.health,
    events: [...state.events]
  };
}

function applyCollision(state, object) {
  if (object.type === "signal") {
    state.combo += 1;
    state.readiness += 1;
    state.score += 10 + state.combo * 3;
    addEvent(state, `signal:${object.label} captured`);
    if (state.readiness >= WORLD.readinessTarget) {
      state.handoffs += 1;
      state.score += 75;
      state.readiness = 0;
      state.combo += 2;
      addEvent(state, `handoff:${state.handoffs} live prompt returned marker`);
    }
    return;
  }

  state.combo = 0;
  state.health -= 1;
  state.readiness = Math.max(0, state.readiness - 2);
  addEvent(state, `blocked:${object.label} requires operator action`);
}

function collides(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) <= a.radius + b.radius;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

