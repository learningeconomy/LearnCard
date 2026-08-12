/**
 * guardian-approval — all preview scenarios stacked.
 */

import * as React from 'react';

import { GuardianApproval } from '../templates/guardian-approval';
import { LEARNCARD_BRANDING, VETPASS_BRANDING, ScenarioDivider } from './_fixtures';

export default function GuardianApprovalScenarios() {
    return (
        <>
            <ScenarioDivider label="Full — requester name + guardian email" />
            <GuardianApproval
                branding={LEARNCARD_BRANDING}
                approvalUrl="https://learncard.app/approve?token=abc123"
                approvalToken="abc123"
                requester={{ displayName: 'Alex Smith', profileId: 'alex-smith-123' }}
                guardian={{ email: 'parent@example.com' }}
            />

            <ScenarioDivider label="Minimal — no requester name (fallback to 'Someone')" />
            <GuardianApproval
                branding={LEARNCARD_BRANDING}
                approvalUrl="https://learncard.app/approve?token=abc123"
                approvalToken="abc123"
            />

            <ScenarioDivider label="VetPass tenant branding" />
            <GuardianApproval
                branding={VETPASS_BRANDING}
                approvalUrl="https://vetpass.app/approve?token=xyz789"
                approvalToken="xyz789"
                requester={{ displayName: 'Jamie Rodriguez' }}
                guardian={{ email: 'guardian@example.com' }}
            />
        </>
    );
}
