# Learning path

This repository has two goals: build the dashboard described in
[`spec.md`](spec.md), and get comfortable with CI/CD and agentic workflows while
you do it. The milestones below build on each other. Each ends with a concrete
**Done when** so you can tell you are finished.

Along the way you build both halves of CI/CD yourselves: a CI job in milestone
5, and the dashboard's deployment in milestone 6.

From milestone 2 on, every change goes through a pull request: `main` is
protected, so nothing merges until CI passes.

## 1. Get it running

- Install the [prerequisites](../README.md#prerequisites), then run the
  dashboard with `moon run dashboard:dev`.
- Open the hosted API in a browser to get GraphiQL, and run a few queries by
  hand. The schema's descriptions explain the units and when a figure can be
  null.
- Run the mock API locally with `moon run mock-api:dev` and point the dashboard
  at it through `apps/dashboard/.env.local`, as the README describes.
- Read spec §1–§4: the panels, how each behaves and fails, and the API
  conventions.

**Done when** you have found Deployment's 1D empty state in the dashboard, and
queried `portfolioRisk` for `p-revenue` in GraphiQL to see the GARCH failure.

## 2. Your first pull request

- Make a small change on a branch, open a pull request, and watch CI run. Open
  the run's log and find each step: format check, build, tests, typecheck, lint
  and the codegen checks.
- Find where each step is defined: `.github/workflows/ci.yml` for the workflow,
  each project's `moon.yml` for its tasks.
- Break something on purpose, such as a failing assertion, push it, and watch CI
  stop the merge. Then fix it.
- Once more than one person is contributing, ask a repository admin to require
  one approving review in the ruleset (Settings → Rules) so every change gets a
  second pair of eyes.

**Done when** a pull request has merged through the protection rules, and you
can explain what each CI step checks.

## 3. Build panels

- Build one panel end to end by following the Deployment panel's pattern. The
  Rebalancer (§3.6) and Drift (§3.5) need no charts, so they make good first
  panels.
- Handle every state: loading, error, and the panel's empty state. The README's
  sample-portfolio table shows which portfolio triggers which empty state.
- Write unit tests for any logic you add, such as sorting or formatting, in
  `apps/dashboard/test/`.

**Done when** the panel renders correctly for all five sample portfolios,
including its empty state, and its tests run in CI.

## 4. Charts, and adding a dependency

- Price Action (§3.2) needs a line chart and Sector / Holdings (§3.8) a treemap.
  Choose a chart library and add it the repository's way: an exact version in
  the catalog, at least a week old.
- Keep the spec's rules: the server already downsamples long series, the index
  line can come back empty with a reason, and colour is never the only thing
  showing a sign.

**Done when** Price Action draws its lines for every horizon, and shows the
index series' empty state with its reason.

## 5. Write your own CI job

So far CI runs checks someone else wrote. Now write one: a few end-to-end tests
that open the dashboard in a real browser, run on every pull request.

- Add [Playwright](https://playwright.dev) the repository's way (an exact
  version in the catalog, at least a week old) and give `apps/dashboard` a
  `test-e2e` moon task, the name the testing skill expects.
- Keep it small, as the testing skill advises: two or three tests of what only a
  real browser shows, such as the page loading data and an empty state
  rendering. Switching to `p-earnings` should show "Trade date not set".
- The tests need the dashboard running. It is a port-bound server, so follow
  "Adding a new port-bound service" in `scripts/README.md`.
- Decide what the tests talk to: the hosted mock API, or one started inside the
  CI job. A local one means CI never fails because of a deployment you do not
  control.
- Add a job to `.github/workflows/ci.yml`, or a new workflow, that installs the
  browsers and runs the tests. Then ask a repository admin to add it to the
  ruleset's required checks, so a pull request cannot merge while it fails.

**Done when** a pull request that breaks what a user sees fails your job, and
the job is a required check.

## 6. Deploy the dashboard

- The mock API already deploys continuously: Railway watches `main` and
  redeploys when the API changes (see `railway.json`). Now do the same for the
  dashboard.
- `moon run dashboard:build` writes static files to `apps/dashboard/dist`. Write
  a GitHub Actions workflow that builds and deploys them on every push to
  `main`. GitHub Pages is free for public repositories; it serves the site under
  the repository's path, so set Vite's `base` option to match.
- Stretch: build a preview deployment for every pull request.

**Done when** merging to `main` updates a public URL with no manual steps.

## 7. Work with AI agents

- Coding agents read `AGENTS.md` and the skills in `.agents/skills/`. Ask one to
  build a panel from its spec section, then review its pull request as you would
  a teammate's.
- When an agent gets something wrong because the instructions were missing or
  unclear, fix the instructions in `AGENTS.md` or a skill, not just the code.
  That is what makes the next run better.
- Run agents in parallel: `moonx root:wt -- new <slug>` creates a separate
  worktree with its own dev-server ports (see `scripts/README.md`), so two
  agents can each run the dashboard at the same time.
- Write a skill for a task you repeat, for example adding a dashboard panel.

**Done when** a panel an agent built from the spec has merged, along with one
improvement to `AGENTS.md` or a skill based on what the agent got wrong.

## 8. Stretch: change the contract end to end

- Add a field the spec does not have, for example the portfolio's inception date
  on `DashboardSummary` (the sample data already has it). Edit
  `apps/mock-api/schema.graphql`, run both codegen tasks, implement it in the
  resolver, and use it in the dashboard, all in one pull request.
- Watch what the pipeline does: the codegen checks fail until the generated
  types are regenerated, and after the merge Railway redeploys the API.

**Done when** the new field is live on the hosted API and shown in the
dashboard.
