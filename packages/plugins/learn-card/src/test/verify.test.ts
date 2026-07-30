import { VC, VerificationCheck, VerificationStatusEnum } from '@learncard/types';

import { verifyCredential } from '../verify';

const credential = {} as VC;

const prettify = async (verificationCheck: VerificationCheck) => {
    const learnCard = {
        invoke: {
            verifyCredential: jest.fn().mockResolvedValue(verificationCheck),
        },
    };

    return verifyCredential(learnCard as any)({} as any, credential, {}, true);
};

describe('verifyCredential prettify', () => {
    it('formats a successful multi-purpose status check as active', async () => {
        await expect(
            prettify({
                checks: ['proof', 'status'],
                warnings: [],
                errors: [],
                status: [
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'revocation',
                        isSet: false,
                    },
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'suspension',
                        isSet: false,
                    },
                ],
            })
        ).resolves.toEqual(
            expect.arrayContaining([
                {
                    status: VerificationStatusEnum.Success,
                    check: 'status',
                    message: 'Active',
                },
            ])
        );
    });

    it('formats a successful single-purpose status check with the purpose', async () => {
        await expect(
            prettify({
                checks: ['credentialStatus'],
                warnings: [],
                errors: [],
                status: [
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'revocation',
                        isSet: false,
                    },
                ],
            })
        ).resolves.toEqual([
            {
                status: VerificationStatusEnum.Success,
                check: 'status',
                message: 'Not Revoked',
            },
        ]);
    });

    it('formats set status entries as user-facing failures', async () => {
        await expect(
            prettify({
                checks: ['proof'],
                warnings: [],
                errors: ['Credential is revoked.'],
                status: [
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'revocation',
                        isSet: true,
                    },
                ],
            })
        ).resolves.toEqual(
            expect.arrayContaining([
                {
                    status: VerificationStatusEnum.Failed,
                    check: 'status',
                    details: 'Status: Revoked',
                },
            ])
        );
    });

    it('does not treat unrelated errors as status errors just because status data exists', async () => {
        await expect(
            prettify({
                checks: [],
                warnings: [],
                errors: ['Boost Credential could not be verified.'],
                status: [
                    {
                        entryType: 'BitstringStatusListEntry',
                        statusPurpose: 'revocation',
                        isSet: true,
                    },
                ],
            })
        ).resolves.toEqual([
            {
                status: VerificationStatusEnum.Failed,
                check: 'Boost Credential could not be verified.',
                details: 'Boost Credential could not be verified.',
            },
        ]);
    });
});
