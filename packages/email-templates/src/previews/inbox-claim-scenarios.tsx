/**
 * inbox-claim — all preview scenarios stacked.
 *
 * Covers: full info, minimal info, no issuer, no credential name,
 * no recipient name, and custom tenant branding.
 */

import * as React from 'react';

import { InboxClaim } from '../templates/inbox-claim';
import { LEARNCARD_BRANDING, VETPASS_BRANDING, ScenarioDivider } from './_fixtures';

export default function InboxClaimScenarios() {
    return (
        <>
            <ScenarioDivider label="Full — issuer + credential + recipient" />
            <InboxClaim
                branding={LEARNCARD_BRANDING}
                claimUrl="https://learncard.app/claim/abc123"
                recipient={{ name: 'Jane Doe', email: 'jane@example.com' }}
                issuer={{ name: 'Acme University', logoUrl: 'https://cdn.filestackcontent.com/J6suaVcQ467W9o1k48Kj' }}
                credential={{ name: 'Bachelor of Science', type: 'Achievement' }}
            />

            <ScenarioDivider label="Minimal — no issuer, no credential name, no recipient name" />
            <InboxClaim
                branding={LEARNCARD_BRANDING}
                claimUrl="https://learncard.app/claim/abc123"
            />

            <ScenarioDivider label="No issuer branding (no logo, no name)" />
            <InboxClaim
                branding={LEARNCARD_BRANDING}
                claimUrl="https://learncard.app/claim/abc123"
                recipient={{ name: 'Jane Doe' }}
                credential={{ name: 'Professional Teaching Certificate', type: 'Achievement' }}
            />

            <ScenarioDivider label="Issuer name only (no logo)" />
            <InboxClaim
                branding={LEARNCARD_BRANDING}
                claimUrl="https://learncard.app/claim/abc123"
                recipient={{ name: 'Jane Doe' }}
                issuer={{ name: 'Springfield School District' }}
                credential={{ name: 'Perfect Attendance Award' }}
            />

            <ScenarioDivider label="No credential name (fallback to 'achievement')" />
            <InboxClaim
                branding={LEARNCARD_BRANDING}
                claimUrl="https://learncard.app/claim/abc123"
                recipient={{ name: 'Jane Doe' }}
                issuer={{ name: 'Acme University', logoUrl: 'https://cdn.filestackcontent.com/J6suaVcQ467W9o1k48Kj' }}
            />

            <ScenarioDivider label="VetPass tenant branding" />
            <InboxClaim
                branding={VETPASS_BRANDING}
                claimUrl="https://vetpass.app/claim/xyz789"
                recipient={{ name: 'Sgt. Alex Rivera' }}
                issuer={{ name: 'US Department of Veterans Affairs' }}
                credential={{ name: 'DD-214 Service Record', type: 'record' }}
            />
        </>
    );
}
