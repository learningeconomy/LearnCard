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

import MyLearnCardModal from '../../components/learncard/MyLearnCardModal';
import QrCodeUserCardModal from '../../components/qrcode-user-card/QRCodeUserCard';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { useModal, ModalTypes } from 'learn-card-base';
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
import QuickActionsRow from './components/QuickActionsRow';
import GetStartedChecklist from './components/GetStartedChecklist';
import ActivityCard from './components/ActivityCard';
import AppsCard from './components/AppsCard';
import { countReviewsDueToday } from './helpers/dueReviews';
import useBuildMyLearnCardModal from './hooks/useBuildMyLearnCardModal';
import useAddToLearnCardActions from './hooks/useAddToLearnCardActions';
import useSkillProfileModal from './hooks/useSkillProfileModal';
import useAppStore from '../launchPad/useAppStore';
import { useSkillProfileCompletion } from '../ai-pathways/ai-pathways-skill-profile/SkillProfileProgressBar';
import { DEFAULT_REGISTRY } from './quickActions/registry';
import { resolveSlots } from './quickActions/resolveSlots';
import type { ActionHandlers, DashboardState, SlotIcons } from './quickActions/types';

import ScanIcon from 'learn-card-base/svgs/ScanIcon';
import LinkOutlinedIcon from 'learn-card-base/svgs/LinkOutlinedIcon';
import AddCredentialIcon from 'learn-card-base/svgs/AddCredentialIcon';

const DashboardPage: React.FC = () => {
    const history = useHistory();
    const flags = useFlags();
    const { theme, getIconSet, getColorSet } = useTheme();
    const sideMenuIcons = getIconSet(IconSetEnum.sideMenu);
    const sideMenuColors = getColorSet(ColorSetEnum.sideMenu);
    const primaryButtonClass = sideMenuColors?.primaryButtonColor;
    const pathwaysEnabled = usePathwaysEnabled();
    const { openBuildMyLearnCard } = useBuildMyLearnCardModal();
    const { openClaimLink, openIssueCredential, openScanQr: openScanQrCredential } =
        useAddToLearnCardActions();
    const { openSkillProfile } = useSkillProfileModal();
    const { percentage: skillProfilePercentage } = useSkillProfileCompletion();
    const { newModal: openHeaderModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

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

    const openMyLearnCard = () => {
        openHeaderModal(<MyLearnCardModal branding={BrandingEnum.learncard} />);
    };
    const openQrScanner = () => {
        openHeaderModal(
            <QrCodeUserCardModal
                branding={BrandingEnum.learncard}
                history={history}
                connections={connections ?? []}
                qrOnly
            />,
        );
    };

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
    const goToInsights = () => history.push('/ai/insights');
    const goToSkills = () => history.push('/skills');
    const goToSetGoal = () => {
        history.push(pathwaysEnabled ? '/pathways/onboard' : '/ai/pathways');
    };
    const goToBrowsePathways = () => {
        history.push(pathwaysEnabled ? '/pathways' : '/ai/pathways');
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

    const hasCredentials = totalCredentialCount > 0;
    const hasGoal = !!activePathway;
    const hasSkillProfile = skillProfilePercentage >= 100;

    const goToWallet = () => history.push('/wallet');

    const showGetStarted = !getStartedDismissed && (!hasCredentials || !hasGoal);
    const heroSlot: 'getStarted' | 'goal' = showGetStarted ? 'getStarted' : 'goal';

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
            onClick: goToSetGoal,
        },
        {
            key: 'skill-profile',
            label: 'Fill out your skills profile',
            done: hasSkillProfile,
            onClick: openSkillProfile,
        },
    ];

    const dismissGetStarted = () => {
        firstStartupStore.set.dashboardGetStartedDismissed(true);
    };

    const dashboardState: DashboardState = {
        credentialsCount: totalCredentialCount,
        skillsCount,
        hasGoal,
        nextNodeTitle: goalSummary?.nextNode?.title,
        pathwaysEnabled,
        showAiInsights: Boolean(flags?.showAiInsights),
    };

    const actionHandlers: ActionHandlers = {
        goToAddCredential: goToCollect,
        goToWallet,
        goToSkills,
        goToInsights,
        goToSetGoal,
        goToPathway,
        goToBrowsePathways,
        goToBrowseAppStore: () => history.push('/launchpad'),
    };

    const slotIcons: SlotIcons = {
        collect: sideMenuIcons.wallet,
        understand: sideMenuIcons[CredentialCategoryEnum.aiInsight],
        navigate: sideMenuIcons.pathways,
    };

    const nextChecklistItem = checklistItems.find(item => !item.done) ?? null;
    const heroActionId: string | null = (() => {
        if (heroSlot === 'getStarted' && nextChecklistItem) {
            if (nextChecklistItem.key === 'add-credential') return 'add-first-credential';
            if (nextChecklistItem.key === 'set-goal') return 'set-goal';
            return null;
        }
        if (heroSlot === 'goal') {
            return goalSummary ? 'continue-goal' : 'set-goal';
        }
        return null;
    })();

    const resolvedSlots = resolveSlots(
        dashboardState,
        { handlers: actionHandlers, icons: slotIcons },
        heroActionId,
        DEFAULT_REGISTRY,
    );

    return (
        <IonPage className="bg-grayscale-100">
            <ErrorBoundary fallback={<ErrorBoundaryFallback />}>
                <IonContent fullscreen color="grayscale-100">

                    <div className="flex justify-center w-full font-poppins">
                        <div className="w-full max-w-[1200px] flex flex-col gap-5 px-4 pt-4 pb-[100px] desktop:px-8 desktop:pt-6">
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
                                    onAvatarClick={openMyLearnCard}
                                    topRightAction={
                                        <button
                                            type="button"
                                            onClick={openQrScanner}
                                            aria-label="Open QR scanner"
                                            className="w-9 h-9 rounded-full bg-grayscale-100 hover:bg-grayscale-200 transition-colors flex items-center justify-center text-grayscale-800 active:scale-95"
                                        >
                                            <QRCodeScanner version="2" />
                                        </button>
                                    }
                                />
                            </GenericErrorBoundary>

                            <div className="grid grid-cols-1 desktop:grid-cols-12 gap-5">
                                <div className="flex flex-col gap-5 desktop:col-span-7 min-w-0">
                                    {heroSlot === 'getStarted' ? (
                                        <GenericErrorBoundary>
                                            <GetStartedChecklist
                                                items={checklistItems}
                                                onDismiss={dismissGetStarted}
                                                variant="hero"
                                                primaryButtonClass={primaryButtonClass}
                                            />
                                        </GenericErrorBoundary>
                                    ) : (
                                        <GenericErrorBoundary>
                                            <CurrentGoalCard
                                                goalSummary={goalSummary}
                                                pathwaysEnabled={pathwaysEnabled}
                                                reviewsDueToday={reviewSummary.total}
                                                onContinue={goToPathway}
                                                onReview={goToReviews}
                                                primaryButtonClass={primaryButtonClass}
                                                variant="hero"
                                            />
                                        </GenericErrorBoundary>
                                    )}
                                </div>
                                <div className="flex flex-col gap-5 desktop:col-span-5 min-w-0">
                                    <GenericErrorBoundary>
                                        <ActivityCard
                                            notifications={unreadNotifications}
                                            pendingContractRequests={pendingContractRequests}
                                            pendingConnections={receivedConnectionRequests}
                                            records={allCredentialRecords}
                                            isLoading={allCredentialsLoading}
                                            emptyTips={[
                                                ...(openScanQrCredential
                                                    ? [
                                                          {
                                                              key: 'scan-qr',
                                                              title: 'Scan a QR code',
                                                              subtitle:
                                                                  'Claim a credential from a poster or screen',
                                                              Icon: ScanIcon,
                                                              onClick: openScanQrCredential,
                                                          },
                                                      ]
                                                    : []),
                                                {
                                                    key: 'claim-link',
                                                    title: 'Use a claim link',
                                                    subtitle: 'Paste or upload a credential link',
                                                    Icon: LinkOutlinedIcon,
                                                    onClick: openClaimLink,
                                                },
                                                {
                                                    key: 'issue-credential',
                                                    title: 'Issue a credential',
                                                    subtitle: 'Send a credential to someone',
                                                    Icon: AddCredentialIcon,
                                                    onClick: openIssueCredential,
                                                },
                                            ]}
                                        />
                                    </GenericErrorBoundary>
                                </div>
                            </div>

                            <GenericErrorBoundary>
                                <QuickActionsRow slots={resolvedSlots} />
                            </GenericErrorBoundary>

                            <GenericErrorBoundary>
                                <AppsCard
                                    installedApps={installedApps}
                                    suggestedApps={suggestedApps}
                                    unreadByListing={unreadByListing}
                                    onInstallSuccess={refetchInstalledApps}
                                    variant="featured"
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
