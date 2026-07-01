import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { getLogger } from 'learn-card-base';
const log = getLogger('my-learn-card-modal');

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
import PrivacyLock from 'learn-card-base/svgs/PrivacyLock';
import PrivacySettingsModal from '../../pages/privacy-settings/PrivacySettingsModal';
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
    useDeviceTypeByWidth,
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
import { MyLearnCardModalViewModeEnum } from './MyLearnCardModal.types';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import { getTenantHeaders } from '../../config/bootstrapTenantConfig';

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
    const brandingConfig = useBrandingConfig();
    const buildMyLCTitle = `Build My ${brandingConfig.name}`;

    const { initWallet } = useWallet();
    const history = useHistory();
    const currentUser = useCurrentUser();
    const { currentLCNUser, refetch } = useGetCurrentLCNUser();
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();
    const { gate } = useLCNGatedAction();
    const { isDesktop } = useDeviceTypeByWidth();
    const [activePanel, setActivePanel] = useState<string | null>(null);

    const { newModal, closeModal } = useModal();
    const { handleLogout, isLoggingOut } = useLogout();

    const { data: isNetworkUser, isLoading: isNetworkUserLoading } = useIsCurrentUserLCNUser();
    const notInNetwork = isNetworkUser === false;

    const { data: connections } = useGetConnections();

    const {
        keyDerivation,
        capabilities,
        showDeviceLinkModal,
        authProvider: contextAuthProvider,
        refreshAuthSession,
    } = useAppAuth();

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
                            handleLogout={() => handleLogout()}
                            showNetworkSettings={true}
                            showNotificationsModal={false}
                        />,
                        { sectionClassName: '!max-w-[500px]' },
                        { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
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
                title: buildMyLCTitle,
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
                        {
                            sectionClassName:
                                '!bg-transparent !shadow-none data-sharing-modal-shell',
                        },
                        { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
                    );
                },
            },
            {
                title: 'Privacy & Data',
                Icon: PrivacyLock,
                caretText: '',
                onClick: () => {
                    newModal(
                        <PrivacySettingsModal />,
                        { sectionClassName: '!bg-transparent !shadow-none' },
                        { desktop: ModalTypes.Center, mobile: ModalTypes.Cancel }
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
            }
        );

        if (capabilities.recovery) {
            rows.push({
                title: 'Account Recovery',
                Icon: ShieldCheck,
                caretText: '',
                onClick: async () => {
                    if (!currentUser?.privateKey) {
                        log.error('No private key available');
                        return;
                    }

                    const showReAuth = () => {
                        newModal(
                            <ReAuthOverlay onSuccess={closeModal} onCancel={closeModal} />,
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
                            existingMethods = await keyDerivation.getAvailableRecoveryMethods(
                                token,
                                providerType
                            );

                            // Fetch masked recovery email from server key status
                            if (keyDerivation.fetchServerKeyStatus) {
                                const status = await keyDerivation.fetchServerKeyStatus(
                                    token,
                                    providerType
                                );
                                fetchedMaskedRecoveryEmail = status.maskedRecoveryEmail ?? null;
                            }
                        } catch {
                            // Non-critical — show modal with empty methods
                        }
                    }

                    const canSetup = !!keyDerivation.setupRecoveryMethod;

                    const setupMethod = canSetup
                        ? async (
                              input: { method: string; password?: string; did?: string },
                              authUser?: unknown
                          ) => {
                              let token: string;

                              try {
                                  token = await contextAuthProvider.getIdToken();
                              } catch {
                                  throw new Error(
                                      'Your session has expired. Please close this dialog and sign in again.'
                                  );
                              }

                              const providerType = contextAuthProvider.getProviderType();

                              const signVp = async (pk: string): Promise<string> => {
                                  const lc = await getSigningLearnCard(pk);

                                  const jwt = await lc.invoke.getDidAuthVp({ proofFormat: 'jwt' });

                                  if (!jwt || typeof jwt !== 'string')
                                      throw new Error('Failed to sign DID-Auth VP');

                                  return jwt;
                              };

                              return keyDerivation.setupRecoveryMethod!({
                                  token,
                                  providerType,
                                  privateKey: currentUser.privateKey!,
                                  input: input as import('@learncard/sss-key-manager').RecoverySetupInput,
                                  authUser:
                                      (authUser as import('@learncard/sss-key-manager').AuthUser) ??
                                      undefined,
                                  signDidAuthVp: signVp,
                              });
                          }
                        : null;

                    const requireAuth = async () => {
                        throw new Error(
                            'Your session has expired. Please close this dialog and sign in again.'
                        );
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
                            ...(vpJwt && typeof vpJwt === 'string'
                                ? { Authorization: `Bearer ${vpJwt}` }
                                : {}),
                            ...getTenantHeaders(),
                        };
                    };

                    newModal(
                        <RecoverySetupModal
                            existingMethods={existingMethods.map(m => ({
                                type: m.type,
                                createdAt:
                                    m.createdAt instanceof Date
                                        ? m.createdAt.toISOString()
                                        : String(m.createdAt),
                            }))}
                            maskedRecoveryEmail={fetchedMaskedRecoveryEmail}
                            onSetupPasskey={
                                setupMethod
                                    ? async () => {
                                          const authUser =
                                              await contextAuthProvider.getCurrentUser();
                                          const result = await setupMethod(
                                              { method: 'passkey' },
                                              authUser
                                          );
                                          return result?.method === 'passkey'
                                              ? result.credentialId
                                              : 'Passkey created';
                                      }
                                    : requireAuth
                            }
                            onGeneratePhrase={
                                setupMethod
                                    ? async () => {
                                          const authUser =
                                              await contextAuthProvider.getCurrentUser();
                                          const result = await setupMethod(
                                              { method: 'phrase' },
                                              authUser
                                          );
                                          return result?.method === 'phrase' ? result.phrase : '';
                                      }
                                    : requireAuth
                            }
                            onSetupBackup={
                                setupMethod
                                    ? async (backupPw: string) => {
                                          const authUser =
                                              await contextAuthProvider.getCurrentUser();
                                          const lc = await getSigningLearnCard(
                                              currentUser.privateKey!
                                          );
                                          const did = lc?.id?.did() || '';
                                          const result = await setupMethod(
                                              { method: 'backup', password: backupPw, did },
                                              authUser
                                          );
                                          return result?.method === 'backup'
                                              ? JSON.stringify(result.backupFile, null, 2)
                                              : '';
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
                                    throw new Error(
                                        data?.message || 'Failed to send verification code.'
                                    );
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
                                          const authUser =
                                              await contextAuthProvider.getCurrentUser();
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

    const groups = [
        {
            title: 'Profile & Identity',
            items: ['My Account', 'Edit Contact Card', buildMyLCTitle],
        },
        {
            title: 'Account & Security',
            items: ['Account Recovery', 'Email Addresses'],
        },
        {
            title: 'Connections & Apps',
            items: ['My Contacts', 'Admin Tools'],
        },
        {
            title: 'Preferences',
            items: ['Personalize AI Sessions', 'Manage Data Sharing', 'Privacy & Data'],
        },
    ];

    const visibleRows = rows.filter(r => !r.hide);
    const groupedRows = groups
        .map(group => ({
            title: group.title,
            rows: visibleRows.filter(r => group.items.includes(r.title)),
        }))
        .filter(group => group.rows.length > 0);

    const moreRows = visibleRows.filter(r => !groups.some(g => g.items.includes(r.title)));
    if (moreRows.length > 0) {
        groupedRows.push({
            title: 'More',
            rows: moreRows,
        });
    }

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

    if (isDesktop) {
        return (
            <section
                className="min-h-full h-full w-full flex items-center justify-center p-[40px] relative"
                style={{
                    ...backgroundStyles,
                }}
            >
                <button
                    onClick={closeModal}
                    className="absolute top-[40px] right-[40px] w-[48px] h-[48px] bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-grayscale-700 hover:text-grayscale-900 hover:bg-white shadow-sm transition-colors z-50"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M13 1L1 13M1 1L13 13"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>

                <div className="w-full max-w-[1100px] h-[85vh] min-h-[600px] bg-white/80 backdrop-blur-xl rounded-[24px] shadow-2xl overflow-hidden flex border border-white/50">
                    <div className="w-[360px] flex-shrink-0 flex flex-col h-full min-w-0 border-r border-grayscale-200/50 bg-white/50">
                        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
                            <div className="p-[24px] flex flex-col gap-[12px]">
                                <LearnCardIdView user={user} />
                                <SwitchAccountButton
                                    handleAccountSwitcher={handleSwitchAccountsClick}
                                />
                            </div>

                            <div
                                className={`flex justify-center relative ${
                                    hideShare ? 'pb-[24px]' : 'pb-[12px]'
                                }`}
                            >
                                {!hideShare && (
                                    <button
                                        onClick={handleQrCodeClick}
                                        className="bg-white rounded-full p-[12px] h-[56px] w-[56px] shadow-sm border border-grayscale-100 hover:bg-grayscale-10 transition-colors z-10"
                                    >
                                        <QRCodeScanner className="text-grayscale-900 w-full h-full" />
                                    </button>
                                )}
                                <IdViewDivetFrame className="absolute top-[28px] bottom-0 pointer-events-none opacity-50" />
                            </div>

                            <div className="px-[24px] flex flex-col pb-[24px]">
                                <span className="py-[12px] text-grayscale-900 font-poppins text-[15px] text-center line-clamp-4">
                                    {description}
                                </span>
                                {!isNetworkUser && !isNetworkUserLoading && (
                                    <button
                                        onClick={() => {
                                            void handlePresentJoinNetworkModal();
                                        }}
                                        className="bg-grayscale-900 text-white font-poppins text-[14px] font-medium px-[20px] py-[12px] rounded-[20px] mb-[24px] hover:opacity-90 transition-opacity"
                                    >
                                        Complete Profile
                                    </button>
                                )}

                                <div className="flex flex-col gap-[24px]">
                                    {groupedRows.map((group, gIdx) => (
                                        <div key={gIdx} className="flex flex-col">
                                            {group.title && (
                                                <h3 className="text-[11px] font-semibold text-grayscale-500 uppercase tracking-wider mb-[8px] px-[12px]">
                                                    {group.title}
                                                </h3>
                                            )}
                                            <div className="flex flex-col gap-[2px]">
                                                {group.rows.map((r, rIdx) => {
                                                    const { title, Icon, caretText, onClick } = r;
                                                    const version =
                                                        title === 'Email Addresses' ? '2' : '1';
                                                    let icon = (
                                                        <Icon
                                                            className="h-[20px] w-[20px]"
                                                            version={version}
                                                        />
                                                    );
                                                    if (title === buildMyLCTitle) {
                                                        icon = (
                                                            <img
                                                                src={buildMyLCIcon}
                                                                className="w-[20px] h-[20px]"
                                                                alt="blocks"
                                                            />
                                                        );
                                                    }
                                                    const isActive = activePanel === title;
                                                    return (
                                                        <button
                                                            key={rIdx}
                                                            onClick={() => {
                                                                if (title === 'My Account') {
                                                                    setActivePanel(title);
                                                                } else {
                                                                    onClick?.();
                                                                }
                                                            }}
                                                            className={`flex items-center justify-between px-[12px] py-[10px] rounded-[12px] text-left transition-colors ${
                                                                isActive
                                                                    ? 'bg-white shadow-sm border border-grayscale-200/50'
                                                                    : 'hover:bg-white/60 border border-transparent'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-[12px]">
                                                                <div
                                                                    className={`flex items-center justify-center w-[28px] h-[28px] rounded-[8px] ${
                                                                        isActive
                                                                            ? 'bg-grayscale-100 text-grayscale-900'
                                                                            : 'text-grayscale-600'
                                                                    }`}
                                                                >
                                                                    {icon}
                                                                </div>
                                                                <span
                                                                    className={`font-poppins text-[14px] ${
                                                                        isActive
                                                                            ? 'font-medium text-grayscale-900'
                                                                            : 'text-grayscale-700'
                                                                    }`}
                                                                >
                                                                    {title}
                                                                </span>
                                                            </div>
                                                            {caretText && (
                                                                <span className="text-grayscale-500 text-[12px] font-poppins bg-grayscale-100 px-[8px] py-[2px] rounded-full">
                                                                    {caretText}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {!hideLogout && (
                            <div className="p-[24px] border-t border-grayscale-200/50 bg-white/30">
                                <button
                                    onClick={() => handleLogout({ overrideRedirectUrl: '/login' })}
                                    className="w-full flex items-center justify-center gap-[8px] py-[12px] text-grayscale-700 hover:text-grayscale-900 hover:bg-white rounded-[20px] font-poppins text-[14px] font-medium transition-colors disabled:opacity-60 border border-grayscale-300/50 shadow-sm"
                                    disabled={isLoggingOut}
                                >
                                    <SignOutIcon className="w-[18px] h-[18px]" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-white/60 relative">
                        {activePanel === 'My Account' ? (
                            <div className="w-full max-w-[600px] mx-auto py-[40px] px-[32px]">
                                <UserProfileSetup
                                    title="My Account"
                                    handleCloseModal={() => setActivePanel(null)}
                                    handleLogout={() => handleLogout()}
                                    showNetworkSettings={true}
                                    showNotificationsModal={false}
                                />
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-[40px]">
                                <div className="w-[64px] h-[64px] bg-white rounded-full shadow-sm flex items-center justify-center mb-[24px] border border-grayscale-100">
                                    <OrangeProfileIcon className="w-[32px] h-[32px]" />
                                </div>
                                <h2 className="text-[20px] font-poppins font-semibold text-grayscale-900 mb-[8px]">
                                    {brandingConfig.name} Settings
                                </h2>
                                <p className="text-[14px] font-poppins text-grayscale-500 max-w-[280px] leading-relaxed">
                                    Select a setting from the menu to view or update your
                                    preferences.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        );
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
                                onClick={() => {
                                    void handlePresentJoinNetworkModal();
                                }}
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

                                if (title === buildMyLCTitle) {
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
                                onClick={() => handleLogout({ overrideRedirectUrl: '/login' })}
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
