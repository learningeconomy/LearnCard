import React from 'react';

import AdminToolsOptionItemHeader from '../AdminToolsModal/helpers/AdminToolsOptionItemHeader';
import { AdminToolOption } from '../AdminToolsModal/admin-tools.helpers';

import {
    useSyncAllCredentialsToContractsMutation,
    useSyncIsActive,
    useSyncPhase,
    useSyncPagesProcessed,
    useSyncRecordsScanned,
    useSyncCategoriesFound,
    useSyncTotalContracts,
    useSyncContractsCompleted,
    useSyncCurrentContract,
    useSyncLastError,
} from 'learn-card-base';

export const AdminToolsSyncAllCredentialsOption: React.FC<{ option: AdminToolOption }> = ({
    option,
}) => {
    const syncAll = useSyncAllCredentialsToContractsMutation();

    const onSync = async () => {
        try {
            await syncAll.mutateAsync();
        } catch {
            // Error is surfaced below via isError state
        }
    };

    return (
        <section className="h-full w-full flex flex-col items-center justify-start overflow-y-scroll pt-4">
            <section className="flex flex-col items-center justify-center bg-white max-w-[800px] w-full rounded-[20px]">
                <AdminToolsOptionItemHeader
                    option={option}
                    onClick={onSync}
                    isDisabled={syncAll.isPending}
                />

                <div className="flex items-center justify-center w-full px-4">
                    <div className="flex items-center justify-center w-full border-grayscale-100 border-[1px] rounded-[20px]" />
                </div>

                <div className="w-full px-4 pb-6">
                    <p className="text-sm text-grayscale-600">
                        This will scan your wallet, group credentials by category, fetch all consented
                        contracts, and sync credentials to those contracts according to your sharing
                        settings.
                    </p>

                    <SyncProgressDisplay />
                </div>
            </section>
        </section>
    );
};

export default AdminToolsSyncAllCredentialsOption;

const SyncProgressDisplay: React.FC = () => {
    const isActive = useSyncIsActive();
    const phase = useSyncPhase();
    const pages = useSyncPagesProcessed();
    const scanned = useSyncRecordsScanned();
    const categories = useSyncCategoriesFound();
    const totalContracts = useSyncTotalContracts();
    const completed = useSyncContractsCompleted();
    const currentContract = useSyncCurrentContract();
    const lastError = useSyncLastError();

    const percent = totalContracts ? Math.round((completed / totalContracts) * 100) : 0;

    return (
        <div className="mt-4">
            {phase === 'scanning' && (
                <div className="text-grayscale-700">
                    <div className="font-medium">Scanning wallet…</div>
                    <div className="text-sm">Pages processed: {pages}</div>
                    <div className="text-sm">Records scanned: {scanned}</div>
                    <div className="text-sm">Categories found: {categories}</div>
                </div>
            )}
            {phase === 'syncing' && (
                <div className="text-grayscale-700">
                    <div className="font-medium">Syncing to consented contracts…</div>
                    <div className="text-sm">Contracts: {completed} / {totalContracts}</div>
                    <div className="w-full bg-grayscale-100 h-[8px] rounded mt-2">
                        <div
                            className="bg-emerald-500 h-[8px] rounded"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                    {currentContract && (
                        <div className="text-xs text-grayscale-500 mt-1 break-all">
                            Current owner DID: {currentContract}
                        </div>
                    )}
                </div>
            )}
            {phase === 'done' && !isActive && (
                <div className="mt-3 text-emerald-600">Sync completed.</div>
            )}
            {phase === 'error' && lastError && (
                <div className="mt-3 text-rose-600">There was an error during sync: {lastError}</div>
            )}
        </div>
    );
};
