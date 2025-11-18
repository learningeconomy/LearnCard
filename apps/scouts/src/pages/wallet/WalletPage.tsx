import React, { ReactElement, useState, useEffect } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { useHistory, useLocation } from 'react-router-dom';

import { IonPage, IonContent, IonRow, IonCol, IonModal, useIonModal } from '@ionic/react';

import WalletSquare from './WalletSquare';
import MainHeader from '../../components/main-header/MainHeader';
import ShareBoostsBundleModal from '../../components/creds-bundle/ShareBoostsBundleModal';
import CapGoUpdateModal from '../../components/capGoUpdateModal/CapGoUpdateModal';
import WalletActionButton from '../../components/main-subheader/WalletActionButton';
import ViewSharedCredentials from 'learn-card-base/components/sharecreds/ViewSharedCredentials';

import modalStateStore from 'learn-card-base/stores/modalStateStore';

import { ICONS_TO_SOURCE } from './constants';
import {
    useCurrentUser,
    CredentialCategory,
    BrandingEnum,
    useModal,
    ModalTypes,
} from 'learn-card-base';

import { useFlags } from 'launchdarkly-react-client-sdk';
import BoostOutline2 from 'learn-card-base/svgs/BoostOutline2';
import MeritBadgesIcon from 'learn-card-base/svgs/MeritBadgesIcon';
import ScoutsPledge2 from 'learn-card-base/svgs/ScoutsPledge2';

const WALLET_SUBTYPES = {
    socialBadge: 'socialBadge',
    meritBadge: 'meritBadge',
    troops: 'troops',
};

type SubType = (typeof WALLET_SUBTYPES)[keyof typeof WALLET_SUBTYPES];

const SUBTYPE_TO_CATEGORY: Record<SubType, CredentialCategory | null> = {
    socialBadge: 'Social Badge',
    meritBadge: 'Merit Badge',
    troops: 'Membership',
};

const walletPageData: {
    id: number;
    title: string;
    subtype: SubType;
    description: string;
    count: string;
    bgColor: string;
    iconSrc: React.FC;
    iconCircleClass: string;
}[] = [
        {
            id: 1,
            title: 'Social Boosts',
            subtype: WALLET_SUBTYPES.socialBadge,
            description: 'Showcase your social milestones',
            count: '0',
            iconSrc: (
                <BoostOutline2
                    outsideStar="#FFFFFF"
                    insideStar="#82E6DE"
                    outlineStar="#03748D"
                    inlineStar="#03748D"
                />
            ),
            bgColor: 'bg-sp-blue-ocean',
            iconCircleClass: 'border-2 border-cyan-300',
        },
        {
            id: 3,
            title: 'Merit Badges',
            subtype: WALLET_SUBTYPES.meritBadge,
            description: 'Collect your scouting achievements',
            count: '0',
            bgColor: 'bg-sp-purple-base',
            iconSrc: <MeritBadgesIcon badgeOutline="#4D006E" mountain="#FF8DFF" />,
            iconCircleClass: 'border-2 border-spice-300',
        },
        {
            id: 4,
            title: 'Troops',
            subtype: WALLET_SUBTYPES.troops,
            description: 'Access your troop affiliations',
            count: '0',
            bgColor: 'bg-sp-green-forest',
            iconSrc: <ScoutsPledge2 ribbon="#9FED8F" pledgeOutline="#0F631D" />,
            iconCircleClass: 'border-2 border-emerald-300',
        },
    ];

const WalletPage: React.FC = () => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const history = useHistory();
    const location = useLocation();

    const currentUser = useCurrentUser();
    const [isOpen, setIsOpen] = useState(false);
    const [shareCredsIsOpen, setShareCredsIsOpen] = useState(false);
    const [viewCredsIsOpen, setViewCredsIsOpen] = useState(false);
    const flags = useFlags();
    const pathName = location?.pathname?.replace('/', '');

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

    const handleShareModal = () => {
        setShareCredsIsOpen(true);
    };

    const handleCloseShareModal = () => {
        setShareCredsIsOpen(false);
    };

    const handleViewModal = () => {
        setViewCredsIsOpen(true);
    };

    const handleCloseViewModal = () => {
        setViewCredsIsOpen(false);
    };

    const handleClickModal = () => {
        modalStateStore.set.issueVcModal({ open: true, name: pathName });
        setIsOpen(true);
    };

    const handleClickSquare = (subtype: SubType) => {
        if (subtype === WALLET_SUBTYPES.meritBadge) {
            history.push('/badges');
        }
        if (subtype === WALLET_SUBTYPES.socialBadge) {
            history.push('/boosts');
        }
        if (subtype === WALLET_SUBTYPES.troops) {
            history.push('/troops');
        }
    };

    const renderWalletList = walletPageData?.map(dataSrc => {
        const { title, id, description, bgColor, iconSrc, subtype, iconCircleClass } = dataSrc;
        const category = SUBTYPE_TO_CATEGORY[subtype];
        return (
            <WalletSquare
                type={subtype}
                category={category}
                iconSrc={iconSrc}
                title={title}
                key={id}
                description={description}
                bgColor={bgColor}
                onClick={() => handleClickSquare(subtype)}
            // iconCircleClass={iconCircleClass}
            />
        );
    });

    return (
        <IonPage className="bg-white">
            <MainHeader customClassName="bg-white" branding={BrandingEnum.scoutPass} />
            <IonContent fullscreen>
                <IonRow className="px-[20px] flex items-center justify-center">
                    <div className="w-full max-w-[380px] mx-auto">
                        <h2 className="text-grayscale-900 font-medium text-2xl tracking-[0.01rem]">
                            Wallet
                        </h2>
                        {/* <div className="wallet-header-menu-options items-center flex">
                            {flags?.boostBundleMenu && (
                                <WalletActionButton
                                    location={location}
                                    handleSelfIssue={handleViewModal}
                                    handleShareCreds={handleShareModal}
                                />
                            )}
                        </div> */}
                    </div>
                </IonRow>
                <IonRow className="wallet-squares-wrapper pb-10">
                    <IonCol className="wallet-squares-container">{renderWalletList}</IonCol>
                </IonRow>
            </IonContent>

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
