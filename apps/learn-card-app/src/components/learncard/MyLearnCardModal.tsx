import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useFlags } from 'launchdarkly-react-client-sdk';

import CaretListItem from './CaretListItem';
import LearnCardIdView from './LearnCardIdView';
import LearnCardFooter from './LearnCardFooter';
import EmailIcon from 'learn-card-base/svgs/EmailIcon';
import BlocksIcon from 'learn-card-base/svgs/Blocks';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import SwitchAccountButton from './SwitchAccountButton';
import IdViewDivetFrame from '../svgs/IdViewDivetFrame';
import AccountSwitcherModal from './AccountSwitcherModal';
import SignOutIcon from 'learn-card-base/svgs/SignOutIcon';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import CheckListContainer from './checklist/CheckListContainer';
import UserProfileSetup from '../user-profile/UserProfileSetup';
import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';
import BluePaintBrush from 'learn-card-base/svgs/BluePaintBrush';
import GreenGlobeStand from 'learn-card-base/svgs/GreenGlobeStand';
import QrCodeUserCardModal from '../qrcode-user-card/QRCodeUserCard';
import OrangeProfileIcon from 'learn-card-base/svgs/OrangeProfileIcon';
import ConnectedAppsIcon from 'learn-card-base/svgs/ConnectedAppsIcon';
import PurpleWrenchIcon from 'learn-card-base/svgs/PurpleWrenchIcon';
import UserContact from '../user-profile/UserContact/UserContact';
import BuildColorBlocksIcon from 'learn-card-base/svgs/BuildColorBlocksIcon';
import LogoutLoadingPage from '../../pages/login/LoginPageLoader/LogoutLoader';
import AdminToolsModal from '../../pages/adminToolsPage/AdminToolsModal/AdminToolsModal';
import { WrenchColorFillIcon } from 'learn-card-base/svgs/WrenchIcon';
import AiPassportPersonalizationContainer from '../ai-passport/AiPassportPersonalizationContainer';
import LearnCardIDCMS, { LearnCardIdCMSEditorModeEnum } from '../learncardID-CMS/LearnCardIDCMS';

import {
    useModal,
    useGetConnections,
    useIsCurrentUserLCNUser,
    BrandingEnum,
    ModalTypes,
    useGetCurrentLCNUser,
    useCurrentUser,
    useWallet,
    useGetCheckListStatus,
} from 'learn-card-base';
import useLogout from '../../hooks/useLogout';

import { useTheme } from '../../theme/hooks/useTheme';

import {
    DEFAULT_COLOR_LIGHT,
    DEFAULT_LEARNCARD_ID_ISSUER_THUMBNAIL,
    DEFAULT_LEARNCARD_WALLPAPER,
} from '../learncardID-CMS/learncard-cms.helpers';
import { FamilyCMSAppearance } from '../familyCMS/familyCMSState';
import { LCNProfile } from '@learncard/types';
import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';
import { checklistItems } from 'learn-card-base';
import useJoinLCNetworkModal from '../network-prompts/hooks/useJoinLCNetworkModal';

export enum MyLearnCardModalViewModeEnum {
    child = 'child',
    guardian = 'guardian',
}

type MyLearnCardModalProps = {
    branding: BrandingEnum;
    viewMode?: MyLearnCardModalViewModeEnum;
    user?: LCNProfile;
    hideLogout?: boolean;
    hideEdit?: boolean;
    hideShare?: boolean;
};

const MyLearnCardModal: React.FC<MyLearnCardModalProps> = ({
    branding,
    viewMode = MyLearnCardModalViewModeEnum.guardian,
    user: _user,
    hideLogout = false,
    hideEdit = false,
    hideShare = false,
}) => {
    const flags = useFlags();
    const [user, setUser] = useState(_user);
    const { theme } = useTheme();
    const { buildMyLCIcon } = theme.defaults;

    const { initWallet } = useWallet();
    const history = useHistory();
    const currentUser = useCurrentUser();
    const { currentLCNUser, refetch } = useGetCurrentLCNUser();
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();

    const { newModal, closeModal } = useModal();
    const { handleLogout, isLoggingOut } = useLogout();

    const { data: isNetworkUser, isLoading: isNetworkUserLoading } = useIsCurrentUserLCNUser();
    const notInNetwork = isNetworkUser === false;

    const { data: connections } = useGetConnections();

    const { checklistItemsWithStatus, completedItems, numStepsRemaining } = useGetCheckListStatus();
    const checkListItemText = `${completedItems} of ${checklistItems?.length}`;
    const numConnectedApps = connections?.filter(c => c.isServiceProfile)?.length;

    const description = user?.bio ?? user?.shortBio;

    let learnCardDisplayStyles = currentLCNUser?.display;
    if (viewMode === MyLearnCardModalViewModeEnum.child) learnCardDisplayStyles = user?.display;

    const handleUpdateMyLearnCardID = async (learnCardIDUpdates: FamilyCMSAppearance) => {
        if (viewMode === MyLearnCardModalViewModeEnum.child) {
            const childLc = await getBespokeLearnCard(currentUser?.privateKey, user?.did);

            // Ensure profile is ready
            await childLc.invoke.getProfile();

            const updates = {
                display: {
                    // container styles
                    backgroundColor: learnCardIDUpdates?.backgroundColor ?? DEFAULT_COLOR_LIGHT,
                    backgroundImage:
                        learnCardIDUpdates?.backgroundImage ?? DEFAULT_LEARNCARD_WALLPAPER,
                    fadeBackgroundImage: learnCardIDUpdates?.fadeBackgroundImage ?? false,
                    repeatBackgroundImage: learnCardIDUpdates?.repeatBackgroundImage ?? false,

                    // id styles
                    fontColor: learnCardIDUpdates?.fontColor ?? DEFAULT_COLOR_LIGHT,
                    accentColor: learnCardIDUpdates?.accentColor ?? '#ffffff',
                    accentFontColor: learnCardIDUpdates?.accentFontColor ?? '',
                    idBackgroundImage:
                        learnCardIDUpdates?.idBackgroundImage ?? DEFAULT_LEARNCARD_WALLPAPER,
                    fadeIdBackgroundImage: learnCardIDUpdates?.dimIdBackgroundImage ?? true,
                    idBackgroundColor: learnCardIDUpdates?.idBackgroundColor ?? '#2DD4BF',
                    repeatIdBackgroundImage: learnCardIDUpdates?.repeatIdBackgroundImage ?? false,
                },
            };

            await childLc.invoke.updateProfile(updates);
            setUser(oldUser => ({ ...oldUser!, ...updates }));
            return;
        }
        const wallet = await initWallet();

        const updatedProfile = await wallet?.invoke?.updateProfile({
            display: {
                // container styles
                backgroundColor: learnCardIDUpdates?.backgroundColor ?? DEFAULT_COLOR_LIGHT,
                backgroundImage: learnCardIDUpdates?.backgroundImage ?? DEFAULT_LEARNCARD_WALLPAPER,
                fadeBackgroundImage: learnCardIDUpdates?.fadeBackgroundImage ?? false,
                repeatBackgroundImage: learnCardIDUpdates?.repeatBackgroundImage ?? false,

                // id styles
                fontColor: learnCardIDUpdates?.fontColor ?? DEFAULT_COLOR_LIGHT,
                accentColor: learnCardIDUpdates?.accentColor ?? '#ffffff',
                accentFontColor: learnCardIDUpdates?.accentFontColor ?? '',
                idBackgroundImage:
                    learnCardIDUpdates?.idBackgroundImage ?? DEFAULT_LEARNCARD_WALLPAPER,
                fadeIdBackgroundImage: learnCardIDUpdates?.dimIdBackgroundImage ?? true,
                idBackgroundColor: learnCardIDUpdates?.idBackgroundColor ?? '#2DD4BF',
                repeatIdBackgroundImage: learnCardIDUpdates?.repeatIdBackgroundImage ?? false,
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

    if (viewMode === MyLearnCardModalViewModeEnum.guardian) {
        rows.push(
            {
                title: 'My Contacts',
                Icon: GreenGlobeStand,
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
                        {
                            sectionClassName: '!max-w-[400px]',
                            usePortal: true,
                            hideButton: true,
                            portalClassName: '!max-w-[400px]',
                        },
                        { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
                    );
                },
            },
            {
                title: 'Personalize AI Sessions',
                Icon: BlueMagicWand,
                caretText: '',
                onClick: () => {
                    newModal(
                        <AiPassportPersonalizationContainer />,
                        { className: '!bg-transparent' },
                        { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
                    );
                },
            },
            {
                title: 'Email Addresses',
                Icon: EmailIcon,
                caretText: '',
                onClick: () => {
                    newModal(
                        <UserContact />,
                        {},
                        { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
                    );
                },
            },
            {
                title: 'Build My LearnCard',
                Icon: BuildColorBlocksIcon,
                caretText: checkListItemText,
                onClick: () => {
                    // closeModal();
                    newModal(
                        <CheckListContainer />,
                        { className: '!bg-transparent' },
                        { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
                    );
                },
            }
            // {
            //     title: 'Engagement Styles',
            //     Icon: BlueBoostOutline2,
            //     caretText: '',
            //     onClick: () => { },
            //     hide: notInNetwork, // ?
            // },
        );
    }

    if (!hideEdit) {
        rows.push({
            title: 'Edit Contact Card',
            Icon: BluePaintBrush,
            caretText: '',
            onClick: () => {
                const learnCardID = {
                    backgroundColor: learnCardDisplayStyles?.backgroundColor ?? DEFAULT_COLOR_LIGHT,
                    backgroundImage:
                        learnCardDisplayStyles?.backgroundImage ?? DEFAULT_LEARNCARD_WALLPAPER,
                    fadeBackgroundImage: learnCardDisplayStyles?.fadeBackgroundImage ?? false,
                    repeatBackgroundImage: learnCardDisplayStyles?.repeatBackgroundImage ?? false,

                    fontColor: learnCardDisplayStyles?.fontColor ?? DEFAULT_COLOR_LIGHT,
                    accentColor: learnCardDisplayStyles?.accentColor ?? '#ffffff',
                    idBackgroundImage:
                        learnCardDisplayStyles?.idBackgroundImage ?? DEFAULT_LEARNCARD_WALLPAPER,
                    dimIdBackgroundImage: learnCardDisplayStyles?.fadeIdBackgroundImage ?? true,
                    idIssuerThumbnail: DEFAULT_LEARNCARD_ID_ISSUER_THUMBNAIL,
                    showIdIssuerImage: true,
                    idThumbnail: '',
                    accentFontColor: '',
                    idBackgroundColor: learnCardDisplayStyles?.idBackgroundColor ?? '#2DD4BF',
                    repeatIdBackgroundImage:
                        learnCardDisplayStyles?.repeatIdBackgroundImage ?? false,
                    idDescription: 'LearnCard',
                };

                newModal(
                    <LearnCardIDCMS
                        learnCardID={learnCardID}
                        user={{
                            name:
                                user?.displayName ??
                                currentUser?.name ??
                                currentLCNUser?.displayName ??
                                '',
                            shortBio: currentLCNUser?.bio,
                            image:
                                user?.image ?? currentLCNUser?.image ?? currentUser?.profileImage,
                            learnCardID: learnCardID,
                        }}
                        handleSaveLearnCardID={handleUpdateMyLearnCardID}
                        handleCloseModal={() => closeModal()}
                        showIssueDate={false}
                        viewMode={LearnCardIdCMSEditorModeEnum.edit}
                    />,
                    {},
                    { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                );
            },
        });
    }

    if (viewMode === MyLearnCardModalViewModeEnum.guardian) {
        rows.push({
            title: 'Admin Tools',
            Icon: WrenchColorFillIcon,
            caretText: '',
            onClick: () => {
                newModal(
                    <AdminToolsModal />,
                    {},
                    { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
                );
            },
        });
    }

    // if (viewMode === MyLearnCardModalViewModeEnum.guardian) {
    //     rows.push({
    //         title: 'Connections',
    //         Icon: ConnectedAppsIcon,
    //         caretText: numConnectedApps ?? '',
    //         onClick: () => {
    //             closeModal();
    //             history.push('/launchpad');
    //         },
    //         hide: notInNetwork,
    //     });
    // }

    const handleSwitchAccountsClick = () => {
        newModal(
            <AccountSwitcherModal
                showServiceProfiles
                containerClassName="max-h-[65vh]"
                showStepsFooter
            />,
            {
                sectionClassName: '!bg-transparent !border-none !shadow-none !max-w-[400px]',
                hideButton: true,
            }
        );
    };

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

    const appearance = learnCardDisplayStyles ?? currentLCNUser?.display;
    const wallpaperImage = appearance?.backgroundImage ?? DEFAULT_LEARNCARD_WALLPAPER;
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

    if (isLoggingOut) {
        return <LogoutLoadingPage />;
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
                            <LearnCardIdView user={user} />

                            <SwitchAccountButton
                                handleAccountSwitcher={handleSwitchAccountsClick}
                            />
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
                        {!isNetworkUser && !isNetworkUserLoading && (
                            <button
                                onClick={handlePresentJoinNetworkModal}
                                className="bg-grayscale-800 text-white font-notoSans text-[17px] font-semibold px-[20px] py-[7px] rounded-[10px] mb-[10px]"
                            >
                                Complete Profile
                            </button>
                        )}

                        <div>
                            {rows.map((r, index) => {
                                const { title, Icon, caretText, onClick, hide } = r;

                                if (hide) return undefined;

                                const version = title === 'Email Addresses' ? '2' : '1';

                                let icon = <Icon className="h-[30px] w-[30px]" version={version} />;

                                if (title === 'Build My LearnCard') {
                                    icon = (
                                        <img
                                            src={buildMyLCIcon}
                                            className="w-[30px] h-[30px]"
                                            alt="blocks"
                                        />
                                    );
                                }

                                return (
                                    <CaretListItem
                                        key={index}
                                        mainText={title}
                                        icon={icon}
                                        caretText={caretText}
                                        onClick={onClick}
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

            <LearnCardFooter hideShare={hideShare} icon={<ReplyIcon />} />
        </section>
    );
};

export default MyLearnCardModal;
