---
name: brainstorming
description: Refines rough ideas through Socratic questioning before writing code. Explores alternatives and presents design in sections for validation. Use when the user describes something to build, has ambiguous requirements, or before any significant feature implementation.
---

# Brainstorming

Activates before writing code. Refines rough ideas through questions, explores alternatives, presents design in sections for validation.

## When to Activate

- When the user describes something they want to build but hasn't specified details
- When there are multiple valid approaches to a problem
- Before any significant feature implementation begins

## Process

1. **Listen** — Understand what the user is really trying to accomplish
2. **Ask** — Pose clarifying questions about constraints, edge cases, and priorities
3. **Explore** — Present 2-3 alternative approaches with trade-offs
4. **Refine** — Narrow down to a chosen approach through iterative discussion
5. **Document** — Save the validated design as a spec document

## Guidelines

- Don't jump to code — tease out the spec first
- Present design in digestible sections, not walls of text
- Ask "what problem are you really trying to solve?"
- Challenge assumptions respectfully
- Consider edge cases the user hasn't thought of
- Save the final design to `openspec/changes/<name>/` for tracking

## Output

A validated design document saved to the appropriate openspec change directory, ready for plan writing.
