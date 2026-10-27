import { describe, expect, it } from 'vitest';
import type {
    ConsentFlowContractDetails,
    ConsentFlowContractDiff,
    ConsentFlowContractScope,
    ConsentFlowContractUpdatePreview,
    ConsentFlowTerms,
} from '@learncard/types';
import {
    applyContractUpdateScopeChoice,
    applyContractUpdateScopeChoices,
    getContractUpdateScopeKey,
    isContractUpdateScopeEnabled,
    getUnchangedDefaultAccessScopes,
    getUnchangedAccessScopes,
    getEnabledOptionalUpdateScopeKeys,
} from './contractUpdateReview.helpers';

const createTerms = (): ConsentFlowTerms => ({
    read: { anonymize: true, credentials: { categories: {} }, personal: {} },
    write: { credentials: { categories: {} }, personal: {} },
});

describe('contract update scope choices', () => {
    it.each([
        { area: 'read', type: 'credential', key: 'Achievement', required: false },
        { area: 'write', type: 'credential', key: 'Certificate', required: false },
        { area: 'read', type: 'personal', key: 'Name', required: false },
        { area: 'write', type: 'personal', key: 'Email', required: false },
    ] as const)('enables optional %s', inputScope => {
        const scope = inputScope as ConsentFlowContractScope;
        const terms = createTerms();
        applyContractUpdateScopeChoice(terms, scope, true);

        if (scope.area === 'read' && scope.type === 'credential') {
            expect(terms.read.credentials.categories[scope.key]).toEqual({
                shareAll: true,
                sharing: true,
                shared: [],
            });
        } else if (scope.area === 'write' && scope.type === 'credential') {
            expect(terms.write.credentials.categories[scope.key]).toBe(true);
        } else if (scope.area === 'read') {
            expect(terms.read.personal[scope.key]).toBe('Anonymous');
        } else {
            expect(terms.write.personal[scope.key]).toBe(true);
        }
    });

    it('leaves an unselected optional addition absent from granted terms', () => {
        const terms = createTerms();
        const scope: ConsentFlowContractScope = {
            area: 'read',
            type: 'personal',
            key: 'Email',
            required: false,
        };

        applyContractUpdateScopeChoice(terms, scope, false);

        expect(terms.read.personal).not.toHaveProperty('Email');
        expect(getContractUpdateScopeKey(scope)).toBe('read|personal|Email');
    });

    it('preserves an existing selected read grant when a required row changes', () => {
        const terms = createTerms();
        const existing = {
            shareAll: false,
            sharing: true,
            shared: ['credential:one'],
            shareUntil: '2026-10-20',
        };
        terms.read.credentials.categories.Achievement = existing;
        const rows: ConsentFlowContractUpdatePreview['rows'] = [
            {
                scope: { area: 'read', type: 'credential', key: 'Achievement', required: true },
                change: 'changed',
                label: 'Achievement',
                subtitle: 'Reason updated',
            },
        ];

        applyContractUpdateScopeChoices(terms, rows, [], ['Achievement']);

        expect(terms.read.credentials.categories.Achievement).toEqual(existing);
    });

    it('removes a required scope when the update removes it', () => {
        const terms = createTerms();
        terms.read.credentials.categories.Achievement = {
            shareAll: true,
            sharing: true,
            shared: [],
        };
        const rows: ConsentFlowContractUpdatePreview['rows'] = [
            {
                scope: { area: 'read', type: 'credential', key: 'Achievement', required: true },
                change: 'removed',
                label: 'Achievement',
                subtitle: 'No longer requested.',
            },
        ];

        applyContractUpdateScopeChoices(terms, rows, [], []);

        expect(terms.read.credentials.categories).not.toHaveProperty('Achievement');
    });

    it('recognizes an already-enabled optional scope when reopening the review', () => {
        const terms = createTerms();
        terms.write.credentials.categories.Certificate = true;

        expect(
            isContractUpdateScopeEnabled(terms, {
                area: 'write',
                type: 'credential',
                key: 'Certificate',
                required: false,
            })
        ).toBe(true);
    });

    it('keeps new optional read access off when replacing a prior read-all grant', () => {
        const terms = createTerms();
        terms.read.credentials.sharing = true;
        terms.read.credentials.shareAll = true;
        const rows: ConsentFlowContractUpdatePreview['rows'] = [
            {
                scope: { area: 'read', type: 'credential', key: 'Transcript', required: true },
                change: 'added',
                label: 'Transcripts',
                subtitle: '',
            },
            {
                scope: { area: 'read', type: 'credential', key: 'Certificate', required: false },
                change: 'added',
                label: 'Certificates',
                subtitle: '',
            },
        ];
        const materialize = applyContractUpdateScopeChoices(
            terms,
            rows,
            [],
            ['Achievement', 'Transcript', 'Certificate']
        );
        expect(terms.read.credentials.shareAll).toBe(false);
        expect(terms.read.credentials.categories.Achievement?.sharing).toBe(true);
        expect(terms.read.credentials.categories.Transcript?.sharing).toBe(true);
        expect(isContractUpdateScopeEnabled(terms, rows[1].scope)).toBe(false);
        expect(materialize.sort()).toEqual(['Achievement', 'Transcript']);
    });

    it('does not seed a new optional read choice from the old root-wide grant', () => {
        const terms = createTerms();
        terms.read.credentials.sharing = true;
        terms.read.credentials.shareAll = true;
        const row: ConsentFlowContractUpdatePreview['rows'][number] = {
            scope: { area: 'read', type: 'credential', key: 'Certificate', required: false },
            change: 'added',
            label: 'Certificates',
            subtitle: '',
        };
        expect(getEnabledOptionalUpdateScopeKeys(terms, [row])).toEqual([]);
        terms.read.credentials.categories.Certificate = {
            sharing: true,
            shareAll: true,
            shared: [],
        };
        expect(getEnabledOptionalUpdateScopeKeys(terms, [row])).toEqual([
            'read|credential|Certificate',
        ]);
    });

    it('enables a selected new read category without reviving globally disabled categories', () => {
        const terms = createTerms();
        terms.read.credentials.sharing = false;
        terms.read.credentials.categories.Achievement = {
            sharing: true,
            shareAll: true,
            shared: ['credential:previous'],
        };
        const row: ConsentFlowContractUpdatePreview['rows'][number] = {
            scope: { area: 'read', type: 'credential', key: 'Transcript', required: false },
            change: 'added',
            label: 'Transcripts',
            subtitle: '',
        };
        const materialize = applyContractUpdateScopeChoices(
            terms,
            [row],
            [getContractUpdateScopeKey(row.scope)],
            ['Achievement', 'Transcript']
        );
        expect(isContractUpdateScopeEnabled(terms, row.scope)).toBe(true);
        expect(terms.read.credentials.categories.Achievement?.sharing).toBe(false);
        expect(materialize).toEqual(['Transcript']);
    });

    it('preserves an enabled personal field with an empty stored value when reopened', () => {
        const terms = createTerms();
        terms.read.personal.Email = '';
        expect(
            isContractUpdateScopeEnabled(terms, {
                area: 'read',
                type: 'personal',
                key: 'Email',
                required: false,
            })
        ).toBe(true);
    });
    it('lists only unchanged scopes the holder currently grants', () => {
        const terms = createTerms();
        terms.read.credentials.categories.Achievement = {
            shareAll: true,
            sharing: true,
            shared: [],
        };
        terms.read.personal.Name = 'Anonymous';
        terms.write.credentials.categories.Certificate = true;
        terms.write.personal.Email = true;
        const contract = {
            contract: {
                read: {
                    credentials: { categories: { Achievement: {}, WorkHistory: {} } },
                    personal: { Name: {}, Email: {} },
                },
                write: {
                    credentials: { categories: { Certificate: {} } },
                    personal: { Email: {} },
                },
            },
        } as unknown as ConsentFlowContractDetails;
        const diff: ConsentFlowContractDiff = { added: [], removed: [], changed: [] };

        expect(getUnchangedAccessScopes(contract, diff, terms)).toEqual([
            { area: 'read', type: 'credential', key: 'Achievement', required: false },
            { area: 'read', type: 'personal', key: 'Name', required: false },
            { area: 'write', type: 'credential', key: 'Certificate', required: false },
            { area: 'write', type: 'personal', key: 'Email', required: false },
        ]);
    });
    it('computes initial-consent defaults and excludes every changed scope', () => {
        const contract = {
            contract: {
                read: {
                    credentials: {
                        categories: {
                            RequiredRead: { required: true, defaultEnabled: false },
                            DefaultRead: { required: false, defaultEnabled: true },
                            OptInRead: { required: false, defaultEnabled: false },
                            ChangedRead: { required: false, defaultEnabled: true },
                        },
                    },
                    personal: {
                        RequiredPersonal: { required: true },
                        OptOutPersonal: { required: false, defaultEnabled: false },
                    },
                },
                write: {
                    credentials: {
                        categories: {
                            RequiredWrite: { required: true },
                            DefaultWrite: { required: false, defaultEnabled: true },
                            OptInWrite: { required: false, defaultEnabled: false },
                        },
                    },
                    personal: {},
                },
            },
        } as unknown as ConsentFlowContractDetails;
        const diff = {
            added: [],
            removed: [],
            changed: [{ area: 'read', type: 'credential', key: 'ChangedRead' }],
        } as unknown as ConsentFlowContractDiff;

        expect(getUnchangedDefaultAccessScopes(contract, diff)).toEqual([
            { area: 'read', type: 'credential', key: 'RequiredRead', required: true },
            { area: 'read', type: 'credential', key: 'DefaultRead', required: false },
            { area: 'read', type: 'personal', key: 'RequiredPersonal', required: true },
            { area: 'write', type: 'credential', key: 'RequiredWrite', required: true },
            { area: 'write', type: 'credential', key: 'DefaultWrite', required: false },
        ]);
    });

    it('does not infer accepted grants from default-enabled contract scopes', () => {
        const contract = {
            contract: {
                read: {
                    credentials: {
                        categories: { DefaultRead: { required: false, defaultEnabled: true } },
                    },
                    personal: {},
                },
                write: {
                    credentials: {
                        categories: { DefaultWrite: { required: false, defaultEnabled: true } },
                    },
                    personal: {},
                },
            },
        } as unknown as ConsentFlowContractDetails;
        expect(
            getUnchangedAccessScopes(contract, {
                added: [],
                removed: [],
                changed: [],
            } as ConsentFlowContractDiff)
        ).toEqual([]);
    });
});
