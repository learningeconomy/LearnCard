import { ConsentFlowContractChangesValidator } from '@learncard/types';
import { describe, expect, it } from 'vitest';
import {
    buildContractUpdatePreview,
    classifyContractChange,
    diffContractChange,
    hasOpenNewOptionsWindow,
} from '../src';
import type {
    ConsentFlowContract,
    ConsentFlowContractDiff,
    ConsentFlowContractScope,
} from '@learncard/types';

type Snapshot = Parameters<typeof classifyContractChange>[0];
const empty: ConsentFlowContract = {
    read: { credentials: { categories: {} }, personal: {} },
    write: { credentials: { categories: {} }, personal: {} },
};
const snapshot = (overrides: Partial<Snapshot> = {}): Snapshot => ({
    name: 'Acme',
    contract: empty,
    ...overrides,
});
const withRead = (key: string, required: boolean) =>
    ({
        read: { credentials: { categories: { [key]: { required } } }, personal: {} },
        write: { credentials: { categories: {} }, personal: {} },
    }) as ConsentFlowContract;
const cases: Array<[string, Snapshot, Snapshot, string]> = [
    ['unchanged', snapshot(), snapshot(), 'relaxed'],
    [
        'optional category addition',
        snapshot(),
        snapshot({ contract: withRead('transcripts', false) }),
        'expanded_optional',
    ],
    [
        'optional with default on remains optional',
        snapshot(),
        snapshot({
            contract: {
                ...withRead('x', false),
                read: {
                    credentials: { categories: { x: { required: false, defaultEnabled: true } } },
                    personal: {},
                },
            },
        }),
        'expanded_optional',
    ],
    [
        'required category addition',
        snapshot(),
        snapshot({ contract: withRead('x', true) }),
        'requires_consent',
    ],
    [
        'optional to required',
        snapshot({ contract: withRead('x', false) }),
        snapshot({ contract: withRead('x', true) }),
        'requires_consent',
    ],
    [
        'required to optional',
        snapshot({ contract: withRead('x', true) }),
        snapshot({ contract: withRead('x', false) }),
        'relaxed',
    ],
    ['scope removed', snapshot({ contract: withRead('x', true) }), snapshot(), 'relaxed'],
    [
        'redirect changed without new access',
        snapshot({ redirectUrl: 'https://example.com/before' }),
        snapshot({ redirectUrl: 'https://example.com/after' }),
        'relaxed',
    ],
    ['name changed', snapshot(), snapshot({ name: 'Acme 2' }), 'requires_consent'],
    [
        'reason changed',
        snapshot({ reasonForAccessing: 'old' }),
        snapshot({ reasonForAccessing: 'new' }),
        'requires_consent',
    ],
    ['guardian required', snapshot(), snapshot({ needsGuardianConsent: true }), 'requires_consent'],
    [
        'guardian relaxed',
        snapshot({ needsGuardianConsent: true }),
        snapshot({ needsGuardianConsent: false }),
        'relaxed',
    ],
    [
        'shorter expiry',
        snapshot({ expiresAt: '2030-01-01' }),
        snapshot({ expiresAt: '2029-01-01' }),
        'requires_consent',
    ],
    [
        'longer expiry',
        snapshot({ expiresAt: '2029-01-01' }),
        snapshot({ expiresAt: '2030-01-01' }),
        'relaxed',
    ],
    ['expiry added', snapshot(), snapshot({ expiresAt: '2030-01-01' }), 'requires_consent'],
    ['expiry cleared', snapshot({ expiresAt: '2030-01-01' }), snapshot(), 'relaxed'],
    [
        'autoboost added by URI',
        snapshot(),
        snapshot({ autoboosts: [{ uri: 'boost:1' }] }),
        'requires_consent',
    ],
    ['autoboost removed', snapshot({ autoboosts: [{ uri: 'boost:1' }] }), snapshot(), 'relaxed'],
    ['writer added', snapshot(), snapshot({ writers: ['did:key:z'] }), 'requires_consent'],
    [
        'presentation only',
        snapshot(),
        snapshot({ subtitle: 'new', description: 'new', image: 'img' }),
        'relaxed',
    ],
    [
        'optional plus required strongest wins',
        snapshot(),
        snapshot({
            contract: {
                ...withRead('optional', false),
                write: { credentials: { categories: { must: { required: true } } }, personal: {} },
            },
        }),
        'requires_consent',
    ],
    [
        'write addition optional stays quiet',
        snapshot(),
        snapshot({
            contract: {
                ...empty,
                write: {
                    credentials: { categories: { certificates: { required: false } } },
                    personal: {},
                },
            },
        }),
        'expanded_optional',
    ],
];

describe('classifyContractChange', () => {
    it.each(cases)('%s', (_name, prev, next, expected) => {
        expect(classifyContractChange(prev, next)).toBe(expected);
    });
    it.each([
        ['read', 'credential', true],
        ['read', 'credential', false],
        ['read', 'personal', true],
        ['read', 'personal', false],
        ['write', 'credential', true],
        ['write', 'credential', false],
        ['write', 'personal', true],
        ['write', 'personal', false],
    ] as const)(
        'requires approval for %s %s reason changes (required=%s)',
        (area, type, required) => {
            for (const [oldReason, newReason] of [
                [undefined, 'Verify enrollment'],
                ['Verify enrollment', 'Personalize recommendations'],
                ['Verify enrollment', undefined],
            ]) {
                const previous = structuredClone(empty);
                const current = structuredClone(empty);
                const oldConfig = { required, reason: oldReason };
                const newConfig = { required, reason: newReason };
                if (type === 'credential') {
                    previous[area].credentials.categories.Transcript = oldConfig;
                    current[area].credentials.categories.Transcript = newConfig;
                } else {
                    previous[area].personal.name = oldConfig;
                    current[area].personal.name = newConfig;
                }
                expect(
                    classifyContractChange(
                        snapshot({ contract: previous }),
                        snapshot({ contract: current })
                    )
                ).toBe('requires_consent');
            }
        }
    );
});

describe('diffContractChange', () => {
    it('keeps material non-scope changes alongside scope changes', () => {
        const diff = diffContractChange(
            snapshot({
                name: 'Original request',
                reasonForAccessing: 'Track progress',
                writers: ['alice'],
                autoboosts: [{ id: 'first-credential' }],
            }),
            snapshot({
                name: 'Updated request',
                reasonForAccessing: 'Recognize achievements',
                writers: ['bob', 'alice'],
                autoboosts: [{ id: 'second-credential' }],
                contract: withRead('Transcript', true),
            })
        );
        expect(diff.added).toEqual([
            { area: 'read', type: 'credential', key: 'Transcript', required: true },
        ]);
        expect(diff.details).toEqual(
            expect.arrayContaining([
                { field: 'name', before: 'Original request', after: 'Updated request' },
                {
                    field: 'reasonForAccessing',
                    before: 'Track progress',
                    after: 'Recognize achievements',
                },
                { field: 'writers', before: ['alice'], after: ['alice', 'bob'] },
                { field: 'autoboosts', before: ['first-credential'], after: ['second-credential'] },
            ])
        );
    });

    it('does not describe ordering, duplicate identities, or absent guardian defaults as changes', () => {
        const diff = diffContractChange(
            snapshot({ writers: ['alice', 'bob'], autoboosts: ['boost:a', 'boost:b'] }),
            snapshot({
                needsGuardianConsent: false,
                writers: ['bob', 'alice', 'alice'],
                autoboosts: [{ id: 'boost:b' }, { uri: 'boost:a' }],
            })
        );
        expect(diff).toEqual({ added: [], removed: [], changed: [] });
    });

    it('returns stable scope changes across read and write kinds', () => {
        const prev = snapshot({
            contract: {
                ...withRead('old', true),
                write: {
                    credentials: { categories: { retain: { required: false } } },
                    personal: {},
                },
            },
        });
        const next = snapshot({
            contract: {
                ...withRead('new', false),
                write: {
                    credentials: { categories: { retain: { required: true } } },
                    personal: {},
                },
            },
        });
        expect(diffContractChange(prev, next)).toEqual({
            added: [{ area: 'read', type: 'credential', key: 'new', required: false }],
            removed: [{ area: 'read', type: 'credential', key: 'old', required: true }],
            changed: [{ area: 'write', type: 'credential', key: 'retain', required: true }],
        });
    });
});

describe('existing-scope update previews', () => {
    const summarize = ({
        headline,
        subhead,
        primaryLabel,
    }: ReturnType<typeof buildContractUpdatePreview>) => ({
        headline,
        subhead,
        primaryLabel,
    });
    const preview = (diff: ConsentFlowContractDiff) =>
        buildContractUpdatePreview({ name: 'Acme', kind: 'requires_consent', diff });
    const generalReview = () =>
        preview({
            added: [],
            removed: [],
            changed: [],
            details: [
                {
                    field: 'reasonForAccessing',
                    before: 'Verify enrollment',
                    after: 'Track progress',
                },
            ],
        });

    it.each([1, 2])(
        'treats %i existing reason changes as a general review, not new access',
        count => {
            const previous = structuredClone(empty);
            const current = structuredClone(empty);
            for (let index = 0; index < count; index++) {
                const key = `Existing${index}`;
                previous.read.credentials.categories[key] = {
                    required: index === 0,
                    reason: 'Verify enrollment',
                };
                current.read.credentials.categories[key] = {
                    required: index === 0,
                    reason: 'Personalize learning',
                };
            }
            const before = snapshot({ contract: previous });
            const after = snapshot({ contract: current });
            expect(classifyContractChange(before, after)).toBe('requires_consent');
            const result = preview(diffContractChange(before, after));
            expect(summarize(result)).toEqual(summarize(generalReview()));
            expect(result.rows.map(row => row.change)).toEqual(Array(count).fill('changed'));
        }
    );

    it('uses a general review for mixed new scopes and existing reason changes', () => {
        const previous = withRead('Transcript', true);
        previous.read.credentials.categories.Transcript.reason = 'Verify enrollment';
        const current = structuredClone(previous);
        current.read.credentials.categories.Transcript.reason = 'Personalize learning';
        current.write.credentials.categories.Achievement = { required: true };
        const result = preview(
            diffContractChange(snapshot({ contract: previous }), snapshot({ contract: current }))
        );
        expect(summarize(result)).toEqual(summarize(generalReview()));
        expect(result.rows.map(row => row.change)).toEqual(['added', 'changed']);
    });

    it('does not describe an existing item becoming required as a newly added item', () => {
        const result = preview(
            diffContractChange(
                snapshot({ contract: withRead('Transcript', false) }),
                snapshot({ contract: withRead('Transcript', true) })
            )
        );
        expect(summarize(result)).toEqual(summarize(generalReview()));
        expect(result.rows[0]?.change).toBe('changed');
    });

    it.each(['read', 'write'] as const)(
        'retains new-access review for a genuinely added %s scope',
        area => {
            const contract = structuredClone(empty);
            contract[area].credentials.categories.Transcript = { required: true };
            const result = preview(diffContractChange(snapshot(), snapshot({ contract })));
            expect(result.headline).not.toBe(generalReview().headline);
            expect(result.rows[0]?.change).toBe('added');
        }
    );
});

describe('canonical contract preview scope copy', () => {
    const previewScope = (scope: ConsentFlowContractScope) =>
        buildContractUpdatePreview({
            name: 'Acme',
            kind: 'expanded_optional',
            diff: { added: [scope], removed: [], changed: [] },
        }).rows[0];
    it('uses explicit reasons first and does not invent descriptions for custom scopes', () => {
        expect(
            previewScope({
                area: 'write',
                type: 'credential',
                key: 'Skill',
                required: false,
                reason: 'Your chosen reason.',
            })
        ).toMatchObject({ subtitle: 'Your chosen reason.' });
        expect(
            previewScope({ area: 'read', type: 'credential', key: 'Custom Scope', required: false })
        ).toMatchObject({ label: 'Custom Scope', subtitle: '' });
    });
});

describe('ConsentFlowContractChangesValidator', () => {
    it('preserves omitted read/write areas and nested maps in a read-only patch', () => {
        const patch = {
            contract: {
                read: {
                    credentials: {
                        categories: { Transcript: { required: true } },
                    },
                },
            },
        };
        expect(ConsentFlowContractChangesValidator.parse(patch)).toEqual(patch);
    });
});

describe('optional proposal window', () => {
    const now = Date.parse('2026-11-01T12:00:00.000Z');
    it.each([
        ['future', '2026-11-01T12:00:00.001Z', true],
        ['deadline', '2026-11-01T12:00:00.000Z', false],
        ['expired', '2026-11-01T11:59:59.999Z', false],
        ['invalid', 'not-a-date', false],
        ['acknowledged', undefined, false],
    ] as const)('handles the %s state', (_state, deadline, expected) => {
        expect(hasOpenNewOptionsWindow(deadline, now)).toBe(expected);
    });
});
