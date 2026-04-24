import assert from "node:assert/strict";
import {
  WORLD,
  createInitialState,
  injectObject,
  startGame,
  stepGame,
  summarizeState
} from "../src/gameLogic.js";

const state = createInitialState(20260424);
startGame(state);

for (let i = 0; i < WORLD.readinessTarget * 3; i += 1) {
  injectObject(state, {
    type: "signal",
    label: `smoke-${i}`,
    x: state.player.x,
    y: state.player.y,
    speed: 0
  });
  stepGame(state, {}, 1 / 60);
}

const summary = summarizeState(state);
assert.equal(summary.status, "won");
assert.equal(summary.handoffs, 3);
assert.ok(summary.score > 250);

console.log("TALOS_GAME_SMOKE_RESULT_START");
console.log(JSON.stringify(summary, null, 2));
console.log("TALOS_GAME_SMOKE_RESULT_END");

