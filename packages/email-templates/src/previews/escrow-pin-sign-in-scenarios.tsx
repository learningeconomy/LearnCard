/**
 * escrow-pin-sign-in — all preview scenarios stacked.
 */

import * as React from 'react';

import { EscrowPinSignIn } from '../templates/escrow-pin-sign-in';
import { LEARNCARD_BRANDING, VETPASS_BRANDING, ScenarioDivider } from './_fixtures';

export default function EscrowPinSignInScenarios() {
    return (
        <>
            <ScenarioDivider label="Default (LearnCard)" />
            <EscrowPinSignIn
                branding={LEARNCARD_BRANDING}
                signedInAt="October 2, 2026, 3:00 PM"
                secureUrl="https://learncard.app/account/secure"
            />

            <ScenarioDivider label="Spanish" />
            <EscrowPinSignIn
                branding={LEARNCARD_BRANDING}
                signedInAt="2 de octubre de 2026, 3:00 p.m."
                secureUrl="https://learncard.app/account/secure"
                locale="es"
            />

            <ScenarioDivider label="French" />
            <EscrowPinSignIn
                branding={LEARNCARD_BRANDING}
                signedInAt="2 octobre 2026, 15h00"
                secureUrl="https://learncard.app/account/secure"
                locale="fr"
            />

            <ScenarioDivider label="Arabic (RTL)" />
            <EscrowPinSignIn
                branding={LEARNCARD_BRANDING}
                signedInAt="2 أكتوبر 2026، 3:00 م"
                secureUrl="https://learncard.app/account/secure"
                locale="ar"
            />

            <ScenarioDivider label="VetPass tenant branding" />
            <EscrowPinSignIn
                branding={VETPASS_BRANDING}
                signedInAt="October 2, 2026, 3:00 PM"
                secureUrl="https://vetpass.app/account/secure"
            />
        </>
    );
}
