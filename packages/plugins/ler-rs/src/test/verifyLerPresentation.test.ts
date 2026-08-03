import { getLerRsPlugin } from '../ler-rs';
import { LERRSDependentLearnCard, VerificationResult } from '../types';

const NON_DID_ISSUER_WARNING =
    'Issuer authorization was not checked because the credential issuer is not a DID';

type Check = { checks: string[]; warnings: string[]; errors: string[] };

const clean: Check = { checks: ['proof'], warnings: [], errors: [] };

const credential = (issuer: string) =>
    ({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer,
        issuanceDate: '2024-01-01T00:00:00.000Z',
        credentialSubject: { id: 'did:key:holder' },
        proof: { type: 'DataIntegrityProof' },
    } as any);

const presentationWith = (...credentials: any[]) =>
    ({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        holder: 'did:key:holder',
        verifiableCredential: credentials,
        proof: { type: 'DataIntegrityProof' },
    } as any);

const buildLearnCard = (checks: {
    presentation?: Check;
    credential?: Check;
}): LERRSDependentLearnCard =>
    ({
        invoke: {
            verifyPresentation: jest.fn().mockResolvedValue(checks.presentation ?? clean),
            verifyCredential: jest.fn().mockResolvedValue(checks.credential ?? clean),
        },
    } as any);

const verify = async (
    learnCard: LERRSDependentLearnCard,
    presentation: any
): Promise<VerificationResult> => {
    const plugin = getLerRsPlugin(learnCard);

    return plugin.methods.verifyLerPresentation(learnCard as any, { presentation });
};

describe('verifyLerPresentation', () => {
    it('reports a fully valid presentation as verified', async () => {
        const result = await verify(
            buildLearnCard({}),
            presentationWith(credential('did:key:realIssuer'))
        );

        expect(result.verified).toBe(true);
        expect(result.presentationResult.verified).toBe(true);
        expect(result.credentialResults[0].verified).toBe(true);
        expect(result.credentialResults[0].warnings).toBeUndefined();
    });

    it('does not report a URL-issuer credential as verified when issuer authorization was never checked', async () => {
        const learnCard = buildLearnCard({
            credential: { checks: ['proof'], warnings: [NON_DID_ISSUER_WARNING], errors: [] },
        });

        const result = await verify(
            learnCard,
            presentationWith(credential('https://real-org.example/issuer'))
        );

        expect(result.credentialResults[0].verified).toBe(false);
        expect(result.credentialResults[0].warnings).toEqual([NON_DID_ISSUER_WARNING]);
        expect(result.verified).toBe(false);
    });

    it('surfaces presentation-level warnings and withholds overall verification', async () => {
        const learnCard = buildLearnCard({
            presentation: { checks: ['proof'], warnings: [NON_DID_ISSUER_WARNING], errors: [] },
        });

        const result = await verify(learnCard, presentationWith(credential('did:key:realIssuer')));

        expect(result.presentationResult.verified).toBe(false);
        expect(result.presentationResult.warnings).toEqual([NON_DID_ISSUER_WARNING]);
        expect(result.verified).toBe(false);
    });

    it('still reports errors as unverified', async () => {
        const learnCard = buildLearnCard({
            credential: { checks: [], warnings: [], errors: ['signature error'] },
        });

        const result = await verify(learnCard, presentationWith(credential('did:key:realIssuer')));

        expect(result.credentialResults[0].verified).toBe(false);
        expect(result.credentialResults[0].errors).toEqual(['signature error']);
    });
});
