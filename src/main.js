import "./styles.css";
import { mountGame } from "./game.js";

mountGame(document.querySelector("#game"), {
  score: document.querySelector("#score"),
  handoffs: document.querySelector("#handoffs"),
  readiness: document.querySelector("#readiness"),
  health: document.querySelector("#health"),
  status: document.querySelector("#status"),
  readinessBar: document.querySelector("#readinessBar"),
  eventLog: document.querySelector("#eventLog"),
  start: document.querySelector("#start"),
  pause: document.querySelector("#pause"),
  restart: document.querySelector("#restart")
});

