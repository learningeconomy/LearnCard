/**
 * verification-code — all variant + branding scenarios stacked.
 */

import * as React from 'react';

import { VerificationCode } from '../templates/verification-code';
import { LEARNCARD_BRANDING, VETPASS_BRANDING, ScenarioDivider } from './_fixtures';

export default function VerificationCodeScenarios() {
    return (
        <>
            <ScenarioDivider label="Login — with email" />
            <VerificationCode
                branding={LEARNCARD_BRANDING}
                verificationCode="847293"
                verificationEmail="jane@example.com"
                variant="login"
            />

            <ScenarioDivider label="Login — no email" />
            <VerificationCode
                branding={LEARNCARD_BRANDING}
                verificationCode="847293"
                variant="login"
            />

            <ScenarioDivider label="Recovery email — with email" />
            <VerificationCode
                branding={LEARNCARD_BRANDING}
                verificationCode="192837"
                verificationEmail="backup@example.com"
                variant="recovery-email"
            />

            <ScenarioDivider label="Embed verification — with email" />
            <VerificationCode
                branding={LEARNCARD_BRANDING}
                verificationCode="564738"
                verificationEmail="student@school.edu"
                variant="embed-verification"
            />

            <ScenarioDivider label="Contact method" />
            <VerificationCode
                branding={LEARNCARD_BRANDING}
                verificationCode="029384"
                variant="contact-method"
            />

            <ScenarioDivider label="VetPass — login variant" />
            <VerificationCode
                branding={VETPASS_BRANDING}
                verificationCode="738291"
                verificationEmail="vet@example.com"
                variant="login"
            />
        </>
    );
}
