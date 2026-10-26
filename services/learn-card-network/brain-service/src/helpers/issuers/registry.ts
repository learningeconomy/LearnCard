import type { BindingEndpoint } from '@learncard/types';
import { platformIssuerAdapter } from './platform';
import type { CredentialIssuerAdapter } from './types';

/**
 * Resolves the issuer that consumes a record lane from the Binding's consumer endpoint.
 * Consumers without an implementation resolve to null, so approval and release fail closed
 * instead of accepting records nothing can issue.
 */
export const resolveIssuerAdapter = (consumer: BindingEndpoint): CredentialIssuerAdapter | null => {
    switch (consumer.resourceType) {
        case 'ECOSYSTEM':
            return platformIssuerAdapter;
        // Post-MVP: WORKLOAD_DEPLOYMENT (DCC issuer) and INTEGRATION_INSTALL (external issuer).
        default:
            return null;
    }
};
