/**
 * escrow-hold-released — all preview scenarios stacked.
 */

import * as React from 'react';

import { EscrowHoldReleased } from '../templates/escrow-hold-released';
import { LEARNCARD_BRANDING, VETPASS_BRANDING, ScenarioDivider } from './_fixtures';

export default function EscrowHoldReleasedScenarios() {
    return (
        <>
            <ScenarioDivider label="With support link" />
            <EscrowHoldReleased
                branding={LEARNCARD_BRANDING}
                completedAt="October 2, 2026, 3:00 PM"
                supportUrl="https://learncard.app/support"
            />

            <ScenarioDivider label="No support link (footer contact only)" />
            <EscrowHoldReleased
                branding={LEARNCARD_BRANDING}
                completedAt="October 2, 2026, 3:00 PM"
            />

            <ScenarioDivider label="Spanish" />
            <EscrowHoldReleased
                branding={LEARNCARD_BRANDING}
                completedAt="2 de octubre de 2026, 3:00 p.m."
                supportUrl="https://learncard.app/support"
                locale="es"
            />

            <ScenarioDivider label="French" />
            <EscrowHoldReleased
                branding={LEARNCARD_BRANDING}
                completedAt="2 octobre 2026, 15h00"
                supportUrl="https://learncard.app/support"
                locale="fr"
            />

            <ScenarioDivider label="Arabic (RTL)" />
            <EscrowHoldReleased
                branding={LEARNCARD_BRANDING}
                completedAt="2 أكتوبر 2026، 3:00 م"
                supportUrl="https://learncard.app/support"
                locale="ar"
            />

            <ScenarioDivider label="VetPass tenant branding" />
            <EscrowHoldReleased
                branding={VETPASS_BRANDING}
                completedAt="October 2, 2026, 3:00 PM"
                supportUrl="https://vetpass.app/support"
            />
        </>
    );
}
