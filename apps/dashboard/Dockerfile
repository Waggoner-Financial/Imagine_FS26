# Builds the dashboard into static files and serves them with Caddy.
# Build from the repository root:
#   docker build -f apps/dashboard/Dockerfile -t dashboard .
# Tool versions mirror .prototools; update the two together.

# --- Build: install the dashboard's dependencies and run the Vite build
FROM node:24.11.0-slim AS build
RUN npm install --global pnpm@11.9.0
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile --filter @imagine/dashboard...
RUN pnpm --filter @imagine/dashboard exec vite build

# --- Runtime: a static file server and the built files, nothing else
FROM caddy:2.11.4-alpine
COPY apps/dashboard/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/dashboard/dist /srv
