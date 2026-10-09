/**
 * escrow-hold-cancelled — all preview scenarios stacked (one per reason).
 */

import * as React from 'react';

import { EscrowHoldCancelled } from '../templates/escrow-hold-cancelled';
import { LEARNCARD_BRANDING, VETPASS_BRANDING, ScenarioDivider } from './_fixtures';

export default function EscrowHoldCancelledScenarios() {
    return (
        <>
            <ScenarioDivider label="Reason: user" />
            <EscrowHoldCancelled
                branding={LEARNCARD_BRANDING}
                cancelledAt="September 26, 2026, 9:15 AM"
                reason="user"
            />

            <ScenarioDivider label="Reason: superseded" />
            <EscrowHoldCancelled
                branding={LEARNCARD_BRANDING}
                cancelledAt="September 26, 2026, 9:15 AM"
                reason="superseded"
            />

            <ScenarioDivider label="Reason: pin-locked" />
            <EscrowHoldCancelled
                branding={LEARNCARD_BRANDING}
                cancelledAt="September 26, 2026, 9:15 AM"
                reason="pin-locked"
            />

            <ScenarioDivider label="Reason: release-failed" />
            <EscrowHoldCancelled
                branding={LEARNCARD_BRANDING}
                cancelledAt="September 26, 2026, 9:15 AM"
                reason="release-failed"
            />

            <ScenarioDivider label="No reason (generic message)" />
            <EscrowHoldCancelled
                branding={LEARNCARD_BRANDING}
                cancelledAt="September 26, 2026, 9:15 AM"
            />

            <ScenarioDivider label="Spanish" />
            <EscrowHoldCancelled
                branding={LEARNCARD_BRANDING}
                cancelledAt="26 de septiembre de 2026, 9:15 a.m."
                reason="user"
                locale="es"
            />

            <ScenarioDivider label="French" />
            <EscrowHoldCancelled
                branding={LEARNCARD_BRANDING}
                cancelledAt="26 septembre 2026, 9h15"
                reason="user"
                locale="fr"
            />

            <ScenarioDivider label="Arabic (RTL)" />
            <EscrowHoldCancelled
                branding={LEARNCARD_BRANDING}
                cancelledAt="26 سبتمبر 2026، 9:15 ص"
                reason="user"
                locale="ar"
            />

            <ScenarioDivider label="VetPass tenant branding" />
            <EscrowHoldCancelled
                branding={VETPASS_BRANDING}
                cancelledAt="September 26, 2026, 9:15 AM"
                reason="user"
            />
        </>
    );
}
