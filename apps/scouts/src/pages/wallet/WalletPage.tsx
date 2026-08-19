import React, { ReactElement, useEffect } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { useHistory, useLocation } from 'react-router-dom';

import { IonPage, IonContent, IonRow, IonCol } from '@ionic/react';

import WalletSquare from './WalletSquare';
import MainHeader from '../../components/main-header/MainHeader';
import CapGoUpdateModal from '../../components/capGoUpdateModal/CapGoUpdateModal';

import { ICONS_TO_SOURCE } from './constants';
import {
    useCurrentUser,
    CredentialCategory,
    BrandingEnum,
    useModal,
    ModalTypes,
    categoryMetadata,
    walletSubtypeToCredentialCategory,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';

import * as m from '../../paraglide/messages.js';
import BoostOutline2 from 'learn-card-base/svgs/BoostOutline2';
import MeritBadgesIcon from 'learn-card-base/svgs/MeritBadgesIcon';
import ScoutsPledge2 from 'learn-card-base/svgs/ScoutsPledge2';
import { WalletCategoryTypes } from 'learn-card-base/components/IssueVC/types';
import { getScoutPassCategoryCopy } from '../../components/category-descriptor/scoutPassCategoryCopy';
import { getLogger } from 'learn-card-base';
const log = getLogger('wallet-page');

const WalletPage: React.FC = () => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const history = useHistory();
    const location = useLocation();

    const currentUser = useCurrentUser();
    const socialBoostsCopy = getScoutPassCategoryCopy(m, BoostCategoryOptionsEnum.socialBadge);
    const meritBadgesCopy = getScoutPassCategoryCopy(m, BoostCategoryOptionsEnum.meritBadge);
    const troopsCopy = getScoutPassCategoryCopy(m, BoostCategoryOptionsEnum.membership);

    const walletPageData = [
        {
            id: 1,
            title: socialBoostsCopy?.titleOther ?? '',
            subtype: WalletCategoryTypes.socialBadges,
            description: socialBoostsCopy?.walletDescription ?? '',
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
            title: meritBadgesCopy?.titleOther ?? '',
            subtype: WalletCategoryTypes.meritBadges,
            description: meritBadgesCopy?.walletDescription ?? '',
            count: '0',
            iconSrc: <MeritBadgesIcon badgeOutline="#4D006E" mountain="#FF8DFF" />,
            bgColor: 'bg-sp-purple-base',
            iconCircleClass: 'border-2 border-spice-300',
        },
        {
            id: 4,
            title: troopsCopy?.titleOther ?? '',
            subtype: WalletCategoryTypes.membership,
            description: troopsCopy?.walletDescription ?? '',
            count: '0',
            iconSrc: <ScoutsPledge2 ribbon="#9FED8F" pledgeOutline="#0F631D" />,
            bgColor: 'bg-sp-green-forest',
            iconCircleClass: 'border-2 border-emerald-300',
        },
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
                            cancelButtonTextOverride: m['launchPad.maybeLater'](),
                        }
                    );
                }
            } catch (error) {
                log.debug(error);
            }
        });

        return () => {
            CapacitorUpdater.removeAllListeners();
        };
    }, []);

    const handleClickSquare = (subtype: WalletCategoryTypes) => {
        if (subtype === WalletCategoryTypes.meritBadges) {
            history.push('/badges');
        }
        if (subtype === WalletCategoryTypes.socialBadges) {
            history.push('/boosts');
        }
        if (subtype === WalletCategoryTypes.membership) {
            history.push('/troops');
        }
    };

    const renderWalletList = walletPageData?.map(dataSrc => {
        const { title, id, description, bgColor, iconSrc, subtype, iconCircleClass } = dataSrc;
        const category = walletSubtypeToCredentialCategory(subtype);
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
                            {m['wallet.title']()}
                        </h2>
                    </div>
                </IonRow>
                <IonRow className="wallet-squares-wrapper pb-10">
                    <IonCol className="wallet-squares-container">{renderWalletList}</IonCol>
                </IonRow>
            </IonContent>
        </IonPage>
    );
};

export default WalletPage;
