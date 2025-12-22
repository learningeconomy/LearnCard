export type UseCaseId = 
    | 'issue-credentials'
    | 'embed-claim'
    | 'embed-app'
    | 'consent-flow'
    | 'verify-credentials'
    | 'server-webhooks';

export interface UseCaseConfig {
    id: UseCaseId;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    color: string;
    bgColor: string;
    steps: GuideStep[];
    comingSoon?: boolean;
}

export interface GuideStep {
    id: string;
    title: string;
    description: string;
    component: string;
}

export interface GuideState {
    currentStep: number;
    completedSteps: string[];
    config: Record<string, unknown>;
}

export const USE_CASES: Record<UseCaseId, Omit<UseCaseConfig, 'steps'>> = {
    'issue-credentials': {
        id: 'issue-credentials',
        title: 'Issue Credentials',
        subtitle: 'Give badges to users',
        description: 'Issue verifiable credentials like badges, certificates, or achievements to your users.',
        icon: 'award',
        color: 'text-violet-600',
        bgColor: 'bg-violet-100',
    },
    'embed-claim': {
        id: 'embed-claim',
        title: 'Embed Claim Button',
        subtitle: 'Issue from your site',
        description: 'Add a "Claim Credential" button to your website so users can claim badges without leaving your page.',
        icon: 'mouse-pointer-click',
        color: 'text-pink-600',
        bgColor: 'bg-pink-100',
    },
    'embed-app': {
        id: 'embed-app',
        title: 'Embed Your App',
        subtitle: 'Run inside LearnCard',
        description: 'Build an app that runs inside the LearnCard wallet with access to user identity and credentials.',
        icon: 'layout',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100',
    },
    'consent-flow': {
        id: 'consent-flow',
        title: 'Request User Data',
        subtitle: 'OAuth-style consent',
        description: 'Set up a consent flow to request access to user data and credentials with their permission.',
        icon: 'shield-check',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
    },
    'verify-credentials': {
        id: 'verify-credentials',
        title: 'Verify Credentials',
        subtitle: 'Accept VCs from users',
        description: 'Accept and verify credentials presented by users to prove their achievements or identity.',
        icon: 'check-circle',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        comingSoon: true,
    },
    'server-webhooks': {
        id: 'server-webhooks',
        title: 'Server Webhooks',
        subtitle: 'Backend events',
        description: 'Receive real-time notifications when events happen in LearnCard via webhooks.',
        icon: 'webhook',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        comingSoon: true,
    },
};
