/** The shared Brain endpoint may name tRPC; OpenAPI is served alongside it. */
export const getBrainOpenApiBase = (serviceUrl: string): string =>
    `${serviceUrl.replace(/\/(?:trpc|api)\/?$/, '').replace(/\/$/, '')}/api`;
