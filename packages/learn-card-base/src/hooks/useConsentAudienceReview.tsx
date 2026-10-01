import React, { useEffect, useRef } from 'react';
import type { ConsentFlowContractDetails } from '@learncard/types';
import { useModal } from '../components/modals/useModal';
import { ModalTypes } from '../components/modals/types/Modals';
import { useT } from '../i18n';

const ConsentAudienceReview = ({
    contract,
    onConfirm,
    onCancel,
    onDismiss,
}: {
    contract: ConsentFlowContractDetails;
    onConfirm: () => void;
    onCancel: () => void;
    onDismiss: () => void;
}) => {
    const t = useT();
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
        <div className="p-6 font-poppins space-y-5 bg-white text-grayscale-900">
            <h2 className="text-xl font-semibold">{t('consentAudience.title')}</h2>
            <p className="text-sm text-grayscale-600 leading-relaxed">
                {t('consentAudience.description')}
            </p>
            <ul className="space-y-3 max-h-64 overflow-y-auto">
                {profiles.map(profile => (
                    <li key={profile.profileId} className="text-sm text-grayscale-700">
                        <span className="font-medium">
                            {profile.displayName || profile.profileId}
                        </span>
                        <span className="block text-xs text-grayscale-600">
                            @{profile.profileId}
                        </span>
                    </li>
                ))}
            </ul>
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 text-sm font-medium hover:bg-grayscale-10 transition-colors"
                >
                    {t('consentAudience.cancel')}
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    className="flex-1 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    {t('consentAudience.confirm')}
                </button>
            </div>
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
    return async (contract: ConsentFlowContractDetails): Promise<void> => {
        if (!(contract.audienceVersion ?? 0) && !contract.recipients?.length) return;
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
                    contract={contract}
                    onDismiss={() => settle(false)}
                    onConfirm={() => {
                        settle(true);
                        closeModal();
                    }}
                    onCancel={() => {
                        settle(false);
                        closeModal();
                    }}
                />,
                { onClose: () => settle(false) }
            );
        });
        if (!accepted) throw new Error('Sharing canceled.');
    };
};
