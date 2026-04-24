# Talos Signal Run

Talos Signal Run is a browser game built as an end-to-end test target for agentic coding workflows. The player routes prompt packets through a live handoff gate while avoiding blockers such as auth stalls, stale database state, wrong working directories, trust prompts, and timeouts.

The project is intentionally complete enough to exercise real workflow contracts:

- browser game rendered on canvas
- deterministic game logic tests
- production build with Vite
- devcontainer definition
- bounded smoke/report scripts with stable output markers
- documentation for prompt and monitoring workflows

## Play

```bash
npm ci
npm run start
```

Open the Vite URL and use `W`/`S`, arrow keys, or touch input. Collect green signal packets. Avoid red blockers. Complete three live handoffs to win.

## Validate

```bash
npm test
npm run smoke
npm run build
npm run report
```

`npm run smoke` emits:

```text
TALOS_GAME_SMOKE_RESULT_START
...
TALOS_GAME_SMOKE_RESULT_END
```

`npm run report` emits:

```text
TALOS_GAME_REPORT_START
...
TALOS_GAME_REPORT_END
```

Those markers are designed for Talos pane capture and command telemetry.

## Devcontainer

This repo includes `.devcontainer/devcontainer.json` using the Node 20 devcontainer image.

With Talos, the server-side flow is:

```bash
talos git clone <host> --repo https://github.com/3vilsaint/talos-signal-run-20260424.git --project talos-signal-run-20260424
talos devcontainer build <host> --project /projects/repos/talos-signal-run-20260424 --image-name talos-signal-run-20260424:dev
talos devcontainer up <host> --project /projects/repos/talos-signal-run-20260424
talos devcontainer exec <host> --project /projects/repos/talos-signal-run-20260424 --command "npm test && npm run smoke && npm run build && npm run report"
```

## Agent Prompting

See [docs/PROMPT-WORKFLOW.md](docs/PROMPT-WORKFLOW.md) for the model prompting contract. The core rule is that Talos should enforce readiness and capture, not force the user's prompt into a biased template.

## Monitoring

See [docs/MONITORING.md](docs/MONITORING.md) for stable output markers and Talos capture expectations.

