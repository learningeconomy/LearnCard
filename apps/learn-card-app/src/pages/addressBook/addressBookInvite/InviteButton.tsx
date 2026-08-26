import React, { useState } from 'react';
import { IonSpinner } from '@ionic/react';

import LinkChain from 'learn-card-base/svgs/LinkChain';
import { useToast, ToastTypeEnum } from 'learn-card-base';
import { AnalyticsEvents, useAnalytics, type InviteSurface } from '@analytics';

import useLCNGatedAction from '../../../components/network-prompts/hooks/useLCNGatedAction';
import { useInviteLink } from '../../../hooks/useInviteLink';
import { shareOrCopy } from '../../../helpers/shareHelpers';
import * as m from '../../../paraglide/messages.js';

export type InviteButtonVariant = 'pill' | 'block';

/**
 * Shares the user's personal invite link.
 *
 * `pill` sits in the contacts header next to "New +". `block` is the primary
 * CTA inside the empty state, sized to the 300px stack from the design. Both
 * share the gate, the link resolution and the loading state.
 */
const InviteButton: React.FC<{
    variant?: InviteButtonVariant;
    surface: InviteSurface;
    /**
     * Resolve the link eagerly rather than on tap. The empty state passes true
     * because it renders only for zero-contact users; the header does not,
     * because `listInvites` is a server-side scan.
     */
    prefetch?: boolean;
    className?: string;
}> = ({ variant = 'pill', surface, prefetch = false, className = '' }) => {
    const { gate } = useLCNGatedAction();
    const { presentToast } = useToast();
    const analytics = useAnalytics();

    const [sharing, setSharing] = useState(false);

    /*
      `enabled` tracks `prefetch` only — never a "user tapped" flag. Flipping
      the query on AND calling refetch() would fire two concurrent resolutions,
      and for a user with no existing invite that mints two invites instead of
      one. On-tap resolution goes through refetch() alone, which works fine on a
      disabled query in react-query v5.
    */
    const { data: invite, refetch } = useInviteLink({ enabled: prefetch });

    const handleClick = async () => {
        const { prompted } = await gate();
        if (prompted) return;

        setSharing(true);

        try {
            const link = invite ?? (await refetch()).data;

            if (!link) throw new Error('No invite link');

            const result = await shareOrCopy({
                url: link.url,
                title: m['contacts.invite.cta'](),
            });

            if (result.method === 'clipboard') {
                presentToast(m['contacts.invite.linkCopied'](), { hasDismissButton: true });
            }

            await analytics.track(AnalyticsEvents.CONTACT_INVITE_SHARED, {
                surface,
                method: result.method,
                shared: result.shared,
            });
        } catch {
            presentToast(m['contacts.invite.linkFailed'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setSharing(false);
        }
    };

    const isPill = variant === 'pill';

    const classes = isPill
        ? 'flex items-center rounded-[40px] bg-indigo-600 py-[6px] px-[16px] font-poppins text-[17px] font-semibold text-white'
        : 'flex h-[41px] w-full items-center justify-center gap-[6px] rounded-[15px] bg-indigo-600 px-[30px] py-[10px] font-poppins text-[14px] font-semibold text-white';

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={sharing}
            data-testid={`invite-button-${surface}`}
            aria-label={m['contacts.invite.cta']()}
            className={`${classes} ${className}`}
        >
            {sharing ? (
                <IonSpinner name="crescent" className="h-[20px] w-[20px]" />
            ) : (
                <>
                    <LinkChain
                        version="thin"
                        stroke="white"
                        className={isPill ? 'me-[4px] h-[20px] w-[20px]' : 'h-[25px] w-[25px]'}
                    />
                    {isPill ? m['contacts.invite.short']() : m['contacts.invite.cta']()}
                </>
            )}
        </button>
    );
};

export default InviteButton;
