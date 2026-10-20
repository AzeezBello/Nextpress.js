# Repository Audit Checklist

Completed for `NextPress.js` during Milestone 0 (see [`docs/AUDIT-REPORT.md`](AUDIT-REPORT.md) and [`docs/BRANCH-PROTECTION.md`](BRANCH-PROTECTION.md) for full details).

## Baseline
- [x] Record repository URL, default branch, current commit, and working tree state.
- [x] Identify package manager and lockfile (`npm` + `package-lock.json`).
- [x] Record Node.js (`v24.15.0`) and framework versions (`next@16.4.2`, `eslint-config-next@16.4.2`, `eslint@9.39.5`, `tailwindcss@4.3.3`).
- [x] Run the current test, typecheck, lint, and build commands; record actual output and resolve version mismatches.
- [x] Identify deployment target and environment variables without copying secret values into documentation.

## Code and functionality
- [x] Map app routes, components, server actions, API routes, and shared modules.
- [x] Classify each feature as working, partial, broken, missing, or unverified.
- [x] Identify existing authentication and authorization behavior (implemented HTTP-only session auth + 4-tier RBAC).
- [x] Identify database, migrations, data ownership, and backup/restore arrangements (`node:sqlite` with `schema_migrations`).
- [x] Identify editor or renderer code and current saved content formats (`ContentDocument` `schemaVersion: 1`).
- [x] Identify existing design tokens and reusable UI components.

## Safety & CI
- [x] Confirm no production data will be reset.
- [x] Confirm environment files and secrets (`.env.local`, `/data/*.sqlite*`) are excluded from Git.
- [x] Record known starter issues separately from newly introduced features.
- [x] Add automated CI checks (`.github/workflows/ci.yml`) and branch protection rules (`docs/BRANCH-PROTECTION.md`).

## Decision record
For each major subsystem, record one decision:
- **Retain:** already suitable and working.
- **Refactor:** useful but needs bounded improvements.
- **Replace:** demonstrably unsuitable, with migration plan.
- **Add:** missing capability.
- **Defer:** not needed for the current milestone.

Do not choose “replace” merely to make the repository match the proposed folder tree.
