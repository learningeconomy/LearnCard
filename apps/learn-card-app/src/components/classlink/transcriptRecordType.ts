import * as m from '../../paraglide/messages.js';

export type TranscriptRecordType = 'official' | 'unofficial';

/** Wallet banner title, labelled only when the issuer says what kind of record it sends. */
export const getTranscriptBannerTitle = (recordType?: TranscriptRecordType): string =>
    recordType === 'official'
        ? m['transcriptOptIn.bannerTitleOfficial']()
        : recordType === 'unofficial'
          ? m['transcriptOptIn.bannerTitleUnofficial']()
          : m['transcriptOptIn.bannerTitle']();

/** Title of the request step in onboarding and the sign-in prompt. */
export const getTranscriptRequestTitle = (recordType?: TranscriptRecordType): string =>
    recordType === 'official'
        ? m['onboarding.transcript.titleOfficial']()
        : recordType === 'unofficial'
          ? m['onboarding.transcript.titleUnofficial']()
          : m['onboarding.transcript.title']();
