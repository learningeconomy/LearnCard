import React, { useEffect, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useHistory, useLocation, Link } from 'react-router-dom';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

import passportPageStore, { PassportPageViewMode } from '../../stores/passportPageStore';

import {
    useModal,
    ModalTypes,
    useGetCredentialList,
    CredentialCategoryEnum,
    newCredsStore,
    lazyWithRetry,
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

    const { theme } = useTheme();
    const categories = theme.categories;

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
    const placeholderCategories = [
        CredentialCategoryEnum.aiPathway,
        CredentialCategoryEnum.aiInsight,
    ];

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

    const categoryToPath: Partial<Record<CredentialCategoryEnum, string>> = {
        [CredentialCategoryEnum.aiTopic]: '/ai/topics',
        // [CredentialCategoryEnum.aiPathway]: '/ai/pathways', // placeholder
        [CredentialCategoryEnum.aiInsight]: '/ai/insights', // placeholder
        [CredentialCategoryEnum.skill]: '/skills',
        [CredentialCategoryEnum.socialBadge]: '/socialBadges',
        [CredentialCategoryEnum.achievement]: '/achievements',
        [CredentialCategoryEnum.learningHistory]: '/learninghistory',
        [CredentialCategoryEnum.accomplishment]: '/accomplishments',
        [CredentialCategoryEnum.accommodation]: '/accommodations',
        [CredentialCategoryEnum.workHistory]: '/workhistory',
        [CredentialCategoryEnum.family]: '/families',
        [CredentialCategoryEnum.id]: '/ids',
        [CredentialCategoryEnum.membership]: '/memberships',
    };

    const handleClickSquare = (categoryType: CredentialCategoryEnum) => {
        const path = categoryToPath[categoryType];
        if (path) history.push(path);
    };

    const renderWalletList = categories?.map(category => {
        const { categoryId: categoryType } = category;

        if (categoryType === CredentialCategoryEnum.family && !canCreateFamilies) {
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
        <IonPage className="bg-white">
            <MainHeader customClassName="bg-white" />
            <GenericErrorBoundary>
                <IonContent fullscreen>
                    <div className="px-[20px]">
                        <div className="flex flex-col max-w-[600px] mx-auto">
                            <IonRow>
                                <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-[10px] w-full">
                                        <h2 className="text-grayscale-900 font-poppins text-[25px] tracking-[0.25px]">
                                            Passport
                                        </h2>

                                        {/* 
                                        // TODOS:
                                        - add support for new items count based on categories
                                        */}
                                        {totalNewCredentialsCount > 0 && (
                                            <p className="text-emerald-700 font-poppins text-[17px] font-[600] leading-[130%] flex items-center gap-[5px]">
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
                            <CheckListButton className="mb-[10px] mt-[10px]" />
                            <ResumeBuilderController className="mb-[10px]" />
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
