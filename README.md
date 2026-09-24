# Imagine FS26 — Portfolio Dashboard

Build a one-page dashboard for a model portfolio: seven panels covering price
action, valuation, risk, drift, expected return, deployment and sector weights.

Everything the page needs to read is already here, served by a mock GraphQL API
over synthetic data. **What to build is described in
[`docs/spec.md`](docs/spec.md)** — start there.

All figures in this repository are invented. The tickers are real public
companies, but the weights, returns, price targets and account figures describe
no real portfolio or firm.

## What's in the repo

| Path                 | What it is                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------- |
| `docs/spec.md`       | The spec: panels, behaviour, the API contract and the sample data                             |
| `apps/mock-api`      | The GraphQL server. `schema.graphql` is the contract                                          |
| `packages/mock-data` | The five sample portfolios and the pure functions that derive every figure                    |
| `apps/`              | Where your dashboard app goes                                                                 |
| `AGENTS.md`          | Instructions for AI coding agents working in this repo; conventions live in `.agents/skills/` |

## Prerequisites

- [Git](https://git-scm.com/downloads)
- [proto](https://moonrepo.dev/docs/proto/install), which installs every other
  tool (Bun, pnpm, Node and moon) at the versions pinned in `.prototools`. After
  installing it, open a new terminal so its shims are on your `PATH`.
- Docker is optional. It is only needed to build the mock API's deployment image
  locally.

## Getting started

A deployed copy of the mock API runs at
<https://imaginemock-api-production.up.railway.app/graphql>. Point your frontend
there, or open it in a browser to explore the schema in GraphiQL. It redeploys
automatically when the API or the sample data changes on `main`.

To run it locally instead:

```bash
proto use          # installs the pinned bun, pnpm, node and moon
pnpm install
moon run mock-api:dev
```

Open <http://localhost:4000/graphql>. In a browser that's GraphiQL, an in-page
editor with autocomplete and documentation for every field. Try:

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

## Working in this repo

Tasks run through [moon](https://moonrepo.dev):

```bash
moon run :test :typecheck         # every project's tests and typecheck
moon run root:format root:lint    # format and lint the whole repo
moon run mock-api:codegen         # regenerate API types after editing the schema
moon tasks mock-api               # list a project's tasks
```

**Changing the API contract.** Edit `apps/mock-api/schema.graphql`, run
`moon run mock-api:codegen`, update the resolvers until the typecheck passes,
and commit the regenerated `src/generated` file with your change. CI fails if
the generated types are out of date.

**CI** (`.github/workflows/ci.yml`) runs on every pull request and push to
`main`: format check, then build, test, typecheck and lint for the projects the
change affects.

**Deployment.** The mock API deploys to [Railway](https://railway.com):
`railway.json` points Railway at `apps/mock-api/Dockerfile`, which bundles the
server into a single file. Railway waits for `/health` before routing traffic.

## Toolchain

pnpm workspaces with a dependency catalog, moon as the task runner,
[proto](https://moonrepo.dev/docs/proto) for tool version pins, oxlint, oxfmt
and stylelint, and Bun's test runner. Libraries go under `packages/`, apps under
`apps/`. `scripts/README.md` covers the worktree manager and dev-server helpers.
