ARG BASE_IMAGE=learncard-monorepo-local

FROM ${BASE_IMAGE}

# Skip native DIDKit build (not needed for browser apps, uses WASM fallback)
ENV SKIP_DIDKIT_NAPI=1

# Set the working directory in the container
WORKDIR /app

# Bun can create package-local node_modules symlink forests for workspaces.
# Clear them before build-time module resolution, then again before snapshotting
# the final image layer.
RUN find apps packages services tests -type d -name node_modules -prune -exec rm -rf {} + && \
    NX_DAEMON=false bunx nx run learn-card-app:docker-build && \
    find apps packages services tests -type d -name node_modules -prune -exec rm -rf {} +

# Expose the port the app runs on
EXPOSE 3000

# Serve the app
CMD ["sh", "-c", "cd apps/learn-card-app && bun run preview"]
