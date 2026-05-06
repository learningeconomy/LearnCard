/**
 * endorsement-request — all preview scenarios stacked.
 */

import * as React from 'react';

import { EndorsementRequest } from '../templates/endorsement-request';
import { LEARNCARD_BRANDING, VETPASS_BRANDING, ScenarioDivider } from './_fixtures';

export default function EndorsementRequestScenarios() {
    return (
        <>
            <ScenarioDivider label="Full — issuer + credential + message + recipient" />
            <EndorsementRequest
                branding={LEARNCARD_BRANDING}
                shareLink="https://learncard.app/share/xyz789"
                recipient={{ name: 'Dr. Emily Chen' }}
                issuer={{ name: 'John Doe', logoUrl: 'https://cdn.filestackcontent.com/J6suaVcQ467W9o1k48Kj' }}
                credential={{ name: 'Professional Teaching Certificate' }}
                message="I would greatly appreciate your endorsement of my teaching credential. We worked together at Springfield Academy for 3 years."
            />

            <ScenarioDivider label="Minimal — no recipient name, no credential, no message" />
            <EndorsementRequest
                branding={LEARNCARD_BRANDING}
                shareLink="https://learncard.app/share/xyz789"
                issuer={{ name: 'John Doe' }}
            />

            <ScenarioDivider label="With message, no credential name" />
            <EndorsementRequest
                branding={LEARNCARD_BRANDING}
                shareLink="https://learncard.app/share/xyz789"
                recipient={{ name: 'Dr. Emily Chen' }}
                issuer={{ name: 'John Doe' }}
                message="Would you be willing to endorse my professional qualifications?"
            />

            <ScenarioDivider label="VetPass tenant branding" />
            <EndorsementRequest
                branding={VETPASS_BRANDING}
                shareLink="https://vetpass.app/share/abc456"
                recipient={{ name: 'Col. Sarah Mitchell' }}
                issuer={{ name: 'Sgt. Alex Rivera' }}
                credential={{ name: 'Leadership Training Certificate' }}
                message="Requesting your endorsement for my leadership training completed at Fort Bragg."
            />
        </>
    );
}
