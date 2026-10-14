import type { InboxBatchStatus, IssueInboxCredentialBatch } from '@learncard/types';
import type { RosterDraft } from './types';
import type { ColumnScopes } from './roster';
import type { OBv3CredentialTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

export interface IssuanceScope {
    issuer: string;
    domain: string;
    tenant: string;
}
export type RowOutcomeState = 'ready' | 'queued' | 'sent' | 'failed' | 'confirming';
export interface RowOutcome {
    state: RowOutcomeState;
    error?: { code: string; message: string; reason?: string };
    issuanceId?: string;
    templateData?: Record<string, unknown>;
}
export interface SubmissionAttempt {
    id: string;
    createdAt: number;
    rowIds: string[];
    body: IssueInboxCredentialBatch;
    batchId?: string;
    admittedAt?: number;
    done?: boolean;
    status?: InboxBatchStatus;
}
export interface IssuanceRun {
    version: 1;
    id: string;
    scope: IssuanceScope;
    createdAt: number;
    updatedAt: number;
    draft: RosterDraft;
    template: OBv3CredentialTemplate;
    templateUri?: string;
    scopes: ColumnScopes;
    shared: Record<string, string>;
    outcomes: Record<string, RowOutcome>;
    attempts: SubmissionAttempt[];
}

export const issuanceScopeKey = (scope: IssuanceScope): string =>
    JSON.stringify([scope.issuer, scope.domain, scope.tenant]);

export class IssuanceRecoveryError extends Error {
    constructor(
        readonly code: 'storage' | 'corrupt' | 'context' | 'expired' | 'oversize' | 'busy'
    ) {
        super(code);
        this.name = 'IssuanceRecoveryError';
    }
}
