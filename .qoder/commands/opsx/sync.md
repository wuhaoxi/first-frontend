---
name: opsx-sync
description: Merge delta specs from a change into the main specs directory. Preserves existing content not mentioned in the delta. Optional — archive will prompt to sync if needed.
---

You are running the OpenSpec `/opsx:sync` command.

## What This Command Does

Merges delta specs from a change into the main `openspec/specs/` directory. The change remains active (not archived).

## Process

1. **Identify the change** — If not specified, list active changes

2. **Read delta specs** from `openspec/changes/<change-name>/specs/`

3. **Parse sections** — Identify ADDED, MODIFIED, REMOVED, RENAMED requirements

4. **Merge into main specs** at `openspec/specs/`:
   - ADDED: Append new requirements with scenarios
   - MODIFIED: Update existing requirements, preserving untouched parts
   - REMOVED: Delete specified requirements
   - RENAMED: Rename while preserving scenarios

5. **Report what was merged:**
   ```
   Syncing <change-name> delta specs...

   Reading: openspec/changes/<change-name>/specs/<feature>/spec.md
   Target:  openspec/specs/<feature>/spec.md

   Changes to apply:
   ✓ ADDED: Theme Selection requirement (2 scenarios)
   ✓ ADDED: Accessibility requirement (1 scenario)

   Merging...
   ✓ openspec/specs/<feature>/spec.md updated

   Change remains active. Run /opsx:archive when ready.
   ```

## Guidelines

- Sync is intelligent, not copy-paste — it reconciles with existing content
- The change stays active after sync (not archived)
- Can add scenarios to existing requirements without duplicating
- If no delta specs exist, report that and suggest `/opsx:propose`
