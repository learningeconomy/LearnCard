import { generateLearnCard, LearnCard } from '@learncard/core';
import { DidMethod, getDidKitPlugin, DIDKitPlugin } from '@learncard/didkit-plugin';
import { getDidKeyPlugin, DidKeyPlugin } from '@learncard/didkey-plugin';
import { VCPlugin, getVCPlugin } from '@learncard/vc-plugin';
import { VCTemplatePlugin, getVCTemplatesPlugin } from '@learncard/vc-templates-plugin';
import { CeramicPlugin, getCeramicPlugin } from '@learncard/ceramic-plugin';
import { ExpirationPlugin, expirationPlugin } from '@learncard/expiration-plugin';
import { LearnCardPlugin, getLearnCardPlugin } from '@learncard/learn-card-plugin';
import { DidWebPlugin, getDidWebPlugin } from '../';

let learnCards: Record<
    string,
    {
        learnCard: LearnCard<
            [
                DIDKitPlugin,
                DidKeyPlugin<DidMethod>,
                VCPlugin,
                VCTemplatePlugin,
                CeramicPlugin,
                ExpirationPlugin,
                LearnCardPlugin,
                DidWebPlugin
            ]
        >;
    }
> = {};

const DEFAULT_DID_WEB = 'did:web:network.learncard.com';

const getLearnCard = async (seed = 'a'.repeat(64), didWeb = DEFAULT_DID_WEB) => {
    if (!learnCards[seed]) {
        const emptyLearnCard = await generateLearnCard();
        const didkitLc = await emptyLearnCard.addPlugin(await getDidKitPlugin());
        const didkeyLc = await didkitLc.addPlugin(
            await getDidKeyPlugin(didkitLc, seed, 'key' as DidMethod)
        );
        const vcLc = await didkeyLc.addPlugin(getVCPlugin(didkeyLc));
        const vcTemplateLc = await vcLc.addPlugin(getVCTemplatesPlugin());
        const ceramicLc = await vcTemplateLc.addPlugin(
            await getCeramicPlugin(vcTemplateLc, {} as any)
        );
        const expirationLc = await ceramicLc.addPlugin(expirationPlugin(ceramicLc));
        const lcLc = await expirationLc.addPlugin(getLearnCardPlugin(expirationLc));
        const learnCard = await lcLc.addPlugin(await getDidWebPlugin(lcLc, didWeb));
        learnCards[seed] = { learnCard: learnCard };
    }

    return {
        ...learnCards[seed].learnCard,
    };
};

describe('DID Web Plugin', () => {
    describe('DIDWebLearnCard', () => {
        it('should work', async () => {
            await expect(getLearnCard()).resolves.toBeDefined();
        });

        it('should update the ID function to return the did:web address', async () => {
            const learnCard = await getLearnCard();
            expect(learnCard.id.did()).toEqual(DEFAULT_DID_WEB);
        });

        it('should still allow getting did:key address', async () => {
            const learnCard = await getLearnCard();
            expect(learnCard.id.did('key')).toContain('did:key:');
        });

        // TODO: this test will fail unless we have a stable seed <> did:web pairing, we should host a did:web for testing.
        it.skip('should sign a credential with the did:web address', async () => {
            const learnCard = await getLearnCard();
            const vc = await learnCard.invoke.issueCredential(learnCard.invoke.getTestVc());
            expect(vc.issuer).toEqual(DEFAULT_DID_WEB);
        });

        // TODO: this test will fail unless we have a stable seed <> did:web pairing, we should host a did:web for testing.
        it.skip('should sign a credential with the did:web address', async () => {
            const learnCard = await getLearnCard();
            const didAuthVP = await learnCard.invoke.getDidAuthVp();
            if (typeof didAuthVP !== 'string') {
                expect(didAuthVP.holder).toEqual(DEFAULT_DID_WEB);
            }
        });
    });
});
