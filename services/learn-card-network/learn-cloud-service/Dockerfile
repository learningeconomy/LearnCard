ARG BASE_IMAGE=learncard-monorepo-local

FROM ${BASE_IMAGE}

ENV SKIP_DIDKIT_NAPI=1

WORKDIR /app

EXPOSE 3000

CMD ["sh", "-c", "cd services/learn-card-network/learn-cloud-service && bun run start:docker"]
