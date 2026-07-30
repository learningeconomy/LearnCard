import React, { useMemo, useState } from 'react';
import { Shield } from 'lucide-react';

import { SearchInput, LEARNCARD_AI_PASSPORT_CONTRACT_URI } from 'learn-card-base';
import {
    ConsentedContractRow,
    type ConsentedContract,
} from '../../../components/data-sharing/ManageDataSharingModal';
import GlassCard from './GlassCard';
import * as m from '../../../paraglide/messages.js';

type ConnectedAppsSectionProps = {
    contracts: ConsentedContract[];
    onUpdate: () => Promise<unknown> | void;
    delay?: number;
};

type GroupKey = 'ai' | 'school' | 'app';

const GROUP_THRESHOLD = 8;

const groupLabel = (key: GroupKey): string => {
    switch (key) {
        case 'ai':
            return m['dataShareCenter.groups.ai']();
        case 'school':
            return m['dataShareCenter.groups.school']();
        default:
            return m['dataShareCenter.groups.app']();
    }
};

const GROUP_ORDER: GroupKey[] = ['ai', 'school', 'app'];

const SCHOOL_PATTERN = /school|universit|college|academ|district|campus|education|institute|k-?12/;
const AI_PATTERN = /\bai\b|gpt|claude|assistant|copilot|chatbot|\bbot\b/;

const classifyContract = (contract: ConsentedContract): GroupKey => {
    const uri = contract.contract?.uri ?? contract.uri;
    const name = (contract.contract?.name ?? '').toLowerCase();

    if (uri === LEARNCARD_AI_PASSPORT_CONTRACT_URI || AI_PATTERN.test(name)) return 'ai';
    if (SCHOOL_PATTERN.test(name)) return 'school';
    return 'app';
};

const ConnectedAppsSection: React.FC<ConnectedAppsSectionProps> = ({
    contracts,
    onUpdate,
    delay = 0,
}) => {
    const [query, setQuery] = useState('');
    const isEmpty = contracts.length === 0;
    const useGroups = contracts.length > GROUP_THRESHOLD;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return contracts;
        return contracts.filter(contract =>
            (contract.contract?.name ?? '').toLowerCase().includes(q)
        );
    }, [contracts, query]);

    const groups = useMemo(() => {
        const buckets: Record<GroupKey, ConsentedContract[]> = { ai: [], school: [], app: [] };
        for (const contract of filtered) buckets[classifyContract(contract)].push(contract);
        return GROUP_ORDER.map(key => ({
            key,
            items: buckets[key],
        })).filter(group => group.items.length > 0);
    }, [filtered]);

    return (
        <div
            className="animate-fade-in-up"
            style={delay ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}
        >
            <div className="px-1 mb-2">
                <h3 className="text-[15px] font-semibold text-grayscale-900">
                    {m['dataShareCenter.connectedApps.heading']()}
                </h3>
                <p className="text-sm text-grayscale-600">
                    {m['dataShareCenter.connectedApps.subtitle']()}
                </p>
            </div>

            {contracts.length > GROUP_THRESHOLD && (
                <div className="mb-3">
                    <SearchInput
                        value={query}
                        onChange={setQuery}
                        placeholder={m['dataShareCenter.connectedApps.searchPlaceholder']()}
                        className="!bg-white border border-grayscale-300 rounded-[14px] shadow-[0_2px_10px_rgba(24,34,78,0.06)]"
                    />
                </div>
            )}

            <GlassCard className="overflow-hidden">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                        <Shield className="w-11 h-11 text-grayscale-300 mb-3" />
                        <p className="text-grayscale-700 font-medium">
                            {m['dataShareCenter.connectedApps.emptyTitle']()}
                        </p>
                        <p className="text-sm text-grayscale-500 mt-1">
                            {m['dataShareCenter.connectedApps.emptySubtitle']()}
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                        <p className="text-grayscale-600 font-medium">
                            {m['dataShareCenter.connectedApps.noMatches']()}
                        </p>
                        <p className="text-sm text-grayscale-500 mt-1">
                            {m['dataShareCenter.connectedApps.noMatchesFor']({ query })}
                        </p>
                    </div>
                ) : useGroups ? (
                    <div className="flex flex-col">
                        {groups.map(group => (
                            <div
                                key={group.key}
                                className="border-b border-grayscale-100 last:border-b-0"
                            >
                                <p className="px-5 pt-4 pb-1 text-xs font-semibold tracking-wider text-grayscale-500 uppercase">
                                    {groupLabel(group.key)}
                                </p>
                                <div className="flex flex-col gap-1 p-2 pt-1">
                                    {group.items.map(contract => (
                                        <ConsentedContractRow
                                            key={contract.uri}
                                            contract={contract}
                                            onUpdate={onUpdate}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-1 p-2">
                        {filtered.map(contract => (
                            <ConsentedContractRow
                                key={contract.uri}
                                contract={contract}
                                onUpdate={onUpdate}
                            />
                        ))}
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

export default ConnectedAppsSection;
