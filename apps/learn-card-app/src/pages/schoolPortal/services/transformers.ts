/**
 * Data Transformers
 *
 * Maps Ed.link onboarding data to our internal models.
 */

import type { LMSConnection, EdlinkIntegrationData } from '../types';

/**
 * Maps Ed.link integration status to our ConnectionStatus.
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
 */
export const transformOnboardingData = (data: EdlinkIntegrationData): LMSConnection => {
    const integration = data.integration;

    return {
        id: integration.id,
        integrationId: integration.id,
        sourceId: integration.source.id,
        provider: 'other',
        providerName: 'LMS',
        institutionName: 'Connected Institution',
        status: mapIntegrationStatus(integration.status),
        connectedAt: integration.created_date || new Date().toISOString(),
        accessToken: integration.access_token,
    };
};
