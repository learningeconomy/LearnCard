import React from 'react';
import { useIonModal } from '@ionic/react';

import { AnalyticsEvents, useAnalytics } from '@analytics';

import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import InviteFriends from '../../../components/svgs/placeholders/InviteFriends';
import QrCodeGlyph from '../../../components/svgs/QrCodeGlyph';
import InviteQRCodeModal from './InviteQRCodeModal';
import InviteButton from './InviteButton';
import * as m from '../../../paraglide/messages.js';

/**
 * Shown in place of the contact list when the user has no connections.
 *
 * Figma node 2864:28606. The frame is desktop-only, so the generous
 * `pb-[100px]` from the design is applied at `sm:` and up — on a phone it
 * would push the QR button below the fold.
 */
const ContactsInviteEmptyState: React.FC = () => {
    const analytics = useAnalytics();
    const brandingConfig = useBrandingConfig();
    const brand = brandingConfig?.name ?? 'LearnCard';

    const [presentQrModal, dismissQrModal] = useIonModal(InviteQRCodeModal, {
        handleCloseModal: () => dismissQrModal(),
    });

    const handleShowQr = () => {
        // Fire-and-forget, exactly as `useInviteAction` does. Awaiting this
        // delayed the modal behind the analytics round trip, and a rejecting
        // provider stopped it opening at all — a dead button because a metric
        // failed.
        void analytics
            .track(AnalyticsEvents.CONTACT_INVITE_QR_SHOWN, { surface: 'empty_state' })
            .catch(() => {});

        presentQrModal({
            cssClass: 'generic-modal show-modal ion-disable-focus-trap',
            backdropDismiss: true,
            showBackdrop: false,
        });
    };

    return (
        <section
            data-testid="contacts-invite-empty-state"
            className="flex w-full flex-col items-center justify-center gap-[40px] rounded-[30px] bg-white px-[24px] pb-[48px] pt-[40px] sm:px-[40px] sm:pb-[100px]"
        >
            <InviteFriends className="h-[115px] w-[217px] max-w-full" />

            <div className="flex flex-col items-center gap-[20px]">
                <h2 className="text-center font-poppins text-[24px] font-semibold text-grayscale-800">
                    {m['contacts.invite.heading']({ brand })}
                </h2>

                <div className="text-center font-poppins text-[17px] text-grayscale-600">
                    <p>{m['contacts.invite.bodyLine1']()}</p>
                    <p>{m['contacts.invite.bodyLine2']()}</p>
                </div>

                <div className="flex w-full max-w-[300px] flex-col items-center justify-center gap-[20px]">
                    <InviteButton surface="empty_state" prefetch />

                    <div className="flex w-full items-center justify-center gap-[10px]">
                        <span className="h-px flex-1 bg-grayscale-300" />
                        <span className="font-poppins text-[17px] text-grayscale-500">
                            {m['contacts.invite.or']()}
                        </span>
                        <span className="h-px flex-1 bg-grayscale-300" />
                    </div>

                    <p className="text-center font-poppins text-[17px] text-grayscale-600">
                        {m['contacts.invite.nearby']()}
                    </p>

                    <button
                        type="button"
                        onClick={handleShowQr}
                        data-testid="invite-show-qr"
                        className="flex h-[41px] w-full items-center justify-center gap-[6px] rounded-[15px] border border-grayscale-200 bg-grayscale-50 px-[30px] py-[10px] font-poppins text-[14px] font-semibold text-grayscale-700"
                    >
                        <QrCodeGlyph className="h-[25px] w-[25px]" />
                        {m['contacts.invite.showQr']()}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ContactsInviteEmptyState;
