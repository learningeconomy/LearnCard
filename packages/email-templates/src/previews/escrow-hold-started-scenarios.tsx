/**
 * escrow-hold-started — all preview scenarios stacked.
 */

import * as React from 'react';

import { EscrowHoldStarted } from '../templates/escrow-hold-started';
import { LEARNCARD_BRANDING, VETPASS_BRANDING, ScenarioDivider } from './_fixtures';

export default function EscrowHoldStartedScenarios() {
    return (
        <>
            <ScenarioDivider label="Default — with device hint" />
            <EscrowHoldStarted
                branding={LEARNCARD_BRANDING}
                requestedAt="September 25, 2026, 3:00 PM"
                releaseAfter="October 2, 2026, 3:00 PM"
                cancelUrl="https://learncard.app/recovery/cancel?token=abc123"
                deviceHint="Chrome on Windows"
            />

            <ScenarioDivider label="No device hint" />
            <EscrowHoldStarted
                branding={LEARNCARD_BRANDING}
                requestedAt="September 25, 2026, 3:00 PM"
                releaseAfter="October 2, 2026, 3:00 PM"
                cancelUrl="https://learncard.app/recovery/cancel?token=abc123"
            />

            <ScenarioDivider label="Spanish" />
            <EscrowHoldStarted
                branding={LEARNCARD_BRANDING}
                requestedAt="25 de septiembre de 2026, 3:00 p.m."
                releaseAfter="2 de octubre de 2026, 3:00 p.m."
                cancelUrl="https://learncard.app/recovery/cancel?token=abc123"
                locale="es"
            />

            <ScenarioDivider label="French" />
            <EscrowHoldStarted
                branding={LEARNCARD_BRANDING}
                requestedAt="25 septembre 2026, 15h00"
                releaseAfter="2 octobre 2026, 15h00"
                cancelUrl="https://learncard.app/recovery/cancel?token=abc123"
                locale="fr"
            />

            <ScenarioDivider label="Arabic (RTL)" />
            <EscrowHoldStarted
                branding={LEARNCARD_BRANDING}
                requestedAt="25 سبتمبر 2026، 3:00 م"
                releaseAfter="2 أكتوبر 2026، 3:00 م"
                cancelUrl="https://learncard.app/recovery/cancel?token=abc123"
                locale="ar"
            />

            <ScenarioDivider label="VetPass tenant branding" />
            <EscrowHoldStarted
                branding={VETPASS_BRANDING}
                requestedAt="September 25, 2026, 3:00 PM"
                releaseAfter="October 2, 2026, 3:00 PM"
                cancelUrl="https://vetpass.app/recovery/cancel?token=abc123"
                deviceHint="Safari on iPhone"
            />
        </>
    );
}
