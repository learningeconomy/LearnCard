import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import CaretListItem from '../../pages/troop/CaretListItem';
import ScoutsIdView from './ScoutsIdView';
import ScoutPassFooter from './ScoutPassFooter';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';

import IdViewDivetFrame from '../svgs/IdViewDivetFrame';
import SignOutIcon from 'learn-card-base/svgs/SignOutIcon';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import UserProfileSetup from '../user-profile/UserProfileSetup';
import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';
import BluePaintBrush from 'learn-card-base/svgs/BluePaintBrush';
import ScoutsGlobe2Colored from 'learn-card-base/svgs/ScoutsGlobe2Colored';
import QrCodeUserCardModal from '../qrcode-user-card/QRCodeUserCard';
import OrangeProfileIcon from 'learn-card-base/svgs/OrangeProfileIcon';
import ConnectedAppsIcon from 'learn-card-base/svgs/ConnectedAppsIcon';
import ScoutPassIDCMS, { ScoutPassIdCMSEditorModeEnum } from '../scoutsID-CMS/ScoutPassIDCMS';

import {
    useModal,
    useGetConnections,
    useIsCurrentUserLCNUser,
    BrandingEnum,
    ModalTypes,
    useGetCurrentLCNUser,
    useCurrentUser,
    useWallet,
} from 'learn-card-base';
import useLogout from '../../hooks/useLogout';

import {
    DEFAULT_COLOR_LIGHT,
    DEFAULT_SCOUTPASS_ID_ISSUER_THUMBNAIL,
    DEFAULT_SCOUTS_WALLPAPER,
} from '../scoutsID-CMS/scouts-cms.helpers';

import { UserCMSAppearance } from '../scoutsID-CMS/scouts-cms.helpers';
import { LCNProfile } from '@learncard/types';

type MyScoutsModalProps = {
    branding: BrandingEnum;
    user?: LCNProfile;
    hideLogout?: boolean;
    hideEdit?: boolean;
    hideShare?: boolean;
};

const MyScoutsModal: React.FC<MyScoutsModalProps> = ({
    branding,
    user: _user,
    hideLogout = false,
    hideEdit = false,
    hideShare = false,
}) => {
    const [user, setUser] = useState(_user);

    const { initWallet } = useWallet();
    const history = useHistory();
    const currentUser = useCurrentUser();
    const { currentLCNUser, refetch } = useGetCurrentLCNUser();

    const { newModal, closeModal } = useModal();
    const { handleLogout, isLoggingOut } = useLogout();

    const { data: isNetworkUser } = useIsCurrentUserLCNUser();
    const notInNetwork = isNetworkUser === false;

    const { data: connections } = useGetConnections();
    const numConnectedApps = connections?.filter(c => c.isServiceProfile)?.length;

    const description = user?.bio ?? user?.shortBio;

    let scoutPassDisplayStyles = currentLCNUser?.display;

    const handleUpdateMyScoutPassID = async (scoutPassIDUpdates: UserCMSAppearance) => {
        const wallet = await initWallet();

        const updatedProfile = await wallet?.invoke?.updateProfile({
            display: {
                // container styles
                backgroundColor: scoutPassIDUpdates?.backgroundColor ?? DEFAULT_COLOR_LIGHT,
                backgroundImage: scoutPassIDUpdates?.backgroundImage ?? DEFAULT_SCOUTS_WALLPAPER,
                fadeBackgroundImage: scoutPassIDUpdates?.fadeBackgroundImage ?? false,
                repeatBackgroundImage: scoutPassIDUpdates?.repeatBackgroundImage ?? false,

                // id styles
                fontColor: scoutPassIDUpdates?.fontColor ?? DEFAULT_COLOR_LIGHT,
                accentColor: scoutPassIDUpdates?.accentColor ?? '#ffffff',
                accentFontColor: scoutPassIDUpdates?.accentFontColor ?? '',
                idBackgroundImage:
                    scoutPassIDUpdates?.idBackgroundImage ?? DEFAULT_SCOUTS_WALLPAPER,
                fadeIdBackgroundImage: scoutPassIDUpdates?.dimIdBackgroundImage ?? true,
                idBackgroundColor: scoutPassIDUpdates?.idBackgroundColor ?? '#2DD4BF',
                repeatIdBackgroundImage: scoutPassIDUpdates?.repeatIdBackgroundImage ?? false,
            },
        });

        refetch();
    };

    const rows: {
        Icon: React.FC;
        title: string;
        caretText?: string;
        onClick?: () => void;
        hide?: boolean;
    }[] = [];

    rows.push(
        {
            title: 'My Contacts',
            Icon: ScoutsGlobe2Colored,
            caretText: connections?.length.toString() ?? '...',
            onClick: () => {
                closeModal();
                history.push('/contacts');
            },
            hide: notInNetwork,
        },
        {
            title: 'My Account',
            Icon: OrangeProfileIcon,
            caretText: '',
            onClick: () => {
                newModal(
                    <UserProfileSetup
                        title="My Account"
                        handleCloseModal={closeModal}
                        handleLogout={() => handleLogout(branding)}
                        showNetworkSettings={true}
                        showNotificationsModal={false}
                    />,
                    { sectionClassName: '!max-w-[400px]' },
                    { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
                );
            },
        }
    );

    if (!hideEdit) {
        rows.push({
            title: 'Edit Contact Card',
            Icon: BluePaintBrush,
            caretText: '',
            onClick: () => {
                const scoutPassId = {
                    backgroundColor: scoutPassDisplayStyles?.backgroundColor ?? DEFAULT_COLOR_LIGHT,
                    backgroundImage:
                        scoutPassDisplayStyles?.backgroundImage ?? DEFAULT_SCOUTS_WALLPAPER,
                    fadeBackgroundImage: scoutPassDisplayStyles?.fadeBackgroundImage ?? false,
                    repeatBackgroundImage: scoutPassDisplayStyles?.repeatBackgroundImage ?? false,

                    fontColor: scoutPassDisplayStyles?.fontColor ?? DEFAULT_COLOR_LIGHT,
                    accentColor: scoutPassDisplayStyles?.accentColor ?? '#ffffff',
                    idBackgroundImage:
                        scoutPassDisplayStyles?.idBackgroundImage ?? DEFAULT_SCOUTS_WALLPAPER,
                    dimIdBackgroundImage: scoutPassDisplayStyles?.fadeIdBackgroundImage ?? true,
                    idIssuerThumbnail: DEFAULT_SCOUTPASS_ID_ISSUER_THUMBNAIL,
                    showIdIssuerImage: true,
                    idThumbnail: '',
                    accentFontColor: '',
                    idBackgroundColor: scoutPassDisplayStyles?.idBackgroundColor ?? '#2DD4BF',
                    repeatIdBackgroundImage:
                        scoutPassDisplayStyles?.repeatIdBackgroundImage ?? false,
                    idDescription: 'ScoutPass',
                };

                newModal(
                    <ScoutPassIDCMS
                        scoutPassID={scoutPassId}
                        user={{
                            name:
                                user?.displayName ??
                                currentUser?.name ??
                                currentLCNUser?.displayName ??
                                '',
                            shortBio: currentLCNUser?.bio,
                            image:
                                user?.image ?? currentLCNUser?.image ?? currentUser?.profileImage,
                            scoutPassID: scoutPassId,
                        }}
                        handleSaveScoutPassID={handleUpdateMyScoutPassID}
                        handleCloseModal={() => closeModal()}
                        showIssueDate={false}
                        viewMode={ScoutPassIdCMSEditorModeEnum.edit}
                    />,
                    {},
                    { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                );
            },
        });
    }

    const handleQrCodeClick = () => {
        newModal(
            <QrCodeUserCardModal
                branding={branding}
                history={history}
                connections={connections ?? []}
                qrOnly
            />,
            { sectionClassName: '!max-w-[400px]' },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    const appearance = scoutPassDisplayStyles ?? currentLCNUser?.display;
    const wallpaperImage = appearance?.backgroundImage ?? DEFAULT_SCOUTS_WALLPAPER;
    const wallpaperBackgroundColor = appearance?.backgroundColor ?? DEFAULT_COLOR_LIGHT;
    const isWallpaperFaded = appearance?.fadeBackgroundImage ?? false;
    const isWallpaperTiled = appearance?.repeatBackgroundImage ?? false;

    let backgroundStyles = {
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundImage: `url(${wallpaperImage})`,
        backgroundRepeat: 'no-repeat',
    };

    if (isWallpaperFaded) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundImage: `linear-gradient(#353E6480, #353E6480), url(${wallpaperImage})`,
        };

        if (wallpaperBackgroundColor) {
            backgroundStyles = {
                ...backgroundStyles,
                backgroundImage: `linear-gradient(${wallpaperBackgroundColor}80, ${wallpaperBackgroundColor}80), url(${wallpaperImage})`,
            };
        }
    }

    if (isWallpaperTiled) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
        };
    }

    if (!isWallpaperFaded) {
        backgroundStyles.backgroundColor = wallpaperBackgroundColor;
    }

    return (
        <section
            className="min-h-full h-full overflow-y-auto pb-[100px]"
            style={{
                ...backgroundStyles,
            }}
        >
            <section className="min-h-[calc(100%-85px)] p-[20px] flex items-center justify-center">
                <div className="max-w-[335px] mx-auto rounded-[15px] overflow-hidden shadow-box-bottom">
                    <div className="bg-white bg-opacity-70 backdrop-blur-[10px]">
                        <div className="p-[15px] flex flex-col gap-[10px]">
                            <ScoutsIdView user={user} />
                        </div>

                        <div
                            className={`flex justify-center relative ${
                                hideShare ? 'pb-[50px]' : ' pb-[10px]'
                            }`}
                        >
                            {!hideShare && (
                                <button
                                    onClick={handleQrCodeClick}
                                    className="bg-white rounded-full p-[10px] h-[50px] w-[50px] shadow-box-bottom"
                                >
                                    <QRCodeScanner className="text-grayscale-900" />
                                </button>
                            )}

                            <IdViewDivetFrame className="absolute top-[20px] bottom-0 pointer-events-none" />
                        </div>
                    </div>
                    <div className="bg-white text-grayscale-900 px-[10px] flex flex-col pb-[10px]">
                        <span className="py-[10px] text-grayscale-900 font-notoSans text-[17px] text-center line-clamp-4">
                            {description}
                        </span>

                        <div>
                            {rows.map((r, index) => {
                                const { title, Icon, caretText, onClick, hide } = r;

                                if (hide) return undefined;

                                return (
                                    <CaretListItem
                                        key={index}
                                        mainText={title}
                                        icon={<Icon className="h-[30px] w-[30px]" />}
                                        caretText={caretText}
                                        onClick={onClick}
                                        borderWanted={false}
                                    />
                                );
                            })}
                        </div>

                        {!hideLogout && (
                            <button
                                onClick={() => handleLogout(branding)}
                                className="flex items-center justify-center gap-[5px] py-[10px] text-grayscale-900 font-notoSans text-[20px] disabled:opacity-60"
                                disabled={isLoggingOut}
                            >
                                <SignOutIcon />
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <ScoutPassFooter hideShare={hideShare} icon={<ReplyIcon />} />
        </section>
    );
};

export default MyScoutsModal;
