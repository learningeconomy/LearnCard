import React from 'react';
import { IonIcon } from '@ionic/react';
import { flaskOutline, informationCircleOutline } from 'ionicons/icons';

import type { AddressProblem } from './launchSettings';
import { displayHost } from './testAddress';

interface AddressGuidanceProps {
    address: string;
    problem: AddressProblem;
    /** Offered when the address can still be used to try the app (local or preview). */
    onKeepForTesting?: () => void;
}

const explain = (problem: AddressProblem, host: string): { title: string; body: string } => {
    switch (problem) {
        case 'local':
            return {
                title: `Learners can't open ${host}`,
                body: 'That address only works on your computer. Enter the address where your app is published, like https://myapp.com.',
            };
        case 'preview':
            return {
                title: `${host} is a preview address`,
                body: 'Preview links change and only work while you build. Enter the address where your app is published.',
            };
        case 'insecure':
            return {
                title: 'Use a secure address',
                body: 'LearnCard only opens apps over https://. Check that your site has a secure address and use that one.',
            };
        default:
            return {
                title: "That address doesn't look right",
                body: 'Enter a full address, like https://myapp.com.',
            };
    }
};

export const AddressGuidance: React.FC<AddressGuidanceProps> = ({
    address,
    problem,
    onKeepForTesting,
}) => {
    const { title, body } = explain(problem, displayHost(address));

    return (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl" role="status">
            <div className="flex items-start gap-2.5">
                <IonIcon
                    icon={informationCircleOutline}
                    className="text-amber-600 text-lg mt-0.5 shrink-0"
                />
                <div className="min-w-0">
                    <p className="text-sm font-medium text-amber-900">{title}</p>
                    <p className="text-sm text-amber-800 leading-relaxed mt-0.5">{body}</p>
                </div>
            </div>
            {onKeepForTesting && (
                <div className="mt-3 pl-7">
                    <button
                        type="button"
                        onClick={onKeepForTesting}
                        className="inline-flex items-center gap-1.5 py-2 px-4 rounded-[20px] bg-white border border-amber-200 text-amber-900 font-medium text-sm hover:bg-amber-100 transition-colors"
                    >
                        <IonIcon icon={flaskOutline} />
                        Keep {displayHost(address)} for testing
                    </button>
                    <p className="mt-1.5 text-xs text-amber-700">
                        You can still try it under Try your app. Learners get the published address.
                    </p>
                </div>
            )}
        </div>
    );
};
