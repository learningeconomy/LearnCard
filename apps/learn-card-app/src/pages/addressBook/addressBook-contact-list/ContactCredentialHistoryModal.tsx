import React, { useMemo, useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';

import type { LCNProfile, VC } from '@learncard/types';
import {
    categoryMetadata,
    CredentialCategoryEnum,
    getDefaultCategoryForCredential,
} from 'learn-card-base';
import X from 'learn-card-base/svgs/X';
import { CredentialGeneralIcon } from 'learn-card-base/svgs/CredentialGeneralIcon';

import BoostEarnedCard from '../../../components/boost/boost-earned-card/BoostEarnedCard';
import {
    type ContactCredentialDirection,
    type ContactCredentialHistoryItem,
    useContactCredentialHistory,
} from './useContactCredentialHistory';

type ContactCredentialHistoryModalProps = {
    contact: Pick<LCNProfile, 'profileId' | 'displayName'>;
    onClose: () => void;
};

type HistoryTab = Extract<ContactCredentialDirection, 'received' | 'sent'>;

const getCredentialCategory = (credential: VC): CredentialCategoryEnum => {
    const category = getDefaultCategoryForCredential(credential) as CredentialCategoryEnum;

    return categoryMetadata[category] ? category : CredentialCategoryEnum.achievement;
};

const CredentialGrid: React.FC<{
    items: ContactCredentialHistoryItem[];
}> = ({ items }) => (
    <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
        {items.map(item => {
            const category = getCredentialCategory(item.credential);

            return (
                <BoostEarnedCard
                    key={`${item.direction}-${item.uri}`}
                    credential={item.credential}
                    record={{ uri: item.uri }}
                    categoryType={category}
                    defaultImg={categoryMetadata[category]?.defaultImageSrc}
                    useWrapper={false}
                    hideOptionsMenu
                    hideCardOptionsMenu
                />
            );
        })}
    </div>
);

const ContactCredentialHistoryModal: React.FC<ContactCredentialHistoryModalProps> = ({
    contact,
    onClose,
}) => {
    const [activeTab, setActiveTab] = useState<HistoryTab>('received');
    const contactName = contact.displayName || contact.profileId;
    const { data, isLoading, isError } = useContactCredentialHistory(contact.profileId, {
        limit: null,
    });

    const itemsByDirection = useMemo(
        () => ({
            received: data?.items.filter(item => item.direction === 'received') ?? [],
            sent: data?.items.filter(item => item.direction === 'sent') ?? [],
        }),
        [data?.items]
    );

    const tabs: Array<{ id: HistoryTab; label: string; count: number }> = [
        {
            id: 'received',
            label: 'Shared with me',
            count: data?.receivedCount ?? 0,
        },
        {
            id: 'sent',
            label: `Shared with ${contactName}`,
            count: data?.sentCount ?? 0,
        },
    ];

    const activeItems = itemsByDirection[activeTab];
    const emptyMessage =
        activeTab === 'received'
            ? `${contactName} has not shared any credentials with you yet.`
            : `You have not shared any credentials with ${contactName} yet.`;

    return (
        <section className="flex h-full w-full flex-col bg-white font-poppins">
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-grayscale-200 px-5 py-4">
                <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-grayscale-900">Shared credentials</h2>
                    <p className="mt-1 truncate text-sm text-grayscale-600">With {contactName}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close shared credentials"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-grayscale-200 bg-white text-grayscale-700 shadow-box-bottom transition-colors hover:bg-grayscale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                    <X className="h-5 w-5" />
                </button>
            </header>

            <div className="shrink-0 border-b border-grayscale-100 bg-white px-5 py-3">
                <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {tabs.map(tab => {
                        const isActive = tab.id === activeTab;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                                    isActive
                                        ? 'border-primary bg-white text-primary'
                                        : 'border-transparent bg-white text-grayscale-600 hover:text-grayscale-900'
                                }`}
                                aria-pressed={isActive}
                            >
                                {tab.count} {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                {isLoading && (
                    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 text-sm text-grayscale-600">
                        <IonSpinner className="h-6 w-6" />
                        Loading shared credentials...
                    </div>
                )}

                {isError && (
                    <div className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-3">
                        <IonIcon
                            icon={alertCircleOutline}
                            className="mt-0.5 shrink-0 text-lg text-red-400"
                        />
                        <span className="text-sm leading-relaxed text-red-700">
                            We could not load shared credentials. Please try again.
                        </span>
                    </div>
                )}

                {!isLoading && !isError && activeItems.length === 0 && (
                    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[20px] border border-grayscale-200 bg-grayscale-10 px-6 text-center">
                        <CredentialGeneralIcon className="mb-3 h-9 w-9 text-grayscale-400" />
                        <p className="text-sm font-medium text-grayscale-900">Nothing shared yet</p>
                        <p className="mt-1 max-w-sm text-xs leading-relaxed text-grayscale-500">
                            {emptyMessage}
                        </p>
                    </div>
                )}

                {!isLoading && !isError && activeItems.length > 0 && (
                    <CredentialGrid items={activeItems} />
                )}
            </div>
        </section>
    );
};

export default ContactCredentialHistoryModal;
