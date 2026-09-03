import React from 'react';
import moment from 'moment';

import type { CredentialRefreshMetadata } from 'learn-card-base/types/credential-records';

import * as m from '../../../paraglide/messages.js';

type CredentialUpdatedIndicatorProps = {
    /** Refresh metadata from the credential's encrypted LearnCloud index record */
    refresh?: CredentialRefreshMetadata;
    className?: string;
};

/**
 * Updated indicator for refreshable credentials (LC-2117, LC-2135, LC-2136).
 *
 * While the record carries an unread refresh update, an emerald `Updated` pill is
 * shown. Once the update has been viewed (and the cleared flag persisted), the pill
 * is replaced by an unobtrusive `Updated {date}` label so the update date remains
 * visible. Records without refresh metadata render nothing.
 */
const CredentialUpdatedIndicator: React.FC<CredentialUpdatedIndicatorProps> = ({
    refresh,
    className,
}) => {
    if (!refresh) return null;

    if (refresh.unreadUpdate) {
        return (
            <span
                data-testid="credential-updated-pill"
                className={`inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100
                            text-emerald-700 text-xs font-medium px-2.5 py-0.5 ${className ?? ''}`}
            >
                {m['alerts.updated']()}
            </span>
        );
    }

    if (refresh.lastUpdatedAt) {
        const date = moment(refresh.lastUpdatedAt).format('MMM D, YYYY');

        return (
            <span
                data-testid="credential-updated-date"
                className={`text-xs text-grayscale-500 ${className ?? ''}`}
            >
                {m['credentialHistory.updatedOn']({ date })}
            </span>
        );
    }

    return null;
};

export default CredentialUpdatedIndicator;
