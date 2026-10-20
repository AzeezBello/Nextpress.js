# Repository Audit Checklist

Use this checklist before adopting this starter into an existing NextPress.js repository.

## Baseline
- [ ] Record repository URL, default branch, current commit, and working tree state.
- [ ] Identify package manager and lockfile.
- [ ] Record Node.js and framework versions.
- [ ] Run the current test, typecheck, lint, and build commands; record actual output.
- [ ] Identify deployment target and environment variables without copying secret values into documentation.

## Code and functionality
- [ ] Map app routes, components, server actions, API routes, and shared modules.
- [ ] Classify each feature as working, partial, broken, missing, or unverified.
- [ ] Identify existing authentication and authorization behavior.
- [ ] Identify database, migrations, data ownership, and backup/restore arrangements.
- [ ] Identify editor or renderer code and current saved content formats.
- [ ] Identify existing design tokens and reusable UI components.

## Safety
- [ ] Confirm no production data will be reset.
- [ ] Confirm environment files and secrets are excluded from Git.
- [ ] Record known bugs separately from newly introduced regressions.
- [ ] Create a branch and rollback strategy before refactoring.

## Decision record
For each major subsystem, record one decision:
- **Retain:** already suitable and working.
- **Refactor:** useful but needs bounded improvements.
- **Replace:** demonstrably unsuitable, with migration plan.
- **Add:** missing capability.
- **Defer:** not needed for the current milestone.

Do not choose “replace” merely to make the repository match the proposed folder tree.
