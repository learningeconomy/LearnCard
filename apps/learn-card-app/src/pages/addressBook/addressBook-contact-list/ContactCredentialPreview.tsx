import React from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { arrowDownOutline, arrowUpOutline, ribbonOutline } from 'ionicons/icons';

import type { ContactRelationshipCredential, VC } from '@learncard/types';
import {
    getCredentialName,
    getImageUrlFromCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import { ModalTypes, useGetResolvedCredential, useModal, VCModal } from 'learn-card-base';

import { useLocale } from '../../../i18n';
import * as m from '../../../paraglide/messages.js';

type ContactCredentialPreviewProps = {
    record: ContactRelationshipCredential;
    variant?: 'card' | 'row';
};

const formatDate = (date: string | undefined, locale: string): string => {
    if (!date) return '';

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '';

    return new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(parsed);
};

export const ContactCredentialPreview: React.FC<ContactCredentialPreviewProps> = ({
    record,
    variant = 'card',
}) => {
    const locale = useLocale();
    const { data: credential, isLoading, isError } = useGetResolvedCredential(record.uri);
    const { newModal, closeModal } = useModal();

    const openCredential = (): void => {
        if (!credential) return;

        newModal(
            <VCModal vc={credential as VC} onDismiss={closeModal} />,
            { hideButton: true },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const image = credential ? getImageUrlFromCredential(credential) : undefined;
    const name = credential
        ? getCredentialName(credential)
        : m['contacts.relationship.credential']();
    const directionLabel =
        record.direction === 'sent'
            ? m['contacts.relationship.sentByYou']()
            : m['contacts.relationship.sentByThem']();
    const date = formatDate(record.received, locale);

    if (variant === 'row') {
        return (
            <button
                type="button"
                onClick={openCredential}
                disabled={!credential}
                className="flex w-full items-center gap-3 rounded-2xl border border-grayscale-200 bg-white p-3 text-start transition-colors hover:bg-grayscale-10 disabled:cursor-default"
                aria-label={m['contacts.relationship.openCredential']({ name })}
            >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-grayscale-100 text-grayscale-500">
                    {isLoading ? (
                        <IonSpinner name="crescent" className="h-5 w-5" />
                    ) : image ? (
                        <img src={image} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <IonIcon icon={ribbonOutline} className="text-2xl" aria-hidden="true" />
                    )}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-grayscale-900">
                        {isError ? m['contacts.relationship.unavailableCredential']() : name}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-grayscale-600">
                        <IonIcon
                            icon={record.direction === 'sent' ? arrowUpOutline : arrowDownOutline}
                            aria-hidden="true"
                        />
                        {directionLabel}
                        {date ? ` · ${date}` : ''}
                    </span>
                </span>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={openCredential}
            disabled={!credential}
            className="flex min-w-[184px] max-w-[184px] items-center gap-2 rounded-xl border border-grayscale-200 bg-white p-1.5 text-start transition-colors hover:bg-grayscale-10 disabled:cursor-default"
            aria-label={m['contacts.relationship.openCredential']({ name })}
        >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-grayscale-100 text-grayscale-500">
                {isLoading ? (
                    <IonSpinner name="crescent" className="h-4 w-4" />
                ) : image ? (
                    <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                    <IonIcon icon={ribbonOutline} className="text-xl" aria-hidden="true" />
                )}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-grayscale-900">
                    {isError ? m['contacts.relationship.unavailableCredential']() : name}
                </span>
                <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-grayscale-600">
                    <IonIcon
                        icon={record.direction === 'sent' ? arrowUpOutline : arrowDownOutline}
                        aria-hidden="true"
                    />
                    {date || directionLabel}
                </span>
            </span>
        </button>
    );
};

export default ContactCredentialPreview;
