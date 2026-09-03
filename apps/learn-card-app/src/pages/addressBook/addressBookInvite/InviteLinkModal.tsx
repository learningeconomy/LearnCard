import React from 'react';
import { IonSpinner } from '@ionic/react';
import { Clipboard } from '@capacitor/clipboard';

import { useToast, ToastTypeEnum } from 'learn-card-base';

import CopyStack from '../../../components/svgs/CopyStack';
import { useInviteLink } from '../../../hooks/useInviteLink';
import * as m from '../../../paraglide/messages.js';

/**
 * Desktop-web presentation of the personal invite link.
 *
 * Desktop deliberately does NOT get a share sheet. `navigator.share` is not
 * mobile-only — Chrome on macOS implements it and opens the OS sheet, which is
 * out of place next to this app's own share modals. Desktop users get the link
 * and a copy button here instead; native and mobile web still go to their OS
 * share sheet via `shareOrCopy`.
 */
const InviteLinkModal: React.FC = () => {
    const { presentToast } = useToast();
    const { data: invite, isLoading, isError } = useInviteLink({ enabled: true });

    const handleCopy = async () => {
        if (!invite?.url) return;

        try {
            await Clipboard.write({ string: invite.url });
            presentToast(m['contacts.invite.linkCopied'](), { hasDismissButton: true });
        } catch {
            presentToast(m['contacts.invite.linkFailed'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    return (
        <section className="text-grayscale-900 pt-[25px] pb-[16px]" data-testid="invite-link-modal">
            <div className="mb-4 flex w-full flex-col items-start justify-start px-4 text-left">
                <p className="font-notoSans m-0 text-xl tracking-wide text-grayscale-900">
                    {m['contacts.invite.qrHeading']()}
                </p>
                <p className="font-poppins mt-[10px] text-[14px] text-grayscale-700">
                    {m['contacts.invite.bodyLine1']()} {m['contacts.invite.bodyLine2']()}
                </p>
            </div>

            {isLoading && (
                <div className="flex w-full items-center justify-center py-8">
                    <IonSpinner name="crescent" />
                </div>
            )}

            {isError && (
                <p className="font-poppins px-4 py-6 text-center text-[15px] text-grayscale-600">
                    {m['contacts.invite.linkFailed']()}
                </p>
            )}

            {invite && (
                <div className="mt-4 flex w-full items-center justify-center rounded-[15px] px-4">
                    <button
                        type="button"
                        onClick={handleCopy}
                        aria-label={m['contacts.invite.copyLink']()}
                        data-testid="invite-copy-link"
                        className="flex w-full items-center justify-between rounded-2xl bg-grayscale-100 px-4 py-3 text-left"
                    >
                        <span className="flex w-[80%] items-center justify-start text-left">
                            <span className="line-clamp-1 text-sm font-medium text-grayscale-500">
                                {invite.url}
                            </span>
                        </span>
                        <span className="flex w-[20%] items-center justify-end">
                            <CopyStack className="h-[32px] w-[32px] text-grayscale-900" />
                        </span>
                    </button>
                </div>
            )}
        </section>
    );
};

export default InviteLinkModal;
