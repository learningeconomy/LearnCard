/**
 * account-secured — all preview scenarios stacked.
 */

import * as React from 'react';

import { AccountSecured } from '../templates/account-secured';
import { LEARNCARD_BRANDING, VETPASS_BRANDING, ScenarioDivider } from './_fixtures';

export default function AccountSecuredScenarios() {
    return (
        <>
            <ScenarioDivider label="Default (LearnCard)" />
            <AccountSecured branding={LEARNCARD_BRANDING} securedAt="October 2, 2026, 3:00 PM" />

            <ScenarioDivider label="Spanish" />
            <AccountSecured
                branding={LEARNCARD_BRANDING}
                securedAt="2 de octubre de 2026, 3:00 p.m."
                locale="es"
            />

            <ScenarioDivider label="French" />
            <AccountSecured
                branding={LEARNCARD_BRANDING}
                securedAt="2 octobre 2026, 15h00"
                locale="fr"
            />

            <ScenarioDivider label="Arabic (RTL)" />
            <AccountSecured
                branding={LEARNCARD_BRANDING}
                securedAt="2 أكتوبر 2026، 3:00 م"
                locale="ar"
            />

            <ScenarioDivider label="VetPass tenant branding" />
            <AccountSecured branding={VETPASS_BRANDING} securedAt="October 2, 2026, 3:00 PM" />
        </>
    );
}
