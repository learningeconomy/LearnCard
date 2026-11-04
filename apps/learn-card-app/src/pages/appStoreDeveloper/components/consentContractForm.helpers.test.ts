import { describe, expect, it } from 'vitest';
import type { ConsentFlowContractDetails } from '@learncard/types';
import { buildContractFormChanges, contractToFormValue } from './consentContractForm.helpers';

const makeContract = (): ConsentFlowContractDetails => ({
    uri: 'lc:contract:form',
    name: 'Example',
    version: 4,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    owner: {
        profileId: 'owner',
        did: 'did:example:owner',
        displayName: 'Owner',
        shortBio: '',
        bio: '',
    },
    autoBoosts: ['lc:boost:existing'],
    writers: [
        {
            profileId: 'writer',
            did: 'did:example:writer',
            displayName: 'Writer',
            shortBio: '',
            bio: '',
        },
    ],
    contract: {
        read: {
            anonymize: true,
            credentials: {
                categories: {
                    Achievement: {
                        required: false,
                        defaultEnabled: true,
                        reason: 'Keep this purpose',
                    },
                    Transcript: { required: true },
                },
            },
            personal: { name: { required: false, defaultEnabled: false } },
        },
        write: { credentials: { categories: { Certificate: { required: false } } }, personal: {} },
    },
});

describe('contract form update patches', () => {
    it('does not turn normalized empty metadata into an update', () => {
        const baseline = makeContract();
        expect(buildContractFormChanges(baseline, contractToFormValue(baseline))).toEqual({});
    });
    it('removes only selected scopes with explicit null, leaving unrelated grants and delivery configuration untouched', () => {
        const baseline = makeContract();
        const draft = contractToFormValue(baseline);
        delete draft.contract.read.credentials.categories.Transcript;
        delete draft.contract.read.personal.name;
        expect(buildContractFormChanges(baseline, draft)).toEqual({
            contract: {
                read: {
                    credentials: { categories: { Transcript: null } },
                    personal: { name: null },
                },
            },
        });
        expect(baseline.contract.read.credentials.categories.Transcript).toEqual({
            required: true,
        });
    });
    it('keeps a scope purpose when changing its required or default state and supports clearing metadata', () => {
        const baseline = { ...makeContract(), description: 'Old description' };
        const draft = contractToFormValue(baseline);
        draft.description = '';
        draft.contract.read.credentials.categories.Achievement.required = true;
        expect(buildContractFormChanges(baseline, draft)).toEqual({
            description: '',
            contract: {
                read: {
                    credentials: {
                        categories: {
                            Achievement: {
                                required: true,
                                defaultEnabled: true,
                                reason: 'Keep this purpose',
                            },
                        },
                    },
                },
            },
        });
    });
    it('serializes personal-field defaults and reasons independently of category grants', () => {
        const baseline = makeContract();
        const draft = contractToFormValue(baseline);
        draft.contract.write.personal.email = {
            required: false,
            defaultEnabled: false,
            reason: 'Send results',
        };
        draft.contract.read.anonymize = false;
        expect(buildContractFormChanges(baseline, draft)).toEqual({
            contract: {
                read: { anonymize: false },
                write: {
                    personal: {
                        email: { required: false, defaultEnabled: false, reason: 'Send results' },
                    },
                },
            },
        });
    });
});
