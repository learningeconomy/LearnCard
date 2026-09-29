import type { VP } from '@learncard/types';
import type {
    ExchangeState,
    RequestResponseDataType,
    VCAPIRequestStrategy,
} from './ClaimFromRequest';
import type { InboxDelivery } from './inboxDelivery';

export interface ExchangePresentationRequestData {
    query: { type?: string | string[]; [key: string]: unknown }[];
    challenge: string;
    domain: string;
}

/**
 * Guardian-gated inbox credentials that could not be delivered yet. The brain
 * service short-circuits these instead of signing/delivering them, so the
 * claimant can be shown a waiting (or declined) state instead of a genuine
 * "no credentials" empty response.
 */
export type InboxClaimOutcomeStatus = 'AWAITING_GUARDIAN' | 'GUARDIAN_REJECTED';

export interface InboxClaimOutcome {
    id: string;
    status: InboxClaimOutcomeStatus;
}

/** The wrapped and legacy unwrapped responses supported by the VC-API exchange. */
export type VCAPIResponse = Partial<VP> &
    Partial<ExchangePresentationRequestData> & {
        verifiablePresentationRequest?: ExchangePresentationRequestData;
        verifiablePresentation?: VP;
        redirectUrl?: string;
        inboxDeliveries?: InboxDelivery[];
        /** Optional so older wrapped/unwrapped responses stay valid. */
        inboxClaimOutcomes?: InboxClaimOutcome[];
        message?: string;
    };

export type NormalizedExchangeResponse = (
    | {
          type: RequestResponseDataType.VerifiablePresentationRequest;
          data: ExchangePresentationRequestData;
      }
    | { type: RequestResponseDataType.VerifiablePresentation; data: VP }
    | { type: RequestResponseDataType.RedirectUrl; data: string }
    | { type: RequestResponseDataType.Unknown; data: VCAPIResponse }
) & { strategy: VCAPIRequestStrategy };

export type ExchangeResponse = (
    | {
          state: ExchangeState.PresentationRequest | ExchangeState.DidAuth;
          data: ExchangePresentationRequestData;
      }
    | { state: ExchangeState.AcceptCredentials; data: VP }
    | { state: ExchangeState.Redirect; data: string }
    | { state: ExchangeState.Error; data: unknown }
    | { state: ExchangeState.Finished; data?: { title?: string; description?: string } }
    | { state: ExchangeState.Loading | ExchangeState.Initiate }
) & { strategy?: VCAPIRequestStrategy };
