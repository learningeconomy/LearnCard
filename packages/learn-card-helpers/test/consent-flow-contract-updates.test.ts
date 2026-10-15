import { ConsentFlowContractChangesValidator } from '@learncard/types';
import { describe, expect, it } from 'vitest';
import { buildContractUpdatePreview, classifyContractChange, diffContractChange } from '../src';
import type {
    ConsentFlowContract,
    ConsentFlowContractChangeKind,
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
});

describe('diffContractChange', () => {
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

describe('buildContractUpdatePreview headline grammar', () => {
    const read = {
        area: 'read' as const,
        type: 'credential' as const,
        key: 'Transcripts',
        required: true,
    };
    const write = {
        area: 'write' as const,
        type: 'credential' as const,
        key: 'Certificates',
        required: true,
    };
    const diff = (added: ConsentFlowContractScope[] = []): ConsentFlowContractDiff => ({
        added,
        removed: [],
        changed: [],
    });
    const previewCases: Array<
        [string, ConsentFlowContractChangeKind, ConsentFlowContractDiff, string, string, string]
    > = [
        [
            'single read',
            'requires_consent',
            diff([read]),
            'Acme is asking to see your Transcripts',
            '',
            'Allow',
        ],
        [
            'single write',
            'requires_consent',
            diff([write]),
            'Acme is asking to add Certificates to your account',
            '',
            'Allow',
        ],
        [
            'multiple required',
            'requires_consent',
            diff([read, write]),
            'Acme is asking for more access',
            '2 new items',
            'Allow access',
        ],
        [
            'non-data update',
            'requires_consent',
            diff(),
            'Acme changed its request',
            "Review what's different.",
            'Allow',
        ],
        [
            'optional',
            'expanded_optional',
            diff([{ ...read, required: false }]),
            'Acme has a new option',
            'Turn it on if you want. Nothing changes unless you do.',
            'Continue',
        ],
        [
            'relaxed',
            'relaxed',
            { added: [], removed: [read], changed: [] },
            'Acme now sees less',
            'Stopped asking for Transcripts.',
            'Done',
        ],
        [
            'name update with one removed scope uses non-data grammar',
            'requires_consent',
            { added: [], removed: [read], changed: [] },
            'Acme changed its request',
            "Review what's different.",
            'Allow',
        ],
        [
            'suspended',
            'requires_consent',
            diff([read]),
            "Acme's access is paused",
            'Approve the update to reconnect.',
            'Reconnect',
        ],
    ];
    it.each(previewCases)('%s', (_label, kind, changes, headline, subhead, primaryLabel) => {
        const preview = buildContractUpdatePreview({
            name: 'Acme',
            kind,
            diff: changes,
            status: _label === 'suspended' ? 'suspended' : undefined,
        });
        expect(preview).toMatchObject({ headline, subhead, primaryLabel });
        expect(preview.rows).toHaveLength(
            changes.added.length + changes.removed.length + changes.changed.length
        );
    });
});

describe('canonical contract preview scope copy', () => {
    const previewScope = (scope: ConsentFlowContractScope) =>
        buildContractUpdatePreview({
            name: 'Acme',
            kind: 'expanded_optional',
            diff: { added: [scope], removed: [], changed: [] },
        }).rows[0];

    it('uses canonical category labels and concise descriptions', () => {
        expect(
            previewScope({
                area: 'read',
                type: 'credential',
                key: 'Transcript',
                required: false,
            })
        ).toMatchObject({
            label: 'Transcripts',
            subtitle: 'Records of completed courses and learning.',
        });
        expect(
            previewScope({
                area: 'write',
                type: 'credential',
                key: 'Certificate',
                required: false,
            })
        ).toMatchObject({
            label: 'Certificates',
            subtitle: 'Credentials recognizing qualifications or completed learning.',
        });
        expect(
            previewScope({
                area: 'read',
                type: 'credential',
                key: 'Achievement',
                required: false,
            })
        ).toMatchObject({
            label: 'Achievements',
            subtitle: 'Milestones earned through effort, skill, or perseverance.',
        });
        expect(
            previewScope({
                area: 'read',
                type: 'credential',
                key: 'Skill',
                required: false,
            })
        ).toMatchObject({
            label: 'Skills',
            subtitle: 'Abilities developed through training, practice, or experience.',
        });
        expect(
            previewScope({
                area: 'read',
                type: 'credential',
                key: 'Work History',
                required: false,
            })
        ).toMatchObject({
            label: 'Work History',
            subtitle: 'Professional roles and activities over time.',
        });
    });

    it('uses per-item reasons first, canonical personal copy otherwise, and no invented unknown copy', () => {
        expect(
            previewScope({
                area: 'write',
                type: 'credential',
                key: 'Skill',
                required: false,
                reason: 'Your chosen reason.',
            })
        ).toMatchObject({ label: 'Skills', subtitle: 'Your chosen reason.' });
        expect(
            previewScope({
                area: 'read',
                type: 'personal',
                key: 'Email',
                required: false,
            })
        ).toMatchObject({ label: 'Email', subtitle: 'Your email address.' });
        expect(
            previewScope({
                area: 'read',
                type: 'personal',
                key: 'Image',
                required: false,
            })
        ).toMatchObject({ label: 'Profile photo', subtitle: 'Your profile photo.' });
        expect(
            previewScope({
                area: 'read',
                type: 'credential',
                key: 'Custom Scope',
                required: false,
            })
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
