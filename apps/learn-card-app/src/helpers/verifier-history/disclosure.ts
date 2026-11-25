import type { VP } from '@learncard/types';
import type { DisclosureAttempt } from './history';
/** Metadata stays local: this argument must never be spread into a protocol request body. */
export type CredentialDisclosureSubmit = (
    body: { verifiablePresentation: VP },
    history?: DisclosureAttempt
) => void | Promise<void>;

export type VerifierPresentationRequest = {
    challenge?: string;
    domain?: string;
    purpose?: string;
    query?: Record<string, unknown>[];
};
