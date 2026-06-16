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
    isVerifiableDataRecord,
    useExistingAiInsightCredential,
    useAiFeatureGate,
    useGetCredentialsForSkills,
} from 'learn-card-base';
import {
    getCredentialName,
    getIssuerName,
    unwrapBoostCredential,
    SELF_ASSIGNED_SKILLS_BOOST_NAME,
} from 'learn-card-base/helpers/credentialHelpers';
import firstStartupStore from 'learn-card-base/stores/firstStartupStore';

import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';

import MyLearnCardModal from '../../components/learncard/MyLearnCardModal';
import QrCodeUserCardModal from '../../components/qrcode-user-card/QRCodeUserCard';
import ManageDataSharingModal from '../../components/data-sharing/ManageDataSharingModal';
import { summarizeConsent } from '../../components/data-sharing/consentSummary';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { useModal, ModalTypes, useBrandingConfig } from 'learn-card-base';
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

import DashboardView from './DashboardView';
import type {
    DashboardViewModel,
    DashboardEmptyTip,
    DashboardDataTrustViewModel,
    DashboardLearningProfileViewModel,
} from './DashboardView.types';
import { buildLearningSnapshots } from './helpers/learningSnapshots';
import { buildTopSkills } from './helpers/topSkills';
import {
    aggregateCategorizedEntries,
    getTopSkills,
    mapBoostsToSkills,
    type RawCategorizedEntry,
} from '../skills/skills.helpers';
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
    const brandingConfig = useBrandingConfig();
    const sideMenuIcons = getIconSet(IconSetEnum.sideMenu);
    const sideMenuColors = getColorSet(ColorSetEnum.sideMenu);
    const primaryButtonClass = sideMenuColors?.primaryButtonColor;
    const pathwaysEnabled = usePathwaysEnabled();
    const { openBuildMyLearnCard } = useBuildMyLearnCardModal();
    const {
        openClaimLink,
        openIssueCredential,
        openScanQr: openScanQrCredential,
    } = useAddToLearnCardActions();
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

    const { data: idCredentials } = useGetCredentialList(CredentialCategoryEnum.id);
    const primaryId = useMemo(() => idCredentials?.pages?.[0]?.records?.[0], [idCredentials]);
    const { data: primaryIdVc } = useGetResolvedCredential(primaryId?.uri);
    const unwrappedPrimaryIdVc = useMemo(
        () => (primaryIdVc ? unwrapBoostCredential(primaryIdVc) : undefined),
        [primaryIdVc]
    );

    const { data: skillCredentials } = useGetCredentialList(CredentialCategoryEnum.skill);
    const skillsCount = useMemo(
        () => skillCredentials?.pages?.flatMap(p => p?.records ?? []).length ?? 0,
        [skillCredentials]
    );

    const { data: skillProfileData } =
        useVerifiableData<SkillProfileProfileData>(SKILL_PROFILE_PROFILE_KEY);
    const { data: selfAssignedSkillsBoost } = useGetSelfAssignedSkillsBoost();
    const { data: selfAssignedSkills } = useGetBoostSkills(selfAssignedSkillsBoost?.uri);
    const headerSkillPills = useMemo(
        () =>
            (selfAssignedSkills ?? [])
                .filter((s: any) => s?.statement?.trim())
                .map((s: any) => ({ id: s.id, label: s.statement.trim() })),
        [selfAssignedSkills]
    );

    const selfAssignedSkillsUri = selfAssignedSkillsBoost?.uri;
    const allCredentialRecords = useMemo(
        () =>
            (allCredentials?.pages?.flatMap(p => p?.records ?? []) ?? []).filter(record => {
                if (isVerifiableDataRecord(record)) return false;
                if (selfAssignedSkillsUri && record.uri === selfAssignedSkillsUri) return false;
                if (record.title?.trim() === SELF_ASSIGNED_SKILLS_BOOST_NAME) return false;
                return true;
            }),
        [allCredentials, selfAssignedSkillsUri]
    );
    const totalCredentialCount = allCredentialRecords.length;

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
        currentLCNUser?.profileId ?? ''
    );
    const pendingContractRequests = useMemo(
        () => (pendingContracts ?? []).filter(r => r?.status === 'pending'),
        [pendingContracts]
    );

    const { data: receivedConnectionRequests = [] } = useGetConnectionsRequests();
    const { data: connections = [] } = useGetConnections();

    const { data: consentedContracts = [] } = useConsentedContracts();

    const showAiInsights = Boolean(flags?.showAiInsights);
    const { isAiEnabled } = useAiFeatureGate();
    const aiInsightsAllowed = showAiInsights && isAiEnabled;
    const { data: existingAiInsightCredential } = useExistingAiInsightCredential({
        enabled: aiInsightsAllowed,
    });

    const { data: skillsCredentials } = useGetCredentialsForSkills(aiInsightsAllowed);
    const dashboardTopSkills = useMemo(() => {
        if (!aiInsightsAllowed) return [];

        const skillsMap = mapBoostsToSkills(skillsCredentials);
        const categorizedSkills = Object.entries(skillsMap) as [
            string,
            RawCategorizedEntry[] & { totalSkills: number; totalSubskills: number }
        ][];
        const aggregatedSkills = aggregateCategorizedEntries(categorizedSkills);

        return buildTopSkills(getTopSkills(aggregatedSkills, 15), 3);
    }, [aiInsightsAllowed, skillsCredentials]);

    const openMyLearnCard = () => {
        openHeaderModal(<MyLearnCardModal branding={BrandingEnum.learncard} />);
    };
    const openQrScanner = () => {
        openHeaderModal(
            React.createElement(QrCodeUserCardModal as any, {
                branding: BrandingEnum.learncard,
                history,
                connections: connections ?? [],
                qrOnly: true,
            })
        );
    };
    const openManageDataSharing = () => {
        openHeaderModal(
            <ManageDataSharingModal />,
            { sectionClassName: '!bg-transparent !shadow-none' },
            { desktop: ModalTypes.Center, mobile: ModalTypes.FullScreen }
        );
    };

    const pathways = pathwayStore.use.pathways();
    const activePathwayId = pathwayStore.use.activePathwayId();
    const activePathway = pathwayStore.use.activePathway();

    const reviewSummary = useMemo(
        () => countReviewsDueToday(pathways, activePathwayId),
        [pathways, activePathwayId]
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
    const hasDiscoveredApps = installedApps.length > 0;

    const goToWallet = () => history.push('/wallet');
    const goToDiscoverApps = () => history.push('/launchpad?tab=All');

    const secondChecklistStep = pathwaysEnabled
        ? {
              key: 'set-goal',
              label: 'Set a goal',
              done: hasGoal,
              onClick: goToSetGoal,
          }
        : {
              key: 'discover-apps',
              label: 'Discover apps',
              done: hasDiscoveredApps,
              onClick: goToDiscoverApps,
          };

    const secondStepDone = pathwaysEnabled ? hasGoal : hasDiscoveredApps;

    const showGetStarted = !getStartedDismissed && (!hasCredentials || !secondStepDone);
    const heroSlot: 'getStarted' | 'goal' = showGetStarted ? 'getStarted' : 'goal';

    const checklistItems = [
        {
            key: 'add-credential',
            label: 'Add your first credential',
            done: hasCredentials,
            onClick: goToCollect,
        },
        secondChecklistStep,
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
        hasSkillProfile,
        nextNodeTitle: goalSummary?.nextNode?.title,
        pathwaysEnabled,
        showAiInsights,
    };

    const actionHandlers: ActionHandlers = {
        goToAddCredential: goToCollect,
        goToWallet,
        goToSkills,
        goToInsights,
        openSkillProfile,
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
            if (nextChecklistItem.key === 'add-credential') return 'connect-new';
            if (nextChecklistItem.key === 'set-goal') return 'navigate-new';
            return null;
        }
        if (heroSlot === 'goal') {
            return goalSummary ? 'navigate-active' : 'navigate-new';
        }
        return null;
    })();

    const resolvedSlots = resolveSlots(
        dashboardState,
        { handlers: actionHandlers, icons: slotIcons },
        heroActionId,
        DEFAULT_REGISTRY
    );

    const emptyTips: DashboardEmptyTip[] = [
        ...(openScanQrCredential
            ? [
                  {
                      key: 'scan-qr',
                      title: 'Scan a QR code',
                      subtitle: 'Claim a credential from a poster or screen',
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
    ];

    const learningProfile = useMemo<DashboardLearningProfileViewModel>(() => {
        const skills = dashboardTopSkills.map(skill => ({
            name: skill.name,
            title: skill.title,
            category: skill.category,
            strengthTier: skill.strengthTier,
        }));

        let strength: DashboardLearningProfileViewModel['strength'] = null;

        if (aiInsightsAllowed) {
            const snapshots = buildLearningSnapshots(existingAiInsightCredential);
            const strengthSnapshot = snapshots.find(snap => snap.tone === 'strength');
            if (strengthSnapshot) {
                strength = {
                    title: strengthSnapshot.title,
                    summary: strengthSnapshot.description,
                };
            }
        }

        let state: DashboardLearningProfileViewModel['state'] = 'empty';
        if (strength && skills.length > 0) {
            state = 'rich';
        } else if (skills.length > 0 || strength) {
            state = 'early';
        }

        return {
            state,
            strength,
            verifiedRecords: totalCredentialCount,
            skills,
            updatedAt: existingAiInsightCredential?.issuanceDate,
            onViewInsights: goToInsights,
        };
    }, [aiInsightsAllowed, dashboardTopSkills, existingAiInsightCredential, totalCredentialCount]);

    const dataTrust = useMemo<DashboardDataTrustViewModel>(() => {
        const summary = summarizeConsent(consentedContracts);
        return { ...summary, onManage: openManageDataSharing };
    }, [consentedContracts]);

    const viewModel: DashboardViewModel = {
        brandName: brandingConfig.name,
        header: {
            displayName,
            profileImage,
            heroImage: currentLCNUser?.heroImage,
            profileRole: currentLCNUser?.role,
            shortBio: currentLCNUser?.shortBio,
            affiliation,
            stats: {
                credentials: totalCredentialCount,
                skills: skillsCount,
                contacts: connections.length,
            },
            professionalTitle: skillProfileData?.professionalTitle,
            experience: skillProfileData?.lifetimeExperience ?? null,
            skills: headerSkillPills,
            onSkillPillClick: () => history.push('/skills'),
            onAvatarClick: openMyLearnCard,
            onScanQrTopRight: openQrScanner,
        },
        heroSlot,
        checklistItems,
        onDismissGetStarted: dismissGetStarted,
        goalSummary,
        pathwaysEnabled,
        reviewsDueToday: reviewSummary.total,
        onContinueGoal: goToPathway,
        onReviewGoal: goToReviews,
        primaryButtonClass,
        slots: resolvedSlots,
        dataTrust,
        activity: {
            notifications: unreadNotifications,
            pendingContractRequests: pendingContractRequests,
            pendingConnections: receivedConnectionRequests,
            records: allCredentialRecords,
            isLoading: allCredentialsLoading,
            emptyTips,
        },
        learningProfile,
        apps: {
            installedApps,
            suggestedApps,
            unreadByListing,
            onInstallSuccess: refetchInstalledApps,
        },
    };

    return (
        <IonPage className="bg-grayscale-100">
            <ErrorBoundary fallback={<ErrorBoundaryFallback />}>
                <IonContent fullscreen color="grayscale-100">
                    <DashboardView vm={viewModel} />
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default DashboardPage;
