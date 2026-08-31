import React, { useEffect, useRef, useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import { IonIcon, IonSpinner, useIonAlert } from '@ionic/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';
import {
    alertCircleOutline,
    banOutline,
    calendarClearOutline,
    copyOutline,
    documentTextOutline,
    ellipsisHorizontal,
    personAddOutline,
    ribbonOutline,
    trashOutline,
} from 'ionicons/icons';
import moment from 'moment';

import type { LCNProfile, VC } from '@learncard/types';
import { LCNProfileConnectionStatusEnum } from '@learncard/types';
import {
    boostCategoryMetadata,
    BoostCategoryOptionsEnum,
    CredentialCategoryEnum,
    getBoostMetadata,
    getDefaultCategoryForCredential,
    getImageFromImage,
    getImageUrlFromCredential,
    ModalTypes,
    ToastTypeEnum,
    unwrapBoostCredential,
    useModal,
    useToast,
} from 'learn-card-base';
import { getInfoFromCredential } from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';

import { CalendarIcon } from 'learn-card-base/svgs/CalendarIcon';
import { CredentialGeneralIcon } from 'learn-card-base/svgs/CredentialGeneralIcon';
import BoostOutline3 from 'learn-card-base/svgs/BoostOutline3';

import BoostTemplateSelector from '../../../components/boost/boost-template/BoostTemplateSelector';
import useLCNGatedAction from '../../../components/network-prompts/hooks/useLCNGatedAction';
import SlimCaretLeft from '../../../components/svgs/SlimCaretLeft';
import SlimCaretRight from '../../../components/svgs/SlimCaretRight';
import * as m from '../../../paraglide/messages.js';
import ContactCredentialCard from './ContactCredentialCard';
import ContactProfileCard from './ContactProfileCard';
import ContactCredentialHistoryModal from './ContactCredentialHistoryModal';
import {
    type ContactCredentialHistoryItem,
    useContactCredentialHistory,
} from './useContactCredentialHistory';
import { ThreeDotVertical } from '@learncard/react';
import X from 'learn-card-base/svgs/X';

import 'swiper/css';

type ContactWithRelationship = LCNProfile & {
    connectedAt?: string;
    connectionStatus?: LCNProfileConnectionStatusEnum;
};

type AddressBookContactDetailsViewProps = {
    contact: ContactWithRelationship | null;
    showCloseButton: boolean;
    showBoostButton: boolean;
    showRequestButton: boolean;
    handleConnectionRequest: (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    showDeleteButton: boolean;
    handleRemoveConnection?: (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    showAcceptButton: boolean;
    handleAcceptConnectionRequest: (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    showCancelButton: boolean;
    handleCancelConnectionRequest?: (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    showBlockButton: boolean;
    handleBlockUser?: (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    showUnblockButton: boolean;
    handleUnblockUser?: (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    history: { push: (path: string, state?: unknown) => void };
};

const PRIMARY_BUTTON_CLASSES =
    'flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[20px] bg-grayscale-900 px-4 py-3 font-poppins text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40';

const SECONDARY_BUTTON_CLASSES =
    'flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[20px] border border-grayscale-300 bg-white px-4 py-3 font-poppins text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 disabled:cursor-not-allowed disabled:opacity-40';

const CredentialPreview: React.FC<{
    item: ContactCredentialHistoryItem;
    onClick: () => void;
}> = ({ item, onClick }) => {
    const [imageError, setImageError] = useState(false);
    const credential = unwrapBoostCredential(item.credential) as VC;
    const { title, createdAt } = getInfoFromCredential(credential, 'MMM D, YYYY', {
        uppercaseDate: false,
    });
    const category = getDefaultCategoryForCredential(item.credential);
    const categoryInfo =
        getBoostMetadata(category as CredentialCategoryEnum) ??
        boostCategoryMetadata[BoostCategoryOptionsEnum.achievement];
    const CategoryIcon = categoryInfo.SolidIconComponent ?? categoryInfo.IconComponent;
    const CategoryBadge = categoryInfo.IconWithShape ?? CategoryIcon;
    const imageUrl = getImageUrlFromCredential(credential);
    const thumbnail = imageUrl ? getImageFromImage(imageUrl) : '';

    useEffect(() => {
        setImageError(false);
    }, [thumbnail]);

    const directionLabel =
        item.direction === 'received'
            ? m['contacts.credentialHistory.theySent']()
            : m['contacts.credentialHistory.youSent']();
    const credentialTitle = title || m['contacts.credentialHistory.credentialFallback']();

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex p-2 w-full items-center gap-2 rounded-2xl border border-grayscale-200 border-solid bg-white text-left transition-opacity hover:opacity-90"
            aria-label={m['contacts.credentialHistory.viewCredential']({
                title: credentialTitle,
                direction: directionLabel,
            })}
        >
            <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-grayscale-100">
                {thumbnail && !imageError ? (
                    <img
                        src={thumbnail}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <CategoryBadge className="h-12 w-12" />
                )}
            </div>

            <div className="min-w-0 flex-1 pr-2 font-poppins">
                <p className="truncate text-sm font-semibold text-grayscale-900">
                    {credentialTitle}
                </p>
                <div className="mt-1 flex min-w-0 items-center gap-1 text-grayscale-600">
                    <CategoryIcon className="h-5 w-5 shrink-0" />
                    <time className="truncate text-sm font-semibold">{createdAt}</time>
                </div>
            </div>
        </button>
    );
};

const ContactCredentialPreview: React.FC<{ item: ContactCredentialHistoryItem }> = ({ item }) => {
    const renderPreviewTrigger = (openPreview: () => void): React.ReactNode => (
        <CredentialPreview item={item} onClick={openPreview} />
    );

    return <ContactCredentialCard item={item} renderPreviewTrigger={renderPreviewTrigger} />;
};

export const AddressBookContactDetailsView: React.FC<AddressBookContactDetailsViewProps> = ({
    contact,
    showCloseButton,
    showBoostButton,
    showRequestButton,
    handleConnectionRequest = () => {},
    showDeleteButton,
    handleRemoveConnection = () => {},
    showAcceptButton,
    handleAcceptConnectionRequest = () => {},
    showCancelButton,
    handleCancelConnectionRequest = () => {},
    showBlockButton,
    handleBlockUser = () => {},
    showUnblockButton,
    handleUnblockUser = () => {},
    history,
}) => {
    const { newModal, closeModal } = useModal();
    const { presentToast } = useToast();
    const [presentAlert, dismissAlert] = useIonAlert();
    const { gate } = useLCNGatedAction();
    const overflowRef = useRef<HTMLDivElement>(null);
    const credentialSwiperRef = useRef<SwiperInstance | null>(null);
    const [showOverflow, setShowOverflow] = useState(false);
    const [credentialAtBeginning, setCredentialAtBeginning] = useState(true);
    const [credentialAtEnd, setCredentialAtEnd] = useState(false);
    const [loadingAction, setLoadingAction] = useState<'boost' | 'send' | 'block' | null>(null);

    const connectionStatus = contact?.connectionStatus;
    const isConnected =
        showDeleteButton || connectionStatus === LCNProfileConnectionStatusEnum.enum.CONNECTED;
    const {
        data: credentialHistory,
        isLoading,
        isError,
    } = useContactCredentialHistory(contact?.profileId, { enabled: isConnected });

    useEffect(() => {
        if (!showOverflow) return undefined;

        const handlePointerDown = (event: MouseEvent): void => {
            if (!overflowRef.current?.contains(event.target as Node)) setShowOverflow(false);
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [showOverflow]);

    if (!contact) return null;

    const showConfirmationAlert = (header: string, handler: () => void | Promise<void>): void => {
        closeModal();
        presentAlert({
            backdropDismiss: false,
            cssClass: 'boost-confirmation-alert',
            header,
            buttons: [
                { text: m['contacts.confirm'](), role: 'confirm', handler },
                {
                    text: m['common.cancel'](),
                    role: 'cancel',
                    handler: () => dismissAlert(),
                },
            ],
        });
    };

    const copyLearnCardNumber = async (): Promise<void> => {
        setShowOverflow(false);

        try {
            await Clipboard.write({ string: contact.did });
            presentToast('LearnCard Number copied', { hasDismissButton: true });
        } catch {
            presentToast('Could not copy the LearnCard Number. Please try again.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleBoost = async (): Promise<void> => {
        setLoadingAction('boost');

        try {
            const { prompted } = await gate();
            if (prompted) return;

            closeModal();
            newModal(
                <BoostTemplateSelector otherUserProfileId={contact.profileId} />,
                { hideButton: true },
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        } finally {
            setLoadingAction(null);
        }
    };

    const handleSendCredential = async (): Promise<void> => {
        setLoadingAction('send');

        try {
            const { prompted } = await gate();
            if (prompted) return;

            closeModal();
            history.push('/issue', {
                entryPoint: 'contact-card',
                recipient: {
                    kind: 'profile',
                    profileId: contact.profileId,
                    displayName: contact.displayName || contact.profileId,
                    image: contact.image,
                    did: contact.did,
                },
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const openCredentialHistory = (): void => {
        newModal(
            <ContactCredentialHistoryModal contact={contact} onClose={closeModal} />,
            {
                hideButton: true,
                sectionClassName: '!max-w-[760px] !overflow-hidden',
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const updateCredentialNavigation = (swiper: SwiperInstance): void => {
        setCredentialAtBeginning(swiper.isBeginning);
        setCredentialAtEnd(swiper.isEnd);
    };

    const handleCredentialSwiperInit = (swiper: SwiperInstance): void => {
        credentialSwiperRef.current = swiper;

        requestAnimationFrame(() => {
            if (swiper.destroyed) return;

            swiper.update();
            updateCredentialNavigation(swiper);
        });
    };

    const relationshipLabel = contact.connectedAt
        ? `Connected since ${moment(contact.connectedAt).format('MMM D, YYYY')}`
        : 'Connected';

    const renderConnectionAction = (): React.ReactNode => {
        if (
            showAcceptButton ||
            connectionStatus === LCNProfileConnectionStatusEnum.enum.PENDING_REQUEST_RECEIVED
        ) {
            return (
                <button
                    type="button"
                    className={PRIMARY_BUTTON_CLASSES}
                    onClick={event => {
                        event.stopPropagation();
                        showConfirmationAlert(m['contacts.confirmAcceptRequest'](), () =>
                            handleAcceptConnectionRequest(event, contact.profileId)
                        );
                    }}
                >
                    Accept Request
                </button>
            );
        }

        if (
            showCancelButton ||
            connectionStatus === LCNProfileConnectionStatusEnum.enum.PENDING_REQUEST_SENT
        ) {
            return (
                <button
                    type="button"
                    className={SECONDARY_BUTTON_CLASSES}
                    onClick={event => {
                        event.stopPropagation();
                        showConfirmationAlert(m['contacts.confirmCancelRequest'](), () =>
                            handleCancelConnectionRequest(event, contact.profileId)
                        );
                    }}
                >
                    Cancel Request
                </button>
            );
        }

        if (showUnblockButton) {
            return (
                <button
                    type="button"
                    className={SECONDARY_BUTTON_CLASSES}
                    onClick={event => {
                        event.stopPropagation();
                        showConfirmationAlert(m['contacts.confirmUnblock'](), () =>
                            handleUnblockUser(event, contact.profileId)
                        );
                    }}
                >
                    Unblock Contact
                </button>
            );
        }

        if (showRequestButton) {
            return (
                <button
                    type="button"
                    className={PRIMARY_BUTTON_CLASSES}
                    onClick={event => {
                        event.stopPropagation();
                        showConfirmationAlert(m['contacts.confirmSendRequest'](), () =>
                            handleConnectionRequest(event, contact.profileId)
                        );
                    }}
                >
                    Request Connection
                </button>
            );
        }

        return null;
    };

    const connectionAction = renderConnectionAction();
    const showOverflowMenu =
        showDeleteButton || showBlockButton || showUnblockButton || contact.did;
    const credentialPreviewItems = credentialHistory?.items.slice(0, 10) ?? [];
    const showCredentialNavigation = credentialPreviewItems.length > 1;

    const footer = (
        <footer className="shrink-0 border-t border-grayscale-200 bg-white px-6 py-4">
            <div className="mx-auto w-full max-w-md space-y-3">
                {isConnected ? (
                    <>
                        {showBoostButton && (
                            <button
                                type="button"
                                className={PRIMARY_BUTTON_CLASSES}
                                disabled={Boolean(loadingAction)}
                                onClick={handleBoost}
                            >
                                {loadingAction === 'boost' ? (
                                    <IonSpinner className="h-4 w-4 text-white" />
                                ) : (
                                    <BoostOutline3 className="text-lg text-white" />
                                )}
                                {loadingAction === 'boost' ? 'Opening...' : 'Boost'}
                            </button>
                        )}
                        <button
                            type="button"
                            className={`${SECONDARY_BUTTON_CLASSES} border border-solid border-1px border-grayscale-200 font-semibold text-sm rounded-full text-grayscale-900`}
                            disabled={Boolean(loadingAction)}
                            onClick={handleSendCredential}
                        >
                            {loadingAction === 'send' ? (
                                <IonSpinner className="h-4 w-4 text-grayscale-900" />
                            ) : (
                                <CredentialGeneralIcon className="text-lg text-grayscale-900" />
                            )}
                            {loadingAction === 'send' ? 'Opening...' : 'Send Credential'}
                        </button>
                    </>
                ) : (
                    connectionAction
                )}
            </div>
        </footer>
    );

    return (
        <section className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-grayscale-10 font-poppins text-grayscale-900">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5 pt-3">
                <div className="mx-auto w-full max-w-md">
                    {showCloseButton && (
                        <div className="mb-3 flex justify-end md:hidden">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-grayscale-200 bg-white text-grayscale-700 shadow-box-bottom transition-colors hover:bg-grayscale-100"
                                aria-label="Close contact details"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    )}

                    <ContactProfileCard contact={contact} />

                    <div
                        className="relative mt-5 flex items-center justify-between"
                        ref={overflowRef}
                    >
                        <div className="flex min-w-0 items-center gap-2 text-sm text-grayscale-600 font-semibold">
                            <CalendarIcon className="shrink-0 text-lg" />
                            <span className="truncate">
                                {isConnected ? relationshipLabel : 'Contact'}
                            </span>
                        </div>

                        {showOverflowMenu && (
                            <button
                                type="button"
                                onClick={() => setShowOverflow(value => !value)}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-grayscale-700 transition-colors hover:bg-grayscale-100 bg-white border border-grayscale-200 border-solid border-1px"
                                aria-label="More contact actions"
                                aria-expanded={showOverflow}
                            >
                                <ThreeDotVertical />
                            </button>
                        )}

                        {showOverflow && (
                            <div className="absolute right-0 top-11 z-20 w-[230px] overflow-hidden rounded-2xl border border-grayscale-200 bg-white p-1.5 shadow-xl animate-fade-in-up">
                                {contact.did && (
                                    <button
                                        type="button"
                                        onClick={copyLearnCardNumber}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10"
                                    >
                                        <IonIcon icon={copyOutline} className="text-lg" />
                                        Copy LearnCard Number
                                    </button>
                                )}
                                {showDeleteButton && (
                                    <button
                                        type="button"
                                        onClick={event => {
                                            event.stopPropagation();
                                            setShowOverflow(false);
                                            showConfirmationAlert(
                                                m['contacts.confirmRemoveConnection'](),
                                                () =>
                                                    handleRemoveConnection(event, contact.profileId)
                                            );
                                        }}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                                    >
                                        <IonIcon icon={trashOutline} className="text-lg" />
                                        Remove Contact
                                    </button>
                                )}
                                {showBlockButton && (
                                    <button
                                        type="button"
                                        disabled={loadingAction === 'block'}
                                        onClick={async event => {
                                            event.stopPropagation();
                                            setLoadingAction('block');
                                            try {
                                                const { prompted } = await gate();
                                                if (prompted) return;
                                                setShowOverflow(false);
                                                showConfirmationAlert(
                                                    m['contacts.confirmBlock'](),
                                                    () => handleBlockUser(event, contact.profileId)
                                                );
                                            } finally {
                                                setLoadingAction(null);
                                            }
                                        }}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-40"
                                    >
                                        {loadingAction === 'block' ? (
                                            <IonSpinner className="h-[18px] w-[18px]" />
                                        ) : (
                                            <IonIcon icon={banOutline} className="text-lg" />
                                        )}
                                        Block Contact
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {isConnected && (
                        <section className="mt-6" aria-labelledby="credential-history-heading">
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2">
                                    <CredentialGeneralIcon className="text-grayscale-600" />
                                    <div className="flex flex-col">
                                        <h3
                                            id="credential-history-heading"
                                            className="text-sm font-semibold text-grayscale-600"
                                        >
                                            {(credentialHistory?.receivedCount ?? 0) +
                                                (credentialHistory?.sentCount ?? 0)}{' '}
                                            {m['contacts.credentialHistory.credentialsExchanged']()}
                                        </h3>
                                        {!isLoading && !isError && credentialHistory && (
                                            <p className="mt-1 text-sm  font-semibold text-grayscale-500">
                                                {m['contacts.credentialHistory.exchangeSummary']({
                                                    receivedCount: credentialHistory.receivedCount,
                                                    sentCount: credentialHistory.sentCount,
                                                })}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={openCredentialHistory}
                                    className="shrink-0 rounded-sm text-sm font-semibold text-indigo-600 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                >
                                    {m['common.viewAll']()}
                                </button>
                            </div>

                            {isLoading && (
                                <div className="flex min-h-[150px] items-center justify-center gap-2 rounded-2xl border border-grayscale-200 bg-white text-sm text-grayscale-600">
                                    <IonSpinner className="h-5 w-5" />
                                    {m['contacts.credentialHistory.loadingPreview']()}
                                </div>
                            )}

                            {isError && (
                                <div className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-3">
                                    <IonIcon
                                        icon={alertCircleOutline}
                                        className="mt-0.5 shrink-0 text-lg text-red-400"
                                    />
                                    <span className="text-sm leading-relaxed text-red-700">
                                        {m['contacts.credentialHistory.loadPreviewError']()}
                                    </span>
                                </div>
                            )}

                            {!isLoading && !isError && credentialHistory?.items.length === 0 && (
                                <div className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-grayscale-200 bg-white px-6 text-center">
                                    <IonIcon
                                        icon={documentTextOutline}
                                        className="mb-3 text-3xl text-grayscale-400"
                                    />
                                    <p className="text-sm font-medium text-grayscale-900">
                                        {m['contacts.credentialHistory.nothingExchanged']()}
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-grayscale-500">
                                        {m['contacts.credentialHistory.sendToStart']()}
                                    </p>
                                </div>
                            )}

                            {!isLoading && !isError && Boolean(credentialHistory?.items.length) && (
                                <div className="relative">
                                    <Swiper
                                        className="[&_.swiper-wrapper]:items-stretch"
                                        slidesPerView="auto"
                                        spaceBetween={12}
                                        grabCursor
                                        slidesPerGroupAuto
                                        onSwiper={handleCredentialSwiperInit}
                                        onResize={updateCredentialNavigation}
                                        onSlideChange={updateCredentialNavigation}
                                    >
                                        {credentialPreviewItems.map(item => (
                                            <SwiperSlide
                                                key={`${item.direction}-${item.uri}`}
                                                className="!h-auto"
                                                style={{
                                                    width: 'min(300px, calc(100vw - 96px))',
                                                }}
                                            >
                                                <ContactCredentialPreview item={item} />
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>

                                    {showCredentialNavigation && (
                                        <>
                                            {!credentialAtBeginning && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        credentialSwiperRef.current?.slidePrev()
                                                    }
                                                    className="absolute -left-4 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-grayscale-200 bg-white text-grayscale-700 shadow-box-bottom transition-colors hover:bg-grayscale-10 md:flex"
                                                    aria-label={m[
                                                        'contacts.credentialHistory.previous'
                                                    ]()}
                                                >
                                                    <SlimCaretLeft className="h-5 w-5" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    credentialSwiperRef.current?.slideNext()
                                                }
                                                disabled={credentialAtEnd}
                                                className="absolute -right-4 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-grayscale-200 bg-white text-grayscale-700 shadow-box-bottom transition-colors hover:bg-grayscale-10 disabled:cursor-not-allowed disabled:opacity-30 md:flex"
                                                aria-label={m['contacts.credentialHistory.more']()}
                                            >
                                                <SlimCaretRight className="h-5 w-5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {!isConnected && (
                        <section className="mt-6" aria-labelledby="credential-connection-heading">
                            <div className="mb-4 flex items-start gap-2">
                                <CredentialGeneralIcon className="text-grayscale-600" />
                                <h3
                                    id="credential-connection-heading"
                                    className="text-sm font-semibold text-grayscale-600"
                                >
                                    {m['contacts.credentialHistory.credentialsExchanged']()}
                                </h3>
                            </div>

                            <div className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-grayscale-200 bg-white px-6 text-center">
                                <IonIcon
                                    icon={personAddOutline}
                                    className="mb-3 text-3xl text-grayscale-400"
                                />
                                <p className="text-sm font-medium text-grayscale-900">
                                    {m['contacts.credentialHistory.connectTitle']()}
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-grayscale-500">
                                    {m['contacts.credentialHistory.connectDescription']({
                                        name: contact.displayName || contact.profileId,
                                    })}
                                </p>
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {footer}
        </section>
    );
};

export default AddressBookContactDetailsView;
