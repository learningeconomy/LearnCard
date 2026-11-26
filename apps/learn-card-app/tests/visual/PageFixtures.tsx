import React from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { AppStoreListing } from '@learncard/types';
import {
    BoostCategoryOptionsEnum,
    currentUserStore,
    walletStore,
    switchedProfileStore,
    type BespokeLearnCard,
} from 'learn-card-base';
import firstStartupStore from 'learn-card-base/stores/firstStartupStore';
import { themeStore } from '../../src/theme/store/themeStore';
import { SignedInLaunchpadFixture } from './SignedInLaunchpadFixture';
import BoostPreview from '../../src/components/boost/boostCMS/BoostPreview/BoostPreview';
import BoostDetailsSideMenu from '../../src/components/boost/boostCMS/BoostPreview/BoostDetailsSideMenu';
import LaunchPad from '../../src/pages/launchPad/LaunchPad';
import MyAppsLanding from '../../src/pages/myApps/MyAppsLanding';
import AppStoreDetailModal from '../../src/pages/launchPad/AppStoreDetailModal';
import { personaCredentials } from '../../src/pages/dashboard/dashboard.personas';
import { IssueVisualFixture } from './IssueVisualFixture';
import { ControlsVisualFixture } from './ControlsVisualFixture';
import { TogglesVisualFixture } from './TogglesVisualFixture';
import { TextareasVisualFixture } from './TextareasVisualFixture';
import { InputsVisualFixture } from './InputsVisualFixture';
import { ListVisualFixture } from './ListVisualFixture';
import { IconsVisualFixture } from './IconsVisualFixture';
import { GridVisualFixture } from './GridVisualFixture';
import { WidgetsVisualFixture } from './WidgetsVisualFixture';
import { OverlaysVisualFixture } from './OverlaysVisualFixture';

export const additionalStates = [
    'credential',
    'credential-details',
    'issue',
    'issue-json',
    'apps',
    'my-apps',
    'my-apps-signed-in',
    'app-details',
    // Ionic replacement phase 4 batch 1a (buttons, checkboxes, radios). Not in tailwind.spec.ts.
    'controls-1a',
    // Ionic replacement phase 4 batch 1b (IonToggle call sites). Not in tailwind.spec.ts.
    'toggles-1b',
    // Ionic replacement phase 4 batch 1b (IonTextarea call sites). Not in tailwind.spec.ts.
    'textareas-1b',
    // Ionic replacement phase 4 (IonInput call sites). Not in tailwind.spec.ts.
    'inputs-1b',
    'list-1',
    'icons-1',
    'grid-1',
    'widgets-1',
    'overlays-1',
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
export const seedPageQueries = (client: QueryClient, state?: string): void => {
    if (state === 'my-apps-signed-in') {
        themeStore.set.theme('formal');
        firstStartupStore.set.version('1.100.3');
        const did = 'did:web:network.learncard.com:users:visual-jordan';
        const profile = {
            did,
            profileId: 'visual-jordan',
            displayName: 'Jordan Lee',
            image: '',
            dob: '1996-01-01',
            country: 'US',
        };
        currentUserStore.set.currentUser({
            uid: 'visual-jordan',
            email: 'jordan@example.test',
            phoneNumber: '',
            name: 'Jordan Lee',
            profileImage: '',
            privateKey: 'visual-fixture-only-not-a-real-key',
            baseColor: 'bg-grayscale-900',
        });
        switchedProfileStore.set.switchedDid(did);
        // The public marker satisfies normal session hydration. This read-only
        // fixture wallet has no signing methods and never connects to a service.
        walletStore.set.wallet({ id: { did: () => did } } as unknown as BespokeLearnCard);
        client.setQueryData(['getProfile', did, undefined], profile);
        client.setQueryData(['getProfile', did, 'visual-jordan'], profile);
        client.setQueryData(['useGetUnreadUserNotifications', did], { notifications: [] });
        client.setQueryData(['useGetPreferencesForDid', did], {
            aiEnabled: true,
            theme: 'colorful',
        });
        for (const category of ['', 'AI Topic', 'Family']) {
            client.setQueryData(['useGetCredentialList', did, category], {
                pages: [{ records: [], hasMore: false }],
                pageParams: [undefined],
            });
        }
    }
    const installed = { ...listings[0], installed_at: '2026-10-01T09:00:00Z' };
    client.setQueryData(['appStore', 'browse', undefined, undefined, 50, undefined], {
        records: listings,
        hasMore: false,
    });
    client.setQueryData(['appStore', 'featuredCarousel', null], [listings[1]]);
    client.setQueryData(['appStore', 'curatedList'], [listings[2]]);
    client.setQueryData(['appStore', 'installed', 50, undefined], {
        records: state?.startsWith('my-apps')
            ? listings.map(listing => ({ ...listing, installed_at: installed.installed_at }))
            : [installed],
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
    if (state === 'controls-1a') return <ControlsVisualFixture />;
    if (state === 'toggles-1b') return <TogglesVisualFixture />;
    if (state === 'textareas-1b') return <TextareasVisualFixture />;
    if (state === 'inputs-1b') return <InputsVisualFixture />;
    if (state === 'list-1') return <ListVisualFixture />;
    if (state === 'icons-1') return <IconsVisualFixture />;
    if (state === 'grid-1') return <GridVisualFixture />;
    if (state === 'widgets-1') return <WidgetsVisualFixture />;
    if (state === 'overlays-1') return <OverlaysVisualFixture />;
    if (state === 'apps') return <LaunchPad />;
    if (state === 'my-apps-signed-in') return <SignedInLaunchpadFixture />;
    if (state === 'my-apps') return <MyAppsLanding />;
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
