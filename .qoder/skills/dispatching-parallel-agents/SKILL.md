---
name: dispatching-parallel-agents
description: Manages concurrent subagent workflows for independent tasks. Use when tasks have no dependencies, multiple features can be developed simultaneously, or when speed matters with well-isolated tasks.
---

# Dispatching Parallel Agents

Activates when multiple independent tasks can run concurrently. Manages parallel subagent workflows.

## When to Activate

- When tasks in a plan have no dependencies between them
- When multiple features can be developed simultaneously
- When speed matters and tasks are well-isolated

## Process

1. **Identify parallelizable tasks** — Find tasks with no shared state or file conflicts
2. **Dispatch concurrently** — Launch subagents for independent tasks simultaneously
3. **Collect results** — Wait for all agents to complete
4. **Review each** — Apply two-stage review to each result
5. **Integrate** — Merge all completed work and verify no conflicts

## Guidelines

- Only parallelize tasks that touch different files
- Never have two agents modify the same file simultaneously
- Use clear naming: `agent-task-1.1`, `agent-task-1.2`
- Monitor for conflicts during integration
- If tasks have dependencies, use sequential execution instead

## Conflict Prevention

- Map file ownership before dispatching
- If two tasks might touch the same file, serialize them
- Always run full test suite after merging parallel work
