import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import CaretListItem from '../../pages/troop/CaretListItem';
import ScoutsIdView from './ScoutsIdView';
import ScoutPassFooter from './ScoutPassFooter';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';

import IdViewDivetFrame from '../svgs/IdViewDivetFrame';
import SignOutIcon from 'learn-card-base/svgs/SignOutIcon';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import ShieldCheck from 'learn-card-base/svgs/ShieldCheck';
import UserProfileSetup from '../user-profile/UserProfileSetup';
// oxlint-disable-next-line no-unused-vars
import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';
import BluePaintBrush from 'learn-card-base/svgs/BluePaintBrush';
import ScoutsGlobe2Colored from 'learn-card-base/svgs/ScoutsGlobe2Colored';
import QrCodeUserCardModal from '../qrcode-user-card/QRCodeUserCard';
import OrangeProfileIcon from 'learn-card-base/svgs/OrangeProfileIcon';
// oxlint-disable-next-line no-unused-vars
import ConnectedAppsIcon from 'learn-card-base/svgs/ConnectedAppsIcon';
import ScoutPassIDCMS, { ScoutPassIdCMSEditorModeEnum } from '../scoutsID-CMS/ScoutPassIDCMS';
import { WrenchColorFillIcon } from 'learn-card-base/svgs/WrenchIcon';
import { RecoverySetupModal } from '../recovery';
import ReAuthOverlay from '../auth/ReAuthOverlay';

import {
    useModal,
    useGetConnections,
    useIsCurrentUserLCNUser,
    BrandingEnum,
    ModalTypes,
    useGetCurrentLCNUser,
    useCurrentUser,
    useWallet,
    getAuthConfig,
} from 'learn-card-base';
import useLogout from '../../hooks/useLogout';
import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import { getSigningLearnCard } from 'learn-card-base/helpers/walletHelpers';

import {
    DEFAULT_COLOR_LIGHT,
    DEFAULT_SCOUTPASS_ID_ISSUER_THUMBNAIL,
    DEFAULT_SCOUTS_WALLPAPER,
} from '../scoutsID-CMS/scouts-cms.helpers';

import { UserCMSAppearance } from '../scoutsID-CMS/scouts-cms.helpers';
import { LCNProfile } from '@learncard/types';
import { useFlags } from 'launchdarkly-react-client-sdk';
import AdminToolsModal from '../../pages/adminToolsPage/AdminToolsModal/AdminToolsModal';

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
    // oxlint-disable-next-line no-unused-vars
    const [user, setUser] = useState(_user);

    // oxlint-disable-next-line no-unused-vars
    const flags = useFlags();
    const enableAdminTools = flags.enableAdminTools;

    const { initWallet } = useWallet();
    const history = useHistory();
    const currentUser = useCurrentUser();

    const { keyDerivation, capabilities, showDeviceLinkModal, authProvider: contextAuthProvider, refreshAuthSession } = useAppAuth();
    const { currentLCNUser, refetch } = useGetCurrentLCNUser();

    const { newModal, closeModal } = useModal();
    const { handleLogout, isLoggingOut } = useLogout();

    const { data: isNetworkUser } = useIsCurrentUserLCNUser();
    const notInNetwork = isNetworkUser === false;

    const { data: connections } = useGetConnections();
    // oxlint-disable-next-line no-unused-vars
    const numConnectedApps = connections?.filter(c => c.isServiceProfile)?.length;

    const description = user?.bio ?? user?.shortBio;

    let scoutPassDisplayStyles = currentLCNUser?.display;

    const handleUpdateMyScoutPassID = async (scoutPassIDUpdates: UserCMSAppearance) => {
        const wallet = await initWallet();

        // oxlint-disable-next-line no-unused-vars
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

    if (enableAdminTools) {
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
