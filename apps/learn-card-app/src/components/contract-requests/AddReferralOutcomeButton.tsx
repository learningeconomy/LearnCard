import React, { lazy, Suspense } from 'react';
import { ModalTypes, useModal } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';

const ReferralOutcomes = lazy(() =>
    import('./ReferralOutcomes').then(module => ({ default: module.ReferralOutcomes }))
);

export const AddReferralOutcomeButton: React.FC<{
    contractUri: string;
    onComplete?: () => void;
    disabled?: boolean;
    beforeSubmit?: () => void;
}> = ({ contractUri, onComplete, disabled, beforeSubmit }) => {
    const { newModal } = useModal({ desktop: ModalTypes.Right, mobile: ModalTypes.FullScreen });
    return (
        <button
            type="button"
            className="min-h-11 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-emerald-500"
            disabled={disabled}
            onClick={() =>
                newModal(
                    <Suspense
                        fallback={
                            <div
                                role="status"
                                className="h-full bg-white p-6 text-sm text-grayscale-600"
                            >
                                {m['referralOutcomes.loading']()}
                            </div>
                        }
                    >
                        <ReferralOutcomes
                            contractUri={contractUri}
                            onComplete={onComplete}
                            beforeSubmit={beforeSubmit}
                        />
                    </Suspense>
                )
            }
        >
            {m['referralOutcomes.add']()}
        </button>
    );
};
