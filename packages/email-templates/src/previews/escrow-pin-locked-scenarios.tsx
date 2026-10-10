/**
 * escrow-pin-locked — all preview scenarios stacked.
 */

import * as React from 'react';

import { EscrowPinLocked } from '../templates/escrow-pin-locked';
import { LEARNCARD_BRANDING, VETPASS_BRANDING, ScenarioDivider } from './_fixtures';

export default function EscrowPinLockedScenarios() {
    return (
        <>
            <ScenarioDivider label="With pending waiting-period recovery (cancel link)" />
            <EscrowPinLocked
                branding={LEARNCARD_BRANDING}
                lockedAt="September 25, 2026, 3:00 PM"
                releaseAfter="October 2, 2026, 3:00 PM"
                cancelUrl="https://learncard.app/recovery/cancel?token=abc123"
            />

            <ScenarioDivider label="No pending recovery" />
            <EscrowPinLocked branding={LEARNCARD_BRANDING} lockedAt="September 25, 2026, 3:00 PM" />

            <ScenarioDivider label="Spanish" />
            <EscrowPinLocked
                branding={LEARNCARD_BRANDING}
                lockedAt="25 de septiembre de 2026, 3:00 p.m."
                releaseAfter="2 de octubre de 2026, 3:00 p.m."
                cancelUrl="https://learncard.app/recovery/cancel?token=abc123"
                locale="es"
            />

            <ScenarioDivider label="French" />
            <EscrowPinLocked
                branding={LEARNCARD_BRANDING}
                lockedAt="25 septembre 2026, 15h00"
                releaseAfter="2 octobre 2026, 15h00"
                cancelUrl="https://learncard.app/recovery/cancel?token=abc123"
                locale="fr"
            />

            <ScenarioDivider label="Arabic (RTL)" />
            <EscrowPinLocked
                branding={LEARNCARD_BRANDING}
                lockedAt="25 سبتمبر 2026، 3:00 م"
                releaseAfter="2 أكتوبر 2026، 3:00 م"
                cancelUrl="https://learncard.app/recovery/cancel?token=abc123"
                locale="ar"
            />

            <ScenarioDivider label="VetPass tenant branding" />
            <EscrowPinLocked
                branding={VETPASS_BRANDING}
                lockedAt="September 25, 2026, 3:00 PM"
                releaseAfter="October 2, 2026, 3:00 PM"
                cancelUrl="https://vetpass.app/recovery/cancel?token=abc123"
            />
        </>
    );
}
