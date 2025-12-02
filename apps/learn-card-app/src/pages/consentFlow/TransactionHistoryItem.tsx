import React from 'react';
import moment from 'moment';
import { ConsentFlowTransaction, ConsentFlowTransactionAction, LCNProfile } from '@learncard/types';
import BoostEarnedCard from '../../components/boost/boost-earned-card/BoostEarnedCard';

type TransactionHistoryItemProps = {
    transaction: ConsentFlowTransaction;
    contractOwner?: LCNProfile;
};

const ACTION_COLOR: Record<ConsentFlowTransactionAction, string> = {
    consent: 'text-emerald-700',
    sync: 'text-cyan-700',
    update: 'text-indigo-700',
    withdraw: 'text-rose-700',
    write: 'text-cyan-700',
};

const ACTION_TEXT: Record<ConsentFlowTransactionAction, string> = {
    consent: 'Consent',
    sync: 'Sync',
    update: 'Update',
    withdraw: 'Withdraw',
    write: 'Write',
};

const getDescriptiveText = (
    transaction: ConsentFlowTransaction,
    contractOwner?: LCNProfile
): string => {
    if (transaction.action === 'consent') {
        if (transaction.oneTime) {
            return `You have consented to share your data with ${contractOwner?.displayName} one time only.`;
        }

        return `You have consented and are actively sharing your data with ${contractOwner?.displayName}.`;
    }

    if (transaction.action === 'sync') {
        return `You have shared a new credential with ${contractOwner?.displayName}.`;
    }

    if (transaction.action === 'update') return 'You have updated your terms.';

    if (transaction.action === 'withdraw') {
        return `You have disconnected your data sharing with ${contractOwner?.displayName}.`;
    }

    if (transaction.action === 'write') return 'You have received a credential.';

    return '';
};

const TransactionHistoryItem: React.FC<TransactionHistoryItemProps> = ({
    transaction,
    contractOwner,
}) => {
    return (
        <li className="w-full py-4 [&:not(:last-of-type)]:border-b flex flex-col gap-2">
            <header className="flex gap-1 text-sm font-poppins text-grayscale-800">
                <span className={`${ACTION_COLOR[transaction.action]} font-bold`}>
                    {ACTION_TEXT[transaction.action]}
                </span>
                <span className="font-medium">•</span>
                <span className="font-medium">
                    {moment(transaction.date).format('MMM DD YYYY, h:mm A')}
                </span>
            </header>
            <section className="text-xs font-poppins text-grayscale-700">
                {getDescriptiveText(transaction, contractOwner)}
            </section>
            {(transaction.action === 'write' || transaction.action === 'sync') && (
                <section className="text-xs font-poppins text-grayscale-700">
                    {(transaction.action === 'write'
                        ? transaction.uris ?? []
                        : Object.values(transaction.terms?.read?.credentials?.categories ?? {}).flatMap(
                              category => category.shared ?? []
                          )
                    ).map(uri => (
                        <BoostEarnedCard key={uri} record={{ uri }} boostPageViewMode="list" />
                    ))}
                </section>
            )}
        </li>
    );
};

export default TransactionHistoryItem;
