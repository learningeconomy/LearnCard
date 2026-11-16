import React, { useEffect, useId, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, codeSlashOutline } from 'ionicons/icons';
import { useQueryClient } from '@tanstack/react-query';
import { currentUserStore, switchedProfileStore, useWallet } from 'learn-card-base';
import useScreenWidth from 'learn-card-base/hooks/useScreenWidth';

import { LearnCardRolesEnum } from '../onboarding/onboarding.helpers';
import { persistQueryCacheNow } from '../../helpers/queryPersistence';
import * as m from '../../paraglide/messages.js';

type DeveloperRoleConfirmationProps = {
    onClose: () => void;
    saving: { current: boolean };
};

const DeveloperRoleConfirmation: React.FC<DeveloperRoleConfirmationProps> = ({
    onClose,
    saving,
}) => {
    const { initWallet } = useWallet();
    const isNarrow = useScreenWidth() < 400;
    const queryClient = useQueryClient();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const currentUser = currentUserStore.use.currentUser();
    const origin = useRef({ switchedDid, privateKey: currentUser?.privateKey }).current;
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(false);
    const titleId = useId();
    const descriptionId = useId();
    const mounted = useRef(true);

    const isSameAccount = (): boolean =>
        switchedProfileStore.get.switchedDid() === origin.switchedDid &&
        currentUserStore.get.currentUser()?.privateKey === origin.privateKey;

    useEffect(() => {
        if (switchedDid !== origin.switchedDid || currentUser?.privateKey !== origin.privateKey) {
            onClose();
        }
    }, [switchedDid, currentUser?.privateKey, origin, onClose]);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const handleConfirm = async (): Promise<void> => {
        if (saving.current) return;
        if (!isSameAccount()) {
            onClose();
            return;
        }
        saving.current = true;
        setIsSaving(true);
        setError(false);

        try {
            const wallet = await initWallet();
            if (!isSameAccount() || !mounted.current) return;
            const profile = await wallet.invoke.getProfile();
            if (!isSameAccount() || !mounted.current) return;
            if (!profile?.profileId) throw new Error('Profile unavailable');

            // A retry after a cache-persistence failure need not repeat the server mutation.
            if (!('role' in profile) || profile.role !== LearnCardRolesEnum.developer) {
                const updated = await wallet.invoke.updateProfile({
                    role: LearnCardRolesEnum.developer,
                });
                if (!updated) throw new Error('Profile update failed');
            }
            const savedProfile = await wallet.invoke.getProfile();
            if (!isSameAccount() || !mounted.current) return;
            if (
                !savedProfile ||
                !('role' in savedProfile) ||
                savedProfile.role !== LearnCardRolesEnum.developer
            ) {
                throw new Error('Updated profile unavailable');
            }

            const ownProfileKey = ['getProfile', origin.switchedDid ?? '', undefined];
            await queryClient.cancelQueries({
                predicate: query =>
                    query.queryKey[0] === 'getProfile' &&
                    ((query.queryKey[1] === ownProfileKey[1] && !query.queryKey[2]) ||
                        query.queryKey[2] === profile.profileId),
            });
            if (!isSameAccount() || !mounted.current) return;
            queryClient.setQueryData(ownProfileKey, savedProfile);
            await queryClient.invalidateQueries({ queryKey: ['useGetPreferencesForDid'] });
            await queryClient.invalidateQueries({
                predicate: query =>
                    query.queryKey[0] === 'getProfile' && query.queryKey[2] === profile.profileId,
            });
            await persistQueryCacheNow(queryClient);
            if (isSameAccount() && mounted.current) onClose();
        } catch {
            if (isSameAccount() && mounted.current) setError(true);
        } finally {
            saving.current = false;
            if (mounted.current) setIsSaving(false);
        }
    };

    const cancelButton = (
        <button
            key="cancel"
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="min-h-12 min-w-0 flex-1 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
            {m['common.cancel']()}
        </button>
    );
    const confirmButton = (
        <button
            key="confirm"
            type="button"
            disabled={isSaving}
            onClick={handleConfirm}
            className="min-h-12 min-w-0 flex-1 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
            {isSaving ? (
                <span role="status" className="flex items-center justify-center gap-2">
                    <span
                        aria-hidden="true"
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full motion-safe:animate-spin"
                    />
                    {m['profile.developerProgram.saving']()}
                </span>
            ) : (
                m['profile.developerProgram.confirmAction']()
            )}
        </button>
    );

    return (
        <div
            role="group"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            aria-busy={isSaving}
            className="p-6 font-poppins text-grayscale-900 break-words"
        >
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-grayscale-100">
                    <IonIcon icon={codeSlashOutline} aria-hidden="true" className="text-2xl" />
                </div>
                <h2 id={titleId} className="min-w-0 text-xl font-semibold leading-snug">
                    {m['profile.developerProgram.confirmTitle']()}
                </h2>
            </div>
            <p id={descriptionId} className="mb-6 text-sm text-grayscale-600 leading-relaxed">
                {m['profile.developerProgram.confirmDescription']()}
            </p>
            {error && (
                <div
                    role="alert"
                    className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5"
                >
                    <IonIcon
                        icon={alertCircleOutline}
                        aria-hidden="true"
                        className="text-red-400 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-red-700 leading-relaxed">
                        {m['profile.developerProgram.saveError']()}
                    </span>
                </div>
            )}
            <div className="flex flex-col gap-3 min-[400px]:flex-row">
                {isNarrow ? [confirmButton, cancelButton] : [cancelButton, confirmButton]}
            </div>
        </div>
    );
};

export default DeveloperRoleConfirmation;
