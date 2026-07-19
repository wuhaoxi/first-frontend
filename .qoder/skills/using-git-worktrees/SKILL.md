---
name: using-git-worktrees
description: Creates isolated git worktree workspaces on new branches for parallel development. Use after design approval, before starting new feature implementation, or when working on multiple changes simultaneously.
---

# Using Git Worktrees

Activates after design approval. Creates isolated workspace on a new branch, runs project setup, verifies clean test baseline.

## When to Activate

- Before starting implementation of a new feature
- When working on multiple changes simultaneously
- When you need a clean, isolated workspace

## Process

1. **Create worktree**
   ```bash
   git worktree add ../project-feature-name -b feature/feature-name
   ```

2. **Setup**
   ```bash
   cd ../project-feature-name
   npm install
   npm test  # Verify clean baseline
   ```

3. **Work** — Implement changes in the isolated worktree

4. **Cleanup** — After merging, remove the worktree
   ```bash
   git worktree remove ../project-feature-name
   ```

## Guidelines

- One worktree per feature/change
- Always verify tests pass before starting work (clean baseline)
- Name branches descriptively: `feature/<change-name>`
- Don't share worktrees between changes
