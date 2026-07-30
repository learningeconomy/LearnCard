import type { AppStoreListing, InstalledApp, VC } from '@learncard/types';
import type { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';

import type { QuickActionIcon, ResolvedAction, SlotName } from './quickActions/types';
import type {
    DashboardActivityRecord,
    DashboardEmptyTip,
    DashboardSlots,
    DashboardViewModel,
} from './DashboardView.types';

import PassportIcon from 'learn-card-base/svgs/PassportIcon';
import AiInsightsTwoTonedIcon from 'learn-card-base/svgs/SideNav/AiInsightsTwoTonedIcon';
import CompassTwoTonedIcon from 'learn-card-base/svgs/SideNav/CompassTwoTonedIcon';
import ScanIcon from 'learn-card-base/svgs/ScanIcon';
import LinkOutlinedIcon from 'learn-card-base/svgs/LinkOutlinedIcon';
import AddCredentialIcon from 'learn-card-base/svgs/AddCredentialIcon';

const noop = () => undefined;

const PORTRAIT = {
    jordan: 'https://i.pravatar.cc/160?img=12',
    maya: 'https://i.pravatar.cc/160?img=45',
    sam: 'https://i.pravatar.cc/160?img=33',
    acme: 'https://api.dicebear.com/7.x/initials/svg?seed=Acme%20Corp&backgroundColor=18224E',
} as const;

const ISSUER_LOGO = {
    university:
        'https://api.dicebear.com/7.x/initials/svg?seed=State%20University&backgroundColor=0B6E4F',
    pmi: 'https://api.dicebear.com/7.x/initials/svg?seed=PMI&backgroundColor=1F6FEB',
    redCross: 'https://api.dicebear.com/7.x/initials/svg?seed=Red%20Cross&backgroundColor=C81E1E',
} as const;

const ACHIEVEMENT_IMG = {
    degree: 'https://cdn.filestackcontent.com/Y9DCbjt6Q0CccrCDX46I',
    certificate: 'https://cdn.filestackcontent.com/OSTqZlxSCe6B62jwPm7O',
    award: 'https://cdn.filestackcontent.com/F9yva92WQ0CPisIeQRmr',
} as const;

const makeCredentialVC = (opts: {
    uri: string;
    title: string;
    issuerName: string;
    issuerImage: string;
    achievementImage: string;
    achievementType: string;
    issuedAt: string;
}): VC =>
    ({
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: opts.uri,
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: {
            id: 'did:web:network.learncard.com:users:demo-issuer',
            name: opts.issuerName,
            image: opts.issuerImage,
        },
        issuanceDate: opts.issuedAt,
        name: opts.title,
        credentialSubject: {
            id: 'did:web:network.learncard.com:users:chad-rivera',
            type: ['AchievementSubject'],
            achievement: {
                id: `${opts.uri}#achievement`,
                type: ['Achievement'],
                achievementType: opts.achievementType,
                name: opts.title,
                description: `${opts.title}, issued by ${opts.issuerName}.`,
                image: opts.achievementImage,
                criteria: { narrative: `Awarded for completing ${opts.title}.` },
            },
        },
    } as unknown as VC);

const SLOT_ICON: Record<SlotName, QuickActionIcon> = {
    collect: PassportIcon,
    understand: AiInsightsTwoTonedIcon,
    navigate: CompassTwoTonedIcon,
};

const makeAction = (
    slot: SlotName,
    id: string,
    label: string,
    caption: string
): ResolvedAction => ({
    id,
    slot,
    Icon: SLOT_ICON[slot],
    label,
    caption,
    onClick: noop,
});

const emptySlots: DashboardSlots = { collect: null, understand: null, navigate: null };

const makeApp = (id: string, name: string, tagline: string): AppStoreListing =>
    ({
        listing_id: id,
        display_name: name,
        tagline,
        full_description: tagline,
        icon_url: '',
        app_listing_status: 'PUBLISHED',
        launch_type: 'EMBED',
        launch_config_json: '{}',
    } as unknown as AppStoreListing);

const makeInstalledApp = (id: string, name: string, tagline: string): InstalledApp =>
    ({ ...makeApp(id, name, tagline), installed_at: new Date().toISOString() } as InstalledApp);

const makeNotification = (id: string, type: string, title: string): NotificationType =>
    ({
        _id: id,
        type,
        read: false,
        archived: false,
        message: { title },
        sent: new Date().toISOString(),
    } as unknown as NotificationType);

const daysAgo = (n: number): string => new Date(Date.now() - n * 86_400_000).toISOString();

const credentialSeeds = [
    {
        id: 'rec-1',
        uri: 'lc:cloud:rec-1',
        title: 'Bachelor of Science, Computer Science',
        from: 'State University',
        issuerImage: ISSUER_LOGO.university,
        achievementImage: ACHIEVEMENT_IMG.degree,
        achievementType: 'Degree',
        date: daysAgo(2),
        category: 'achievement',
    },
    {
        id: 'rec-2',
        uri: 'lc:cloud:rec-2',
        title: 'Project Management Professional (PMP)',
        from: 'Project Management Institute',
        issuerImage: ISSUER_LOGO.pmi,
        achievementImage: ACHIEVEMENT_IMG.certificate,
        achievementType: 'ext:ProfessionalCertification',
        date: daysAgo(9),
        category: 'achievement',
    },
    {
        id: 'rec-3',
        uri: 'lc:cloud:rec-3',
        title: 'Volunteer of the Year 2025',
        from: 'American Red Cross',
        issuerImage: ISSUER_LOGO.redCross,
        achievementImage: ACHIEVEMENT_IMG.award,
        achievementType: 'CommunityService',
        date: daysAgo(21),
        category: 'achievement',
    },
] as const;

const credentialRecords: DashboardActivityRecord[] = credentialSeeds.map(s => ({
    id: s.id,
    uri: s.uri,
    title: s.title,
    from: s.from,
    date: s.date,
    category: s.category,
}));

export const personaCredentials: Record<string, VC> = Object.fromEntries(
    credentialSeeds.map(s => [
        s.uri,
        makeCredentialVC({
            uri: s.uri,
            title: s.title,
            issuerName: s.from,
            issuerImage: s.issuerImage,
            achievementImage: s.achievementImage,
            achievementType: s.achievementType,
            issuedAt: s.date,
        }),
    ])
);

const meanwhileTips: DashboardEmptyTip[] = [
    {
        key: 'scan-qr',
        title: 'Scan a QR code',
        subtitle: 'Claim a credential from a poster or screen',
        Icon: ScanIcon,
        onClick: noop,
    },
    {
        key: 'claim-link',
        title: 'Use a claim link',
        subtitle: 'Paste or upload a credential link',
        Icon: LinkOutlinedIcon,
        onClick: noop,
    },
    {
        key: 'issue-credential',
        title: 'Issue a credential',
        subtitle: 'Send a credential to someone',
        Icon: AddCredentialIcon,
        onClick: noop,
    },
];

const suggestedApps: AppStoreListing[] = [
    makeApp('app-1', 'Learn about LearnCard', 'See how LearnCard works for you'),
    makeApp('app-2', 'Venture Academy', 'An entrepreneurial challenge for students'),
    makeApp('app-3', 'Khan Academy', 'Free world-class lessons and practice'),
];

const baseHeader = {
    displayName: 'Chad Rivera',
    profileImage: 'https://i.pravatar.cc/160?img=68',
    profileRole: undefined,
    shortBio: undefined,
    onAvatarClick: noop,
    onScanQrTopRight: noop,
};

const baseHandlers = {
    onDismissGetStarted: noop,
    onContinueGoal: noop,
    onReviewGoal: noop,
    onInstallSuccess: noop,
};

const checklist = (done: { credential: boolean; goal: boolean; skills: boolean }) => [
    {
        key: 'add-credential',
        label: 'Add your first credential',
        done: done.credential,
        onClick: noop,
    },
    { key: 'set-goal', label: 'Set a goal', done: done.goal, onClick: noop },
    {
        key: 'skill-profile',
        label: 'Fill out your skills profile',
        done: done.skills,
        onClick: noop,
    },
];

export const brandNewUser: DashboardViewModel = {
    brandName: 'LearnCard',
    header: {
        ...baseHeader,
    },
    heroSlot: 'getStarted',
    checklistItems: checklist({ credential: false, goal: false, skills: false }),
    onDismissGetStarted: baseHandlers.onDismissGetStarted,
    goalSummary: null,
    pathwaysEnabled: true,
    reviewsDueToday: 0,
    onContinueGoal: baseHandlers.onContinueGoal,
    onReviewGoal: baseHandlers.onReviewGoal,
    primaryButtonClass: 'bg-indigo-500 text-white',
    slots: {
        collect: makeAction(
            'collect',
            'connect-new',
            'Build Your LearnCard',
            'Add your first credential'
        ),
        understand: makeAction(
            'understand',
            'understand-new',
            'Create Skill Profile',
            'Tell us about your skills'
        ),
        navigate: makeAction('navigate', 'navigate-new', 'Set a Goal', 'Get a personal path'),
    },
    dataTrust: {
        places: 0,
        canRead: 0,
        canWrite: 0,
        proof: [],
        onManage: noop,
    },
    activity: {
        notifications: [],
        pendingContractRequests: [],
        pendingConnections: [],
        records: [],
        isLoading: false,
        emptyTips: meanwhileTips,
    },
    learningProfile: {
        state: 'empty',
        verifiedRecords: 0,
        skills: [],
        onViewInsights: noop,
    },
    apps: {
        installedApps: [],
        suggestedApps,
        unreadByListing: new Map(),
        onInstallSuccess: baseHandlers.onInstallSuccess,
    },
};

export const activeLearner: DashboardViewModel = {
    brandName: 'LearnCard',
    header: {
        ...baseHeader,
        professionalTitle: 'Professional QA Engineer',
    },
    heroSlot: 'goal',
    checklistItems: checklist({ credential: true, goal: true, skills: false }),
    onDismissGetStarted: baseHandlers.onDismissGetStarted,
    goalSummary: {
        title: 'Senior Year: AI / Finance College Track',
        goal: 'Get into a top program with a strong AI + finance foundation.',
        total: 7,
        completed: 2,
        nextNode: {
            id: 'node-3',
            title: 'Complete calculus module',
            description: 'Finish the differential calculus unit and pass the quiz.',
        } as never,
        pathwayId: 'pw-1',
    },
    pathwaysEnabled: true,
    reviewsDueToday: 3,
    onContinueGoal: baseHandlers.onContinueGoal,
    onReviewGoal: baseHandlers.onReviewGoal,
    primaryButtonClass: 'bg-indigo-500 text-white',
    slots: {
        collect: makeAction('collect', 'connect-active', 'See Passport', '12 credentials'),
        understand: makeAction(
            'understand',
            'understand-active',
            'See Insights',
            'AI summary of your record'
        ),
        navigate: makeAction('navigate', 'navigate-active', 'See Pathways', 'Open your pathways'),
    },
    dataTrust: {
        places: 7,
        canRead: 4,
        canWrite: 2,
        proof: [
            { uri: 'ct-1', name: 'State University', image: PORTRAIT.acme },
            { uri: 'ct-2', name: 'Khan Academy' },
            { uri: 'ct-3', name: 'Acme Corp', image: PORTRAIT.maya },
            { uri: 'ct-4', name: 'SXSW EDU', image: PORTRAIT.jordan },
            { uri: 'ct-5', name: 'City Library' },
            { uri: 'ct-6', name: 'Coursera' },
            { uri: 'ct-7', name: 'Local Co-op' },
        ],
        onManage: noop,
    },
    activity: {
        notifications: [
            makeNotification('n1', 'BOOST_RECEIVED', 'State University sent you a credential'),
        ],
        pendingContractRequests: [],
        pendingConnections: [
            { profileId: 'jordan-lee', displayName: 'Jordan Lee', image: PORTRAIT.jordan },
        ],
        records: credentialRecords,
        isLoading: false,
        emptyTips: meanwhileTips,
    },
    learningProfile: {
        state: 'rich',
        strength: {
            title: 'Quality Assurance & Testing',
            summary:
                'Your credentials and skills show deep, consistent strength in test design and QA process.',
        },
        verifiedRecords: 12,
        updatedAt: new Date().toISOString(),
        skills: [
            {
                name: 'attention-to-detail',
                title: 'Attention to Detail',
                category: 'durable',
                strengthTier: 'strongest',
            },
            {
                name: 'critical-thinking',
                title: 'Critical Thinking',
                category: 'stem',
                strengthTier: 'strong',
            },
            {
                name: 'communication',
                title: 'Communication',
                category: 'social',
                strengthTier: 'growing',
            },
        ],
        onViewInsights: noop,
    },
    apps: {
        installedApps: [
            makeInstalledApp('app-3', 'Khan Academy', 'Free world-class lessons and practice'),
            makeInstalledApp('app-2', 'SXSW EDU', 'Earn credentials and issue badges at SXSW'),
        ],
        suggestedApps,
        unreadByListing: new Map([['app-3', 2]]),
        onInstallSuccess: baseHandlers.onInstallSuccess,
    },
};

export const returningNoActivity: DashboardViewModel = {
    ...activeLearner,
    goalSummary: null,
    learningProfile: {
        state: 'empty',
        verifiedRecords: 0,
        skills: [],
        onViewInsights: noop,
    },
    heroSlot: 'goal',
    checklistItems: checklist({ credential: true, goal: false, skills: true }),
    slots: {
        collect: makeAction('collect', 'connect-active', 'See Passport', '12 credentials'),
        understand: makeAction(
            'understand',
            'understand-active',
            'See Insights',
            'AI summary of your record'
        ),
        navigate: makeAction('navigate', 'navigate-new', 'Set a Goal', 'Get a personal path'),
    },
    activity: {
        notifications: [],
        pendingContractRequests: [],
        pendingConnections: [],
        records: [],
        isLoading: false,
        emptyTips: meanwhileTips,
    },
};

export const pendingOnly: DashboardViewModel = {
    ...activeLearner,
    activity: {
        notifications: [
            makeNotification('n2', 'PRESENTATION_REQUEST', 'Acme Corp requested your transcript'),
        ],
        pendingContractRequests: [
            {
                profile: { profileId: 'acme', displayName: 'Acme Corp', image: PORTRAIT.acme },
                contract: { name: 'Employment verification' },
            },
        ],
        pendingConnections: [
            { profileId: 'maya-chen', displayName: 'Maya Chen', image: PORTRAIT.maya },
        ],
        records: [],
        isLoading: false,
        emptyTips: meanwhileTips,
    },
};

export const loadingState: DashboardViewModel = {
    ...activeLearner,
    activity: {
        ...activeLearner.activity,
        records: [],
        notifications: [],
        pendingConnections: [],
        isLoading: true,
    },
};

export const journeysDisabled: DashboardViewModel = {
    ...activeLearner,
    pathwaysEnabled: false,
    goalSummary: null,
    heroSlot: 'goal',
    checklistItems: [
        {
            key: 'add-credential',
            label: 'Add your first credential',
            done: true,
            onClick: noop,
        },
        { key: 'discover-apps', label: 'Discover apps', done: false, onClick: noop },
        {
            key: 'skill-profile',
            label: 'Fill out your skills profile',
            done: false,
            onClick: noop,
        },
    ],
    slots: {
        collect: makeAction('collect', 'connect-active', 'See Passport', '12 credentials'),
        understand: makeAction(
            'understand',
            'understand-active',
            'See Insights',
            'AI summary of your record'
        ),
        navigate: makeAction('navigate', 'navigate-new', 'Set a Goal', 'Get a personal path'),
    },
};

export const DASHBOARD_PERSONAS: Record<string, DashboardViewModel> = {
    'Brand-new user': brandNewUser,
    'Active learner': activeLearner,
    'Returning · empty feed': returningNoActivity,
    'Pending actions only': pendingOnly,
    'Loading': loadingState,
    'Journeys disabled': journeysDisabled,
};

export { emptySlots };
