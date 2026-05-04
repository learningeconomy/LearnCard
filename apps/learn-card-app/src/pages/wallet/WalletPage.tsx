import React, { useEffect, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useHistory, useLocation, Link } from 'react-router-dom';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

import passportPageStore, { PassportPageViewMode } from '../../stores/passportPageStore';
import { CATEGORY_TO_ROUTE } from '../../helpers/categoryRoutes';

import {
    useModal,
    ModalTypes,
    useGetCredentialList,
    CredentialCategoryEnum,
    newCredsStore,
    lazyWithRetry,
    useAiFeatureGate,
    useToast,
    ToastTypeEnum,
    useDeviceTypeByWidth,
} from 'learn-card-base';

import ResumeBuilderController from '../../components/resume-builder/ResumeBuilderController';
import ThemeSelector, { themeSelectorViewMode } from '../../theme/components/ThemeSelector';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';
import WalletActionButton from '../../components/main-subheader/WalletActionButton';
import CapGoUpdateModal from '../../components/capGoUpdateModal/CapGoUpdateModal';
import CheckListButton from '../../components/learncard/checklist/CheckListButton';
import { IonPage, IonContent, IonRow, IonCol, IonModal } from '@ionic/react';
import WalletPageViewModeSelector from './WalletPageViewModeSelector';
import MainHeader from '../../components/main-header/MainHeader';
import WalletPageItemWrapper from './WalletPageItemWrapper';
import DotIcon from 'learn-card-base/svgs/DotIcon';

import { useTheme } from '../../theme/hooks/useTheme';
import { chatBotStore } from '../../stores/chatBotStore';
import { prefetchWalletRoutes, WALLET_ROUTE_PRELOAD } from '../../Routes';

const ViewSharedCredentials = lazyWithRetry(
    () => import('learn-card-base/components/sharecreds/ViewSharedCredentials')
);
const ShareBoostsBundleModal = lazyWithRetry(
    () => import('../../components/creds-bundle/ShareBoostsBundleModal')
);

const WalletPage: React.FC = () => {
    const flags = useFlags();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const history = useHistory();
    const location = useLocation();

    const { theme, colors } = useTheme();
    const { isMobile } = useDeviceTypeByWidth();
    const categories = theme.categories;

    const passportBgColor = colors?.defaults?.passportBgColor;
    const passportTextColor = colors?.defaults?.passportTextColor ?? 'text-grayscale-900';

    const [shareCredsIsOpen, setShareCredsIsOpen] = useState(false);
    const [viewCredsIsOpen, setViewCredsIsOpen] = useState(false);

    const viewMode = passportPageStore.use.viewMode();
    const totalNewCredentialsCount = newCredsStore.use.totalNewCredentialsCount();

    const { data: records } = useGetCredentialList(CredentialCategoryEnum.family);

    const hasFamilyID = records?.pages?.[0]?.records?.length > 0 ?? false;
    const canCreateFamilies = hasFamilyID || flags?.canCreateFamilies;
    const hideAiWalletRoutes = flags?.hideAiWalletRoutes;
    const showAiInsights = flags?.showAiInsights;
    const hideAiPathways = flags?.hideAiPathways;
    const showChecklistButton = Boolean(flags?.enableOnboardingChecklist);
    const showResumeBuilderButton = Boolean(flags?.enableResumeBuilder);
    const showInlineWalletActions = showChecklistButton && showResumeBuilderButton;
    const { isAiEnabled, reason } = useAiFeatureGate();
    const { presentToast } = useToast();
    const placeholderCategories = [
        CredentialCategoryEnum.aiPathway,
        CredentialCategoryEnum.aiInsight,
    ];

    useEffect(() => {
        prefetchWalletRoutes();
    }, []);

    useEffect(() => {
        CapacitorUpdater.addListener('updateAvailable', async res => {
            try {
                if (res?.bundle?.version && res?.bundle) {
                    newModal(
                        <CapGoUpdateModal
                            closeModal={() => closeModal()}
                            bundle={res?.bundle}
                            updateVersion={res?.bundle?.version}
                        />,
                        {
                            sectionClassName: '!max-w-[400px]',
                            cancelButtonTextOverride: 'Maybe Later',
                        }
                    );
                }
            } catch (error) {
                console.log(error);
            }
        });

        return () => {
            CapacitorUpdater.removeAllListeners();
        };
    }, []);

    const handleShareModal = () => setShareCredsIsOpen(true);
    const handleCloseShareModal = () => setShareCredsIsOpen(false);
    const handleViewModal = () => setViewCredsIsOpen(true);
    const handleCloseViewModal = () => setViewCredsIsOpen(false);

    const categoryToPath = CATEGORY_TO_ROUTE;

    const AI_CATEGORIES = [
        CredentialCategoryEnum.aiTopic,
        CredentialCategoryEnum.aiPathway,
        CredentialCategoryEnum.aiInsight,
    ];

    const handleClickSquare = async (categoryType: CredentialCategoryEnum) => {
        const path = categoryToPath[categoryType];
        if (!path) return;

        if (AI_CATEGORIES.includes(categoryType) && !isAiEnabled) {
            const msg =
                reason === 'disabled_minor'
                    ? 'AI features are not available for users under 18.'
                    : 'AI features are currently disabled. You can enable them in Privacy & Data from your profile.';
            presentToast(msg, { type: ToastTypeEnum.Error });
            return;
        }

        if (path === '/ai/topics') {
            chatBotStore.set.resetStore();
        }

        // Await the destination chunk before navigating so WalletPage stays
        // mounted (no Suspense fallback flash). Idle-prefetch on mount means
        // this resolves instantly in the common case; on slow networks, cap
        // the wait so a stalled fetch doesn't block navigation forever.
        const preload = WALLET_ROUTE_PRELOAD[path];
        if (preload) {
            await Promise.race([
                preload(),
                new Promise<void>(resolve => setTimeout(resolve, 4000)),
            ]).catch(() => undefined);
        }

        history.push(path);
    };

    const renderWalletList = categories?.map(category => {
        const { categoryId: categoryType } = category;

        if (categoryType === CredentialCategoryEnum.family && !canCreateFamilies) {
            return <React.Fragment key={categoryType}></React.Fragment>;
        }

        if (categoryType === CredentialCategoryEnum.resume) {
            return <React.Fragment key={categoryType}></React.Fragment>;
        }

        if (categoryType === CredentialCategoryEnum.aiInsight && !showAiInsights) {
            return <React.Fragment key={categoryType}></React.Fragment>;
        }

        if (categoryType === CredentialCategoryEnum.aiPathway && hideAiPathways) {
            return <React.Fragment key={categoryType}></React.Fragment>;
        }

        return (
            <GenericErrorBoundary key={categoryType}>
                <WalletPageItemWrapper
                    handleClickSquare={handleClickSquare}
                    walletPageItem={category}
                />
            </GenericErrorBoundary>
        );
    });

    const isGrid = viewMode === PassportPageViewMode.grid;
    const isList = viewMode === PassportPageViewMode.list;

    return (
        <IonPage
            className="bg-white"
            style={passportBgColor ? { backgroundColor: passportBgColor } : undefined}
        >
            <MainHeader
                customClassName={passportBgColor ? '' : 'bg-white'}
                style={passportBgColor
                    ? isMobile
                        ? {
                            background: 'linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,0.8))',
                            backdropFilter: 'blur(5px)',
                            WebkitBackdropFilter: 'blur(5px)',
                            borderBottom: '1px solid white',
                        }
                        : { backgroundColor: passportBgColor }
                    : undefined
                }
                notificationColorOverride={passportBgColor && !isMobile ? 'text-white' : undefined}
            />
            <GenericErrorBoundary>
                <IonContent
                    fullscreen
                    style={passportBgColor ? { '--background': passportBgColor } as React.CSSProperties : undefined}
                >
                    <div className={`px-[20px] ${passportBgColor ? 'pt-[12px]' : ''}`}>
                        <div className="flex flex-col max-w-[600px] mx-auto">
                            <IonRow>
                                <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-[10px] w-full">
                                        <h2 className={`${passportTextColor} font-poppins text-[25px] tracking-[0.25px]`}>
                                            Passport
                                        </h2>

                                        {/* 
                                        // TODOS:
                                        - add support for new items count based on categories
                                        */}
                                        {totalNewCredentialsCount > 0 && (
                                            <p className={`${passportBgColor ? 'text-white/80' : 'text-emerald-700'} font-poppins text-[17px] font-[600] leading-[130%] flex items-center gap-[5px]`}>
                                                <DotIcon className="w-[10px] h-[10px]" />{' '}
                                                {totalNewCredentialsCount} New
                                            </p>
                                        )}
                                    </div>
                                    <div className="wallet-header-menu-options items-center flex gap-[10px]">
                                        {flags?.boostBundleMenu && (
                                            <WalletActionButton
                                                location={location}
                                                handleSelfIssue={handleViewModal}
                                                handleShareCreds={handleShareModal}
                                            />
                                        )}

                                        <div className="flex items-center justify-end">
                                            <WalletPageViewModeSelector />
                                            <ThemeSelector viewMode={themeSelectorViewMode.Mini} />
                                        </div>
                                    </div>
                                </div>
                            </IonRow>
                            {isMobile ? (
                                <>
                                    <CheckListButton className="mb-[10px] mt-[16px]" />
                                    <ResumeBuilderController className="mb-[16px]" />
                                </>
                            ) : (
                                <div
                                    className={`w-full flex gap-[10px] pt-[6px] pb-[16px] ${
                                        showInlineWalletActions ? 'flex-row' : 'flex-col'
                                    }`}
                                >
                                    {showChecklistButton && (
                                        <div className={showInlineWalletActions ? 'flex-1' : ''}>
                                            <CheckListButton
                                                mode={
                                                    showInlineWalletActions ? 'inline' : 'default'
                                                }
                                            />
                                        </div>
                                    )}
                                    {showResumeBuilderButton && (
                                        <div className={showInlineWalletActions ? 'flex-1' : ''}>
                                            <ResumeBuilderController mode="inline" />
                                        </div>
                                    )}
                                </div>
                            )}
                            <IonRow className="wallet-squares-wrapper max-w-[600px] mx-auto">
                                <IonCol
                                    className={`wallet-squares-container ${
                                        isList ? 'list' : 'grid'
                                    }`}
                                >
                                    {renderWalletList}
                                </IonCol>
                            </IonRow>
                        </div>
                    </div>
                </IonContent>
            </GenericErrorBoundary>

            <IonModal className="main-header-modal" isOpen={shareCredsIsOpen}>
                <ShareBoostsBundleModal onDismiss={handleCloseShareModal} />
            </IonModal>

            <IonModal className="main-header-modal" isOpen={viewCredsIsOpen}>
                <ViewSharedCredentials onDismiss={handleCloseViewModal} />
            </IonModal>
        </IonPage>
    );
};

export default WalletPage;
