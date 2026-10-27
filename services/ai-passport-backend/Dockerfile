# syntax = docker/dockerfile:1

# Use the official Bun image as a base
# Bun pin matches the LearnCard monorepo (root package.json packageManager).
FROM oven/bun:1.4.2 AS base
WORKDIR /app

# Local-only document extraction and OCR, provisioned before application source.
# Kept outside /app so development bind mounts cannot hide the processor.
COPY services/ai-passport-backend/privacy/requirements.txt services/ai-passport-backend/privacy/install.sh /tmp/ai-privacy-assets/
RUN sh /tmp/ai-privacy-assets/install.sh /tmp/ai-privacy-assets && rm -rf /tmp/ai-privacy-assets
COPY services/ai-passport-backend/privacy/processor.py /opt/ai-privacy/assets/processor.py
ENV AI_PRIVACY_PYTHON=/opt/ai-privacy/bin/python \
    AI_PRIVACY_ASSET_DIR=/opt/ai-privacy/assets

# The bun.lock is shared by every LearnCard workspace, so a frozen install needs the full
# workspace closure (same pattern as services/learn-card-network/*/Dockerfile).
# .dockerignore at the repo root keeps node_modules and Rust targets out of the context.
COPY . .

ENV SKIP_DIDKIT_NAPI=1 \
    MONGOMS_DISABLE_POSTINSTALL=1

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# --- Development Stage ---
# This stage is optimized for development with hot-reloading
FROM base AS development
WORKDIR /app/services/ai-passport-backend

# Expose the port the backend service runs on
# Ensure this matches the PORT env var used in your app and docker-compose
EXPOSE ${PORT:-3000}

# The command to start the backend service in development mode
# This assumes your package.json has a "dev" script like "bun --watch src/index.ts"
# The volume mount in docker-compose.yml ensures source changes are reflected.
CMD ["bun", "run", "dev"]

# --- Production Stage (Optional but Recommended) ---
# You can add a production stage later for optimized builds
# FROM base as production
# WORKDIR /app
# Copy only necessary files from the base stage
# COPY --from=base /app /app
# Set production environment
# ENV NODE_ENV=production
# Install only production dependencies for the specific workspace
# RUN cd services/ai-passport-backend && bun install --production --frozen-lockfile
# WORKDIR /app/services/ai-passport-backend
# Expose port
# EXPOSE ${PORT:-3000}
# Command to run the production build
# CMD ["bun", "run", "start"] # Assuming a "start" script for production
