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
import ManageDataSharingModal from '../data-sharing/ManageDataSharingModal';
import DataSharingIcon from 'learn-card-base/svgs/DataSharingIcon';
import ShieldCheck from 'learn-card-base/svgs/ShieldCheck';
import LearnCardIDCMS, { LearnCardIdCMSEditorModeEnum } from '../learncardID-CMS/LearnCardIDCMS';
import { RecoverySetupModal } from '../recovery';

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
    getAuthConfig,
} from 'learn-card-base';
import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import useLogout from '../../hooks/useLogout';
import ReAuthOverlay from '../auth/ReAuthOverlay';

import { useTheme } from '../../theme/hooks/useTheme';

import {
    DEFAULT_COLOR_LIGHT,
    DEFAULT_LEARNCARD_ID_ISSUER_THUMBNAIL,
    DEFAULT_LEARNCARD_WALLPAPER,
} from '../learncardID-CMS/learncard-cms.helpers';
import { FamilyCMSAppearance } from '../familyCMS/familyCMSState';
import { LCNProfile } from '@learncard/types';
import { getBespokeLearnCard, getSigningLearnCard } from 'learn-card-base/helpers/walletHelpers';
import { checklistItems } from 'learn-card-base';
import useJoinLCNetworkModal from '../network-prompts/hooks/useJoinLCNetworkModal';
import useLCNGatedAction from '../network-prompts/hooks/useLCNGatedAction';

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
    const { gate } = useLCNGatedAction();

    const { newModal, closeModal } = useModal();
    const { handleLogout, isLoggingOut } = useLogout();

    const { data: isNetworkUser, isLoading: isNetworkUserLoading } = useIsCurrentUserLCNUser();
    const notInNetwork = isNetworkUser === false;

    const { data: connections } = useGetConnections();

    const { keyDerivation, capabilities, showDeviceLinkModal, authProvider: contextAuthProvider, refreshAuthSession } = useAppAuth();

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
                onClick: async () => {
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
                onClick: async () => {
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
                onClick: async () => {
                    const { prompted } = await gate();
                    if (prompted) return;
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
                onClick: async () => {
                    // closeModal();
                    const { prompted } = await gate();
                    if (prompted) return;
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
        rows.push(
            {
                title: 'Manage Data Sharing',
                Icon: DataSharingIcon,
                caretText: '',
                onClick: async () => {
                    const { prompted } = await gate();
                    if (prompted) return;
                    newModal(
                        <ManageDataSharingModal />,
                        { sectionClassName: '!bg-transparent !shadow-none' },
                        { desktop: ModalTypes.Center, mobile: ModalTypes.FullScreen }
                    );
                },
            },
            {
                title: 'Admin Tools',
                Icon: WrenchColorFillIcon,
                caretText: '',
                onClick: async () => {
                    const { prompted } = await gate();
                    if (prompted) return;
                    newModal(
                        <AdminToolsModal />,
                        {},
                        { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
                    );
                },
            },
        );

        if (capabilities.recovery) {
            rows.push({
                title: 'Account Recovery',
                Icon: ShieldCheck,
                caretText: '',
                onClick: async () => {
                    if (!currentUser?.privateKey) {
                        console.error('No private key available');
                        return;
                    }

                    const showReAuth = () => {
                        newModal(
                            <ReAuthOverlay
                                onSuccess={closeModal}
                                onCancel={closeModal}
                            />,
                            { sectionClassName: '!max-w-[480px]' },
                            { desktop: ModalTypes.Center, mobile: ModalTypes.FullScreen }
                        );
                    };

                    // Proactive session check — try silent refresh first,
                    // then verify the token before opening the modal.
                    if (!contextAuthProvider) {
                        showReAuth();
                        return;
                    }

                    // Try silent refresh first
                    const refreshed = await refreshAuthSession();

                    if (!refreshed) {
                        try {
                            await contextAuthProvider.getIdToken();
                        } catch {
                            showReAuth();
                            return;
                        }
                    }

                    let existingMethods: Array<{ type: string; createdAt: Date }> = [];
                    let fetchedMaskedRecoveryEmail: string | null = null;

                    if (keyDerivation.getAvailableRecoveryMethods) {
                        try {
                            const token = await contextAuthProvider.getIdToken();
                            const providerType = contextAuthProvider.getProviderType();
                            existingMethods = await keyDerivation.getAvailableRecoveryMethods(token, providerType);

                            // Fetch masked recovery email from server key status
                            if (keyDerivation.fetchServerKeyStatus) {
                                const status = await keyDerivation.fetchServerKeyStatus(token, providerType);
                                fetchedMaskedRecoveryEmail = status.maskedRecoveryEmail ?? null;
                            }
                        } catch {
                            // Non-critical — show modal with empty methods
                        }
                    }

                    const canSetup = !!keyDerivation.setupRecoveryMethod;

                    const setupMethod = canSetup
                        ? async (input: { method: string; password?: string; did?: string }, authUser?: unknown) => {
                              let token: string;

                              try {
                                  token = await contextAuthProvider.getIdToken();
                              } catch {
                                  throw new Error('Your session has expired. Please close this dialog and sign in again.');
                              }

                              const providerType = contextAuthProvider.getProviderType();

                              const signVp = async (pk: string): Promise<string> => {
                                  const lc = await getSigningLearnCard(pk);

                                  const jwt = await lc.invoke.getDidAuthVp({ proofFormat: 'jwt' });

                                  if (!jwt || typeof jwt !== 'string') throw new Error('Failed to sign DID-Auth VP');

                                  return jwt;
                              };

                              return keyDerivation.setupRecoveryMethod!({
                                  token,
                                  providerType,
                                  privateKey: currentUser.privateKey!,
                                  input: input as import('@learncard/sss-key-manager').RecoverySetupInput,
                                  authUser: (authUser as import('@learncard/sss-key-manager').AuthUser) ?? undefined,
                                  signDidAuthVp: signVp,
                              });
                          }
                        : null;

                    const requireAuth = async () => {
                        throw new Error('Your session has expired. Please close this dialog and sign in again.');
                    };

                    const { serverUrl } = getAuthConfig();

                    const getTokenAndProvider = async () => {
                        const token = await contextAuthProvider.getIdToken();
                        const providerType = contextAuthProvider.getProviderType();
                        return { token, providerType };
                    };

                    const getDidAuthHeaders = async (): Promise<Record<string, string>> => {
                        const lc = await getSigningLearnCard(currentUser.privateKey!);
                        const vpJwt = await lc.invoke.getDidAuthVp({ proofFormat: 'jwt' });

                        return {
                            'Content-Type': 'application/json',
                            ...(vpJwt && typeof vpJwt === 'string' ? { Authorization: `Bearer ${vpJwt}` } : {}),
                        };
                    };

                    newModal(
                        <RecoverySetupModal
                            existingMethods={existingMethods.map(m => ({
                                type: m.type,
                                createdAt: m.createdAt instanceof Date
                                    ? m.createdAt.toISOString()
                                    : String(m.createdAt),
                            }))}
                            maskedRecoveryEmail={fetchedMaskedRecoveryEmail}
                            onSetupPasskey={
                                setupMethod
                                    ? async () => {
                                          const authUser = await contextAuthProvider.getCurrentUser();
                                          const result = await setupMethod({ method: 'passkey' }, authUser);
                                          return result?.method === 'passkey' ? result.credentialId : 'Passkey created';
                                      }
                                    : requireAuth
                            }
                            onGeneratePhrase={
                                setupMethod
                                    ? async () => {
                                          const authUser = await contextAuthProvider.getCurrentUser();
                                          const result = await setupMethod({ method: 'phrase' }, authUser);
                                          return result?.method === 'phrase' ? result.phrase : '';
                                      }
                                    : requireAuth
                            }
                            onSetupBackup={
                                setupMethod
                                    ? async (backupPw: string) => {
                                          const authUser = await contextAuthProvider.getCurrentUser();
                                          const lc = await getSigningLearnCard(currentUser.privateKey!);
                                          const did = lc?.id?.did() || '';
                                          const result = await setupMethod({ method: 'backup', password: backupPw, did }, authUser);
                                          return result?.method === 'backup' ? JSON.stringify(result.backupFile, null, 2) : '';
                                      }
                                    : requireAuth
                            }
                            onAddRecoveryEmail={async (email: string) => {
                                const { token, providerType } = await getTokenAndProvider();
                                const headers = await getDidAuthHeaders();

                                const res = await fetch(`${serverUrl}/keys/recovery-email/add`, {
                                    method: 'POST',
                                    headers,
                                    body: JSON.stringify({ authToken: token, providerType, email }),
                                });

                                if (!res.ok) {
                                    const data = await res.json().catch(() => ({}));
                                    throw new Error(data?.message || 'Failed to send verification code.');
                                }
                            }}
                            onVerifyRecoveryEmail={async (code: string) => {
                                const { token, providerType } = await getTokenAndProvider();
                                const headers = await getDidAuthHeaders();

                                const res = await fetch(`${serverUrl}/keys/recovery-email/verify`, {
                                    method: 'POST',
                                    headers,
                                    body: JSON.stringify({ authToken: token, providerType, code }),
                                });

                                if (!res.ok) {
                                    const data = await res.json().catch(() => ({}));
                                    throw new Error(data?.message || 'Incorrect code.');
                                }

                                return res.json();
                            }}
                            onSetupEmailRecovery={
                                setupMethod
                                    ? async () => {
                                          const authUser = await contextAuthProvider.getCurrentUser();
                                          await setupMethod({ method: 'email' }, authUser);
                                      }
                                    : requireAuth
                            }
                            onClose={closeModal}
                        />,
                        { sectionClassName: '!max-w-[480px]' },
                        { desktop: ModalTypes.Center, mobile: ModalTypes.FullScreen }
                    );
                },
            });
        }

        if (capabilities.deviceLinking) {
            rows.push({
                title: 'Link a Device',
                Icon: QRCodeScanner,
                caretText: '',
                onClick: () => {
                    closeModal();
                    showDeviceLinkModal();
                },
            });
        }
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
            {},
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
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
                                onClick={() =>
                                    handleLogout(branding, { overrideRedirectUrl: '/login' })
                                }
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
