# Changes

In-flight changes to the project. Each change gets its own subdirectory.

## Structure

```
changes/
├── <change-name>/
│   ├── proposal.md    # Why we're doing this, what's changing
│   ├── specs/         # Requirements and scenarios for this change
│   ├── design.md      # Technical approach
│   └── tasks.md       # Implementation checklist
└── archive/           # Completed changes (date-prefixed)
```

## Lifecycle

1. Created via `/opsx:propose <change-name>`
2. Reviewed and refined by human + AI
3. Implemented via `/opsx:apply`
4. Archived via `/opsx:archive` → moves to `archive/YYYY-MM-DD-<change-name>/`
