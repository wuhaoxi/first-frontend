# OpenSpec

This directory contains the specification-driven development artifacts for this project, following the [OpenSpec](https://github.com/Fission-AI/OpenSpec) methodology.

## Philosophy

```
→ fluid not rigid
→ iterative not waterfall
→ easy not complex
→ built for brownfield not just greenfield
→ scalable from personal projects to enterprises
```

## Directory Structure

```
openspec/
├── specs/          # Living specifications — the source of truth for what the project does
├── changes/        # In-flight changes — each change gets its own folder
│   └── archive/    # Completed changes, archived with date prefix
└── templates/      # Reusable templates for proposals, specs, designs, and tasks
```

## Workflow

1. **Explore** — Think through an idea with `/opsx:explore`
2. **Propose** — Create a change with `/opsx:propose <name>`
   - Generates: proposal.md, specs/, design.md, tasks.md
3. **Apply** — Implement tasks with `/opsx:apply`
4. **Archive** — Close out with `/opsx:archive`

## Key Principles

- **Agree before you build** — Human and AI align on specs before code is written
- **Stay organized** — Each change gets its own folder with proposal, specs, design, and tasks
- **Work fluidly** — Update any artifact anytime, no rigid phase gates
- **Plain Markdown** — No special syntax to learn, just requirements with concrete scenarios
