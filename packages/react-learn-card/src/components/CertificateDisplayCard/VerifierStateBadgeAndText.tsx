import React, { forwardRef } from 'react';
import type { IssuerContext } from '@learncard/types';

import UnknownVerifierBadge from '../svgs/UnknownVerifierBadge';
import VerifiedBadge from '../svgs/VerifiedBadge';
import PersonBadge from '../svgs/PersonBadge';
import RedFlag from '../svgs/RedFlag';

export type VerifierStateBadgeAndTextProps = {
    issuerContext: IssuerContext;
    label: string;
    issuerName?: string;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const IssuerAvatar: React.FC<{ issuerContext: IssuerContext }> = ({ issuerContext }) => {
    const profile = issuerContext.profile;
    const initial = profile?.displayName?.trim()[0] ?? profile?.profileId?.trim()[0] ?? '?';

    if (profile?.image) {
        return (
            <img
                src={profile.image}
                alt=""
                className="w-[22px] h-[22px] rounded-full object-cover bg-grayscale-100"
                referrerPolicy="no-referrer"
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            className="w-[22px] h-[22px] rounded-full bg-grayscale-200 text-grayscale-700 flex items-center justify-center text-[10px] font-semibold uppercase"
        >
            {initial}
        </span>
    );
};

export const IssuerLabelText: React.FC<{ label: string; issuerName?: string }> = ({
    label,
    issuerName,
}) => {
    const exactIssuerName = issuerName ?? '';
    const issuerNameStart = exactIssuerName ? label.indexOf(exactIssuerName) : -1;

    if (issuerNameStart < 0) return <>{label}</>;

    return (
        <>
            {label.slice(0, issuerNameStart)}
            <strong className="font-bold">{exactIssuerName}</strong>
            {label.slice(issuerNameStart + exactIssuerName.length)}
        </>
    );
};

const VerifierStateBadgeAndText = forwardRef<HTMLButtonElement, VerifierStateBadgeAndTextProps>(
    ({ issuerContext, label, issuerName, className = '', onClick }, ref) => {
        const isRelationshipState =
            issuerContext.state === 'connection' ||
            issuerContext.state === 'mutuals' ||
            issuerContext.state === 'identified' ||
            issuerContext.state === 'unclaimed';
        const color =
            issuerContext.state === 'denied'
                ? 'text-red-600'
                : issuerContext.state === 'trusted' ||
                  issuerContext.state === 'app' ||
                  issuerContext.state === 'connection'
                ? 'text-emerald-600'
                : issuerContext.state === 'unresolvable'
                ? 'text-amber-600'
                : issuerContext.state === 'unclaimed'
                ? 'text-grayscale-500'
                : 'text-grayscale-700';
        const icon = isRelationshipState ? (
            <IssuerAvatar issuerContext={issuerContext} />
        ) : issuerContext.state === 'denied' ? (
            <RedFlag />
        ) : issuerContext.state === 'self' ? (
            <PersonBadge />
        ) : issuerContext.state === 'trusted' || issuerContext.state === 'app' ? (
            <VerifiedBadge />
        ) : (
            <UnknownVerifierBadge />
        );
        const emphasizedIssuerName =
            issuerName ?? issuerContext.profile?.displayName ?? issuerContext.profile?.profileId;
        const renderedLabel = <IssuerLabelText label={label} issuerName={emphasizedIssuerName} />;
        const content = (
            <div
                className={`flex items-center gap-1 font-poppins font-[500] text-[12px] leading-tight ${color}`}
            >
                {icon}
                <span className="whitespace-nowrap">{renderedLabel}</span>
            </div>
        );

        return (
            <div className={`flex justify-center ${className}`}>
                {onClick ? (
                    <button
                        ref={ref}
                        type="button"
                        className="appearance-none bg-transparent p-0 text-left"
                        onClick={event => {
                            event.stopPropagation();
                            onClick(event);
                        }}
                        onMouseDown={event => event.stopPropagation()}
                        aria-haspopup="dialog"
                    >
                        {content}
                    </button>
                ) : (
                    <div>{content}</div>
                )}
            </div>
        );
    }
);

VerifierStateBadgeAndText.displayName = 'VerifierStateBadgeAndText';

export default VerifierStateBadgeAndText;
