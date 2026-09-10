import React from 'react';

import type { LCNProfile } from '@learncard/types';
import { UserProfilePicture } from 'learn-card-base';
import ShieldBadgeContainer from 'learn-card-base/svgs/ShieldBadgeContainer';
import VerifiedBadge from 'learn-card-base/svgs/VerifiedBadge';

import { DEFAULT_BRAND_MARK, useTenantBrandingAssets } from '../../../config/brandingAssets';
import { getIdBackgroundStyles } from '../../../components/learncardID-CMS/learncard-cms.helpers';

type ContactProfileCardProps = {
    contact: LCNProfile;
};

const ContactProfileCard: React.FC<ContactProfileCardProps> = ({ contact }) => {
    const { brandMark } = useTenantBrandingAssets();
    const backgroundStyles = getIdBackgroundStyles(contact.display);
    const displayName = contact.displayName || contact.profileId;
    const accentColor = contact.display?.accentColor || '#FFFFFF';
    const accentFontColor = contact.display?.accentFontColor || '#18224E';

    return (
        <article className="flex aspect-[1.6] w-full flex-col overflow-hidden rounded-[20px] border-2 border-white/70 bg-grayscale-900 shadow-[0_0_15px_rgba(10,18,55,0.25)]">
            <div
                className="relative flex min-h-0 flex-1 items-center gap-5 bg-cover bg-center px-7"
                style={{ ...backgroundStyles, color: contact.display?.fontColor || '#FFFFFF' }}
            >
                <div className="relative shrink-0">
                    <UserProfilePicture
                        customContainerClass="flex h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-[28px] border-2 border-white text-4xl font-medium text-white shadow-lg"
                        customImageClass="block h-full w-full !rounded-[26px] object-cover"
                        customSize={240}
                        user={contact}
                    />
                    {contact?.approved && (
                        <ShieldBadgeContainer className="absolute -bottom-2 -right-2 drop-shadow-md">
                            <VerifiedBadge />
                        </ShieldBadgeContainer>
                    )}
                </div>

                <div className="min-w-0 font-poppins text-white">
                    <h2 className="truncate text-xl font-semibold leading-tight">{displayName}</h2>
                    <p className="truncate text-sm font-medium">@{contact.profileId}</p>
                </div>
            </div>

            <div
                className="flex h-[60px] shrink-0 items-center gap-3 border-t border-white/20 px-3"
                style={{ backgroundColor: accentColor, color: accentFontColor }}
            >
                <img
                    src={brandMark}
                    alt=""
                    className="h-10 w-10 rounded-xl object-cover"
                    onError={event => {
                        if (!event.currentTarget.dataset.fallbackApplied) {
                            event.currentTarget.dataset.fallbackApplied = 'true';
                            event.currentTarget.src = DEFAULT_BRAND_MARK;
                        }
                    }}
                />
                <div className="min-w-0 font-poppins">
                    {/* <p className="truncate text-sm font-semibold">{brandingConfig?.name}</p> */}
                    <p className="truncate text-[12px] font-semibold uppercase tracking-[0.22em]">
                        LEARNCARD PASSPORT
                    </p>
                </div>
            </div>
        </article>
    );
};

export default ContactProfileCard;
