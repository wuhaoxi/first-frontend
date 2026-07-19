---
name: systematic-debugging
description: 4-phase root cause debugging process (Observe, Hypothesize, Test, Fix). Use when tests fail unexpectedly, the app behaves incorrectly, error messages are unclear, or before making any fix.
---

# Systematic Debugging

Activates when bugs appear. Uses a 4-phase root cause process instead of guessing.

## When to Activate

- When a test fails unexpectedly
- When the application behaves incorrectly
- When an error message is unclear
- Before making any "fix" — understand the root cause first

## 4-Phase Process

### Phase 1: Observe
- Reproduce the bug reliably
- Collect exact error messages, stack traces, and logs
- Note what was expected vs. what actually happened
- Document the minimal reproduction steps

### Phase 2: Hypothesize
- List possible causes (at least 3)
- Rank by likelihood
- For each hypothesis, predict what evidence you'd see if it were true

### Phase 3: Test
- Test ONE hypothesis at a time
- Change ONE variable at a time
- Document results for each test
- Eliminate hypotheses that don't match evidence

### Phase 4: Fix & Verify
- Apply the fix for the confirmed root cause
- Write a regression test that catches this bug
- Run the full test suite
- Verify the original bug is gone AND no new bugs were introduced

## Techniques

### Root-Cause Tracing
Ask "why?" five times to get past symptoms to the actual cause.

### Defense in Depth
Don't just fix the bug — add guardrails to prevent similar bugs.

### Condition-Based Waiting
Instead of `sleep()`, wait for specific conditions. Flaky tests are bugs too.

## Anti-Patterns

- Guessing and checking randomly
- Changing multiple things at once
- Declaring "fixed" without a regression test
- Ignoring "impossible" bugs
