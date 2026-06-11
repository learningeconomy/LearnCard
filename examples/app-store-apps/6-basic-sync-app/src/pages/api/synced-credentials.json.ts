import type { APIRoute } from 'astro';

const getNetworkOption = (networkUrl?: string): true | string => {
    const raw = networkUrl?.trim();

    if (!raw) return true;

    const normalized = raw.replace(/\/+$/, '');
    return normalized.endsWith('/trpc') ? normalized : `${normalized}/trpc`;
};

export const GET: APIRoute = async ({ url }) => {
    const issuerSeed = import.meta.env?.LEARNCARD_ISSUER_SEED;
    const networkUrl = import.meta.env?.LEARNCARD_NETWORK_URL as string | undefined;
    const appContractUri = import.meta.env?.APP_CONTRACT_URI as string | undefined;
    const did = url.searchParams.get('did')?.trim();
    const limit = Number(url.searchParams.get('limit') ?? '200');

    if (!did) {
        return new Response(JSON.stringify({ error: 'Missing required did query parameter.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (!issuerSeed) {
        return new Response(
            JSON.stringify({
                error: 'LEARNCARD_ISSUER_SEED is required for synced credential queries.',
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    if (!appContractUri?.trim()) {
        return new Response(
            JSON.stringify({
                error: 'APP_CONTRACT_URI is required for contract-scoped synced credential queries.',
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    try {
        const { initLearnCard } = await import('@learncard/init');
        const learnCard = await initLearnCard({
            seed: issuerSeed,
            network: getNetworkOption(networkUrl),
        });

        const records: Record<string, unknown>[] = [];
        let cursor: string | undefined;
        let hasMore = true;

        while (hasMore) {
            const page = await learnCard.invoke.getConsentFlowDataForDid(did, {
                limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 200,
                cursor,
                query: {
                    id: appContractUri.split(':').at(-1),
                },
            });

            records.push(
                ...(page.records as Record<string, unknown>[]).filter(
                    record => record.contractUri === appContractUri
                )
            );
            cursor = page.cursor ?? undefined;
            hasMore = Boolean(page.hasMore && cursor);
        }

        const sharedUrisByCategory = records.reduce<Record<string, Set<string>>>(
            (summary, record) => {
                const credentials = Array.isArray(record.credentials)
                    ? (record.credentials as Record<string, unknown>[])
                    : [];

                for (const credential of credentials) {
                    const category =
                        typeof credential.category === 'string'
                            ? credential.category
                            : 'Uncategorized';
                    const uri =
                        typeof credential.uri === 'string' ? credential.uri.trim() : undefined;

                    if (!uri) continue;

                    if (!summary[category]) {
                        summary[category] = new Set<string>();
                    }

                    summary[category].add(uri);
                }

                return summary;
            },
            {}
        );

        const totalCredentialEntries = Object.values(sharedUrisByCategory).reduce(
            (total, uris) => total + uris.size,
            0
        );

        const categoryCounts = Object.fromEntries(
            Object.entries(sharedUrisByCategory).map(([category, uris]) => [category, uris.size])
        );

        const serializedSharedUrisByCategory = Object.fromEntries(
            Object.entries(sharedUrisByCategory).map(([category, uris]) => [
                category,
                [...uris].sort(),
            ])
        );

        const allUniqueSharedUris = [
            ...new Set(Object.values(serializedSharedUrisByCategory).flat()),
        ].sort();

        return new Response(
            JSON.stringify({
                did,
                contractUri: appContractUri,
                recordCount: records.length,
                totalCredentialEntries,
                totalUniqueSharedUris: allUniqueSharedUris.length,
                categoryCounts,
                sharedUrisByCategory: serializedSharedUrisByCategory,
                sampleSharedUris: allUniqueSharedUris.slice(0, 25),
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        const details =
            error instanceof Error
                ? {
                      name: error.name,
                      message: error.message,
                      stack: error.stack,
                      cause:
                          error.cause instanceof Error
                              ? {
                                    name: error.cause.name,
                                    message: error.cause.message,
                                    stack: error.cause.stack,
                                }
                              : error.cause,
                  }
                : {
                      message: 'Failed to query synced data.',
                      raw: error,
                  };

        console.error('Synced credential query failed', details);

        return new Response(
            JSON.stringify({
                error: 'Failed to query synced data.',
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};
