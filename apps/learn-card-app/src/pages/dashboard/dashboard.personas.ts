import React from 'react';

import type { AppStoreListing, InstalledApp } from '@learncard/types';
import type { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';

import type { ResolvedAction, SlotName } from './quickActions/types';
import type {
    DashboardActivityRecord,
    DashboardEmptyTip,
    DashboardSlots,
    DashboardViewModel,
} from './DashboardView.types';

const noop = () => undefined;

const DotIcon: React.FC<{ className?: string }> = ({ className }) =>
    React.createElement(
        'span',
        {
            className: `inline-block rounded-full bg-grayscale-400 ${className ?? ''}`,
            style: { width: '1em', height: '1em' },
        },
        null,
    );

const makeAction = (
    slot: SlotName,
    id: string,
    label: string,
    caption: string,
): ResolvedAction => ({
    id,
    slot,
    Icon: DotIcon,
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
    }) as unknown as AppStoreListing;

const makeInstalledApp = (id: string, name: string, tagline: string): InstalledApp =>
    ({ ...makeApp(id, name, tagline), installed_at: new Date().toISOString() }) as InstalledApp;

const makeNotification = (id: string, type: string, title: string): NotificationType =>
    ({
        _id: id,
        type,
        read: false,
        archived: false,
        message: { title },
        sent: new Date().toISOString(),
    }) as unknown as NotificationType;

const credentialRecords: DashboardActivityRecord[] = [
    {
        id: 'rec-1',
        uri: 'lc:cloud:rec-1',
        title: 'Bachelor of Science',
        from: 'State University',
        date: new Date().toISOString(),
        category: 'achievement',
    },
    {
        id: 'rec-2',
        uri: 'lc:cloud:rec-2',
        title: 'Project Management Certificate',
        from: 'PMI',
        date: new Date().toISOString(),
        category: 'achievement',
    },
    {
        id: 'rec-3',
        uri: 'lc:cloud:rec-3',
        title: 'Volunteer of the Year',
        from: 'Red Cross',
        date: new Date().toISOString(),
        category: 'achievement',
    },
];

const meanwhileTips: DashboardEmptyTip[] = [
    {
        key: 'scan-qr',
        title: 'Scan a QR code',
        subtitle: 'Claim a credential from a poster or screen',
        Icon: DotIcon,
        onClick: noop,
    },
    {
        key: 'claim-link',
        title: 'Use a claim link',
        subtitle: 'Paste or upload a credential link',
        Icon: DotIcon,
        onClick: noop,
    },
    {
        key: 'issue-credential',
        title: 'Issue a credential',
        subtitle: 'Send a credential to someone',
        Icon: DotIcon,
        onClick: noop,
    },
];

const suggestedApps: AppStoreListing[] = [
    makeApp('app-1', 'Learn about LearnCard', 'Learn how LearnCard can work for you'),
    makeApp('app-2', 'Venture Academy', 'An entrepreneurial challenge for students'),
    makeApp('app-3', 'ChatGPT', 'AI tutoring by OpenAI'),
];

const baseHeader = {
    displayName: 'Chad',
    profileImage: '',
    profileRole: undefined,
    shortBio: undefined,
    onSkillPillClick: noop,
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
    { key: 'add-credential', label: 'Add your first credential', done: done.credential, onClick: noop },
    { key: 'set-goal', label: 'Set a goal', done: done.goal, onClick: noop },
    { key: 'skill-profile', label: 'Fill out your skills profile', done: done.skills, onClick: noop },
];

export const brandNewUser: DashboardViewModel = {
    header: {
        ...baseHeader,
        affiliation: null,
        stats: { credentials: 0, skills: 0, contacts: 0 },
        skills: [],
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
        collect: makeAction('collect', 'find-credential-apps', 'Find credential apps', 'Discover places that issue credentials'),
        understand: makeAction('understand', 'see-skills', 'See your skills', 'Skills you\u2019ve collected'),
        navigate: makeAction('navigate', 'browse-pathways', 'Explore journeys', 'Browse other pathways'),
    },
    activity: {
        notifications: [],
        pendingContractRequests: [],
        pendingConnections: [],
        records: [],
        isLoading: false,
        emptyTips: meanwhileTips,
    },
    apps: {
        installedApps: [],
        suggestedApps,
        unreadByListing: new Map(),
        onInstallSuccess: baseHandlers.onInstallSuccess,
    },
};

export const activeLearner: DashboardViewModel = {
    header: {
        ...baseHeader,
        professionalTitle: 'Professional QA Engineer',
        experience: { years: 10, months: 0 },
        affiliation: { role: 'Member', from: 'State University', issuedAt: new Date().toISOString() },
        stats: { credentials: 12, skills: 8, contacts: 5 },
        skills: [
            { id: 's1', label: 'Attention to detail' },
            { id: 's2', label: 'Giving and receiving feedback' },
            { id: 's3', label: 'Empathy' },
        ],
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
        collect: makeAction('collect', 'view-passport', 'View passport', '12 credentials'),
        understand: makeAction('understand', 'see-insights', 'See insights', 'AI summary of your record'),
        navigate: makeAction('navigate', 'browse-pathways', 'Explore journeys', 'Browse other pathways'),
    },
    activity: {
        notifications: [makeNotification('n1', 'CONNECTION_REQUEST', 'Jackson Smith wants to connect')],
        pendingContractRequests: [],
        pendingConnections: [{ profileId: 'jackson', displayName: 'Jackson Smith', image: '' }],
        records: credentialRecords,
        isLoading: false,
        emptyTips: meanwhileTips,
    },
    apps: {
        installedApps: [
            makeInstalledApp('app-3', 'ChatGPT', 'AI tutoring by OpenAI'),
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
    heroSlot: 'goal',
    checklistItems: checklist({ credential: true, goal: false, skills: true }),
    slots: {
        collect: makeAction('collect', 'view-passport', 'View passport', '12 credentials'),
        understand: makeAction('understand', 'see-insights', 'See insights', 'AI summary of your record'),
        navigate: makeAction('navigate', 'set-goal', 'Set a goal', 'Get a personal path'),
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
            makeNotification('n1', 'CONNECTION_REQUEST', 'Jackson Smith wants to connect'),
            makeNotification('n2', 'PRESENTATION_REQUEST', 'Acme Corp requested your transcript'),
        ],
        pendingContractRequests: [
            { profile: { profileId: 'acme', displayName: 'Acme Corp', image: '' }, contract: { name: 'Hiring data' } },
        ],
        pendingConnections: [{ profileId: 'jackson', displayName: 'Jackson Smith', image: '' }],
        records: [],
        isLoading: false,
        emptyTips: meanwhileTips,
    },
};

export const loadingState: DashboardViewModel = {
    ...activeLearner,
    activity: { ...activeLearner.activity, records: [], notifications: [], pendingConnections: [], isLoading: true },
};

export const DASHBOARD_PERSONAS: Record<string, DashboardViewModel> = {
    'Brand-new user': brandNewUser,
    'Active learner': activeLearner,
    'Returning · empty feed': returningNoActivity,
    'Pending actions only': pendingOnly,
    'Loading': loadingState,
};

export { emptySlots };
