import type { AppStoreListing } from '../types/app-store';

export const MOCK_LISTINGS: AppStoreListing[] = [
    {
        listing_id: 'app-001',
        display_name: 'SkillVerify Pro',
        tagline: 'Instantly verify professional skills and certifications',
        full_description:
            'SkillVerify Pro connects with thousands of certification providers to verify professional credentials in real-time. Perfect for HR departments, recruiters, and educational institutions.',
        icon_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=skillverify',
        app_listing_status: 'PENDING_REVIEW',
        launch_type: 'CONSENT_REDIRECT',
        launch_config_json: JSON.stringify({
            contractUri: 'lc:network:contract:skillverify',
            redirectUri: 'https://skillverify.example.com/callback',
            scopes: ['credentials:read', 'profile:read'],
        }),
        category: 'credentials',
        promotion_level: 'STANDARD',
        privacy_policy_url: 'https://skillverify.example.com/privacy',
        terms_url: 'https://skillverify.example.com/terms',
    },
    {
        listing_id: 'app-002',
        display_name: 'EduConnect',
        tagline: 'Bridge your academic achievements to opportunities',
        full_description:
            'EduConnect helps students and graduates share their academic credentials with employers and institutions securely. Features transcript verification, degree authentication, and skills mapping.',
        icon_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=educonnect',
        app_listing_status: 'PENDING_REVIEW',
        launch_type: 'EMBEDDED_IFRAME',
        launch_config_json: JSON.stringify({
            url: 'https://educonnect.example.com/embed',
            width: '100%',
            height: '600px',
            sandbox: ['allow-scripts', 'allow-same-origin', 'allow-forms'],
            allow: ['clipboard-read', 'clipboard-write'],
        }),
        category: 'education',
        promotion_level: 'CURATED_LIST',
        privacy_policy_url: 'https://educonnect.example.com/privacy',
    },
    {
        listing_id: 'app-003',
        display_name: 'JobMatch AI',
        tagline: 'AI-powered job matching based on verified credentials',
        full_description:
            'JobMatch AI uses advanced machine learning to match your verified credentials with job opportunities. Get personalized job recommendations based on your actual skills and achievements.',
        icon_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=jobmatch',
        app_listing_status: 'LISTED',
        launch_type: 'SECOND_SCREEN',
        launch_config_json: JSON.stringify({
            url: 'https://jobmatch.example.com/wallet-launch',
        }),
        category: 'employment',
        promotion_level: 'FEATURED_CAROUSEL',
        promo_video_url: 'https://youtube.com/watch?v=example',
    },
    {
        listing_id: 'app-004',
        display_name: 'CredentialVault',
        tagline: 'Secure backup and recovery for your digital credentials',
        full_description:
            'CredentialVault provides enterprise-grade backup and recovery solutions for your digital credentials. Never lose access to your important certifications and achievements.',
        icon_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=vault',
        app_listing_status: 'DRAFT',
        launch_type: 'SERVER_HEADLESS',
        launch_config_json: JSON.stringify({
            webhookUrl: 'https://vault.example.com/webhooks/learncard',
            apiKey: 'REPLACE_WITH_API_KEY',
        }),
        category: 'utilities',
        promotion_level: 'STANDARD',
    },
    {
        listing_id: 'app-005',
        display_name: 'HealthCert',
        tagline: 'Healthcare credential verification made simple',
        full_description:
            'HealthCert streamlines the verification of healthcare professional credentials including licenses, certifications, and continuing education records.',
        icon_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=healthcert',
        app_listing_status: 'PENDING_REVIEW',
        launch_type: 'DIRECT_LINK',
        launch_config_json: JSON.stringify({
            url: 'https://healthcert.example.com/verify',
        }),
        category: 'healthcare',
        promotion_level: 'STANDARD',
        privacy_policy_url: 'https://healthcert.example.com/privacy',
        terms_url: 'https://healthcert.example.com/terms',
    },
];

export const getListingsByStatus = (status: AppStoreListing['app_listing_status']) => {
    return MOCK_LISTINGS.filter(listing => listing.app_listing_status === status);
};

export const getPendingReviewListings = () => getListingsByStatus('PENDING_REVIEW');

export const getAllListings = () => MOCK_LISTINGS;
