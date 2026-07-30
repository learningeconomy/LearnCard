import React from 'react';
import { UserProfilePicture } from 'learn-card-base';
import CaretRight from 'learn-card-base/svgs/CaretRight';
import { ActivityCredentialIcon } from './ActivityCredentialIcon';
import type { ActivityFeedItemVM } from './activityFeed.helpers';
import * as m from '../../../paraglide/messages.js';
import { tShortMonth } from './activityFeedI18n';

const shortDate = (iso: string) => {
    const d = new Date(iso);
    return `${tShortMonth(d.getUTCMonth())} ${d.getUTCDate()}`;
};

export const ActivityFeedItem: React.FC<{
    item: ActivityFeedItemVM;
    onSelect?: (item: ActivityFeedItemVM) => void;
}> = ({ item, onSelect }) => {
    return (
        <li
            data-unread={item.unread}
            className="[&:not(:last-of-type)]:border-b border-grayscale-100"
        >
            <button
                type="button"
                onClick={() => onSelect?.(item)}
                aria-label={item.title}
                className={`flex items-center gap-3 w-full text-left py-3 px-2 rounded-[12px] transition-colors hover:bg-grayscale-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    item.unread ? 'bg-emerald-50' : ''
                }`}
            >
                <div
                    className="relative shrink-0 h-[44px] w-[44px]"
                    style={
                        item.lifecycleStatus !== 'active'
                            ? { filter: 'grayscale(1) brightness(0.95)' }
                            : undefined
                    }
                >
                    {item.isSelf ? (
                        <div className="flex items-center justify-center h-[44px] w-[44px]">
                            <ActivityCredentialIcon
                                category={item.category}
                                isGeneric={item.isGenericCredential}
                                className="w-[38px] h-[38px]"
                            />
                        </div>
                    ) : (
                        <>
                            <UserProfilePicture
                                user={{
                                    displayName: item.avatar.displayName,
                                    profileId: item.avatar.profileId,
                                    image: item.avatar.image,
                                }}
                                customContainerClass="h-[44px] w-[44px] min-h-[44px] min-w-[44px] text-[16px]"
                                customImageClass="h-[44px] w-[44px] object-cover"
                            />
                            <span className="absolute -right-[3px] -bottom-[3px] flex items-center justify-center h-[22px] w-[22px] rounded-full bg-white ring-2 ring-white shadow-sm">
                                <ActivityCredentialIcon
                                    category={item.category}
                                    isGeneric={item.isGenericCredential}
                                    className="w-[20px] h-[20px]"
                                />
                            </span>
                        </>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-poppins text-[15px] truncate">
                        <span className="font-[500] text-grayscale-900">{item.titleLead}</span>
                        {item.titleSubject && (
                            <span className="font-normal text-grayscale-600">
                                {' '}
                                {item.titleSubject}
                            </span>
                        )}
                    </p>
                    {item.credentialType && (
                        <p className="font-poppins text-[13px] text-grayscale-500 truncate">
                            {item.credentialType}
                        </p>
                    )}
                    {item.lifecycleStatus !== 'active' && (
                        <span
                            className="inline-block mt-1 rounded-full px-[8px] py-[1px] text-[11px] font-bold uppercase tracking-wide text-white"
                            style={{
                                backgroundColor:
                                    item.lifecycleStatus === 'revoked' ? '#DC2626' : '#D97706',
                            }}
                        >
                            {item.statusLabel}
                        </span>
                    )}
                </div>

                <span className="font-poppins text-[13px] text-grayscale-500 whitespace-nowrap">
                    {shortDate(item.timestamp)}
                </span>
                <CaretRight className="h-3 w-auto text-grayscale-400" />
            </button>
        </li>
    );
};

export default ActivityFeedItem;
