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

/** The wrapped and legacy unwrapped responses supported by the VC-API exchange. */
export type VCAPIResponse = Partial<VP> &
    Partial<ExchangePresentationRequestData> & {
        verifiablePresentationRequest?: ExchangePresentationRequestData;
        verifiablePresentation?: VP;
        redirectUrl?: string;
        inboxDeliveries?: InboxDelivery[];
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
