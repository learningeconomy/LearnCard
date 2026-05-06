/**
 * Guardian credential flow — approval, awaiting, approved, rejected scenarios.
 */

import * as React from 'react';

import { GuardianCredentialApproval } from '../templates/guardian-credential-approval';
import { CredentialAwaitingGuardian } from '../templates/credential-awaiting-guardian';
import { GuardianApprovedClaim } from '../templates/guardian-approved-claim';
import { GuardianRejectedCredential } from '../templates/guardian-rejected-credential';
import { GuardianEmailOtp } from '../templates/guardian-email-otp';
import { LEARNCARD_BRANDING, VETPASS_BRANDING, ScenarioDivider } from './_fixtures';

export default function GuardianCredentialScenarios() {
    return (
        <>
            <ScenarioDivider label="Guardian credential approval — full" />
            <GuardianCredentialApproval
                branding={LEARNCARD_BRANDING}
                approvalUrl="https://learncard.app/guardian/approve?token=abc123"
                approvalToken="abc123"
                issuer={{ name: 'Springfield School District', logoUrl: 'https://cdn.filestackcontent.com/J6suaVcQ467W9o1k48Kj' }}
                credential={{ name: 'Perfect Attendance Award' }}
                recipient={{ email: 'student@example.com' }}
            />

            <ScenarioDivider label="Guardian credential approval — minimal (no issuer logo)" />
            <GuardianCredentialApproval
                branding={LEARNCARD_BRANDING}
                approvalUrl="https://learncard.app/guardian/approve?token=abc123"
                approvalToken="abc123"
                credential={{ name: 'Science Fair Winner' }}
                recipient={{ email: 'kid@example.com' }}
            />

            <ScenarioDivider label="Credential awaiting guardian — full" />
            <CredentialAwaitingGuardian
                branding={LEARNCARD_BRANDING}
                issuer={{ name: 'Springfield School District', logoUrl: 'https://cdn.filestackcontent.com/J6suaVcQ467W9o1k48Kj' }}
                credential={{ name: 'Perfect Attendance Award' }}
                recipient={{ email: 'student@example.com' }}
            />

            <ScenarioDivider label="Guardian approved claim — full" />
            <GuardianApprovedClaim
                branding={LEARNCARD_BRANDING}
                issuer={{ name: 'Springfield School District', logoUrl: 'https://cdn.filestackcontent.com/J6suaVcQ467W9o1k48Kj' }}
                credential={{ name: 'Perfect Attendance Award' }}
            />

            <ScenarioDivider label="Guardian approved claim — no credential name" />
            <GuardianApprovedClaim
                branding={LEARNCARD_BRANDING}
                issuer={{ name: 'Springfield School District' }}
            />

            <ScenarioDivider label="Guardian rejected credential — full" />
            <GuardianRejectedCredential
                branding={LEARNCARD_BRANDING}
                issuer={{ name: 'Springfield School District' }}
                credential={{ name: 'Perfect Attendance Award' }}
                recipient={{ email: 'student@example.com' }}
            />

            <ScenarioDivider label="Guardian rejected credential — no credential name" />
            <GuardianRejectedCredential
                branding={LEARNCARD_BRANDING}
                issuer={{ name: 'Springfield School District' }}
            />

            <ScenarioDivider label="Guardian email OTP" />
            <GuardianEmailOtp
                branding={LEARNCARD_BRANDING}
                verificationCode="847293"
            />

            <ScenarioDivider label="VetPass — guardian credential approval" />
            <GuardianCredentialApproval
                branding={VETPASS_BRANDING}
                approvalUrl="https://vetpass.app/guardian/approve?token=xyz789"
                approvalToken="xyz789"
                issuer={{ name: 'VA Medical Center' }}
                credential={{ name: 'Health Records Access' }}
                recipient={{ email: 'veteran@example.com' }}
            />
        </>
    );
}
