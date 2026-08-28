import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { AppStoreListing, PaginatedAppStoreListings } from '@learncard/types';

import { DidAuthBearerFactory } from '../brain/did-auth';
import { authorizedCall, type BrainServiceTransport } from '../brain';
import type { KeyManagementService, ManagedKeyRef } from '@kms';
import { router, protectedProcedure } from './trpc';

export type CatalogListingVersion = {
    version_id: string;
    version: string;
    status: string;
    created_at: string;
};

export type CatalogListingDetail = {
    listing: AppStoreListing;
    versions: CatalogListingVersion[];
};

/**
 * One entry of a BUNDLE listing's signed `lc.bundle` manifest (ADR-008). `targetType` is
 * the install target the member materializes as, which is what the console maps to its
 * catalog sections.
 */
export type CatalogBundleMember = {
    declarationId: string;
    targetType: string;
    listingId: string;
    versionId: string;
    optional: boolean;
    display_name?: string;
};

/**
 * The declarative surface of an INTEGRATION listing's signed `lc.integration` manifest.
 * `supportedRecordClasses` is what makes a listing a Data Source (ADR-013 §3.1): an
 * integration that provisions subject-data records must declare its record classes.
 */
export type CatalogIntegrationManifestSummary = {
    apiVersion: string;
    category: string;
    supportedRecordClasses: string[];
    capabilities: { provided: string[]; consumed: string[] };
};

/**
 * ADR-010 §3.1/§3.2 catalog policy state for one ecosystem. `allowedListings` is null
 * while the ecosystem is still implicitly permissive (`unrestricted`).
 */
export type CatalogEnablementState = {
    ecosystemId: string;
    allowedListings: string[] | null;
    requireEndorsement: boolean;
    unrestricted: boolean;
};

const emptyEnablementState = (ecosystemId: string): CatalogEnablementState => ({
    ecosystemId,
    allowedListings: null,
    requireEndorsement: false,
    unrestricted: true,
});

const normalizeEnablementState = (
    ecosystemId: string,
    result: CatalogEnablementState | undefined
): CatalogEnablementState => {
    // Stubbed transports return {} for every call — normalize to a safe shape.
    if (!result || typeof result.unrestricted !== 'boolean') {
        return emptyEnablementState(ecosystemId);
    }

    return {
        ecosystemId: result.ecosystemId ?? ecosystemId,
        allowedListings: Array.isArray(result.allowedListings) ? result.allowedListings : null,
        requireEndorsement: Boolean(result.requireEndorsement),
        unrestricted: result.unrestricted,
    };
};

const makeBrainCaller = (
    kms: KeyManagementService,
    transport: BrainServiceTransport,
    did: string,
    keyRef: ManagedKeyRef
) => {
    const bearerFactory = new DidAuthBearerFactory(kms);

    return <T>(path: string, input: unknown) =>
        authorizedCall(bearerFactory, transport, did, keyRef, bearer =>
            transport.trpcQuery<T>(bearer, path, input)
        );
};

const makeBrainMutator = (
    kms: KeyManagementService,
    transport: BrainServiceTransport,
    did: string,
    keyRef: ManagedKeyRef
) => {
    const bearerFactory = new DidAuthBearerFactory(kms);

    return <T>(path: string, input: unknown) =>
        authorizedCall(bearerFactory, transport, did, keyRef, bearer =>
            transport.trpcMutation<T>(bearer, path, input)
        );
};

export const catalogRouter = router({
    listings: protectedProcedure
        .input(
            z
                .object({
                    limit: z.number().min(1).max(100).optional(),
                    cursor: z.string().optional(),
                    category: z.string().optional(),
                })
                .optional()
        )
        .query(async ({ ctx, input }): Promise<PaginatedAppStoreListings> => {
            const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
            if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

            const bearerFactory = new DidAuthBearerFactory(ctx.kms);

            const result = await authorizedCall(
                bearerFactory,
                ctx.transport,
                ctx.session.managedDid,
                keyRef,
                bearer =>
                    ctx.transport.trpcQuery<PaginatedAppStoreListings>(
                        bearer,
                        'appStore.browseListedApps',
                        input ?? {}
                    )
            );

            // Stubbed transports return {} for every query — normalize to a safe shape.
            if (!result || !Array.isArray(result.records)) {
                return { hasMore: false, cursor: undefined, records: [] };
            }

            return result;
        }),

    listingsForEcosystem: protectedProcedure
        .input(
            z.object({
                ecosystemId: z.string().min(1),
                limit: z.number().min(1).max(100).optional(),
                cursor: z.string().optional(),
                category: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }): Promise<PaginatedAppStoreListings> => {
            const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
            if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

            const query = makeBrainCaller(ctx.kms, ctx.transport, ctx.session.managedDid, keyRef);

            const result = await query<PaginatedAppStoreListings>(
                'appStore.browseListedAppsForEcosystem',
                input
            );

            // Stubbed transports return {} for every query — normalize to a safe shape.
            if (!result || !Array.isArray(result.records)) {
                return { hasMore: false, cursor: undefined, records: [] };
            }

            return result;
        }),

    enablement: router({
        get: protectedProcedure
            .input(z.object({ ecosystemId: z.string().min(1) }))
            .query(async ({ ctx, input }): Promise<CatalogEnablementState> => {
                const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
                if (!keyRef)
                    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

                const query = makeBrainCaller(
                    ctx.kms,
                    ctx.transport,
                    ctx.session.managedDid,
                    keyRef
                );

                const result = await query<CatalogEnablementState>('ecosystem.getCatalogPolicy', {
                    id: input.ecosystemId,
                });

                return normalizeEnablementState(input.ecosystemId, result);
            }),

        enable: protectedProcedure
            .input(z.object({ ecosystemId: z.string().min(1), listingId: z.string().min(1) }))
            .mutation(async ({ ctx, input }): Promise<CatalogEnablementState> => {
                const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
                if (!keyRef)
                    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

                const mutate = makeBrainMutator(
                    ctx.kms,
                    ctx.transport,
                    ctx.session.managedDid,
                    keyRef
                );

                const result = await mutate<CatalogEnablementState>('ecosystem.enableListing', {
                    id: input.ecosystemId,
                    listingId: input.listingId,
                });

                return normalizeEnablementState(input.ecosystemId, result);
            }),

        disable: protectedProcedure
            .input(z.object({ ecosystemId: z.string().min(1), listingId: z.string().min(1) }))
            .mutation(async ({ ctx, input }): Promise<CatalogEnablementState> => {
                const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
                if (!keyRef)
                    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

                const mutate = makeBrainMutator(
                    ctx.kms,
                    ctx.transport,
                    ctx.session.managedDid,
                    keyRef
                );

                const result = await mutate<CatalogEnablementState>('ecosystem.disableListing', {
                    id: input.ecosystemId,
                    listingId: input.listingId,
                });

                return normalizeEnablementState(input.ecosystemId, result);
            }),
    }),

    get: protectedProcedure
        .input(z.object({ listingId: z.string() }))
        .query(async ({ ctx, input }): Promise<CatalogListingDetail> => {
            const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
            if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

            const bearerFactory = new DidAuthBearerFactory(ctx.kms);

            const call = <T>(path: string, callInput: unknown) =>
                authorizedCall(
                    bearerFactory,
                    ctx.transport,
                    ctx.session.managedDid,
                    keyRef,
                    bearer => ctx.transport.trpcQuery<T>(bearer, path, callInput)
                );

            const [listing, versions] = await Promise.all([
                call<AppStoreListing | undefined>('appStore.getPublicListing', {
                    listingId: input.listingId,
                }),
                call<CatalogListingVersion[]>('appStore.getListingVersions', {
                    listingId: input.listingId,
                }).catch(() => [] as CatalogListingVersion[]),
            ]);

            if (!listing || !listing.listing_id) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
            }

            return { listing, versions: Array.isArray(versions) ? versions : [] };
        }),

    getBundleMembers: protectedProcedure
        .input(z.object({ listingId: z.string().min(1) }))
        .query(async ({ ctx, input }): Promise<CatalogBundleMember[]> => {
            const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
            if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

            const query = makeBrainCaller(ctx.kms, ctx.transport, ctx.session.managedDid, keyRef);

            const result = await query<CatalogBundleMember[]>('appStore.getBundleMembers', input);

            // Stubbed transports return {} for every query — normalize to a safe shape.
            return Array.isArray(result) ? result : [];
        }),

    getIntegrationManifestSummary: protectedProcedure
        .input(z.object({ listingId: z.string().min(1) }))
        .query(async ({ ctx, input }): Promise<CatalogIntegrationManifestSummary | null> => {
            const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
            if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

            const query = makeBrainCaller(ctx.kms, ctx.transport, ctx.session.managedDid, keyRef);

            const result = await query<CatalogIntegrationManifestSummary>(
                'appStore.getIntegrationManifestSummary',
                input
            );

            // Stubbed transports return {} for every query — normalize to a safe shape.
            if (!result || !Array.isArray(result.supportedRecordClasses)) return null;

            return result;
        }),
});
