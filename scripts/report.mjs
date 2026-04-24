import {
  createInitialState,
  injectObject,
  startGame,
  stepGame,
  summarizeState
} from "../src/gameLogic.js";

const state = createInitialState(31415);
startGame(state);

for (const label of ["host", "docker", "workspace", "ssh", "tmux", "live-prompt"]) {
  injectObject(state, {
    type: "signal",
    label,
    x: state.player.x,
    y: state.player.y,
    speed: 0
  });
  stepGame(state, {}, 1 / 60);
}

console.log("TALOS_GAME_REPORT_START");
console.log(JSON.stringify(summarizeState(state), null, 2));
console.log("TALOS_GAME_REPORT_END");

