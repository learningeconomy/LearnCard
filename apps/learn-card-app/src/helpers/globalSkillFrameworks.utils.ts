// Keep this allowlist in sync with production tenants. If a prod tenant points at a
// brain-service host not listed here, local frontend builds will incorrectly try the
// seeded-framework path and global skills will disappear.
const PRODUCTION_BRAIN_SERVICE_HOSTS = new Set(['network.learncard.com', 'network.vetpass.app']);

export const isProductionBrainService = (brainServiceUrl?: string | null): boolean => {
    const normalizedBrainServiceUrl = brainServiceUrl?.trim();

    if (!normalizedBrainServiceUrl) {
        return false;
    }

    try {
        const hostname = new URL(normalizedBrainServiceUrl).hostname.toLowerCase();

        return PRODUCTION_BRAIN_SERVICE_HOSTS.has(hostname);
    } catch {
        return false;
    }
};
