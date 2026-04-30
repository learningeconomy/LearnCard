/**
 * account-approved — all preview scenarios stacked.
 */

import * as React from 'react';

import { AccountApproved } from '../templates/account-approved';
import { LEARNCARD_BRANDING, VETPASS_BRANDING, ScenarioDivider } from './_fixtures';

export default function AccountApprovedScenarios() {
    return (
        <>
            <ScenarioDivider label="With user display name" />
            <AccountApproved
                branding={LEARNCARD_BRANDING}
                user={{ displayName: 'Jane Doe' }}
            />

            <ScenarioDivider label="No user info (fallback greeting)" />
            <AccountApproved
                branding={LEARNCARD_BRANDING}
            />

            <ScenarioDivider label="VetPass tenant branding" />
            <AccountApproved
                branding={VETPASS_BRANDING}
                user={{ displayName: 'Sgt. Alex Rivera' }}
            />
        </>
    );
}
