import { initDidWebLearnCard, DidWebLearnCard } from '../';

let learnCards: Record<
    string,
    {
        learnCard: DidWebLearnCard;
    }
> = {};

const DEFAULT_DID_WEB = 'did:web:network.learncard.com';

const getLearnCard = async (seed = 'a'.repeat(64), didWeb = DEFAULT_DID_WEB) => {
    if (!learnCards[seed]) {
        const learnCard = await initDidWebLearnCard({ seed, didWeb });
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
