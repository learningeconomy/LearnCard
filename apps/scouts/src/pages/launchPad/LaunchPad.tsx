import React, { useEffect, useState, useCallback } from 'react';
import queryString from 'query-string';
import { useHistory, useLocation, Link, useParams } from 'react-router-dom';
import { BrandingEnum, ModalTypes, useModal, BoostCategoryOptionsEnum } from 'learn-card-base';
import { IonContent, IonPage } from '@ionic/react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import * as m from '../../paraglide/messages.js';

import MainHeader from '../../components/main-header/MainHeader';
import CapGoUpdateModal from '../../components/capGoUpdateModal/CapGoUpdateModal';
import { RecoveryBanner } from '../../components/recovery/RecoveryBanner';
import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import NewBoostSelectMenu from '../../components/boost/boost-select-menu/NewBoostSelectMenu';
import { ScoutsNewsList } from '../../components/scout-news/ScoutNews';
import useAppConnectModal from '../../hooks/useConnectAppModal';
import { useGetUnreadUserNotifications } from 'learn-card-base';

import BoostOutline2 from 'learn-card-base/svgs/BoostOutline2';
import ContactsIcon from '../../assets/icons/ContactsIcon';
import TroopsIcon from '../../assets/icons/TroopsIcon';
import AlertsIcon from '../../assets/icons/AlertsIcon';
import ViewAlignmentInfo from '../SkillFrameworks/ViewAlignmentInfo';
import { useCheckIfUserInNetwork } from '../../components/network-prompts/hooks/useCheckIfUserInNetwork';
import { getLogger } from 'learn-card-base';
const log = getLogger('launch-pad');

type CapacitorBundle = {
    version: string;
    [key: string]: unknown;
};

const LaunchPad: React.FC = () => {
    const history = useHistory();
    const { search } = useLocation();
    const { connectTo, challenge } = queryString.parse(search);
    const { frameworkId, skillId } = useParams<{ frameworkId?: string; skillId?: string }>();

    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_updateVersion, setUpdateVersion] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_bundle, setBundle] = useState<CapacitorBundle | null>(null);
    const checkIfUserInNetwork = useCheckIfUserInNetwork();
    const { data: unreadNotifications } = useGetUnreadUserNotifications();
    const { presentConnectAppModal, loading: modalLoading } = useAppConnectModal(
        String(connectTo || ''),
        String(challenge || '')
    );

    const { recoveryMethodCount, openRecoverySetup } = useAppAuth();

    const isAndroid = /android/i.test(navigator.userAgent);

    const unreadCount = unreadNotifications?.notifications?.length || 0;

    useEffect(() => {
        if (frameworkId && skillId) {
            newModal(<ViewAlignmentInfo frameworkId={frameworkId} skillId={skillId} />, undefined, {
                desktop: ModalTypes.FullScreen,
                mobile: ModalTypes.FullScreen,
            });
        }
    }, []);

    const handleUpdateAvailable = async (res: { bundle: CapacitorBundle }) => {
        try {
            setUpdateVersion(res.bundle.version);
            setBundle(res.bundle);

            if (res.bundle) {
                newModal(
                    <CapGoUpdateModal
                        closeModal={() => closeModal()}
                        bundle={res?.bundle}
                        updateVersion={res?.bundle?.version}
                    />,
                    {
                        sectionClassName: '!max-w-[400px]',
                        cancelButtonTextOverride: m['launchPad.maybeLater'](),
                        topSectionClassName: '!py-[20px]',
                        androidClassName: isAndroid ? '!mb-[40px]' : '',
                    },
                    {
                        desktop: ModalTypes.Cancel,
                        mobile: ModalTypes.Cancel,
                    }
                );
            }
        } catch (error) {
            log.error('Update available error:', error);
        }
    };

    useEffect(() => {
        CapacitorUpdater.addListener('updateAvailable', handleUpdateAvailable);
        return () => {
            CapacitorUpdater.removeAllListeners();
        };
    }, []);

    useEffect(() => {
        if (connectTo && challenge && !modalLoading) {
            presentConnectAppModal();
        }
    }, [connectTo, challenge, modalLoading, presentConnectAppModal]);

    const handleBoostClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();

            if (!checkIfUserInNetwork()) {
                return;
            }

            newModal(
                <NewBoostSelectMenu
                    handleCloseModal={closeModal}
                    showHardcodedBoostPacks
                    category={BoostCategoryOptionsEnum.socialBadge}
                />,
                { className: '!p-0', sectionClassName: '!p-0' }
            );
        },
        [checkIfUserInNetwork, newModal, closeModal]
    );

    const navButtons = [
        {
            to: '/contacts',
            icon: <ContactsIcon />,
            text: m['launchPad.contacts'](),
            color: 'text-[#622599]',
        },
        {
            to: '/troops',
            icon: <TroopsIcon />,
            text: m['launchPad.troops'](),
            color: 'text-[#248737]',
        },
        {
            to: '/notifications',
            icon: <AlertsIcon unreadCount={unreadCount} />,
            text: m['launchPad.alerts'](),
            color: 'text-[#FF5655]',
            className: 'mt-1',
        },
    ];

    return (
        <IonPage className="bg-white">
            <MainHeader
                customClassName="bg-white px-0"
                branding={BrandingEnum.scoutPass}
                customHeaderClass="px-0"
            />

            <IonContent fullscreen>
                <div className="w-full flex justify-center px-4">
                    <RecoveryBanner
                        recoveryMethodCount={recoveryMethodCount}
                        onSetup={openRecoverySetup}
                    />
                </div>

                <section className="w-full flex items-center justify-center h-32">
                    <div className="flex items-center justify-around w-full max-w-[600px] h-32">
                        {navButtons.map(button => (
                            <Link
                                key={button.to}
                                to={button.to}
                                className="relative flex flex-col items-center justify-center p-4 rounded-3xl flex-1"
                            >
                                {button.icon}
                                <p
                                    className={`text-center font-notoSans text-xl font-bold leading-normal ${
                                        button.color
                                    } ${button.className || ''}`}
                                >
                                    {button.text}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="w-full flex items-center justify-center my-8 relative z-10">
                    <div className="flex flex-col items-center w-full max-w-[600px]">
                        <button
                            onClick={handleBoostClick}
                            className="flex items-center justify-center w-[95%] py-2.5 rounded-full bg-sp-blue-ocean text-white font-notoSans text-[25px] leading-[130%] tracking-[-0.25px] mb-6 shadow-button"
                            aria-label={m['launchPad.openBoostMenu']()}
                        >
                            <span className="mr-2">{m['launchPad.boost']()}</span>
                            <BoostOutline2
                                outsideStar="#FFFFFF"
                                insideStar="#03748D"
                                outlineStar="#FFFFFF"
                                inlineStar="#03748D"
                            />
                        </button>
                    </div>
                </section>

                <div className="relative w-full h-24 -mt-12 z-0">
                    <div className="absolute bottom-0 inset-x-0 h-48 bg-white" />
                    <div className="absolute -bottom-24 inset-x-[-5%] h-48 bg-[#EFF0F5] rounded-t-[100%] shadow-divider" />
                </div>

                <section className="mt-[-50px] relative">
                    <h2 className="w-full max-w-[600px] px-4 mx-auto font-rubik text-grayscale-900 font-medium text-2xl tracking-0.01">
                        {m['launchPad.latestNews']()}
                    </h2>
                    <div className="bg-gray-100 px-4">
                        <ScoutsNewsList />
                    </div>
                </section>
            </IonContent>
        </IonPage>
    );
};

export default LaunchPad;
