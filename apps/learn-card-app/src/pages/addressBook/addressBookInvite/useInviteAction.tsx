import React, { useState } from 'react';

import {
    useToast,
    ToastTypeEnum,
    useModal,
    ModalTypes,
    useDeviceTypeByWidth,
} from 'learn-card-base';
import { AnalyticsEvents, useAnalytics, type InviteSurface } from '@analytics';

import useLCNGatedAction from '../../../components/network-prompts/hooks/useLCNGatedAction';
import { useInviteLink } from '../../../hooks/useInviteLink';
import { shareOrCopy } from '../../../helpers/shareHelpers';
import InviteLinkModal from './InviteLinkModal';
import * as m from '../../../paraglide/messages.js';

/**
 * The "share my personal invite link" action, shared by every surface that
 * offers it — the empty-state CTA and the "New +" menu row.
 *
 * This lives in one place on purpose. The platform branching below is subtle
 * enough that duplicating it per call site is how it goes wrong: an earlier
 * version decided by feature detection alone and popped the macOS share sheet
 * on desktop, because `navigator.share` is not mobile-only.
 */
export const useInviteAction = ({
    surface,
    prefetch = false,
}: {
    surface: InviteSurface;
    /**
     * Resolve the link eagerly rather than on tap. Only the empty state should
     * pass true — it renders for zero-contact users only, whereas `listInvites`
     * is a Redis `KEYS` scan that must stay off hot paths.
     */
    prefetch?: boolean;
}) => {
    const { gate } = useLCNGatedAction();
    const { presentToast } = useToast();
    const analytics = useAnalytics();
    const { newModal } = useModal();
    const { isMobile } = useDeviceTypeByWidth();

    const [isSharing, setIsSharing] = useState(false);

    /*
      `enabled` tracks `prefetch` only — never a "user tapped" flag. Flipping
      the query on AND calling refetch() would fire two concurrent resolutions,
      and for a user with no existing invite that mints two invites instead of
      one. On-tap resolution goes through refetch() alone, which works fine on a
      disabled query in react-query v5.
    */
    const { data: invite, refetch } = useInviteLink({ enabled: prefetch });

    const track = (method: 'native' | 'web_share' | 'clipboard' | 'modal', shared: boolean) => {
        // Never awaited inside the try below: a rejecting analytics provider
        // would surface "unable to create an invite link" for a share that
        // already succeeded.
        void analytics
            .track(AnalyticsEvents.CONTACT_INVITE_SHARED, { surface, method, shared })
            .catch(() => {});
    };

    const share = async () => {
        const { prompted } = await gate();
        if (prompted) return;

        setIsSharing(true);

        try {
            const link = invite ?? (await refetch()).data;

            if (!link) throw new Error('No invite link');

            // Desktop web gets this app's own share modal, not an OS sheet.
            // Native and mobile web still get their OS share sheet.
            if (!isMobile) {
                newModal(
                    <InviteLinkModal />,
                    { sectionClassName: '!max-w-[400px]' },
                    { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
                );

                track('modal', true);

                return;
            }

            const result = await shareOrCopy({
                url: link.url,
                title: m['contacts.invite.cta'](),
                allowWebShare: true,
            });

            if (result.method === 'clipboard') {
                presentToast(m['contacts.invite.linkCopied'](), { hasDismissButton: true });
            }

            track(result.method, result.shared);
        } catch {
            presentToast(m['contacts.invite.linkFailed'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setIsSharing(false);
        }
    };

    return { share, isSharing };
};

export default useInviteAction;
