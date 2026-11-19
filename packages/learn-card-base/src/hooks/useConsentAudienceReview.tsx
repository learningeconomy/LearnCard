import React, { useEffect, useRef } from 'react';
import { ConsentProfileFields, type FieldReview } from './ConsentProfileFields';
import type { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';
import { useModal } from '../components/modals/useModal';
import { ModalTypes } from '../components/modals/types/Modals';
import { FullCredentialDisclosure } from '../components/FullCredentialDisclosure';
import { useT } from '../i18n';
import { useOptionalTenantConfig } from '../config/TenantConfigProvider';

const ConsentAudienceReview = ({
    contract,
    fieldReview,
    onConfirm,
    onCancel,
    onDismiss,
}: {
    contract: ConsentFlowContractDetails;
    fieldReview?: FieldReview;
    onConfirm: (terms?: ConsentFlowTerms) => void;
    onCancel: () => void;
    onDismiss: () => void;
}) => {
    const t = useT();
    const tenant = useOptionalTenantConfig();
    const notice = fieldReview ? tenant?.verifiableDataConsentNotice : undefined;
    const mounted = useRef(false);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            queueMicrotask(() => {
                if (!mounted.current) onDismiss();
            });
        };
    }, [onDismiss]);
    const profiles = [
        ...new Map(
            [contract.owner, ...(contract.recipients ?? [])].map(profile => [
                profile.profileId,
                profile,
            ])
        ).values(),
    ];
    return (
        <div className="flex flex-col gap-5 bg-white p-5 font-poppins text-grayscale-900 max-[475px]:p-3 sm:p-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold">{t('consentAudience.title')}</h2>
                <p className="text-sm leading-relaxed text-grayscale-600">
                    {t('consentAudience.description')}
                </p>
            </div>
            <FullCredentialDisclosure recipients={contract.readableDeliveryRecipients} />
            <ul className="m-0 flex max-h-40 list-none flex-col gap-3 overflow-y-auto rounded-xl bg-grayscale-100 p-3">
                {profiles.map(profile => (
                    <li key={profile.profileId} className="text-sm text-grayscale-700">
                        <span className="font-medium">
                            {profile.displayName || profile.profileId}
                        </span>
                        <span className="block break-words text-xs text-grayscale-600">
                            @{profile.profileId}
                        </span>
                    </li>
                ))}
            </ul>
            {notice && (
                <p className="rounded-xl border border-grayscale-200 bg-grayscale-10 p-3 text-sm leading-relaxed text-grayscale-700">
                    {notice}
                </p>
            )}
            {fieldReview ? (
                <ConsentProfileFields
                    contract={contract}
                    review={fieldReview}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                />
            ) : (
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3 border-t border-solid border-grayscale-200 pt-5">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-[20px] border border-solid border-grayscale-300 px-3 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10"
                    >
                        {t('consentAudience.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm()}
                        className="rounded-[20px] bg-grayscale-900 px-3 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                        {t('consentAudience.confirm')}
                    </button>
                </div>
            )}
        </div>
    );
};

/** Every interactive mutation reviews the freshly fetched audience before encrypting. */
export const useConsentAudienceReview = () => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });
    const pending = useRef(new Set<(accepted: boolean) => void>());
    useEffect(
        () => () => {
            pending.current.forEach(resolve => resolve(false));
            pending.current.clear();
        },
        []
    );
    return async (
        contract: ConsentFlowContractDetails,
        fieldReview?: FieldReview
    ): Promise<ConsentFlowTerms | undefined> => {
        if (
            !fieldReview &&
            !(contract.audienceVersion ?? 0) &&
            !contract.recipients?.length &&
            !contract.readableDeliveryRecipients?.some(
                recipient => recipient.enabled && recipient.disclosureVersion === '2'
            )
        )
            return;
        let result: ConsentFlowTerms | undefined;
        const accepted = await new Promise<boolean>(resolve => {
            let settled = false;
            const settle = (value: boolean) => {
                if (settled) return;
                settled = true;
                pending.current.delete(settle);
                resolve(value);
            };
            pending.current.add(settle);
            newModal(
                <ConsentAudienceReview
                    fieldReview={fieldReview}
                    contract={contract}
                    onDismiss={() => settle(false)}
                    onConfirm={terms => {
                        if (settled) return;
                        result = terms;
                        settle(true);
                        closeModal();
                    }}
                    onCancel={() => {
                        settle(false);
                        closeModal();
                    }}
                />,
                {
                    onClose: () => settle(false),
                    sectionClassName:
                        'w-[calc(100%_-_2rem)]! max-w-[480px]! max-h-[calc(100%_-_2rem)]!',
                }
            );
        });
        if (!accepted) throw new Error('Sharing canceled.');
        return result;
    };
};
