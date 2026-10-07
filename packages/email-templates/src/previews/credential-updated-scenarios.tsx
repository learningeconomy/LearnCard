/**
 * credential-updated — minimal-context update notice scenarios.
 *
 * Shows the title/no-title fallback and locale variants so reviewers can verify
 * the email never renders grades, subject details, or issuer summaries.
 */

import * as React from 'react';

import { CredentialUpdated } from '../templates/credential-updated';
import { LEARNCARD_BRANDING, VETPASS_BRANDING, ScenarioDivider } from './_fixtures';

export default function CredentialUpdatedScenarios() {
    return (
        <>
            <ScenarioDivider label="English — with credential title" />
            <CredentialUpdated
                branding={LEARNCARD_BRANDING}
                issuer={{ name: 'Inbox Demo School' }}
                credential={{ name: 'Introduction to Biology' }}
            />

            <ScenarioDivider label="English — title unavailable (generic fallback)" />
            <CredentialUpdated
                branding={LEARNCARD_BRANDING}
                issuer={{ name: 'Inbox Demo School' }}
            />

            <ScenarioDivider label="Spanish" />
            <CredentialUpdated
                branding={LEARNCARD_BRANDING}
                issuer={{ name: 'Escuela Demo' }}
                credential={{ name: 'Introducción a la Biología' }}
                locale="es"
            />

            <ScenarioDivider label="French" />
            <CredentialUpdated
                branding={LEARNCARD_BRANDING}
                issuer={{ name: 'École Démo' }}
                credential={{ name: 'Introduction à la biologie' }}
                locale="fr"
            />

            <ScenarioDivider label="Arabic (RTL)" />
            <CredentialUpdated
                branding={LEARNCARD_BRANDING}
                issuer={{ name: 'مدرسة تجريبية' }}
                credential={{ name: 'مقدمة في علم الأحياء' }}
                locale="ar"
            />

            <ScenarioDivider label="VetPass branding" />
            <CredentialUpdated
                branding={VETPASS_BRANDING}
                issuer={{ name: 'VetPass Academy' }}
                credential={{ name: 'Veterinary Ethics' }}
            />
        </>
    );
}
