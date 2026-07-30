export type UseCaseId =
    | 'issue-credentials'
    | 'embed-claim'
    | 'embed-app'
    | 'consent-flow'
    | 'verify-credentials'
    | 'server-webhooks'
    | 'course-catalog';

export interface UseCaseConfig {
    id: UseCaseId;
    title: string;
    titleKey: string;
    subtitle: string;
    subtitleKey: string;
    description: string;
    descriptionKey: string;
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

// ============================================================
// EMBED APP GUIDE - Persisted Configuration
// ============================================================
// This interface defines all user selections that should be
// persisted across page refreshes and navigation

export interface EmbedAppFeatureConfig {
    'issue-credentials'?: {
        mode: 'prompt-claim' | 'sync-wallet';
        credentialName?: string;
        credentialData?: Record<string, unknown>;
        contractUri?: string;
    };

    'peer-badges'?: {
        templateUris: string[];
    };

    'request-credentials'?: {
        mode: 'query' | 'specific';
        queryTitle?: string;
        queryReason?: string;
    };

    'request-data-consent'?: {
        contractUri: string;
    };

    'launch-feature'?: {
        selectedFeatureIds: string[];
        featureParams: Record<string, string>;
    };
}

export interface EmbedAppGuideConfig {
    // Step 0: Getting Started
    selectedListingId: string | null;

    // Step 1: Choose Features
    selectedFeatures: string[];

    // Step 2: Feature Setup - Per-feature configuration
    featureConfig: EmbedAppFeatureConfig;
}

// ============================================================
// LLM Integration Metadata
// ============================================================
// Structured output for LLM consumption

export interface TemplateMetadata {
    uri: string;
    name: string;
    description?: string;
    type?: string;
}

export interface ContractMetadata {
    uri: string;
    type: 'data-consent' | 'issue-credentials';
    name?: string;
}

export interface LLMIntegrationMetadata {
    app: {
        name: string;
        listingId: string;
        integrationId: string;
    };

    features: string[];

    templates: {
        peerBadges: TemplateMetadata[];
        issueCredentials: TemplateMetadata[];
    };

    contracts: {
        dataConsent: string | null;
        issueCredentials: string | null;
    };

    permissions: string[];

    generatedAt: string;
}

export const USE_CASES: Record<UseCaseId, Omit<UseCaseConfig, 'steps'>> = {
    'issue-credentials': {
        id: 'issue-credentials',
        title: 'Issue Credentials',
        titleKey: 'developerPortal.guides.useCases.issueCredentials.title',
        subtitle: 'Give badges to users',
        subtitleKey: 'developerPortal.guides.useCases.issueCredentials.subtitle',
        description:
            'Issue verifiable credentials like badges, certificates, or achievements to your users.',
        descriptionKey: 'developerPortal.guides.useCases.issueCredentials.description',
        icon: 'award',
        color: 'text-violet-600',
        bgColor: 'bg-violet-100',
    },
    'embed-claim': {
        id: 'embed-claim',
        title: 'Embed Claim Button',
        titleKey: 'developerPortal.guides.useCases.embedClaim.title',
        subtitle: 'Issue from your site',
        subtitleKey: 'developerPortal.guides.useCases.embedClaim.subtitle',
        description:
            'Add a "Claim Credential" button to your website so users can claim badges without leaving your page.',
        descriptionKey: 'developerPortal.guides.useCases.embedClaim.description',
        icon: 'mouse-pointer-click',
        color: 'text-pink-600',
        bgColor: 'bg-pink-100',
    },
    'embed-app': {
        id: 'embed-app',
        title: 'Embed Your App',
        titleKey: 'developerPortal.guides.useCases.embedApp.title',
        subtitle: 'Run inside LearnCard',
        subtitleKey: 'developerPortal.guides.useCases.embedApp.subtitle',
        description:
            'Build an app that runs inside the LearnCard wallet with access to user identity and credentials.',
        descriptionKey: 'developerPortal.guides.useCases.embedApp.description',
        icon: 'layout',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100',
    },
    'consent-flow': {
        id: 'consent-flow',
        title: 'Connect Website',
        titleKey: 'developerPortal.guides.useCases.consentFlow.title',
        subtitle: 'Connect your website to LearnCard',
        subtitleKey: 'developerPortal.guides.useCases.consentFlow.subtitle',
        description:
            'Set up a consent flow to send and access user data and credentials with their permission.',
        descriptionKey: 'developerPortal.guides.useCases.consentFlow.description',
        icon: 'shield-check',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
    },
    'course-catalog': {
        id: 'course-catalog',
        title: 'Connect Course Catalog',
        titleKey: 'developerPortal.guides.useCases.courseCatalog.title',
        subtitle: 'Enterprise LMS integration',
        subtitleKey: 'developerPortal.guides.useCases.courseCatalog.subtitle',
        description:
            'Full guided setup for LMS partners. Configure webhooks, build credential templates, map your data, and go live with automatic credential issuance.',
        descriptionKey: 'developerPortal.guides.useCases.courseCatalog.description',
        icon: 'rocket',
        color: 'text-violet-600',
        bgColor: 'bg-violet-100',
    },
    'verify-credentials': {
        id: 'verify-credentials',
        title: 'Verify Credentials',
        titleKey: 'developerPortal.guides.useCases.verifyCredentials.title',
        subtitle: 'Accept VCs from users',
        subtitleKey: 'developerPortal.guides.useCases.verifyCredentials.subtitle',
        description:
            'Accept and verify credentials presented by users to prove their achievements or identity.',
        descriptionKey: 'developerPortal.guides.useCases.verifyCredentials.description',
        icon: 'check-circle',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        comingSoon: true,
    },
    'server-webhooks': {
        id: 'server-webhooks',
        title: 'Server Webhooks',
        titleKey: 'developerPortal.guides.useCases.serverWebhooks.title',
        subtitle: 'Backend events',
        subtitleKey: 'developerPortal.guides.useCases.serverWebhooks.subtitle',
        description:
            'Receive real-time notifications when events happen in LearnCard via webhooks.',
        descriptionKey: 'developerPortal.guides.useCases.serverWebhooks.description',
        icon: 'webhook',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        comingSoon: true,
    },
};
