# Prompt Workflow

Talos Signal Run is intentionally small enough for an agent to modify safely, while still having the pieces needed to validate an agentic code workflow.

The intended workflow is:

1. Create or clone the repository.
2. Build the devcontainer.
3. Run tests and smoke checks from inside the workspace.
4. Start a tmux session in the workspace.
5. Send the model any task prompt without rewriting the prompt into a special house style.
6. Capture pane output and persist it with Talos command telemetry.
7. Require a build/test/smoke report before treating the handoff as done.

The prompt contract should be open-ended. Talos should guard order, readiness, workspace, auth, and capture. It should not bias the model toward a particular implementation unless the user asks for that implementation.

Useful prompts for this repo:

```text
Improve the game feel without changing the public scripts. Keep tests green and summarize what changed.
```

```text
Add one new hazard and one new collectible. Update tests and README if behavior changes.
```

```text
Review this repository as if you were receiving it from another agent. Identify blocking issues first, then fix the highest-confidence issue.
```

The unbiased part is important: Talos supplies the environment and safety rails; the user supplies the task.

