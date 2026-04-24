# Monitoring And Evidence

This repository emits bounded markers that Talos can capture from `devcontainer exec` or tmux panes.

Smoke check:

```bash
npm run smoke
```

Expected markers:

```text
TALOS_GAME_SMOKE_RESULT_START
...
TALOS_GAME_SMOKE_RESULT_END
```

Report check:

```bash
npm run report
```

Expected markers:

```text
TALOS_GAME_REPORT_START
...
TALOS_GAME_REPORT_END
```

These markers are intentionally stable. They let orchestration distinguish between command output, game telemetry, and a stalled shell or model pane.

For Talos-managed servers, `/projects/repos/...` is disposable. `/projects/monitoring/...` should be treated as durable operational evidence and may contain shell history, agent configuration, auth state, and captured output.

