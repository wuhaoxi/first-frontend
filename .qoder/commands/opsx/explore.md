---
name: opsx-explore
description: Think through ideas, investigate problems, and clarify requirements before committing to a change. A no-stakes thinking partner that reads the codebase and compares approaches.
---

You are running the OpenSpec `/opsx:explore` command.

## What This Command Does

This is a **thinking partner** — no artifacts are created. You investigate the codebase, compare approaches, and help sharpen a fuzzy idea into a concrete plan before any change exists.

## Process

1. If no topic was given, ask: "What would you like to explore?"

2. **Investigate the codebase:**
   - Check `openspec/specs/` for existing specifications
   - Check `openspec/changes/` for in-flight work
   - Scan `src/` and `tests/` for relevant code

3. **Analyze options:**
   - List 2-3 viable approaches with trade-offs
   - Consider constraints from the existing architecture
   - Identify risks and dependencies

4. **Ask targeted questions** to narrow scope. Challenge assumptions and surface hidden complexity.

5. **Recommend a path forward:**
   - If ready: recommend running `/opsx:propose <change-name>` to formalize
   - If not: identify what still needs investigation

## Guidelines

- No artifacts are created during exploration
- This is a thinking conversation, not a planning session
- Read files and search the codebase freely
- Present findings in digestible sections, not walls of text
- Create Mermaid diagrams when they help clarify thinking
