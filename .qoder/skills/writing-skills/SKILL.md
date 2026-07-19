---
name: writing-skills
description: Guides creation of new composable skills following best practices. Use when creating a new skill, modifying an existing skill, or extending the Superpowers methodology.
---

# Writing Skills

Guides the creation of new skills following best practices.

## When to Activate

- When creating a new skill for the skill library
- When modifying an existing skill
- When extending the Superpowers methodology

## Skill Structure

Every skill follows this format:

```markdown
# Skill Name

One-line description of when it activates and what it does.

## When to Activate
- Trigger conditions

## Process
1. Step-by-step workflow

## Guidelines
- Do's and don'ts
- Common pitfalls
```

## Best Practices

- **Specific triggers** — Clearly define when the skill activates
- **Actionable steps** — Each step should be concrete and followable
- **Examples** — Include real examples where possible
- **Anti-patterns** — Call out what NOT to do
- **Composable** — Skills should work independently and together
- **Tested** — Verify the skill works across different scenarios

## Testing Skills

- Test with at least 3 different scenarios
- Verify the skill activates at the right time
- Check that it doesn't activate when it shouldn't
- Ensure the output is useful and actionable
