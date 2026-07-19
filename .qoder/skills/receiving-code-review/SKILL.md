---
name: receiving-code-review
description: Structured process for responding to code review feedback. Use after a review is completed, when receiving feedback from reviewers or automated checks, or when review comments need addressing.
---

# Receiving Code Review

Activates when receiving feedback on implementation. Provides a structured process for responding to review comments.

## When to Activate

- After a code review has been completed
- When receiving feedback from a reviewer or automated checks
- When review comments need to be addressed

## Process

1. **Read all feedback** — Don't respond to individual comments yet
2. **Categorize** — Sort feedback by severity (Critical, Warning, Info)
3. **Address critical first** — Fix bugs and spec violations immediately
4. **Discuss warnings** — If you disagree, explain your reasoning
5. **Consider info** — Apply style suggestions that improve clarity
6. **Verify** — Re-run tests after making changes
7. **Re-request review** — Once all critical/warning items are addressed

## Guidelines

- Don't take feedback personally — it's about the code
- Ask for clarification if a comment is unclear
- Push back respectfully with evidence when you disagree
- Fix the underlying issue, not just the symptom pointed out
- Update tests when implementation changes
