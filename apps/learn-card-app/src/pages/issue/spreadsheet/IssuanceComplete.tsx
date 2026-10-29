import React from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline } from 'ionicons/icons';
import * as m from '../../../paraglide/messages.js';
import { Confetti } from '../components/Confetti';

/** A brief confirmation for an active run whose deliveries are all confirmed. */
export const IssuanceComplete: React.FC<{
    sent: number;
    total: number;
    onClose: () => void;
    onViewStatus: () => void;
}> = ({ sent, total, onClose, onViewStatus }) => (
    <div className="relative overflow-hidden bg-white p-6 text-center font-poppins text-grayscale-900 sm:p-8">
        <Confetti />
        <div className="relative space-y-5">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <IonIcon icon={checkmarkCircleOutline} className="h-12 w-12" aria-hidden="true" />
            </span>
            <div>
                <h2 className="text-xl font-semibold">
                    {m['issueFlow.sheet.reviewWorkspace.allSent']()}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-grayscale-700">
                    {m['issueFlow.sheet.reviewWorkspace.completionCount']({ sent, total })}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-grayscale-600">
                    {m['issueFlow.sheet.reviewWorkspace.completionHelp']()}
                </p>
            </div>
            <div className="space-y-3">
                <button
                    type="button"
                    onClick={onViewStatus}
                    className="w-full rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                    {m['issueFlow.sheet.design.viewDeliveryStatus']()}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                    {m['common.done']()}
                </button>
            </div>
        </div>
    </div>
);
