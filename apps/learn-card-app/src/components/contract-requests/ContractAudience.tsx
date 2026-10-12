import React from 'react';
import { IonIcon } from '@ionic/react';
import { businessOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import type { ConsentFlowContractDetails } from '@learncard/types';
import * as m from '../../paraglide/messages.js';

/** Owner-only legacy consent keeps its existing layout. */
export const ContractAudience: React.FC<{
    contract: ConsentFlowContractDetails;
    testId: string;
    alwaysShowOwner?: boolean;
}> = ({ contract, testId, alwaysShowOwner = false }) => {
    if (!alwaysShowOwner && !contract.recipients?.length) return null;
    const profiles = [contract.owner, ...(contract.recipients ?? [])].filter(
        (profile, index, all) => all.findIndex(candidate => candidate.did === profile.did) === index
    );
    return (
        <div
            data-testid={testId}
            className="font-poppins p-4 rounded-2xl border border-grayscale-200 bg-grayscale-10 text-grayscale-900"
        >
            <h4 className="flex items-center gap-2 text-xs font-medium text-grayscale-700">
                <IonIcon
                    icon={shieldCheckmarkOutline}
                    aria-hidden="true"
                    className="text-base text-emerald-700"
                />
                {m['contractRequests.sharedWith']()}
            </h4>
            <ul className="mt-3 space-y-2.5 text-sm text-grayscale-900">
                {profiles.map(profile => (
                    <li
                        key={profile.did}
                        className="flex items-center gap-2.5 leading-relaxed min-w-0"
                    >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-grayscale-200">
                            <IonIcon
                                icon={businessOutline}
                                aria-hidden="true"
                                className="text-sm text-grayscale-500"
                            />
                        </span>
                        <span className="break-words min-w-0">
                            {profile.displayName || profile.profileId}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
