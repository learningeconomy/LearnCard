import React from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { AppStoreListing } from '@learncard/types';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
import BoostPreview from '../../src/components/boost/boostCMS/BoostPreview/BoostPreview';
import BoostDetailsSideMenu from '../../src/components/boost/boostCMS/BoostPreview/BoostDetailsSideMenu';
import LaunchPad from '../../src/pages/launchPad/LaunchPad';
import AppStoreDetailModal from '../../src/pages/launchPad/AppStoreDetailModal';
import { personaCredentials } from '../../src/pages/dashboard/dashboard.personas';
import { IssueVisualFixture } from './IssueVisualFixture';

export const additionalStates = [
    'credential',
    'credential-details',
    'issue',
    'issue-json',
    'apps',
    'app-details',
] as const;

const listings: AppStoreListing[] = [
    {
        listing_id: 'visual-community',
        display_name: 'Community Academy',
        tagline: 'Build leadership skills through practical community projects.',
        full_description:
            'Discover hands-on learning experiences, track your progress, and earn credentials for the skills you build.\n\nLearn at your own pace with courses designed for real communities.',
        icon_url: 'https://visual.example/academy.svg',
        app_listing_status: 'LISTED',
        launch_type: 'EMBEDDED_IFRAME',
        launch_config_json: '{}',
        category: 'learning',
        highlights: ['Learn by doing', 'Track your progress', 'Earn recognized credentials'],
        screenshots: ['https://visual.example/course.png'],
        age_rating: '4+',
    },
    {
        listing_id: 'visual-career',
        display_name: 'Career Explorer',
        tagline: 'Find your next step and connect your skills to new opportunities.',
        full_description: 'Explore careers and build a plan for your next opportunity.',
        icon_url: 'https://visual.example/career.svg',
        app_listing_status: 'LISTED',
        launch_type: 'EMBEDDED_IFRAME',
        launch_config_json: '{}',
        category: 'employment',
    },
    {
        listing_id: 'visual-skills',
        display_name: 'Skills Studio',
        tagline: 'Practice a little every day. Show what you can do.',
        full_description: 'Short activities to help you develop and demonstrate new skills.',
        icon_url: 'https://visual.example/skills.svg',
        app_listing_status: 'LISTED',
        launch_type: 'EMBEDDED_IFRAME',
        launch_config_json: '{}',
        category: 'tools',
    },
];

/** Populate the real app-store hooks without connecting a wallet or changing account data. */
export const seedPageQueries = (client: QueryClient): void => {
    const installed = { ...listings[0], installed_at: '2026-10-01T09:00:00Z' };
    client.setQueryData(['appStore', 'browse', undefined, undefined, 50, undefined], {
        records: listings,
        hasMore: false,
    });
    client.setQueryData(['appStore', 'featuredCarousel', null], [listings[1]]);
    client.setQueryData(['appStore', 'curatedList'], [listings[2]]);
    client.setQueryData(['appStore', 'installed', 50, undefined], {
        records: [installed],
        hasMore: false,
    });
    for (const listing of listings) {
        client.setQueryData(
            ['appStore', 'isInstalled', listing.listing_id],
            listing === listings[0]
        );
        client.setQueryData(['appStore', 'installCount', listing.listing_id], 1280);
    }
    client.setQueryData(['knownDidRegistry', 'did:web:network.learncard.com:users:demo-issuer'], {
        source: 'unknown',
        results: {},
        incomplete: false,
    });
};

export const PageFixture: React.FC<{ state: string }> = ({ state }) => {
    if (state.startsWith('issue')) return <IssueVisualFixture />;
    if (state === 'apps') return <LaunchPad />;
    if (state === 'app-details') {
        return <AppStoreDetailModal listing={listings[0]} isInstalled isPreview />;
    }
    if (state === 'credential-details') {
        return (
            <BoostDetailsSideMenu
                credential={personaCredentials['lc:cloud:rec-2']}
                verificationItems={[]}
                hideEndorsementRequestCard
                isPreview
            />
        );
    }
    return (
        <BoostPreview
            credential={personaCredentials['lc:cloud:rec-2']}
            categoryType={BoostCategoryOptionsEnum.achievement}
            verificationItems={[]}
            customThumbComponent={null}
            customBodyCardComponent={null}
            customFooterComponent={null}
            customIssueHistoryComponent={null}
            issuerOverride="Project Management Institute"
            issueeOverride="Chad Rivera"
            handleCloseModal={() => undefined}
            handleShareBoost={() => undefined}
            sharedOriginal
            skipVerification
            isPreview
        />
    );
};
