import React, { useEffect, useState, useCallback } from 'react';
import queryString from 'query-string';
import { useHistory, useLocation, Link } from 'react-router-dom';
import { BrandingEnum, CredentialCategoryEnum, ModalTypes, useModal } from 'learn-card-base';
import { IonContent, useIonModal, IonPage } from '@ionic/react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { useFlags } from 'launchdarkly-react-client-sdk';

import MainHeader from '../../components/main-header/MainHeader';
import CapGoUpdateModal from '../../components/capGoUpdateModal/CapGoUpdateModal';
import NewBoostSelectMenu from '../../components/boost/boost-select-menu/NewBoostSelectMenu';
import { ScoutsNewsList } from '../../components/scout-news/ScoutNews';
import { MV_TYPEFORM, openExternalLink } from '../../helpers/externalLinkHelpers';
import useAppConnectModal from '../../hooks/useConnectAppModal';
import { useJoinLCNetworkModal } from '../../components/network-prompts/hooks/useJoinLCNetworkModal';
import { useIsCurrentUserLCNUser, useGetUnreadUserNotifications } from 'learn-card-base';

import MiniPack from '../../assets/images/mini-pack.png';
import BoostOutline2 from 'learn-card-base/svgs/BoostOutline2';
import ContactsIcon from '../../assets/icons/ContactsIcon';
import TroopsIcon from '../../assets/icons/TroopsIcon';
import AlertsIcon from '../../assets/icons/AlertsIcon';

type CapacitorBundle = {
    version: string;
    [key: string]: unknown;
};

const LaunchPad: React.FC = () => {
    const history = useHistory();
    const { search } = useLocation();
    const flags = useFlags();
    const { connectTo, challenge } = queryString.parse(search);
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const [updateVersion, setUpdateVersion] = useState('');
    const [bundle, setBundle] = useState<CapacitorBundle | null>(null);
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();
    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();
    const { data: unreadNotifications } = useGetUnreadUserNotifications();
    const { presentConnectAppModal, loading: modalLoading } = useAppConnectModal(
        String(connectTo || ''),
        String(challenge || '')
    );

    const isAndroid = /android/i.test(navigator.userAgent);

    const unreadCount = unreadNotifications?.notifications?.length || 0;

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
                        cancelButtonTextOverride: 'Maybe Later',
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
            console.error('Update available error:', error);
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
            presentConnectAppModal({
                cssClass: 'center-modal network-accept-modal',
                showBackdrop: false,
                onDidDismiss: ({ role }) => role === 'backdrop' && history.push('/launchpad'),
            });
        }
    }, [connectTo, challenge, modalLoading, presentConnectAppModal, history]);

    const handleBoostClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();

            if (!currentLCNUser && !currentLCNUserLoading) {
                handlePresentJoinNetworkModal();
                return;
            }

            newModal(
                <NewBoostSelectMenu
                    handleCloseModal={closeModal}
                    showHardcodedBoostPacks
                    category={CredentialCategoryEnum.socialBadge}
                />,
                { className: '!p-0', sectionClassName: '!p-0' }
            );
        },
        [currentLCNUser, currentLCNUserLoading, handlePresentJoinNetworkModal, newModal, closeModal]
    );

    const navButtons = [
        { to: '/contacts', icon: <ContactsIcon />, text: 'Contacts', color: 'text-[#622599]' },
        { to: '/troops', icon: <TroopsIcon />, text: 'Troops', color: 'text-[#248737]' },
        {
            to: '/notifications',
            icon: <AlertsIcon unreadCount={unreadCount} />,
            text: 'Alerts',
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

                        {!flags?.hideSchoolsButton && (
                            <button
                                onClick={() => openExternalLink(MV_TYPEFORM)}
                                className="relative flex flex-col items-center justify-center p-4 rounded-3xl flex-1 mr-3"
                                aria-label="Manage schools"
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-emerald-50 rounded-full" />
                                <img src={MiniPack} alt="Schools icon" className="z-50 h-15" />
                                <p className="text-medium font-medium text-grayscale-900">
                                    Schools
                                </p>
                            </button>
                        )}
                    </div>
                </section>

                <section className="w-full flex items-center justify-center my-8 relative z-10">
                    <div className="flex flex-col items-center w-full max-w-[600px]">
                        <button
                            onClick={handleBoostClick}
                            className="flex items-center justify-center w-[95%] py-2.5 rounded-full bg-sp-blue-ocean text-white font-notoSans text-[25px] leading-[130%] tracking-[-0.25px] mb-6 shadow-button"
                            aria-label="Open boost menu"
                        >
                            <span className="mr-2">Boost</span>
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
                        Latest News
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
