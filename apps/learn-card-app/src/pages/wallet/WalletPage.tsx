import React, { useEffect, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useHistory, useLocation, Link } from 'react-router-dom';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { getLogger } from 'learn-card-base';
const log = getLogger('wallet-page');

import passportPageStore, { PassportPageViewMode } from '../../stores/passportPageStore';
import { CATEGORY_TO_ROUTE } from '../../helpers/categoryRoutes';

import {
    useModal,
    ModalTypes,
    CredentialCategoryEnum,
    newCredsStore,
    lazyWithRetry,
    useAiFeatureGate,
    useToast,
    ToastTypeEnum,
    useDeviceTypeByWidth,
} from 'learn-card-base';

import ThemeSelector, { themeSelectorViewMode } from '../../theme/components/ThemeSelector';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';
import WalletActionButton from '../../components/main-subheader/WalletActionButton';
import CapGoUpdateModal from '../../components/capGoUpdateModal/CapGoUpdateModal';
import { IonPage, IonContent, IonRow, IonCol, IonModal } from '@ionic/react';
import WalletPageViewModeSelector from './WalletPageViewModeSelector';
import MainHeader from '../../components/main-header/MainHeader';
import WalletPageItemWrapper from './WalletPageItemWrapper';
import { filterPassportCategories } from './passportCategories';
import PassportActivityFeed from './activity-feed/PassportActivityFeed';
import DotIcon from 'learn-card-base/svgs/DotIcon';

import { useTheme } from '../../theme/hooks/useTheme';
import { chatBotStore } from '../../stores/chatBotStore';
import { prefetchRoutes, ROUTE_PRELOAD } from '../../Routes';
import useHeaderScrollSync from '../../hooks/useHeaderScrollSync';

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
    const categories = filterPassportCategories(theme.categories ?? []);

    const passportBgColor = colors?.defaults?.passportBgColor;
    const passportTextColor = colors?.defaults?.passportTextColor ?? 'text-grayscale-900';

    const [shareCredsIsOpen, setShareCredsIsOpen] = useState(false);
    const [viewCredsIsOpen, setViewCredsIsOpen] = useState(false);

    const viewMode = passportPageStore.use.viewMode();
    const totalNewCredentialsCount = newCredsStore.use.totalNewCredentialsCount();

    const showActivityFeed = Boolean(flags?.enablePassportActivityFeed);
    const { isAiEnabled, reason } = useAiFeatureGate();
    const { presentToast } = useToast();

    useEffect(() => {
        prefetchRoutes({ aiEnabled: isAiEnabled });
    }, [isAiEnabled]);

    const onHeaderScroll = useHeaderScrollSync();

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
                log.info(error);
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
        const preload = ROUTE_PRELOAD[path];
        if (preload) {
            await Promise.race([
                preload(),
                new Promise<void>(resolve => setTimeout(resolve, 4000)),
            ]).catch(() => undefined);
        }

        history.push(path);
    };

    const renderWalletList = categories?.map(category => (
        <GenericErrorBoundary key={category.categoryId}>
            <WalletPageItemWrapper
                handleClickSquare={handleClickSquare}
                walletPageItem={category}
            />
        </GenericErrorBoundary>
    ));

    const isList = viewMode === PassportPageViewMode.list;
    // The list/grid switcher is mobile-only; desktop is always the tiled grid.
    const effectiveIsList = isMobile && isList;

    return (
        <IonPage
            className="bg-grayscale-100"
            style={passportBgColor ? { backgroundColor: passportBgColor } : undefined}
        >
            <MainHeader
                // Mobile: white frosted-glass bar (matches the bottom nav). Desktop:
                // transparent bar so it doesn't chop tiles scrolling under it — the
                // gray content shows through and the island floats as its own pill
                // (or the themed passport color when set).
                customClassName=""
                style={
                    isMobile
                        ? {
                              background:
                                  'linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,0.8))',
                              backdropFilter: 'blur(5px)',
                              WebkitBackdropFilter: 'blur(5px)',
                              borderBottom: '1px solid white',
                          }
                        : passportBgColor
                        ? { backgroundColor: passportBgColor }
                        : ({ '--background': 'transparent' } as React.CSSProperties)
                }
                notificationColorOverride={passportBgColor && !isMobile ? 'text-white' : undefined}
            />
            <GenericErrorBoundary>
                <IonContent
                    fullscreen
                    color="grayscale-100"
                    scrollEvents
                    onIonScroll={onHeaderScroll}
                    style={
                        passportBgColor
                            ? ({ '--background': passportBgColor } as React.CSSProperties)
                            : undefined
                    }
                >
                    <div className={`px-[20px] ${passportBgColor ? 'pt-[12px]' : ''}`}>
                        <div className="flex flex-col max-w-[840px] mx-auto">
                            <IonRow>
                                <div className="flex justify-between items-center w-full gap-[10px]">
                                    <h2
                                        className={`${passportTextColor} font-poppins text-[30px] font-normal tracking-[0.25px]`}
                                    >
                                        Passport
                                    </h2>

                                    <div className="wallet-header-menu-options items-center flex gap-[15px]">
                                        {totalNewCredentialsCount > 0 && (
                                            <p
                                                className={`${
                                                    passportBgColor
                                                        ? 'text-white/80'
                                                        : 'text-emerald-700'
                                                } font-poppins text-[17px] font-[600] leading-[130%] flex items-center gap-[5px] whitespace-nowrap`}
                                            >
                                                <DotIcon className="w-[10px] h-[10px]" />{' '}
                                                {totalNewCredentialsCount} New Credentials
                                            </p>
                                        )}
                                        {flags?.boostBundleMenu && (
                                            <WalletActionButton
                                                location={location}
                                                handleSelfIssue={handleViewModal}
                                                handleShareCreds={handleShareModal}
                                            />
                                        )}

                                        {/* View switcher + theme picker are mobile-only; on
                                            desktop the grid is fixed and the theme is set from
                                            the side menu (Colorful Mode). */}
                                        {isMobile && (
                                            <div className="flex items-center justify-end">
                                                <WalletPageViewModeSelector />
                                                <ThemeSelector
                                                    viewMode={themeSelectorViewMode.Mini}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </IonRow>
                            <IonRow className="wallet-squares-wrapper max-w-[840px] mx-auto mt-[16px]">
                                <IonCol
                                    className={`wallet-squares-container ${
                                        effectiveIsList ? 'list' : 'grid'
                                    }`}
                                >
                                    {renderWalletList}
                                </IonCol>
                            </IonRow>
                            {showActivityFeed && <PassportActivityFeed />}
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
