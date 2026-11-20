/**
 * Client-side stand-in for `trpc-to-openapi`'s route metadata type.
 *
 * The services attach OpenAPI metadata to every procedure. It is server-side routing
 * information: tRPC clients never read it, and the real type would make every consumer install
 * the server's OpenAPI toolchain just to type-check.
 */
export type OpenApiMeta<TMeta = Record<string, unknown>> = TMeta & {
    openapi?: Record<string, unknown>;
};
