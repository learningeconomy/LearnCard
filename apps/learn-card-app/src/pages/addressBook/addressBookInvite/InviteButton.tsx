import React from 'react';
import { IonSpinner } from '@ionic/react';

import LinkChain from 'learn-card-base/svgs/LinkChain';
import { type InviteSurface } from '@analytics';

import { useInviteAction } from './useInviteAction';
import * as m from '../../../paraglide/messages.js';

/**
 * Primary "Invite a Friend" CTA on the contacts empty state.
 *
 * The action itself lives in `useInviteAction`, shared with the "New +" menu
 * row so the platform branching exists in exactly one place.
 */
const InviteButton: React.FC<{
    surface: InviteSurface;
    /** Resolve the link on mount rather than on tap. See `useInviteAction`. */
    prefetch?: boolean;
    className?: string;
}> = ({ surface, prefetch = false, className = '' }) => {
    const { share, isSharing } = useInviteAction({ surface, prefetch });

    return (
        <button
            type="button"
            onClick={share}
            disabled={isSharing}
            data-testid={`invite-button-${surface}`}
            aria-label={m['contacts.invite.cta']()}
            className={`flex h-[41px] w-full items-center justify-center gap-[6px] rounded-[15px] bg-indigo-600 px-[30px] py-[10px] font-poppins text-[14px] font-semibold text-white ${className}`}
        >
            {isSharing ? (
                <IonSpinner name="crescent" className="h-[20px] w-[20px]" />
            ) : (
                <>
                    <LinkChain version="thin" stroke="white" className="h-[25px] w-[25px]" />
                    {m['contacts.invite.cta']()}
                </>
            )}
        </button>
    );
};

export default InviteButton;
