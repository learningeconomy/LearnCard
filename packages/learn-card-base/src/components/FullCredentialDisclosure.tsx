import React from 'react';
import type { ConsentFlowContractDetails } from '@learncard/types';
import { useT } from '../i18n';

/** Identify exactly which recipients can receive the original credential. */
export const FullCredentialDisclosure = ({
    recipients,
}: {
    recipients: ConsentFlowContractDetails['readableDeliveryRecipients'];
}) => {
    const t = useT();
    const organizations = recipients
        ?.filter(recipient => recipient.enabled && recipient.disclosureVersion === '2')
        .map(recipient => recipient.displayName)
        .join(', ');
    return organizations ? (
        <span className="block text-sm text-grayscale-700">
            {t('consentAudience.fullCredential', { organizations })}
        </span>
    ) : null;
};
