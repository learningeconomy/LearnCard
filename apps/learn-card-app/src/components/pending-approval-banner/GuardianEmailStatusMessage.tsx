import React from 'react';
import type { GuardianApprovalRequestStatus } from '@learncard/types';

import * as m from '../../paraglide/messages.js';
import { TransP } from '../../i18n/TransP';

type GuardianEmailStatus = Pick<
    GuardianApprovalRequestStatus,
    'status' | 'guardianEmail' | 'linkExpiresAt'
>;

export const isGuardianLinkExpired = (status?: GuardianEmailStatus | null): boolean =>
    status?.status === 'accepted' &&
    !!status.linkExpiresAt &&
    Date.parse(status.linkExpiresAt) <= Date.now();

/**
 * Learner-facing copy for the latest guardian approval email. "accepted" only means the
 * provider took the message, so the copy never claims it reached the guardian's inbox.
 */
const GuardianEmailStatusMessage: React.FC<{ status?: GuardianEmailStatus | null }> = ({
    status,
}) => {
    if (!status) return null;

    const values = { email: status.guardianEmail ?? '' };
    const components = [<span className="font-semibold" key="email" />];

    if (isGuardianLinkExpired(status)) {
        return (
            <TransP
                m={m['onboarding.consent.eu.status.expired']}
                values={values}
                components={components}
            />
        );
    }

    switch (status.status) {
        case 'accepted':
            return (
                <TransP
                    m={m['onboarding.consent.eu.status.accepted']}
                    values={values}
                    components={components}
                />
            );
        case 'failed':
            return (
                <TransP
                    m={m['onboarding.consent.eu.status.failed']}
                    values={values}
                    components={components}
                />
            );
        case 'sending':
            return <>{m['onboarding.consent.eu.status.sending']()}</>;
        case 'unknown':
            return <>{m['onboarding.consent.eu.status.unknown']()}</>;
        default:
            return null;
    }
};

export default GuardianEmailStatusMessage;
