ARG BASE_IMAGE=learncard-monorepo-local

FROM ${BASE_IMAGE} AS build

# Skip native DIDKit build (not needed for browser apps, uses WASM fallback)
ENV SKIP_DIDKIT_NAPI=1

# Set the working directory in the container
WORKDIR /app

RUN NX_DAEMON=false bunx nx run learn-card-app:docker-build

# The browser stack needs only the compiled SPA, not the monorepo or build tools.
FROM nginx:1.28-alpine AS runtime
COPY apps/learn-card-app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/learn-card-app/build /usr/share/nginx/html
EXPOSE 3000
