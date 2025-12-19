import { useWallet } from 'learn-card-base';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import React, { useState } from 'react';
import CustomWalletMain from './CustomWalletMain';
import { IonLoading } from '@ionic/react';

const randomKey = Array.from(crypto.getRandomValues(new Uint8Array(32)), dec =>
    dec.toString(16).padStart(2, '0')
).join('');

const CustomWallet: React.FC = () => {
    const [seed, setSeed] = useState<string>(randomKey);
    const [wallet, setWallet] = useState<BespokeLearnCard | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    const { initWallet } = useWallet();

    const createWallet = async () => {
        setLoading(true);
        setWallet(await initWallet(seed));
        setLoading(false);
    };

    if (wallet) return <CustomWalletMain wallet={wallet} />;

    return (
        <main className="h-full w-full flex flex-col items-center justify-center max-w-[600px] mx-auto">
            <form
                className="flex flex-col p-8 gap-4 border rounded shadow w-full max-w-screen-mobile text-black"
                onSubmit={e => e.preventDefault()}
            >
                <fieldset className="flex flex-col gap-2">
                    <span>Hello, please enter a seed lol</span>
                    <input
                        className="bg-white border"
                        type="text"
                        value={seed}
                        onChange={e => setSeed(e.target.value)}
                    />
                </fieldset>

                <button
                    onClick={createWallet}
                    className="w-full py-2 rounded border border-solid border-emerald-700 text-emerald-800"
                    type="button"
                >
                    Create Wallet
                </button>
            </form>
            <IonLoading isOpen={loading} message="Creating wallet..." mode="ios" />
        </main>
    );
};

export default CustomWallet;
