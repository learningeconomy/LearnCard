import {
    prepareFixture,
    type CredentialFixture,
    type PrepareOptions,
} from '@learncard/credential-library';
import type { UnsignedVC } from '@learncard/types';

/** Preserve historical dates only when deliberately testing expiration. */
export const prepareViewerFixture = (
    fixture: CredentialFixture,
    options: Pick<PrepareOptions, 'issuerDid' | 'subjectDid'>,
    keepFixtureDates: boolean
): UnsignedVC =>
    prepareFixture(fixture, {
        ...options,
        ...(keepFixtureDates
            ? {
                  validFrom: fixture.credential.validFrom ?? fixture.credential.issuanceDate,
                  validUntil: fixture.credential.validUntil ?? fixture.credential.expirationDate,
              }
            : {}),
    });
