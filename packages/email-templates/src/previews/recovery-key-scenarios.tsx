/**
 * recovery-key — all preview scenarios stacked.
 */

import * as React from 'react';

import { RecoveryKey } from '../templates/recovery-key';
import { LEARNCARD_BRANDING, VETPASS_BRANDING, ScenarioDivider } from './_fixtures';

export default function RecoveryKeyScenarios() {
    return (
        <>
            <ScenarioDivider label="Default — LearnCard branding" />
            <RecoveryKey
                branding={LEARNCARD_BRANDING}
                recoveryKey="mango-delta-fox-echo-bravo-seven-lima-niner"
                confirmationCode="123456"
            />

            <ScenarioDivider label="Long recovery key (wrapping test)" />
            <RecoveryKey
                branding={LEARNCARD_BRANDING}
                recoveryKey="alpha-bravo-charlie-delta-echo-foxtrot-golf-hotel-india-juliet-kilo-lima"
                confirmationCode="654321"
            />

            <ScenarioDivider label="VetPass tenant branding" />
            <RecoveryKey
                branding={VETPASS_BRANDING}
                recoveryKey="sierra-tango-uniform-victor-whiskey-xray"
                confirmationCode="987654"
            />
        </>
    );
}
