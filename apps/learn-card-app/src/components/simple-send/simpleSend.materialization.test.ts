import { describe, expect, it, vi } from 'vitest';
import type { UnsignedVC } from '@learncard/types';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { buildSimpleTemplate, fillTemplateSystemVars, issueViaBoost } from './simpleSend.helpers';
import {
    dynamicField,
    staticField,
} from '../../pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

vi.mock('learn-card-base', () => ({ getDefaultCategoryForCredential: () => 'Achievement' }));
vi.mock('../../config/bootstrapTenantConfig', () => ({
    getAppBaseUrl: () => 'https://learncard.test',
    getResolvedTenantConfig: () => ({ domain: 'network.learncard.test' }),
}));
const issuerDid = 'did:example:issuer';
const makeWallet = () => {
    const invoke = {
        issueCredential: vi.fn(async (credential: UnsignedVC) => ({
            ...credential,
            proof: { proofValue: 'test' },
        })),
        createBoost: vi.fn().mockResolvedValue('urn:boost:test'),
        send: vi.fn().mockResolvedValue({ credentialUri: 'urn:credential:test' }),
        acceptCredential: vi.fn().mockResolvedValue(undefined),
        generateClaimLink: vi
            .fn()
            .mockResolvedValue({ boostUri: 'urn:boost:test', challenge: 'test' }),
    };
    return {
        wallet: { id: { did: () => issuerDid }, invoke } as unknown as BespokeLearnCard,
        invoke,
    };
};
const makeTemplate = () =>
    buildSimpleTemplate({ credentialType: 'badge', name: 'Course', description: '' });

describe('standard field materialization in self and link issuance', () => {
    it('normalizes static awarded dates and numeric credits before local self signing', async () => {
        const template = makeTemplate();
        template.awardedDate = staticField('2024-02-29');
        template.credentialSubject.creditsEarned = staticField('0');
        const { wallet, invoke } = makeWallet();
        await issueViaBoost(wallet, template, {
            mode: 'self',
            recipients: [],
            linkOptions: {},
            currentLCNUser: { profileId: 'issuer' },
        });
        expect(invoke.issueCredential).toHaveBeenCalledWith(
            expect.objectContaining({
                awardedDate: '2024-02-29T00:00:00.000Z',
                credentialSubject: expect.objectContaining({ creditsEarned: 0 }),
            })
        );
    });
    it('materializes filled link fields before storing the one-off unsigned template', async () => {
        const template = makeTemplate();
        template.awardedDate = dynamicField('awarded');
        template.credentialSubject.creditsEarned = dynamicField('credits');
        const { wallet, invoke } = makeWallet();
        await issueViaBoost(wallet, template, {
            mode: 'link',
            recipients: [],
            linkOptions: {},
            claimLinkSA: { name: 'issuer', endpoint: 'https://signer.test' },
            variableValues: { awarded: '2024-04-03T09:00:00+02:00', credits: '1.5' },
        });
        expect(invoke.issueCredential).not.toHaveBeenCalled();
        expect(invoke.createBoost).toHaveBeenCalledWith(
            expect.objectContaining({
                awardedDate: '2024-04-03T07:00:00.000Z',
                credentialSubject: expect.objectContaining({ creditsEarned: 1.5 }),
            }),
            expect.anything()
        );
    });
    it('rejects an invalid awarded date before signing or creating a boost', () => {
        const template = makeTemplate();
        template.awardedDate = staticField('2023-02-29');
        expect(() => fillTemplateSystemVars(template, issuerDid)).toThrow('awardedDate');
    });
    it.each(['12 hours', '0x10', 'Infinity'])(
        'rejects invalid static credits %s instead of dropping them',
        value => {
            const template = makeTemplate();
            template.credentialSubject.creditsEarned = staticField(value);
            expect(() => fillTemplateSystemVars(template, issuerDid)).toThrow('creditsEarned');
        }
    );
});
