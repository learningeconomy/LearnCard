import React from 'react';

import { useConfirmation, useIsLoggedIn } from 'learn-card-base';
import { useFeatureConfig } from 'learn-card-base/config/TenantConfigProvider';

import TrashBin from '../../svgs/TrashBin';
import * as m from '../../../paraglide/messages.js';
import { useSamplePersonas } from './useSamplePersonas';

const SampleWalletPillContent: React.FC = () => {
    const confirm = useConfirmation();
    const { sampleDataExists, isLoading, isRemoving, removeSampleCredentials } =
        useSamplePersonas();

    if (isLoading || !sampleDataExists) return null;

    const confirmRemoval = async (): Promise<void> => {
        const confirmed = await confirm({
            text: m['passport.buildMyLearnCard.samplePersona.removeConfirmation'](),
            confirmText: m['passport.buildMyLearnCard.samplePersona.removeAction'](),
            cancelText: m['common.cancel'](),
        });

        if (confirmed) await removeSampleCredentials();
    };

    return (
        <div
            className="fixed right-3 z-[60] flex items-center gap-2 rounded-[20px] bg-amber-50 border border-amber-200 py-1.5 pl-3 pr-1.5 shadow-sm font-poppins"
            style={{
                top: 'calc(12px + var(--lc-overlay-inset-top, var(--ion-safe-area-top, 0px)))',
            }}
        >
            <span role="status" className="text-xs font-semibold text-amber-900">
                {m['passport.buildMyLearnCard.samplePersona.indicator']()}
            </span>
            <button
                type="button"
                onClick={() => void confirmRemoval()}
                disabled={isRemoving}
                className="w-8 h-8 rounded-full flex items-center justify-center text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-40"
                aria-label={m['passport.buildMyLearnCard.samplePersona.removeAction']()}
            >
                {isRemoving ? (
                    <span className="w-4 h-4 border-2 border-amber-200 border-t-amber-900 rounded-full animate-spin" />
                ) : (
                    <TrashBin version="2" className="w-4 h-4" strokeWidth="2" />
                )}
            </button>
        </div>
    );
};

const SampleWalletPill: React.FC = () => {
    const isLoggedIn = useIsLoggedIn();
    const { samplePersonas, legacySamplePersonaContractUris } = useFeatureConfig();

    return isLoggedIn &&
        (samplePersonas.length > 0 || legacySamplePersonaContractUris.length > 0) ? (
        <SampleWalletPillContent />
    ) : null;
};

export default SampleWalletPill;
