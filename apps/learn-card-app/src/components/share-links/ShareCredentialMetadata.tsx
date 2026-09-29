import React from 'react';
import type { VC } from '@learncard/types';
import type { CredentialCategoryEnum } from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import useTheme from '../../theme/hooks/useTheme';
import { getLocale } from '../../paraglide/runtime.js';
import { credentialText } from './shareLinkFlow';

/** Shared display metadata for selection, preview, and recipient cards. */
export const ShareCredentialMetadata = ({
    credential,
    category,
}: {
    credential: VC;
    category?: string;
}) => {
    const { getThemedCategory } = useTheme();
    const resolvedCategory = category || getDefaultCategoryForCredential(credential);
    const categoryLabel = resolvedCategory
        ? getThemedCategory(resolvedCategory as CredentialCategoryEnum)?.category?.labels.plural ||
          resolvedCategory
        : undefined;
    const issuedAt = credential.validFrom || credential.issuanceDate;
    const issuedDate = issuedAt ? new Date(issuedAt) : undefined;
    const dateLabel =
        issuedDate && !Number.isNaN(issuedDate.getTime())
            ? issuedDate.toLocaleDateString(getLocale(), {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  timeZone: 'UTC',
              })
            : undefined;
    const details = [credentialText(credential).issuer, dateLabel].filter(Boolean).join(' · ');
    return (
        <>
            {categoryLabel && (
                <span className="block mt-0.5 text-xs text-grayscale-500">{categoryLabel}</span>
            )}
            {details && (
                <span className="block mt-1 text-xs text-grayscale-600 break-words">{details}</span>
            )}
        </>
    );
};
