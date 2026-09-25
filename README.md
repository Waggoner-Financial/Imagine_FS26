# Imagine FS26 — Portfolio Dashboard

Build a one-page dashboard for a model portfolio: seven panels covering price
action, valuation, risk, drift, expected return, deployment and sector weights.

Everything the page needs is already here: a mock GraphQL API over synthetic
data, and a starter dashboard app with the header and one finished panel. **What
to build is described in [`docs/spec.md`](docs/spec.md)**, and
[`docs/learning-path.md`](docs/learning-path.md) suggests an order to build it
in while learning CI/CD and agentic workflows along the way.

All figures in this repository are invented. The tickers are real public
companies, but the weights, returns, price targets and account figures describe
no real portfolio or firm.

## What's in the repo

| Path                    | What it is                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `docs/spec.md`          | The spec: panels, behaviour, the API contract and the sample data                             |
| `docs/learning-path.md` | Suggested milestones, from first run to deploying and working with agents                     |
| `apps/dashboard`        | The starter dashboard (Vite + React). Build the remaining panels here                         |
| `apps/mock-api`         | The GraphQL server. `schema.graphql` is the contract                                          |
| `packages/mock-data`    | The five sample portfolios and the pure functions that derive every figure                    |
| `AGENTS.md`             | Instructions for AI coding agents working in this repo; conventions live in `.agents/skills/` |

## Prerequisites

- [Git](https://git-scm.com/downloads)
- [proto](https://moonrepo.dev/docs/proto/install), which installs every other
  tool (Bun, pnpm, Node and moon) at the versions pinned in `.prototools`. After
  installing it, open a new terminal so its shims are on your `PATH`.
- Docker is optional. It is only needed to build the mock API's deployment image
  locally.

## Getting started

```bash
proto use          # installs the pinned bun, pnpm, node and moon
pnpm install
moon run dashboard:dev
```

Open <http://localhost:5173>. The dashboard reads the hosted mock API, so
nothing else needs to run. Switch portfolios with the selector at the top.

The hosted API is at
<https://imaginemock-api-production.up.railway.app/graphql>. Open it in a
browser for GraphiQL, an in-page editor with autocomplete and documentation for
every field. Try:

```graphql
{
  portfolioDashboardSummary(portfolioId: "p-equity") {
    portfolio {
      code
      name
    }
    holdingsCount
    returnSinceTrade {
      returnPct
    }
  }
}
```

To run the API on your own machine instead, start it with
`moon run mock-api:dev` (it listens on <http://localhost:4000/graphql>) and
point the dashboard at it by creating `apps/dashboard/.env.local`:

```bash
VITE_API_URL=http://localhost:4000/graphql
```

## The sample portfolios

Every panel has an empty state, and each one is reachable by picking the right
portfolio — build and check them all without touching the data.

| Portfolio id | Shows                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| `p-equity`   | The full twelve-name book, every panel populated (default)               |
| `p-earnings` | No trade date: header and Drift empty states                             |
| `p-dividend` | Thin coverage: a greyed and a dashed 4P multiple                         |
| `p-fcf`      | A flat portfolio: Drift attribution reads "n/a"                          |
| `p-revenue`  | Missing price targets, GARCH that did not converge, a stock above target |

## Building the dashboard

The starter renders the header (portfolio selector, return since last trade,
global horizon toggle) and one complete panel, **Deployment**. The other six are
placeholders that name the spec section and query they need.

| File                              | What it does                                                      |
| --------------------------------- | ----------------------------------------------------------------- |
| `src/api/queries.ts`              | Every GraphQL query the app sends                                 |
| `src/generated/`                  | Types generated from those queries; never edit by hand            |
| `src/components/card.tsx`         | The chrome every panel shares, including loading and error states |
| `src/panels/deployment-panel.tsx` | The finished panel; copy its shape for the others                 |
| `src/app.tsx`                     | The page layout, where each placeholder gets replaced             |

To build a panel:

1. Write its query in `src/api/queries.ts` with `graphql(...)`.
2. Run `moon run dashboard:codegen` to generate its types.
3. Create `src/panels/<name>-panel.tsx`: `useQuery` with `execute(...)`,
   rendered inside a `Card`, like the Deployment panel.
4. Replace the panel's `PlaceholderPanel` in `src/app.tsx`.
5. Check every state by switching sample portfolios, including the empty one.

**Adding a dependency** (a chart library, say): add its exact version under
`catalog` in `pnpm-workspace.yaml`, reference it as `"catalog:"` in
`apps/dashboard/package.json`, and run `pnpm install`. The repo refuses package
versions published less than 7 days ago, a guard against compromised releases.
If `pnpm install` reports `ERR_PNPM_NO_MATURE_MATCHING_VERSION`, pick an older
version.

## Working in this repo

Tasks run through [moon](https://moonrepo.dev):

```bash
moon run :test :typecheck         # every project's tests and typecheck
moon run root:format root:lint    # format and lint the whole repo
moon run dashboard:codegen        # regenerate query types after editing a query
moon run mock-api:codegen         # regenerate API types after editing the schema
moon tasks dashboard              # list a project's tasks
```

**Pull requests.** `main` is protected: changes land through a pull request once
CI passes, and force-pushes are blocked.

**Changing the API contract.** Edit `apps/mock-api/schema.graphql`, run both
codegen tasks, update the resolvers and the dashboard until the typecheck
passes, and commit the regenerated `src/generated` files with your change. CI
fails if either set of generated types is out of date.

**CI** (`.github/workflows/ci.yml`) runs on every pull request and push to
`main`: format check, then build, test, typecheck and lint for the projects the
change affects, and the codegen checks.

**Deployment.** The mock API deploys to [Railway](https://railway.com) whenever
it or the sample data changes on `main`: `railway.json` points Railway at
`apps/mock-api/Dockerfile`, which bundles the server into a single file, and
Railway waits for `/health` before routing traffic. Deploying the dashboard is
yours to set up; see milestone 6 of the learning path.

## Toolchain

pnpm workspaces with a dependency catalog, moon as the task runner,
[proto](https://moonrepo.dev/docs/proto) for tool version pins, oxlint, oxfmt
and stylelint, and Bun's test runner. Libraries go under `packages/`, apps under
`apps/`. `scripts/README.md` covers the worktree manager and dev-server helpers.
