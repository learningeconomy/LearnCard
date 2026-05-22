import React, { useMemo } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useHistory } from 'react-router-dom';

import { IonContent, IonPage } from '@ionic/react';
import {
    CredentialCategoryEnum,
    useAllContractRequestsForProfile,
    useCurrentUser,
    useGetBoostSkills,
    useGetCredentialList,
    useGetConnections,
    useGetConnectionsRequests,
    useGetCurrentLCNUser,
    useGetResolvedCredential,
    useGetSelfAssignedSkillsBoost,
    useGetUnreadUserNotifications,
    useVerifiableData,
} from 'learn-card-base';
import {
    getCredentialName,
    getIssuerName,
    unwrapBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import firstStartupStore from 'learn-card-base/stores/firstStartupStore';

import MainHeader from '../../components/main-header/MainHeader';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';
import { ErrorBoundaryFallback } from '../../components/boost/boostErrors/BoostErrorsDisplay';
import { ErrorBoundary } from 'react-error-boundary';

import pathwayStore from '../../stores/pathways/pathwayStore';
import { usePathwaysEnabled } from '../pathways/hooks/usePathwaysEnabled';
import useTheme from '../../theme/hooks/useTheme';
import { IconSetEnum } from '../../theme/icons';
import { ColorSetEnum } from '../../theme/colors';
import {
    SKILL_PROFILE_PROFILE_KEY,
    type SkillProfileProfileData,
} from '../ai-pathways/ai-pathways-skill-profile/SkillProfileStep1';

import DashboardHeaderCard from './components/DashboardHeaderCard';
import CurrentGoalCard from './components/CurrentGoalCard';
import QuickActionsRow, { type QuickAction } from './components/QuickActionsRow';
import GetStartedChecklist from './components/GetStartedChecklist';
import ActivityCard from './components/ActivityCard';
import AppsCard from './components/AppsCard';
import { countReviewsDueToday } from './helpers/dueReviews';
import useBuildMyLearnCardModal from './hooks/useBuildMyLearnCardModal';
import useAppStore from '../launchPad/useAppStore';

const DashboardPage: React.FC = () => {
    const history = useHistory();
    const flags = useFlags();
    const { theme, getIconSet, getColorSet } = useTheme();
    const sideMenuIcons = getIconSet(IconSetEnum.sideMenu);
    const sideMenuColors = getColorSet(ColorSetEnum.sideMenu);
    const primaryButtonClass = sideMenuColors?.primaryButtonColor;
    const pathwaysEnabled = usePathwaysEnabled();
    const { openBuildMyLearnCard } = useBuildMyLearnCardModal();

    const currentUser = useCurrentUser();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const { data: allCredentials, isLoading: allCredentialsLoading } =
        useGetCredentialList(undefined);
    const allCredentialRecords = useMemo(
        () => allCredentials?.pages?.flatMap(p => p?.records ?? []) ?? [],
        [allCredentials],
    );
    const totalCredentialCount = allCredentialRecords.length;

    const { data: idCredentials } = useGetCredentialList(CredentialCategoryEnum.id);
    const primaryId = useMemo(
        () => idCredentials?.pages?.[0]?.records?.[0],
        [idCredentials]
    );
    const { data: primaryIdVc } = useGetResolvedCredential(primaryId?.uri);
    const unwrappedPrimaryIdVc = useMemo(
        () => (primaryIdVc ? unwrapBoostCredential(primaryIdVc) : undefined),
        [primaryIdVc],
    );

    const { data: skillCredentials } = useGetCredentialList(CredentialCategoryEnum.skill);
    const skillsCount = useMemo(
        () => skillCredentials?.pages?.flatMap(p => p?.records ?? []).length ?? 0,
        [skillCredentials],
    );

    const { data: skillProfileData } = useVerifiableData<SkillProfileProfileData>(
        SKILL_PROFILE_PROFILE_KEY,
    );
    const { data: selfAssignedSkillsBoost } = useGetSelfAssignedSkillsBoost();
    const { data: selfAssignedSkills } = useGetBoostSkills(selfAssignedSkillsBoost?.uri);
    const headerSkillPills = useMemo(
        () =>
            (selfAssignedSkills ?? [])
                .filter(s => s?.statement?.trim())
                .map(s => ({ id: s.id, label: s.statement.trim() })),
        [selfAssignedSkills],
    );

    const { data: unreadNotificationsData } = useGetUnreadUserNotifications();
    const unreadNotifications = unreadNotificationsData?.notifications ?? [];

    const unreadByListing = useMemo(() => {
        const map = new Map<string, number>();
        for (const n of unreadNotifications) {
            if (n.read || n.archived) continue;
            const listingId = (n.data as any)?.metadata?.listingId;
            if (typeof listingId === 'string' && listingId.length > 0) {
                map.set(listingId, (map.get(listingId) ?? 0) + 1);
            }
        }
        return map;
    }, [unreadNotifications]);

    const { useInstalledApps, useFeaturedCarouselApps, useCuratedListApps } = useAppStore();
    const { data: installedAppsData, refetch: refetchInstalledApps } = useInstalledApps({
        limit: 10,
    });
    const installedApps = installedAppsData?.records ?? [];
    const { data: featuredCarouselApps } = useFeaturedCarouselApps();
    const { data: curatedListApps } = useCuratedListApps();
    const suggestedApps = useMemo(() => {
        if ((featuredCarouselApps?.length ?? 0) > 0) return featuredCarouselApps ?? [];
        return curatedListApps ?? [];
    }, [featuredCarouselApps, curatedListApps]);

    const { data: pendingContracts = [] } = useAllContractRequestsForProfile(
        currentLCNUser?.profileId ?? '',
    );
    const pendingContractRequests = useMemo(
        () => (pendingContracts ?? []).filter(r => r?.status === 'pending'),
        [pendingContracts],
    );

    const { data: receivedConnectionRequests = [] } = useGetConnectionsRequests();
    const { data: connections = [] } = useGetConnections();

    const pathways = pathwayStore.use.pathways();
    const activePathwayId = pathwayStore.use.activePathwayId();
    const activePathway = pathwayStore.use.activePathway();

    const reviewSummary = useMemo(
        () => countReviewsDueToday(pathways, activePathwayId),
        [pathways, activePathwayId],
    );

    const getStartedDismissed = firstStartupStore.useTracked.dashboardGetStartedDismissed();

    const displayName = (currentLCNUser?.displayName?.trim() || currentUser?.name?.trim()) ?? '';
    const profileImage = currentLCNUser?.image?.trim() || currentUser?.profileImage?.trim() || '';

    const categoryLabels = useMemo(() => {
        const map: Record<string, string> = {};
        for (const c of theme.categories ?? []) {
            map[c.categoryId] = c.labels.singular;
        }
        return map;
    }, [theme]);

    const affiliation = useMemo(() => {
        if (!primaryId) return null;

        const resolvedName = unwrappedPrimaryIdVc
            ? getCredentialName(unwrappedPrimaryIdVc)
            : undefined;
        const resolvedIssuer = unwrappedPrimaryIdVc
            ? getIssuerName(unwrappedPrimaryIdVc)
            : undefined;

        const metaTitle = primaryId.title?.trim();
        const looksGeneric = !metaTitle || /^(id|ids|identity|membership)$/i.test(metaTitle);

        const role =
            (!looksGeneric && metaTitle) ||
            resolvedName?.trim() ||
            categoryLabels[primaryId.category] ||
            'Member';

        const from = primaryId.from?.trim() || resolvedIssuer?.trim() || undefined;

        return {
            role,
            from,
            issuedAt: primaryId.date,
        };
    }, [primaryId, unwrappedPrimaryIdVc, categoryLabels]);

    const goalSummary = useMemo(() => {
        if (!activePathway) return null;
        const nodes = activePathway.nodes ?? [];
        const order = activePathway.chosenRoute?.length
            ? (activePathway.chosenRoute
                  .map(id => nodes.find(n => n.id === id))
                  .filter(Boolean) as typeof nodes)
            : nodes;
        const total = order.length;
        const completed = order.filter(n => n.progress?.status === 'completed').length;
        const nextNode = order.find(n => n.progress?.status !== 'completed') ?? null;
        return {
            title: activePathway.title,
            goal: activePathway.goal,
            total,
            completed,
            nextNode,
            pathwayId: activePathway.id,
        };
    }, [activePathway]);

    const goToCollect = () => {
        openBuildMyLearnCard();
    };
    const goToUnderstand = () => {
        if (flags?.showAiInsights) history.push('/ai/insights');
        else history.push('/skills');
    };
    const goToNavigate = () => {
        if (pathwaysEnabled) history.push('/pathways');
        else history.push('/ai/pathways');
    };

    const goToPathway = () => {
        if (!pathwaysEnabled) {
            history.push('/ai/pathways');
            return;
        }
        if (goalSummary?.nextNode && goalSummary.pathwayId) {
            history.push(`/pathways/node/${goalSummary.pathwayId}/${goalSummary.nextNode.id}`);
        } else if (activePathway) {
            history.push('/pathways/today');
        } else {
            history.push('/pathways/onboard');
        }
    };

    const goToReviews = () => {
        if (pathwaysEnabled) history.push('/pathways/today');
    };

    const quickActions: QuickAction[] = [
        {
            key: 'collect',
            label: 'Collect',
            caption: 'Add to LearnCard',
            Icon: sideMenuIcons.wallet,
            onClick: goToCollect,
        },
        {
            key: 'understand',
            label: 'Understand',
            caption: flags?.showAiInsights ? 'See your insights' : 'Explore your skills',
            Icon: sideMenuIcons[CredentialCategoryEnum.aiInsight],
            onClick: goToUnderstand,
        },
        {
            key: 'navigate',
            label: 'Navigate',
            caption: 'Set or follow a goal',
            Icon: sideMenuIcons.pathways,
            onClick: goToNavigate,
        },
    ];

    const hasCredentials = totalCredentialCount > 0;
    const hasGoal = !!activePathway;
    const hasConnections = connections.length > 0;
    const showGetStarted = !getStartedDismissed && (!hasCredentials || !hasGoal);

    const checklistItems = [
        {
            key: 'add-credential',
            label: 'Add your first credential',
            done: hasCredentials,
            onClick: goToCollect,
        },
        {
            key: 'set-goal',
            label: 'Set a goal',
            done: hasGoal,
            onClick: () =>
                history.push(pathwaysEnabled ? '/pathways/onboard' : '/ai/pathways'),
        },
        {
            key: 'connect-contact',
            label: 'Connect with someone',
            done: hasConnections,
            onClick: () => history.push('/contacts'),
        },
    ];

    const dismissGetStarted = () => {
        firstStartupStore.set.dashboardGetStartedDismissed(true);
    };

    return (
        <IonPage className="bg-grayscale-100">
            <ErrorBoundary fallback={<ErrorBoundaryFallback />}>
                <IonContent fullscreen color="grayscale-100">
                    <MainHeader showBackButton={false} hidePlusBtn />
                    <div className="flex justify-center w-full font-poppins">
                        <div className="w-full max-w-[680px] flex flex-col gap-5 px-4 pt-4 pb-[100px]">
                            <GenericErrorBoundary>
                                <DashboardHeaderCard
                                    displayName={displayName}
                                    profileImage={profileImage}
                                    heroImage={currentLCNUser?.heroImage}
                                    profileRole={currentLCNUser?.role}
                                    shortBio={currentLCNUser?.shortBio}
                                    affiliation={affiliation}
                                    stats={{
                                        credentials: totalCredentialCount,
                                        skills: skillsCount,
                                        contacts: connections.length,
                                    }}
                                    professionalTitle={skillProfileData?.professionalTitle}
                                    experience={skillProfileData?.lifetimeExperience ?? null}
                                    skills={headerSkillPills}
                                    onSkillPillClick={() => history.push('/skills')}
                                />
                            </GenericErrorBoundary>
                            <GenericErrorBoundary>
                                <ActivityCard
                                    notifications={unreadNotifications}
                                    pendingContractRequests={pendingContractRequests}
                                    pendingConnections={receivedConnectionRequests}
                                    records={allCredentialRecords}
                                    isLoading={allCredentialsLoading}
                                />
                            </GenericErrorBoundary>
                            <GenericErrorBoundary>
                                <QuickActionsRow actions={quickActions} />
                            </GenericErrorBoundary>
                            <GenericErrorBoundary>
                                <AppsCard
                                    installedApps={installedApps}
                                    suggestedApps={suggestedApps}
                                    unreadByListing={unreadByListing}
                                    onInstallSuccess={refetchInstalledApps}
                                />
                            </GenericErrorBoundary>
                            {showGetStarted && (
                                <GenericErrorBoundary>
                                    <GetStartedChecklist
                                        items={checklistItems}
                                        onDismiss={dismissGetStarted}
                                    />
                                </GenericErrorBoundary>
                            )}
                            <GenericErrorBoundary>
                                <CurrentGoalCard
                                    goalSummary={goalSummary}
                                    pathwaysEnabled={pathwaysEnabled}
                                    reviewsDueToday={reviewSummary.total}
                                    onContinue={goToPathway}
                                    onReview={goToReviews}
                                    primaryButtonClass={primaryButtonClass}
                                />
                            </GenericErrorBoundary>
                        </div>
                    </div>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default DashboardPage;
