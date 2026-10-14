// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { initLearnCard } from '@learncard/init';
import { UnsignedVCValidator, type VC } from '@learncard/types';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

import { buildSimpleTemplate, issueViaBoost } from './simpleSend.helpers';
import { attachmentsToEvidence } from '../../pages/issue/components/mediaEvidence';
import { DEFAULT_CONTEXTS } from '../../pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

vi.mock('learn-card-base', async () => {
    const { boostSupportsDynamicEvidence } = await import('learn-card-base/components/boost/boost');
    return {
        getDefaultCategoryForCredential: () => 'Achievement',
        boostSupportsDynamicEvidence,
    };
});

vi.mock('../../config/bootstrapTenantConfig', () => ({
    getAppBaseUrl: () => 'https://learncard.app',
    getResolvedTenantConfig: () => ({ domain: 'network.learncard.com' }),
}));

const EVIDENCE_CONTEXT = 'https://ctx.learncard.com/boosts/1.0.3.json';

describe('issueViaBoost recipient evidence', () => {
    let signer: Awaited<ReturnType<typeof initLearnCard>>;

    beforeAll(async () => {
        signer = await initLearnCard({
            seed: 'a'.repeat(64),
            didkit: readFile(
                require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
            ),
        });
    });

    it('signs distinct uploaded evidence for multiple recipients without losing file metadata', async () => {
        const template = buildSimpleTemplate({
            credentialType: 'badge',
            name: 'Completed Project',
            description: 'Completed the project with supporting evidence.',
        });
        const evidenceByRecipient = {
            jonny: attachmentsToEvidence([
                {
                    id: 'photo-1',
                    type: 'photo',
                    url: 'https://cdn.example.com/jonny.jpeg',
                    title: 'Project photo',
                    fileName: 'jonny.jpeg',
                    fileType: 'image/jpeg',
                },
            ]),
            'learner@example.com': attachmentsToEvidence([
                {
                    id: 'document-1',
                    type: 'document',
                    url: 'https://cdn.example.com/learner.pdf',
                    title: 'Project report',
                    fileName: 'learner.pdf',
                    fileType: 'application/pdf',
                },
            ]),
        };
        let boostTemplate: Record<string, unknown> = {};
        const signedByRecipient: Record<string, VC> = {};
        const createBoost = vi.fn(async (credential: Record<string, unknown>) => {
            boostTemplate = structuredClone(credential);
            return 'urn:boost:project';
        });
        // Stub delivery/storage, but use real DIDKit signing on the final
        // per-recipient credential, after the network would append evidence.
        const send = vi.fn(
            async ({
                recipient,
                templateData,
            }: {
                recipient: string;
                templateData?: Record<string, unknown>;
            }) => {
                const unsigned = UnsignedVCValidator.parse({
                    ...structuredClone(boostTemplate),
                    validFrom: new Date().toISOString(),
                    credentialSubject: {
                        ...(boostTemplate.credentialSubject as Record<string, unknown>),
                        id: `did:example:${recipient === 'jonny' ? 'jonny' : 'learner'}`,
                    },
                    ...(templateData?.evidence ? { evidence: templateData.evidence } : {}),
                });
                const signed = await signer.invoke.issueCredential(unsigned);
                signedByRecipient[recipient] = signed;
                return { credentialUri: `urn:credential:${recipient}` };
            }
        );
        const wallet = {
            id: signer.id,
            invoke: { createBoost, send },
        } as unknown as BespokeLearnCard;

        await expect(
            issueViaBoost(wallet, template, {
                mode: 'people',
                recipients: [
                    { kind: 'profile', profileId: 'jonny', displayName: 'Jonny' },
                    { kind: 'email', email: 'learner@example.com' },
                    { kind: 'profile', profileId: 'no-evidence', displayName: 'No Evidence' },
                ],
                linkOptions: {},
                variableValuesByRecipient: Object.fromEntries(
                    Object.entries(evidenceByRecipient).map(([recipient, evidence]) => [
                        recipient,
                        { evidence },
                    ])
                ),
            })
        ).resolves.toEqual({ credentialUri: 'urn:boost:project', claimLink: undefined });

        expect(createBoost).toHaveBeenCalledOnce();
        expect(send).toHaveBeenCalledTimes(3);
        expect(template.contexts).toEqual(DEFAULT_CONTEXTS);
        expect(boostTemplate).not.toHaveProperty('proof');
        expect(boostTemplate).not.toHaveProperty('evidence');
        for (const [recipient, evidence] of Object.entries(evidenceByRecipient)) {
            const signed = signedByRecipient[recipient];
            expect(signed.proof).toBeDefined();
            expect(signed.evidence).toEqual(evidence);
            const verification = await signer.invoke.verifyCredential(signed);
            expect(verification.errors).toEqual([]);
        }
        expect(signedByRecipient.jonny.credentialSubject).toHaveProperty('id', 'did:example:jonny');
        expect(signedByRecipient['learner@example.com'].credentialSubject).toHaveProperty(
            'id',
            'did:example:learner'
        );
        expect(signedByRecipient['no-evidence'].proof).toBeDefined();
        expect(signedByRecipient['no-evidence']).not.toHaveProperty('evidence');
    }, 30_000);

    it('keeps standard contexts when recipients have no evidence', async () => {
        const template = buildSimpleTemplate({
            credentialType: 'badge',
            name: 'Completed Project',
            description: 'Completed the project.',
        });
        const signedCredentials: VC[] = [];
        const createBoost = vi.fn(async (credential: VC) => {
            signedCredentials.push(credential);
            return 'urn:boost:project';
        });
        const wallet = {
            id: signer.id,
            invoke: {
                issueCredential: signer.invoke.issueCredential,
                createBoost,
                send: vi.fn().mockResolvedValue({}),
            },
        } as unknown as BespokeLearnCard;

        await issueViaBoost(wallet, template, {
            mode: 'people',
            recipients: [{ kind: 'profile', profileId: 'jonny', displayName: 'Jonny' }],
            linkOptions: {},
        });

        expect(signedCredentials[0].proof).toBeDefined();
        expect(signedCredentials[0]['@context']).toEqual(expect.arrayContaining(DEFAULT_CONTEXTS));
        expect(signedCredentials[0]['@context']).not.toContain(EVIDENCE_CONTEXT);
    }, 30_000);

    it('preserves an existing evidence context without duplicating it', async () => {
        const template = buildSimpleTemplate({
            credentialType: 'badge',
            name: 'Completed Project',
            description: 'Completed the project.',
        });
        template.contexts = [...template.contexts, EVIDENCE_CONTEXT];
        const createBoost = vi.fn().mockResolvedValue('urn:boost:project');
        const wallet = {
            id: signer.id,
            invoke: { createBoost, send: vi.fn().mockResolvedValue({}) },
        } as unknown as BespokeLearnCard;

        await issueViaBoost(wallet, template, {
            mode: 'people',
            recipients: [{ kind: 'profile', profileId: 'jonny', displayName: 'Jonny' }],
            linkOptions: {},
            variableValuesByRecipient: {
                jonny: {
                    evidence: attachmentsToEvidence([
                        {
                            id: 'link-1',
                            type: 'link',
                            url: 'https://example.com/project',
                            title: 'Project',
                        },
                    ]),
                },
            },
        });

        expect(createBoost.mock.calls[0][0]['@context']).toEqual(template.contexts);
    });
});
