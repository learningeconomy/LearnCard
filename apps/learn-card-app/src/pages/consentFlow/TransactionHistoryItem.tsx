import React from 'react';
import { useLocale } from '../../i18n';
import { ConsentFlowTransaction, ConsentFlowTransactionAction, LCNProfile } from '@learncard/types';
import BoostEarnedCard from '../../components/boost/boost-earned-card/BoostEarnedCard';
import * as m from '../../paraglide/messages.js';

type TransactionHistoryItemProps = {
    transaction: ConsentFlowTransaction;
    contractOwner?: LCNProfile;
    contractName?: string;
};

const ACTION_COLOR: Record<ConsentFlowTransactionAction, string> = {
    consent: 'text-emerald-700',
    reconsent: 'text-emerald-700',
    sync: 'text-cyan-700',
    update: 'text-indigo-700',
    withdraw: 'text-rose-700',
    write: 'text-cyan-700',
};

const getActionText = (transaction: ConsentFlowTransaction): string => {
    if (transaction.action === 'update' && transaction.kind) {
        return m['consentUpdate.appUpdatedTerms']();
    }
    return {
        consent: 'Consent',
        reconsent: m['consentUpdate.approvedUpdate'](),
        sync: 'Sync',
        update: m['common.update'](),
        withdraw: m['consentFlow.withdraw'](),
        write: m['consentFlow.write'](),
    }[transaction.action];
};

const getDescriptiveText = (
    transaction: ConsentFlowTransaction,
    contractOwner?: LCNProfile,
    contractName?: string
): string => {
    if (transaction.action === 'consent') {
        if (transaction.oneTime) {
            return `You have consented to share your data with ${contractOwner?.displayName} one time only.`;
        }

        return `You have consented and are actively sharing your data with ${contractOwner?.displayName}.`;
    }

    if (transaction.action === 'reconsent') {
        return m['consentUpdate.approvedUpdateDescription']({
            appName: contractName ?? contractOwner?.displayName ?? m['dataSharing.unknownApp'](),
        });
    }

    if (transaction.action === 'sync') {
        return `You have shared a new credential with ${contractOwner?.displayName}.`;
    }

    if (transaction.action === 'update' && transaction.kind) {
        return m['consentUpdate.appUpdatedTermsDescription']({
            appName: contractName ?? contractOwner?.displayName ?? m['dataSharing.unknownApp'](),
        });
    }
    if (transaction.action === 'update') return m['consentFlow.updatedTerms']();

    if (transaction.action === 'withdraw') {
        return `You have disconnected your data sharing with ${contractOwner?.displayName}.`;
    }

    if (transaction.action === 'write') return m['consentFlow.receivedCredential']();

    return '';
};

const TransactionHistoryItem: React.FC<TransactionHistoryItemProps> = ({
    transaction,
    contractOwner,
    contractName,
}) => {
    const locale = useLocale();
    return (
        <li className="w-full py-4 not-last-of-type:border-b flex flex-col gap-2">
            <header className="flex gap-1 text-sm font-poppins text-grayscale-800">
                <span className={`${ACTION_COLOR[transaction.action]} font-bold`}>
                    {getActionText(transaction)}
                </span>
                <span className="font-medium">•</span>
                <span className="font-medium">
                    {new Intl.DateTimeFormat(locale, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                    }).format(new Date(transaction.date))}
                </span>
            </header>
            <section className="text-xs font-poppins text-grayscale-700">
                {getDescriptiveText(transaction, contractOwner, contractName)}
            </section>
            {(transaction.action === 'write' || transaction.action === 'sync') && (
                <section className="text-xs font-poppins text-grayscale-700">
                    {(transaction.action === 'write'
                        ? (transaction.uris ?? [])
                        : Object.values(
                              transaction.terms?.read?.credentials?.categories ?? {}
                          ).flatMap(category => category.shared ?? [])
                    ).map(uri => (
                        <BoostEarnedCard key={uri} record={{ uri }} boostPageViewMode="list" />
                    ))}
                </section>
            )}
        </li>
    );
};

export default TransactionHistoryItem;
