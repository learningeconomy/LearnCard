import React, { useEffect, useRef, useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import { IonIcon, IonSpinner, useIonAlert } from '@ionic/react';
import {
    alertCircleOutline,
    calendarOutline,
    closeOutline,
    copyOutline,
    ellipsisVertical,
    personRemoveOutline,
    sendOutline,
    shieldOutline,
    sparklesOutline,
} from 'ionicons/icons';
import { useQueryClient } from '@tanstack/react-query';

import type { LCNProfile } from '@learncard/types';
import {
    ModalTypes,
    ToastTypeEnum,
    useGetContactRelationship,
    useModal,
    useToast,
} from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import LearnCardIdView from '../../../components/learncard/LearnCardIdView';
import BoostTemplateSelector from '../../../components/boost/boost-template/BoostTemplateSelector';
import useLCNGatedAction from '../../../components/network-prompts/hooks/useLCNGatedAction';
import { useLocale } from '../../../i18n';
import ContactCredentialPreview from './ContactCredentialPreview';
import ContactCredentialHistoryModal from './ContactCredentialHistoryModal';
import SendContactCredentialsModal from './SendContactCredentialsModal';
import * as m from '../../../paraglide/messages.js';

type ContactAction = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    profileId: string
) => void;

type AddressBookContactRelationshipViewProps = {
    contact: LCNProfile;
    handleRemoveConnection?: ContactAction;
    handleBlockUser?: ContactAction;
    avatarLayoutId?: string;
    onClose?: () => void;
};

const createActionEvent = (): React.MouseEvent<HTMLButtonElement, MouseEvent> =>
    ({ stopPropagation: () => undefined } as React.MouseEvent<HTMLButtonElement, MouseEvent>);

export const AddressBookContactRelationshipView: React.FC<
    AddressBookContactRelationshipViewProps
> = ({ contact, handleRemoveConnection, handleBlockUser, avatarLayoutId, onClose }) => {
    const locale = useLocale();
    const queryClient = useQueryClient();
    const brandingConfig = useBrandingConfig();
    const { presentToast } = useToast();
    const { gate } = useLCNGatedAction();
    const { newModal, closeModal } = useModal();
    const [presentAlert, dismissAlert] = useIonAlert();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, isError, refetch } = useGetContactRelationship(contact.profileId, {
        limit: 10,
    });
    const relationship = data?.pages[0];
    const records = data?.pages.flatMap(page => page.records) ?? [];
    const total = (relationship?.sentCount ?? 0) + (relationship?.receivedCount ?? 0);
    const brandName = brandingConfig?.name ?? 'LearnCard';

    const handleClose = (): void => {
        closeModal();
        onClose?.();
    };

    useEffect(() => {
        if (!showMenu) return undefined;

        const closeOnOutsideClick = (event: MouseEvent): void => {
            if (!menuRef.current?.contains(event.target as Node)) setShowMenu(false);
        };
        const closeOnEscape = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') setShowMenu(false);
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [showMenu]);

    const connectedLabel = relationship?.connectedAt
        ? m['contacts.relationship.connectedSince']({
              date: new Intl.DateTimeFormat(locale, {
                  month: 'long',
                  year: 'numeric',
              }).format(new Date(relationship.connectedAt)),
          })
        : m['contacts.relationship.connected']();

    const showConfirmation = (message: string, action: ContactAction | undefined): void => {
        if (!action) return;

        closeModal();
        presentAlert({
            backdropDismiss: false,
            cssClass: 'boost-confirmation-alert',
            header: message,
            buttons: [
                {
                    text: m['contacts.confirm'](),
                    role: 'confirm',
                    handler: () => action(createActionEvent(), contact.profileId),
                },
                {
                    text: m['common.cancel'](),
                    role: 'cancel',
                    handler: () => dismissAlert(),
                },
            ],
        });
    };

    const openBoost = async (): Promise<void> => {
        const { prompted } = await gate();
        if (prompted) return;

        newModal(
            <BoostTemplateSelector otherUserProfileId={contact.profileId} />,
            { hideButton: true },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const openSendCredential = async (): Promise<void> => {
        const { prompted } = await gate();
        if (prompted) return;

        newModal(
            <SendContactCredentialsModal
                contact={contact}
                onCancel={closeModal}
                onComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ['contactRelationship'] });
                    closeModal();
                }}
            />,
            { hideButton: true },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const openHistory = (): void => {
        newModal(
            <ContactCredentialHistoryModal contact={contact} />,
            { hideButton: true },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const copyNumber = async (): Promise<void> => {
        try {
            await Clipboard.write({ string: contact.did });
            presentToast(m['contacts.relationship.numberCopied']({ brand: brandName }), {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
            setShowMenu(false);
        } catch {
            presentToast(m['contacts.relationship.numberCopyFailed']({ brand: brandName }), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    return (
        <div className="relative flex max-h-[90vh] w-full flex-col overflow-y-auto bg-grayscale-10 p-4 font-poppins animate-fade-in-up sm:p-5">
            <div className="mb-4 flex justify-end">
                <button
                    type="button"
                    onClick={handleClose}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-grayscale-700 shadow-md transition-colors hover:bg-grayscale-100"
                    aria-label={m['common.close']()}
                >
                    <IonIcon icon={closeOutline} className="text-2xl" aria-hidden="true" />
                </button>
            </div>

            <LearnCardIdView user={contact} variant="contact" avatarLayoutId={avatarLayoutId} />

            <div className="mt-4 flex items-center justify-between border-t border-grayscale-300 pt-3">
                <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-grayscale-700">
                    <IonIcon
                        icon={calendarOutline}
                        className="shrink-0 text-xl"
                        aria-hidden="true"
                    />
                    <span className="truncate">{connectedLabel}</span>
                </div>

                <div ref={menuRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setShowMenu(value => !value)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-grayscale-300 bg-white text-grayscale-700 transition-colors hover:bg-grayscale-10"
                        aria-label={m['contacts.relationship.moreActions']()}
                        aria-haspopup="menu"
                        aria-expanded={showMenu}
                    >
                        <IonIcon icon={ellipsisVertical} className="text-xl" aria-hidden="true" />
                    </button>

                    {showMenu && (
                        <div
                            role="menu"
                            className="absolute end-0 top-12 z-20 w-56 overflow-hidden rounded-2xl border border-grayscale-200 bg-white p-1.5 shadow-xl"
                        >
                            <button
                                type="button"
                                role="menuitem"
                                onClick={copyNumber}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm text-grayscale-700 transition-colors hover:bg-grayscale-10"
                            >
                                <IonIcon
                                    icon={copyOutline}
                                    className="text-lg"
                                    aria-hidden="true"
                                />
                                {m['contacts.relationship.copyNumber']({ brand: brandName })}
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() =>
                                    showConfirmation(
                                        m['contacts.confirmRemoveConnection'](),
                                        handleRemoveConnection
                                    )
                                }
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm text-red-700 transition-colors hover:bg-red-50"
                            >
                                <IonIcon
                                    icon={personRemoveOutline}
                                    className="text-lg"
                                    aria-hidden="true"
                                />
                                {m['contacts.removeContact']()}
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                onClick={async () => {
                                    const { prompted } = await gate();
                                    if (!prompted) {
                                        showConfirmation(
                                            m['contacts.confirmBlock'](),
                                            handleBlockUser
                                        );
                                    }
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm text-red-700 transition-colors hover:bg-red-50"
                            >
                                <IonIcon
                                    icon={shieldOutline}
                                    className="text-lg"
                                    aria-hidden="true"
                                />
                                {m['contacts.relationship.blockContact']()}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <section className="mt-5" aria-labelledby="relationship-credentials-title">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-2">
                        <IonIcon
                            icon={sparklesOutline}
                            className="mt-0.5 shrink-0 text-xl text-grayscale-700"
                            aria-hidden="true"
                        />
                        <div>
                            <h2
                                id="relationship-credentials-title"
                                className="text-sm font-medium text-grayscale-700"
                            >
                                {m['contacts.relationship.credentialsExchanged']({ count: total })}
                            </h2>
                            {!isLoading && !isError && (
                                <p className="text-xs text-grayscale-600">
                                    {m['contacts.relationship.exchangeBreakdown']({
                                        received: relationship?.receivedCount ?? 0,
                                        sent: relationship?.sentCount ?? 0,
                                    })}
                                </p>
                            )}
                        </div>
                    </div>
                    {total > 0 && (
                        <button
                            type="button"
                            onClick={openHistory}
                            className="shrink-0 text-sm font-medium text-grayscale-700 underline-offset-4 hover:text-grayscale-900 hover:underline"
                        >
                            {m['contacts.relationship.viewAll']()}
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="mt-3 flex h-16 items-center justify-center rounded-xl bg-grayscale-100 text-grayscale-600">
                        <IonSpinner name="crescent" className="h-5 w-5" />
                        <span className="ms-2 text-xs">
                            {m['contacts.relationship.loadingHistory']()}
                        </span>
                    </div>
                ) : isError ? (
                    <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-3">
                        <IonIcon
                            icon={alertCircleOutline}
                            className="mt-0.5 shrink-0 text-lg text-red-400"
                            aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm leading-relaxed text-red-700">
                                {m['contacts.relationship.loadError']()}
                            </p>
                            <button
                                type="button"
                                onClick={() => refetch()}
                                className="mt-1 text-xs font-medium text-red-700 underline"
                            >
                                {m['contacts.relationship.tryAgain']()}
                            </button>
                        </div>
                    </div>
                ) : total === 0 ? (
                    <button
                        type="button"
                        onClick={openBoost}
                        className="mt-3 w-full rounded-2xl border border-grayscale-200 bg-white p-4 text-start transition-colors hover:bg-grayscale-10"
                    >
                        <span className="block text-sm font-semibold text-grayscale-900">
                            {m['contacts.relationship.startHistory']()}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-grayscale-600">
                            {m['contacts.relationship.emptyPrompt']({ name: contact.displayName })}
                        </span>
                    </button>
                ) : (
                    <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 rtl:flex-row-reverse">
                        {records.slice(0, 4).map(record => (
                            <ContactCredentialPreview
                                key={`${record.direction}-${record.uri}`}
                                record={record}
                            />
                        ))}
                    </div>
                )}
            </section>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={openBoost}
                    className="flex items-center justify-center gap-2 rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                    <IonIcon icon={sparklesOutline} className="text-lg" aria-hidden="true" />
                    {m['contacts.relationship.boostContact']({ name: contact.displayName })}
                </button>
                <button
                    type="button"
                    onClick={openSendCredential}
                    className="flex items-center justify-center gap-2 rounded-[20px] border border-grayscale-300 bg-white px-4 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10"
                >
                    <IonIcon icon={sendOutline} className="text-lg" aria-hidden="true" />
                    {m['contacts.relationship.sendCredential']()}
                </button>
            </div>
        </div>
    );
};

export default AddressBookContactRelationshipView;
