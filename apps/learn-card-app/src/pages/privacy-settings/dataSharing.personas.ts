import {
    AllowConnectionRequestsEnum,
    ProfileVisibilityEnum,
    type ShareLink,
    type VP,
} from '@learncard/types';

import type { ConsentedContract } from '../../components/data-sharing/consentSummary';
import type {
    DataSharingCenterViewModel,
    DataSharingDiagnosticsViewModel,
    DataSharingProfileViewModel,
    DataSharingSharedLinksViewModel,
} from './DataSharingCenter.types';

const noop = () => undefined;
const noopToggle = async () => true;

const logo = (seed: string, bg: string) =>
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        seed
    )}&backgroundColor=${bg}`;

const makeContract = (opts: {
    uri: string;
    name: string;
    image?: string;
    read?: string[];
    write?: string[];
}): ConsentedContract => {
    const readCategories = Object.fromEntries((opts.read ?? []).map(c => [c, { sharing: true }]));
    const writeCategories = Object.fromEntries((opts.write ?? []).map(c => [c, true]));

    return {
        uri: opts.uri,
        status: 'live',
        terms: {
            read: { credentials: { categories: readCategories }, personal: {} },
            write: { credentials: { categories: writeCategories }, personal: {} },
        },
        contract: {
            uri: opts.uri,
            name: opts.name,
            image: opts.image,
        },
    } as unknown as ConsentedContract;
};

const FEW_CONTRACTS: ConsentedContract[] = [
    makeContract({
        uri: 'contract:learncard-ai',
        name: 'LearnCard AI',
        image: logo('LearnCard AI', '4F46E5'),
        read: ['Achievement', 'ID', 'Course', 'Skill'],
        write: ['Achievement', 'Skill'],
    }),
    makeContract({
        uri: 'contract:state-university',
        name: 'State University',
        image: logo('State University', '0B6E4F'),
        write: ['Achievement', 'Course'],
    }),
    makeContract({
        uri: 'contract:acme',
        name: 'Acme Careers',
        image: logo('Acme Careers', '18224E'),
        read: ['ID', 'Achievement'],
    }),
];

const MANY_CONTRACTS: ConsentedContract[] = [
    makeContract({
        uri: 'contract:learncard-ai',
        name: 'LearnCard AI',
        image: logo('LearnCard AI', '4F46E5'),
        read: ['Achievement', 'ID', 'Course', 'Skill'],
        write: ['Achievement', 'Skill'],
    }),
    makeContract({
        uri: 'contract:chatgpt',
        name: 'ChatGPT',
        image: logo('ChatGPT', '10A37F'),
        read: ['Achievement', 'Skill'],
        write: ['Skill'],
    }),
    makeContract({
        uri: 'contract:claude',
        name: 'Claude Assistant',
        image: logo('Claude', 'D97757'),
        read: ['Achievement'],
        write: ['Achievement'],
    }),
    makeContract({
        uri: 'contract:state-university',
        name: 'State University',
        image: logo('State University', '0B6E4F'),
        write: ['Achievement', 'Course'],
    }),
    makeContract({
        uri: 'contract:hill-valley-high-school',
        name: 'Hill Valley High School',
        image: logo('Hill Valley', 'C81E1E'),
        write: ['Achievement'],
    }),
    makeContract({
        uri: 'contract:acme',
        name: 'Acme Careers',
        image: logo('Acme Careers', '18224E'),
        read: ['ID', 'Achievement'],
    }),
    makeContract({
        uri: 'contract:taylorbot',
        name: 'TaylorBot Dashboard',
        image: logo('TaylorBot', '1F6FEB'),
        read: ['ID'],
    }),
    makeContract({
        uri: 'contract:jobmatch',
        name: 'JobMatch',
        image: logo('JobMatch', '7C3AED'),
        read: ['Achievement', 'Skill', 'ID'],
        write: ['Skill'],
    }),
    makeContract({
        uri: 'contract:portfolio',
        name: 'Portfolio Builder',
        image: logo('Portfolio', 'DB2777'),
        read: ['Achievement'],
    }),
];

const baseProfile: DataSharingProfileViewModel = {
    brandName: 'LearnCard',
    visibility: ProfileVisibilityEnum.enum.public,
    showEmail: false,
    allowConnectionRequests: AllowConnectionRequestsEnum.enum.anyone,
    savingField: null,
    onChangeVisibility: noop,
    onToggleShowEmail: noop,
    onChangeConnectionRequests: noop,
};

const baseDiagnostics: DataSharingDiagnosticsViewModel = {
    brandName: 'LearnCard',
    analyticsEnabled: true,
    bugReportsEnabled: true,
    onToggleAnalytics: noop,
    onToggleBugReports: noop,
};

const baseAi = {
    checked: true,
    disabled: false,
    showConsentWarning: false,
    onToggle: noopToggle,
    onRetryConsent: noopToggle,
};

export const makeShare = (overrides: Partial<ShareLink>): ShareLink =>
    ({
        id: 'AAAAAAAAAAAAAAAAAAAAAA',
        title: 'Career highlights',
        note: 'Selected credentials for applications',
        selectedCount: 4,
        version: 2,
        contentVersion: 1,
        status: 'active',
        contentState: 'finalized',
        createdAt: '2026-09-12T14:30:00.000Z',
        updatedAt: '2026-09-12T14:30:00.000Z',
        expiresAt: '2027-09-12T14:30:00.000Z',
        stoppedAt: null,
        viewCount: 12,
        lastViewedAt: '2026-09-21T18:15:00.000Z',
        passcodeProtected: false,
        notifyOnView: false,
        minorPolicy: {
            isMinor: false,
            policyResolved: true,
            defaultExpiryDays: 365,
            viewCountingEnabled: true,
        },
        ...overrides,
    }) as ShareLink;

export const sharedLinks: DataSharingSharedLinksViewModel = {
    records: [
        makeShare({ passcodeProtected: true }),
        makeShare({
            id: 'BBBBBBBBBBBBBBBBBBBBBB',
            title: 'Volunteer credentials',
            note: null,
            selectedCount: 2,
            version: 1,
            createdAt: '2026-09-20T09:00:00.000Z',
            updatedAt: '2026-09-20T09:00:00.000Z',
            expiresAt: null,
            viewCount: 0,
            lastViewedAt: null,
        }),
        makeShare({
            id: 'CCCCCCCCCCCCCCCCCCCCCC',
            title: 'Spring internship application',
            status: 'stopped',
            stoppedAt: '2026-09-18T12:00:00.000Z',
            expiresAt: null,
        }),
    ],
    filter: 'active',
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    error: false,
    busyId: null,
    pendingActions: {},
    showViewStats: true,
    savedCollections: {
        records: [
            {
                uri: 'lc:network:localhost%3A4000:pres:saved-collection',
                shareId: 'AAAAAAAAAAAAAAAAAAAAAA',
                title: 'Career highlights',
                note: 'Selected credentials for applications',
                sharer: {
                    profileId: 'mister-localhost',
                    displayName: 'Mister Localhost',
                },
                receivedAt: '2026-09-21T14:30:00.000Z',
                credentialCount: 3,
                presentation: {
                    '@context': ['https://www.w3.org/2018/credentials/v1'],
                    type: ['VerifiablePresentation'],
                    verifiableCredential: [{}, {}, {}],
                    proof: { type: 'Ed25519Signature2020' },
                } as unknown as VP,
            },
        ],
        isLoading: false,
        error: false,
        onOpen: async () => undefined,
        onRefresh: async () => undefined,
        onPreview: noop,
    },
    onFilterChange: noop,
    onRefresh: async () => undefined,
    onLoadMore: async () => undefined,
    onCopy: async () => true,
    onGetPrivateUrl: async () =>
        'https://learncard.app/s/AAAAAAAAAAAAAAAAAAAAAA#AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    onChangeExpiry: async () => undefined,
    onStop: async () => undefined,
    onCheckPending: async () => undefined,
    onPreview: noop,
    onUpdate: noop,
    onCreateShare: noop,
};

export const DATA_SHARING_PERSONAS: Record<string, DataSharingCenterViewModel> = {
    'Active learner': {
        isLoading: false,
        isMinor: false,
        contracts: FEW_CONTRACTS,
        onContractsUpdate: noop,
        ai: baseAi,
        profile: baseProfile,
        diagnostics: baseDiagnostics,
    },
    'Active learner · shared links': {
        isLoading: false,
        isMinor: false,
        contracts: FEW_CONTRACTS,
        onContractsUpdate: noop,
        ai: baseAi,
        profile: baseProfile,
        diagnostics: baseDiagnostics,
        shared: sharedLinks,
    },
    'Active learner · many links': {
        isLoading: false,
        isMinor: false,
        contracts: FEW_CONTRACTS,
        onContractsUpdate: noop,
        ai: baseAi,
        profile: baseProfile,
        diagnostics: baseDiagnostics,
        shared: {
            ...sharedLinks,
            hasMore: true,
            pendingActions: { [`MANY${String(2).padStart(18, '0')}`]: 'expiry' },
            records: [
                ...Array.from({ length: 8 }, (_, index) =>
                    makeShare({
                        id: `MANY${String(index).padStart(18, '0')}`,
                        title: [
                            'Internship application',
                            'Portfolio for Ms. Rivera',
                            'Scholarship packet',
                            'Volunteer hours',
                            'Coding bootcamp',
                            'Summer camp counselor',
                            'Dual enrollment',
                            'Club leadership',
                        ][index],
                        passcodeProtected: index % 2 === 0,
                        createdAt: new Date(2026, 8, 20 - index).toISOString(),
                        expiresAt:
                            index === 0
                                ? new Date(Date.now() + 2 * 86_400_000).toISOString()
                                : index === 3
                                  ? new Date(Date.now() + 20 * 86_400_000).toISOString()
                                  : null,
                        viewCount: [0, 1, 3, 12, 0, 2, 5, 0][index],
                        lastViewedAt:
                            index === 2 ? new Date(Date.now() - 3_600_000).toISOString() : null,
                    })
                ),
                ...sharedLinks.records,
            ],
        },
    },
    'Active learner · only expired links': {
        isLoading: false,
        isMinor: false,
        contracts: FEW_CONTRACTS,
        onContractsUpdate: noop,
        ai: baseAi,
        profile: baseProfile,
        diagnostics: baseDiagnostics,
        shared: {
            ...sharedLinks,
            records: [
                makeShare({ expiresAt: '2026-09-01T00:00:00.000Z' }),
                makeShare({
                    id: 'CCCCCCCCCCCCCCCCCCCCCC',
                    title: 'Spring internship application',
                    status: 'stopped',
                    stoppedAt: '2026-09-18T12:00:00.000Z',
                    expiresAt: null,
                }),
            ],
        },
    },
    'Nothing shared': {
        isLoading: false,
        isMinor: false,
        contracts: [],
        onContractsUpdate: noop,
        ai: { ...baseAi, checked: false },
        profile: baseProfile,
        diagnostics: baseDiagnostics,
    },
    'Many apps · grouped': {
        isLoading: false,
        isMinor: false,
        contracts: MANY_CONTRACTS,
        onContractsUpdate: noop,
        ai: baseAi,
        profile: { ...baseProfile, visibility: ProfileVisibilityEnum.enum.connections_only },
        diagnostics: baseDiagnostics,
    },
    'AI consent needs repair': {
        isLoading: false,
        isMinor: false,
        contracts: FEW_CONTRACTS,
        onContractsUpdate: noop,
        ai: { ...baseAi, showConsentWarning: true },
        profile: baseProfile,
        diagnostics: baseDiagnostics,
    },
    Minor: {
        isLoading: false,
        isMinor: true,
        contracts: FEW_CONTRACTS,
        onContractsUpdate: noop,
        ai: {
            checked: false,
            disabled: true,
            showConsentWarning: false,
            lockedNote: 'Turned off to keep you safe. A guardian can enable this.',
            onToggle: noopToggle,
            onRetryConsent: noopToggle,
        },
        profile: baseProfile,
        diagnostics: {
            ...baseDiagnostics,
            analyticsEnabled: false,
            bugReportsEnabled: false,
            disabled: true,
            lockedNote: 'Turned off to keep you safe. A guardian can change this.',
        },
    },
    Loading: {
        isLoading: true,
        isMinor: false,
        contracts: [],
        onContractsUpdate: noop,
        ai: baseAi,
        profile: baseProfile,
        diagnostics: baseDiagnostics,
    },
};
