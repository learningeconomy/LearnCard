import { issueProvisionedRecord, resolveRecordIssuer } from '@helpers/platform-issuance.helpers';
import type { CredentialIssuerAdapter } from './types';

/** Platform Issuance: the ecosystem issues as its ADR-001 identity via a managed signing key. */
export const platformIssuerAdapter: CredentialIssuerAdapter = {
    kind: 'platform',
    supportedRecordClasses: ['academic'],
    async readinessGaps(binding) {
        const issuance = binding.capabilityMetadata?.issuance;
        if (!issuance) {
            return ['Platform Issuance requires a pinned issuer Group and credential template.'];
        }
        const issuer = await resolveRecordIssuer(binding.ecosystemId, issuance);
        return typeof issuer === 'string' ? [issuer] : [];
    },
    canIssue: metadata => Boolean(metadata.issuance),
    async issue(record, metadata) {
        if (!metadata.issuance) {
            return { status: 'ISSUE_FAILED', reason: 'No Platform Issuance declaration.' };
        }
        return issueProvisionedRecord({ ...record, issuance: metadata.issuance });
    },
};
