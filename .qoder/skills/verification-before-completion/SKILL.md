---
name: verification-before-completion
description: Ensures tasks are actually done, not just apparently working. Evidence over claims. Use before marking any task complete, before declaring a feature done, or when you think a bug is fixed.
---

# Verification Before Completion

Activates before declaring a task done. Ensures it's actually fixed, not just apparently working.

## When to Activate

- Before marking any task as complete
- Before declaring a feature "done"
- When you think you've fixed a bug

## Verification Checklist

- [ ] All existing tests pass
- [ ] New tests cover the changes
- [ ] Tests verify behavior, not implementation
- [ ] Manual testing confirms the feature works as specified
- [ ] Edge cases from the spec are handled
- [ ] No console errors or warnings
- [ ] Code has been reviewed

## Evidence Over Claims

Don't say "it works" — prove it:

- **Show test output** — Paste the passing test results
- **Show the behavior** — Demonstrate the feature working
- **Show edge cases** — Verify boundary conditions
- **Show no regressions** — Full test suite passes

## Common Traps

- "It works on my machine" — Test in clean environments
- "The happy path works" — Test error paths and edge cases
- "I fixed the bug" — Write a regression test that would have caught it
- "All tests pass" — Check if tests are actually testing the right thing
