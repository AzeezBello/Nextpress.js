# Branch Protection & Continuous Integration Guide

This document defines the Continuous Integration (CI) quality gates and GitHub branch protection rules for `Nextpress.js`.

## 1. Automated CI Pipeline (`.github/workflows/ci.yml`)

Every `push` and `pull_request` targeting `main` runs the **Verify (typecheck, lint, test, build)** job on Node.js 24:

1. `npm ci` — clean, reproducible dependency installation from `package-lock.json`.
2. `npm run typecheck` — strict TypeScript verification (`tsc --noEmit`).
3. `npm run lint` — ESLint 9 flat-config checks with `eslint-config-next@16.4.2` (`core-web-vitals` + `typescript`).
4. `npm test` — automated unit & integration tests (`tests/cms.test.mts`) using an isolated in-memory SQLite database (`NEXTPRESS_DB_PATH=":memory:"`).
5. `npm run build` — full Next.js 16 production build verification.

## 2. Recommended GitHub Branch Protection Rules for `main`

Configure the following rules in **GitHub → Settings → Branches → Add branch ruleset / branch protection rule** for `main`:

- **Require a pull request before merging:** Enabled
  - **Required approvals:** `1` (for team workflows)
  - **Dismiss stale pull request approvals when new commits are pushed:** Enabled
- **Require status checks to pass before merging:** Enabled
  - **Require branches to be up to date before merging:** Enabled
  - **Required status check:** `Verify (typecheck, lint, test, build)`
- **Block force pushes:** Enabled
- **Do not allow deletions:** Enabled

### Applying Branch Protection via GitHub CLI (`gh`)

Once `.github/workflows/ci.yml` is pushed to `origin/main` and authenticated with `gh auth login`, you can apply branch protection directly from the terminal:

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/AzeezBello/Nextpress.js/branches/main/protection \
  -f "required_status_checks[strict]=true" \
  -f "required_status_checks[contexts][]=Verify (typecheck, lint, test, build)" \
  -f "enforce_admins=true" \
  -f "required_pull_request_reviews[dismiss_stale_reviews]=true" \
  -f "required_pull_request_reviews[required_approving_review_count]=1" \
  -F "restrictions=null"
```
