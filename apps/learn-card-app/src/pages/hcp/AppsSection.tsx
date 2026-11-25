import React, { useState } from 'react';

import { useHcpChange, useHcpGrants, type HcpGrant } from 'learn-card-base/hcp/useHcp';
import * as m from '../../paraglide/messages.js';
import { categoryList, grantCategories, grantPurposes } from './hcpModel';
import { formatWhen, HcpEmpty, HcpError, HcpLoading } from './HcpStates';

export const GrantCard: React.FC<{ grant: HcpGrant }> = ({ grant }) => {
    const change = useHcpChange();
    const [confirming, setConfirming] = useState(false);
    const name = grant.client.name;

    return (
        <li className="p-4 bg-white rounded-2xl border border-grayscale-200 space-y-1">
            <p className="text-[15px] font-semibold text-grayscale-900">{name}</p>
            <p className="text-sm text-grayscale-700">
                {m['hcp.apps.canSee']({ categories: categoryList(grantCategories(grant)) })}
            </p>
            <p className="text-sm text-grayscale-600">
                {m['hcp.apps.why']({ purpose: grantPurposes(grant).join('; ') })}
            </p>
            <p className="text-sm text-grayscale-600">
                {grant.expiresAt
                    ? m['hcp.apps.until']({ date: formatWhen(grant.expiresAt) })
                    : m['hcp.apps.untilStopped']()}
            </p>
            {confirming ? (
                <div className="pt-2 space-y-2">
                    <p className="text-sm text-grayscale-700">
                        {m['hcp.apps.stopConfirm']({ app: name })}
                    </p>
                    {change.isError && (
                        <p className="text-sm text-red-700">{m['hcp.error.save']()}</p>
                    )}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={change.isPending}
                            onClick={() =>
                                change.mutate({ kind: 'revoke', grantId: grant.grantId })
                            }
                            className="py-2 px-4 rounded-[20px] bg-red-600 text-white text-sm font-medium disabled:opacity-50"
                        >
                            {change.isPending ? m['hcp.apps.stopping']() : m['hcp.apps.stop']()}
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            className="py-2 px-4 rounded-[20px] border border-grayscale-300 text-sm text-grayscale-700"
                        >
                            {m['common.cancel']()}
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="pt-2 text-sm font-medium text-red-600"
                >
                    {m['hcp.apps.stop']()}
                </button>
            )}
        </li>
    );
};

const AppsSection: React.FC = () => {
    const grants = useHcpGrants('active');

    if (grants.isPending) return <HcpLoading />;
    if (grants.isError) return <HcpError onRetry={() => void grants.refetch()} />;
    if (grants.data.length === 0)
        return <HcpEmpty title={m['hcp.apps.emptyTitle']()} body={m['hcp.apps.emptyBody']()} />;

    return (
        <ul className="space-y-3">
            {grants.data.map(grant => (
                <GrantCard key={grant.grantId} grant={grant} />
            ))}
        </ul>
    );
};

export default AppsSection;
