import type { JWE, VC } from '@learncard/types';
import type { BoostInstance } from '@models';
import type { CredentialIssuer } from './issuer';
import type { ProfileType } from './profile';
import type { DbTermsType } from './consentflowcontract';
import type { IssuedCredential } from './credential';

export interface BoostDeliveryOptions {
    from: CredentialIssuer;
    to: ProfileType;
    boost: BoostInstance;
    credential: VC | JWE | IssuedCredential;
    domain: string;
    skipNotification?: boolean;
    autoAcceptCredential?: boolean;
    contractTerms?: DbTermsType;
    metadata?: Record<string, unknown>;
    activityId?: string;
    integrationId?: string;
    listingId?: string;
}
