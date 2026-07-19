---
name: subagent-driven-development
description: Dispatches fresh subagents per task with two-stage review (spec compliance then code quality). Use when the user wants fast autonomous implementation, tasks are well-defined, or for parallelizable work.
---

# Subagent-Driven Development

Activates with an approved plan. Dispatches fresh subagents per task with two-stage review (spec compliance, then code quality).

## When to Activate

- When the user wants fast, autonomous implementation
- When tasks are well-defined in a plan
- For parallelizable implementation work

## Process

1. **Load the plan** — Read tasks from `openspec/changes/<name>/tasks.md`
2. **Dispatch** — Launch a fresh subagent for each task with:
   - The specific task description
   - Relevant context (design doc, specs)
   - Clear acceptance criteria
3. **Two-Stage Review** — For each completed task:
   - **Stage 1: Spec Compliance** — Does the implementation match the spec?
   - **Stage 2: Code Quality** — Is the code clean, tested, and maintainable?
4. **Iterate** — If review fails, provide feedback and re-dispatch
5. **Integrate** — Once all tasks pass, verify the full test suite

## Subagent Prompt Template

```
You are implementing task {task_number} from the plan.

Task: {task_description}
File: {file_path}
Verification: {verification_step}

Context:
- Design: {design_summary}
- Relevant specs: {spec_references}

Implement this task following TDD. Write tests first, then implementation.
```

## Guidelines

- Each subagent gets a clean context — don't leak state between tasks
- Review is mandatory, not optional
- Critical issues block progress until resolved
- Prefer many small subagents over few large ones
