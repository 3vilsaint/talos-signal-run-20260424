import test from "node:test";
import assert from "node:assert/strict";
import {
  WORLD,
  createInitialState,
  injectObject,
  restartGame,
  startGame,
  stepGame,
  summarizeState
} from "./gameLogic.js";

test("collecting six signals completes one handoff", () => {
  const state = createInitialState(7);
  startGame(state);

  for (let i = 0; i < WORLD.readinessTarget; i += 1) {
    injectObject(state, {
      type: "signal",
      label: `marker-${i}`,
      x: state.player.x,
      y: state.player.y,
      speed: 0
    });
    stepGame(state, {}, 1 / 60);
  }

  assert.equal(state.handoffs, 1);
  assert.equal(state.readiness, 0);
  assert.ok(state.score >= 75);
  assert.match(state.events[0], /handoff:1/);
});

test("blockers reduce health and keep status honest", () => {
  const state = createInitialState(9);
  startGame(state);
  state.readiness = 4;

  injectObject(state, {
    type: "blocker",
    label: "auth",
    x: state.player.x,
    y: state.player.y,
    speed: 0
  });
  stepGame(state, {}, 1 / 60);

  assert.equal(state.health, 2);
  assert.equal(state.readiness, 2);
  assert.match(state.events[0], /blocked:auth/);
});

test("summary is safe for telemetry output", () => {
  const state = restartGame(11);
  const summary = summarizeState(state);

  assert.equal(summary.status, "running");
  assert.equal(summary.readinessTarget, 6);
  assert.deepEqual(Object.keys(summary).sort(), [
    "events",
    "handoffs",
    "health",
    "readiness",
    "readinessTarget",
    "score",
    "status"
  ]);
});

