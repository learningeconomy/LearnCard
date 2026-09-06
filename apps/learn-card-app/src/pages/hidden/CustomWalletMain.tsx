import React, { useState } from 'react';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import CustomWalletManageLCNAccount from './CustomWalletManageLCNAccount';
import CustomWalletCreateContract from './CustomWalletCreateContract';
import CustomWalletViewContracts from './CustomWalletViewContracts';

type CustomWalletMainProps = {
    wallet: BespokeLearnCard;
};

type Page = 'index' | 'Manage LCN Account' | 'Create a Contract' | 'View Contracts';

const CustomWalletMain: React.FC<CustomWalletMainProps> = ({ wallet }) => {
    const [page, setPage] = useState<Page>('index');

    if (page === 'index') {
        return (
            <main className="h-full w-full flex flex-col items-center justify-center p-8 gap-8 text-black">
                <header className="w-full border-b p-2 font-bold">Did: {wallet.id.did()}</header>

                <section className="w-full flex-1 flex flex-col items-center p-8 gap-8">
                    <header className="text-lg">What would you like to do?</header>
                    <ul className="grid gap-8 border rounded w-full flex-1 grid-cols-2 p-4">
                        <li>
                            <button
                                type="button"
                                onClick={() => setPage('Manage LCN Account')}
                                className="transition-colors h-full w-full rounded border border-solid py-2 border-emerald-600 hover:text-white hover:bg-emerald-600"
                            >
                                Manage LCN Account
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                onClick={() => setPage('Create a Contract')}
                                className="transition-colors h-full w-full rounded border border-solid py-2 border-emerald-600 hover:text-white hover:bg-emerald-600"
                            >
                                Create a Contract
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                onClick={() => setPage('View Contracts')}
                                className="transition-colors h-full w-full rounded border border-solid py-2 border-emerald-600 hover:text-white hover:bg-emerald-600"
                            >
                                View Contracts
                            </button>
                        </li>
                    </ul>
                </section>
            </main>
        );
    }

    const PAGES: Record<Page, React.ReactNode> = {
        'Manage LCN Account': <CustomWalletManageLCNAccount wallet={wallet} />,
        'Create a Contract': <CustomWalletCreateContract wallet={wallet} />,
        'View Contracts': <CustomWalletViewContracts wallet={wallet} />,
        index: <></>,
    };

    return (
        <main className="h-full w-full flex flex-col items-center p-8 gap-8 text-black">
            <header className="w-full border-b p-2 font-bold">Did: {wallet.id.did()}</header>

            <section className="w-full flex flex-col items-center p-8 gap-8 overflow-y-auto relative">
                <header className="text-lg flex gap-8 border-b">
                    <button type="button" onClick={() => setPage('index')}>
                        {'< Back'}
                    </button>{' '}
                    {page}
                </header>
                {PAGES[page]}
            </section>
        </main>
    );
};

export default CustomWalletMain;
