import React, { useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, arrowForwardOutline, calendarOutline } from 'ionicons/icons';
import { UserProfilePicture } from 'learn-card-base';
import { ActivityCredentialIcon } from './ActivityCredentialIcon';
import type { ActivityFeedItemVM } from './activityFeed.helpers';

export const ActivityDetailOverlay: React.FC<{
    item: ActivityFeedItemVM;
    onClose: () => void;
}> = ({ item, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    const formattedDate = new Date(item.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });

    const subText = item.isSelf
        ? 'You added this to your passport.'
        : item.direction === 'sent'
        ? `You shared this with ${item.counterpartyName}.`
        : `${item.actorName || 'Someone'} shared this with you.`;

    const personNode = (
        <UserProfilePicture
            user={{
                displayName: item.avatar.displayName,
                profileId: item.avatar.profileId,
                image: item.avatar.image,
            }}
            customContainerClass="h-[64px] w-[64px] min-h-[64px] min-w-[64px] text-[24px]"
            customImageClass="h-[64px] w-[64px] object-cover"
        />
    );
    const credentialNode = (
        <div className="flex items-center justify-center w-[64px] h-[64px]">
            <ActivityCredentialIcon item={item} className="w-[44px] h-[44px]" />
        </div>
    );
    // Sent: the credential travels to the person (credential → person). Received:
    // it comes from the person (person → credential).
    const [leadNode, trailNode] =
        item.direction === 'sent' ? [credentialNode, personNode] : [personNode, credentialNode];

    const statusToneClass: Record<typeof item.statusTone, string> = {
        neutral: 'bg-grayscale-100 text-grayscale-700',
        positive: 'bg-emerald-50 text-emerald-700',
        warning: 'bg-amber-50 text-amber-700',
        critical: 'bg-red-50 text-red-700',
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in-up font-poppins p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-t-[24px] sm:rounded-[24px] w-full sm:max-w-[480px] shadow-2xl relative flex flex-col"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-grayscale-100 hover:bg-grayscale-200 rounded-full text-grayscale-700 transition-colors"
                >
                    <IonIcon icon={closeOutline} className="text-xl" />
                </button>

                <div className="p-8 pb-6 flex flex-col items-center">
                    <div className="flex items-center justify-center gap-4 mb-5">
                        {item.isSelf ? (
                            <div className="flex items-center justify-center w-[64px] h-[64px]">
                                <ActivityCredentialIcon item={item} className="w-[44px] h-[44px]" />
                            </div>
                        ) : (
                            <>
                                {leadNode}
                                <IonIcon
                                    icon={arrowForwardOutline}
                                    className="text-2xl text-grayscale-300"
                                />
                                {trailNode}
                            </>
                        )}
                    </div>
                    <h2 className="text-xl font-semibold text-grayscale-900 text-center mb-1">
                        {item.title}
                    </h2>
                    <p className="text-sm text-grayscale-600 text-center">{subText}</p>
                </div>

                <div className="px-6 pb-2 flex flex-col space-y-3">
                    {item.credentialType && (
                        <div className="flex items-center justify-between border-b border-grayscale-100 pb-3">
                            <span className="text-xs font-medium text-grayscale-500 uppercase tracking-[0.5px]">
                                What
                            </span>
                            <span className="text-sm text-grayscale-900 font-medium text-right">
                                {item.credentialType}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center justify-between border-b border-grayscale-100 pb-3">
                        <span className="text-xs font-medium text-grayscale-500 uppercase tracking-[0.5px]">
                            Type
                        </span>
                        <span className="text-sm text-grayscale-900 font-medium text-right">
                            {item.categoryLabel}
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-grayscale-100 pb-3">
                        <span className="text-xs font-medium text-grayscale-500 uppercase tracking-[0.5px]">
                            Date
                        </span>
                        <span className="text-sm text-grayscale-900 font-medium text-right flex items-center gap-1.5 justify-end">
                            <IonIcon
                                icon={calendarOutline}
                                className="text-grayscale-500 text-sm"
                            />
                            {formattedDate}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-grayscale-500 uppercase tracking-[0.5px]">
                            Status
                        </span>
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                statusToneClass[item.statusTone]
                            }`}
                        >
                            {item.statusLabel}
                        </span>
                    </div>
                </div>

                <div className="p-6 pt-4">
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityDetailOverlay;
