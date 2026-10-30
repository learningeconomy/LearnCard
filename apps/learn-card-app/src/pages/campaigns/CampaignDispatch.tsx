import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Campaign, CampaignDispatchPreview } from '@learncard/types';
import { useModal } from 'learn-card-base/components/modals/useModal';
import { ModalTypes } from 'learn-card-base/components/modals/types/Modals';
import type { CampaignApi } from './types';
import { useCampaignAction } from './useCampaignAction';
import { CampaignDispatchConfirmation } from './CampaignDispatchConfirmation';
import { Busy, Notice, primaryClass } from './ui';

const reasons: Record<NonNullable<CampaignDispatchPreview['blockedReason']>, string> = {
    not_live: 'Go live before sending audience notifications.',
    notify_disabled: 'Enable Inbox / push notification and save before sending.',
    not_started: 'This campaign has not started yet. Check its start date.',
    ended: 'This campaign has ended. Update its end date and save to send notifications.',
    no_recipients:
        'No eligible members remain to notify. They may already have been notified or may not meet the campaign eligibility rules.',
};
const errorCode = (error: unknown): unknown => {
    if (!error || typeof error !== 'object') return undefined;
    if ('data' in error && error.data && typeof error.data === 'object' && 'code' in error.data)
        return error.data.code;
    return 'code' in error ? error.code : undefined;
};

export const CampaignDispatch: React.FC<{
    api: CampaignApi;
    campaign: Campaign;
    disabled: boolean;
    onBusy: (busy: boolean) => void;
}> = ({ api, campaign, disabled, onBusy }) => {
    const [preview, setPreview] = useState<CampaignDispatchPreview>();
    const [conflict, setConflict] = useState('');
    const [now, setNow] = useState(() => new Date().toISOString());
    const action = useCampaignAction();
    const queries = useQueryClient();
    const { newModalWithToken, forceCloseModalByToken } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });
    const sendRef = useRef<() => void>(() => undefined);
    const sendButtonRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        onBusy(Boolean(action.busy));
    }, [action.busy, onBusy]);
    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date().toISOString()), 30_000);
        return () => window.clearInterval(timer);
    }, []);
    useEffect(() => {
        setPreview(undefined);
    }, [campaign.id, campaign.updatedAt, disabled]);
    const unavailable = disabled
        ? 'Save changes and finish other actions before sending.'
        : campaign.status !== 'live'
          ? reasons.not_live
          : !campaign.channels.includes('notify') || !campaign.notification
            ? reasons.notify_disabled
            : campaign.startsAt && campaign.startsAt > now
              ? reasons.not_started
              : campaign.endsAt && campaign.endsAt <= now
                ? reasons.ended
                : undefined;
    const loadPreview = () =>
        void action.run('Checking recipients...', async () => {
            setPreview(undefined);
            setConflict('');
            const next = await api.campaignsPreviewDispatch(campaign.id);
            setPreview(next);
        });
    const send = () => {
        if (!preview || preview.blockedReason || !preview.recipientCount || unavailable) return;
        const token = preview.previewToken;
        void action.run('Starting notification delivery...', async () => {
            setPreview(undefined);
            setConflict('');
            try {
                await api.campaignsDispatch(campaign.id, { expectedPreviewToken: token });
                action.setSuccess(
                    'Notification delivery started. Stats update as inbox notifications are stored.'
                );
            } catch (error) {
                if (errorCode(error) === 'CONFLICT' || errorCode(error) === 'BAD_REQUEST') {
                    setConflict(
                        'The campaign or eligible recipients changed. Review the recipient count again before sending.'
                    );
                } else throw error;
            } finally {
                void queries.invalidateQueries({ queryKey: ['campaign-stats', campaign.id] });
                void queries.invalidateQueries({ queryKey: ['campaign-audience', campaign.id] });
            }
        });
    };
    // Modal content lives outside this component's tree. Keep its action current
    // without reopening the review on every parent render or clock tick.
    useLayoutEffect(() => {
        sendRef.current = send;
    });
    useEffect(() => {
        if (!preview || unavailable || action.busy) return;
        // Loading disables the trigger and can blur it. Restore the origin before
        // the shared modal captures its return-focus target.
        sendButtonRef.current?.focus();
        const token = newModalWithToken(
            <CampaignDispatchConfirmation
                campaignName={campaign.name}
                preview={preview}
                blockedReason={preview.blockedReason ? reasons[preview.blockedReason] : undefined}
                onConfirm={() => sendRef.current()}
                onCancel={() => setPreview(undefined)}
            />,
            { onClose: () => setPreview(undefined) }
        );
        // Close only this review when it becomes stale or the editor unmounts.
        return () => forceCloseModalByToken(token);
    }, [
        preview,
        unavailable,
        action.busy,
        campaign.name,
        newModalWithToken,
        forceCloseModalByToken,
    ]);
    return (
        <div className="flex flex-col gap-4 border-t border-grayscale-200 pt-5">
            <button
                ref={sendButtonRef}
                type="button"
                className={`${primaryClass} w-full`}
                disabled={Boolean(unavailable) || Boolean(action.busy)}
                onClick={loadPreview}
            >
                {action.busy ? <Busy>{action.busy}</Busy> : 'Send Notifications'}
            </button>
            <p className="text-xs leading-relaxed text-grayscale-600">
                {unavailable ?? 'Review eligible recipients before sending to the stored audience.'}
            </p>
            {action.error && <Notice error>{action.error}</Notice>}
            {conflict && <Notice error>{conflict}</Notice>}
            {action.success && <Notice>{action.success}</Notice>}
        </div>
    );
};
