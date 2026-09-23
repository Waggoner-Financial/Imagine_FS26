# Builds the mock API into one bundled file and runs it with Bun.
# Build from the repository root:
#   docker build -f apps/mock-api/Dockerfile -t mock-api .
# Tool versions mirror .prototools; update the two together.

FROM oven/bun:1.3.14 AS bun

# --- Build: install the workspace, build the data package, bundle the server
FROM node:24.11.0-slim AS build
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
RUN npm install --global pnpm@11.9.0
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @imagine/mock-data exec tsdown --clean
RUN bun build apps/mock-api/src/main.ts --target=bun --outfile=dist/server.js

# --- Runtime: just Bun and the single bundled file (the schema is inside it)
FROM oven/bun:1.3.14-slim
WORKDIR /app
COPY --from=build /app/dist/server.js ./server.js
USER bun
EXPOSE 4000
CMD ["bun", "server.js"]
