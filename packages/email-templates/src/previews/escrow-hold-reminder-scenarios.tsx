/**
 * escrow-hold-reminder — all preview scenarios stacked.
 */

import * as React from 'react';

import { EscrowHoldReminder } from '../templates/escrow-hold-reminder';
import { LEARNCARD_BRANDING, VETPASS_BRANDING, ScenarioDivider } from './_fixtures';

export default function EscrowHoldReminderScenarios() {
    return (
        <>
            <ScenarioDivider label="Default — LearnCard branding" />
            <EscrowHoldReminder
                branding={LEARNCARD_BRANDING}
                releaseAfter="October 2, 2026, 3:00 PM"
                cancelUrl="https://learncard.app/recovery/cancel?token=abc123"
            />

            <ScenarioDivider label="Spanish" />
            <EscrowHoldReminder
                branding={LEARNCARD_BRANDING}
                releaseAfter="2 de octubre de 2026, 3:00 p.m."
                cancelUrl="https://learncard.app/recovery/cancel?token=abc123"
                locale="es"
            />

            <ScenarioDivider label="French" />
            <EscrowHoldReminder
                branding={LEARNCARD_BRANDING}
                releaseAfter="2 octobre 2026, 15h00"
                cancelUrl="https://learncard.app/recovery/cancel?token=abc123"
                locale="fr"
            />

            <ScenarioDivider label="Arabic (RTL)" />
            <EscrowHoldReminder
                branding={LEARNCARD_BRANDING}
                releaseAfter="2 أكتوبر 2026، 3:00 م"
                cancelUrl="https://learncard.app/recovery/cancel?token=abc123"
                locale="ar"
            />

            <ScenarioDivider label="VetPass tenant branding" />
            <EscrowHoldReminder
                branding={VETPASS_BRANDING}
                releaseAfter="October 2, 2026, 3:00 PM"
                cancelUrl="https://vetpass.app/recovery/cancel?token=abc123"
            />
        </>
    );
}
