import React from 'react';
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
            className="font-poppins p-4 rounded-2xl bg-grayscale-100 text-grayscale-900"
        >
            <h4 className="text-sm font-medium">{m['contractRequests.sharedWith']()}</h4>
            <ul className="text-sm text-grayscale-600">
                {profiles.map(profile => (
                    <li key={profile.did}>{profile.displayName || profile.profileId}</li>
                ))}
            </ul>
        </div>
    );
};
