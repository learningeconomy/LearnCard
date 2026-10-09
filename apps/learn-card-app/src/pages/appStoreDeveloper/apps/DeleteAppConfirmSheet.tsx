import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { useQueryClient } from '@tanstack/react-query';

import { getLogger, useToast, ToastTypeEnum, useWallet } from 'learn-card-base';

import { useDeveloperPortal } from '../useDeveloperPortal';
import { EMBED_APP_GUIDE } from '../submit/appIntegration';
import { forgetDeletedApp } from './forgetDeletedApp';

const log = getLogger('delete-app-confirm-sheet');

const KNOWN_DELETE_ERRORS = [
    'Only draft apps can be deleted. Withdraw it from review first.',
    "Live apps can't be deleted. Remove it from the store first.",
];

const friendlyDeleteError = (message: string | undefined): string =>
    message && KNOWN_DELETE_ERRORS.includes(message)
        ? message
        : 'Something went wrong. Please try again.';

export interface DeleteAppConfirmSheetProps {
    listingId: string;
    integrationId: string | null;
    displayName: string;
    onDismiss: () => void;
    onDeleted?: () => void;
}

export const DeleteAppConfirmSheet: React.FC<DeleteAppConfirmSheetProps> = ({
    listingId,
    integrationId,
    displayName,
    onDismiss,
    onDeleted,
}) => {
    const queryClient = useQueryClient();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { useDeleteListing } = useDeveloperPortal();
    const deleteListing = useDeleteListing();
    const [error, setError] = useState<string | null>(null);

    // Best-effort: an empty project left behind by the publish flow isn't worth
    // failing the whole delete over, so cleanup failures here are only logged.
    const cleanUpEmptyProject = async (): Promise<void> => {
        if (!integrationId) return;
        try {
            const wallet = await initWallet();
            const integration = await wallet.invoke.getIntegration(integrationId);
            const isAutoCreatedProject =
                integration?.guideType === EMBED_APP_GUIDE &&
                Boolean(integration.guideState?.publishedFromAppUrl);
            if (!isAutoCreatedProject) return;

            const remaining = await wallet.invoke.getListingsForIntegration(integrationId, {
                limit: 1,
            });
            if (remaining.records.length > 0) return;

            await wallet.invoke.deleteIntegration(integrationId);
            await queryClient.invalidateQueries({ queryKey: ['developer', 'integrations'] });
            await queryClient.invalidateQueries({
                queryKey: ['developer', 'integration', integrationId],
            });
        } catch (cleanupError) {
            log.warn('delete-app.project-cleanup-failed', cleanupError, {
                listingId,
                integrationId,
            });
        }
    };

    const handleDelete = async () => {
        setError(null);
        try {
            await deleteListing.mutateAsync(listingId);

            await cleanUpEmptyProject();
            forgetDeletedApp(listingId, integrationId);
            await queryClient.invalidateQueries({ queryKey: ['developer', 'listing'] });

            presentToast('App deleted.', { type: ToastTypeEnum.Success, hasDismissButton: true });
            onDismiss();
            onDeleted?.();
        } catch (e) {
            log.error('delete-app.failed', e, { listingId });
            setError(friendlyDeleteError(e instanceof Error ? e.message : undefined));
        }
    };

    return (
        <div className="p-6 text-left font-poppins">
            <h2 className="text-xl font-semibold text-grayscale-900">Delete "{displayName}"?</h2>
            <p className="mt-1 text-sm text-grayscale-600 leading-relaxed">
                Its store details and test history will be removed. This can't be undone.
            </p>

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon
                        icon={alertCircleOutline}
                        className="text-red-400 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onDismiss}
                    disabled={deleteListing.isPending}
                    className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteListing.isPending}
                    className="py-3 px-4 rounded-[20px] bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {deleteListing.isPending && (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {deleteListing.isPending ? 'Deleting…' : 'Delete Draft'}
                </button>
            </div>
        </div>
    );
};

export default DeleteAppConfirmSheet;
