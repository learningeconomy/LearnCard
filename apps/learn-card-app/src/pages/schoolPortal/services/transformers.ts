/**
 * Data Transformers
 *
 * Maps external data formats (Ed.link) to our internal models.
 */

import type {
    LMSProvider,
    LMSConnection,
    EdlinkIntegrationData,
    EdlinkIntegration,
} from '../types';

// =============================================================================
// Provider Mapping
// =============================================================================

/**
 * Maps Ed.link provider strings to our LMSProvider type.
 * Ed.link uses strings like "google_classroom", "canvas", "schoology", etc.
 */
export const mapProviderString = (providerString?: string): LMSProvider => {
    if (!providerString) return 'other';

    const normalized = providerString.toLowerCase();

    if (normalized.includes('canvas')) return 'canvas';
    if (normalized.includes('google') || normalized.includes('classroom')) return 'google';
    if (normalized.includes('schoology')) return 'schoology';
    if (normalized.includes('blackboard')) return 'blackboard';
    if (normalized.includes('moodle')) return 'moodle';
    if (normalized.includes('brightspace') || normalized.includes('d2l')) return 'brightspace';

    return 'other';
};

/**
 * Formats an LMSProvider into a human-readable display name.
 */
export const formatProviderName = (provider: LMSProvider): string => {
    const names: Record<LMSProvider, string> = {
        canvas: 'Canvas',
        google: 'Google Classroom',
        schoology: 'Schoology',
        blackboard: 'Blackboard',
        moodle: 'Moodle',
        brightspace: 'Brightspace',
        other: 'LMS',
    };
    return names[provider];
};

// =============================================================================
// Connection Transformers
// =============================================================================

/**
 * Maps Ed.link integration status to our ConnectionStatus.
 *
 * Ed.link statuses: 'active', 'paused', 'disabled', 'requested'
 */
const mapIntegrationStatus = (edlinkStatus: string): LMSConnection['status'] => {
    switch (edlinkStatus) {
        case 'active':
        case 'paused':
            return 'CONNECTED';
        case 'requested':
            return 'PENDING_APPROVAL';
        default:
            return 'ERROR';
    }
};

/**
 * Transforms Ed.link onboarding widget callback data into our LMSConnection model.
 *
 * Note: The onboarding callback only returns IDs for source. Provider name and
 * institution name would require additional API calls to fetch.
 */
export const transformOnboardingData = (data: EdlinkIntegrationData): LMSConnection => {
    const integration = data.integration;

    return {
        id: integration.id,
        sourceId: integration.source.id,
        provider: 'other', // Would need separate API call to get provider details
        providerName: 'LMS',
        institutionName: 'Connected Institution', // Would need separate API call
        status: mapIntegrationStatus(integration.status),
        connectedAt: integration.created_date || new Date().toISOString(),
        accessToken: integration.access_token,
    };
};

/**
 * Transforms Ed.link Integration API response into our LMSConnection model.
 */
export const transformIntegration = (integration: EdlinkIntegration): LMSConnection => {
    const provider = mapProviderString(integration.provider.application);

    return {
        id: integration.id,
        sourceId: integration.source.id,
        provider,
        providerName: integration.provider.name || formatProviderName(provider),
        institutionName: integration.source.name,
        status: integration.status === 'active' ? 'CONNECTED' : 'ERROR',
        connectedAt: integration.created_date,
        accessToken: integration.access_token,
    };
};

export const transformers = {
    mapProviderString,
    formatProviderName,
    transformOnboardingData,
    transformIntegration,
};

export default transformers;
