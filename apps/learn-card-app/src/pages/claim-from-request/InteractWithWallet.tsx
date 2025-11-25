import React, { useMemo, useState } from 'react';
import { IonList, IonItem } from '@ionic/react';
import { QRCodeSVG } from 'qrcode.react';
import { useModal, ModalTypes } from 'learn-card-base';
import LearnCardBrandmark from '../../components/svgs/LearnCardBrandmark';
import CaretDown from 'learn-card-base/svgs/CaretDown';

// Simple wallet option type
interface WalletOption {
    name: string;

    urlTemplate: (url: string) => string;

    icon?: React.ReactNode;
}

// Convert the edge function page (interact.ts) into a React component.
// This component expects a vc_request_url (the VC-API exchange endpoint) and
// produces deeplinks for supported wallets as well as a QR code the user can scan.
const InteractWithWallet: React.FC<{
    vc_request_url?: string | (string | null)[] | null;
}> = ({ vc_request_url }) => {
    const vcRequestUrl: string | undefined = useMemo(() => {
        if (!vc_request_url) return undefined;

        if (Array.isArray(vc_request_url)) return vc_request_url[0] ?? undefined;

        return vc_request_url ?? undefined;
    }, [vc_request_url]);

    // Extract workflowId from the vc_request_url: `${LCN_API_URL}/workflows/{workflowId}/exchanges/{interactionId}`
    const workflowId: string | undefined = useMemo(() => {
        if (!vcRequestUrl) return undefined;
        try {
            const u = new URL(vcRequestUrl);
            const parts = u.pathname.split('/').filter(Boolean);
            const idx = parts.indexOf('workflows');
            if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
        } catch (e) {
            const match = vcRequestUrl.match(/\/workflows\/([^/]+)/);
            if (match?.[1]) return match[1];
        }
        return undefined;
    }, [vcRequestUrl]);

    const headingText = useMemo(() => {
        if (workflowId === 'claim') return 'You Have a Credential to Claim';
        if (workflowId === 'verify') return 'Present Your Credentials';
        return 'Continue in Your Wallet';
    }, [workflowId]);

    const subheadingText = useMemo(() => {
        if (workflowId === 'claim')
            return 'Open this request in your wallet to accept and store your new credential.';
        if (workflowId === 'verify')
            return 'A service is requesting you to present information for verification.';
        return 'Please use your preferred digital wallet to complete this interaction.';
    }, [workflowId]);

    const buttonText = useMemo(() => {
        if (workflowId === 'claim') return 'Claim with Wallet';
        if (workflowId === 'verify') return 'Verify with Wallet';
        return 'Open in Wallet';
    }, [workflowId]);

    const wallets: WalletOption[] = useMemo(
        () => [
            {
                name: 'LearnCard',

                urlTemplate: url =>
                    `https://learncard.app/request?vc_request_url=${encodeURIComponent(url)}`,

                icon: <LearnCardBrandmark className="rounded-2xl h-10 w-10" />,
            },
            {
                name: 'Learner Credential Wallet',

                urlTemplate: url =>
                    `https://lcw.app/request?vc_request_url=${encodeURIComponent(url)}`,
            },
        ],
        []
    );

    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    const deeplink = useMemo(() => {
        if (!vcRequestUrl) return '';

        const selected = wallets[selectedIndex] ?? wallets[0];

        return selected.urlTemplate(vcRequestUrl);
    }, [vcRequestUrl, wallets, selectedIndex]);

    if (!vcRequestUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 text-center">
                    <h2 className="text-xl font-semibold mb-2">Invalid request link</h2>
                    <p className="text-gray-600">Missing or invalid vc_request_url.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex justify-center  p-3">
            <div className="max-w-lg w-full bg-white">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-4 mt-[20px]">
                        <LearnCardBrandmark className="rounded-2xl h-16 w-16" />
                    </div>

                    <h1 className="text-2xl font-bold mb-2">{headingText}</h1>
                    <p className="text-gray-600 mb-6">{subheadingText}</p>

                    <div className="mb-6 p-4 border rounded-lg inline-block bg-white">
                        <div className="w-[220px] h-[220px]">
                            <QRCodeSVG
                                value={deeplink}
                                className="w-full h-full"
                                bgColor="transparent"
                            />
                        </div>
                    </div>

                    <div className="mb-4 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Open with:
                        </label>
                        <div className="flex items-center gap-3">
                            <InteractSelector
                                wallets={wallets}
                                selectedIndex={selectedIndex}
                                setSelectedIndex={setSelectedIndex}
                            />
                        </div>
                    </div>

                    <a
                        href={deeplink}
                        className="block w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
                    >
                        {buttonText}
                    </a>

                    <p className="mt-6 text-sm text-gray-500">
                        Scan the QR code or tap the button above.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InteractWithWallet;

const InteractSelectorOptions: React.FC<{
    wallets: WalletOption[];
    selectedIndex: number;
    setSelectedIndex: (idx: number) => void;
}> = ({ wallets, selectedIndex, setSelectedIndex }) => {
    const { closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    return (
        <div className="p-6">
            <p>Select a wallet:</p>
            <IonList className="mb-6 w-full h-full">
                {wallets.map((wallet, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                        <li
                            key={wallet.name}
                            onClick={() => {
                                closeModal();
                                setSelectedIndex(idx);
                            }}
                            className={`w-full rounded-full pl-[10px] pr-4 py-[6px] flex items-center justify-between  mt-4 mb-4 cursor-pointer ${
                                isSelected
                                    ? 'bg-indigo-50 border-indigo-50 bg-indigo-50'
                                    : 'bg-white'
                            }`}
                        >
                            <div className="flex items-center justify-start">
                                <div className="w-[40px] bg-indigo-100 h-[40px] rounded-full  mr-2 overflow-hidden  cursor-pointer">
                                    {wallet.icon}
                                </div>
                                <div className="flex flex-col items-start justify-center">
                                    <h4 className="text-grayscale-800 text-left text-[17px]">
                                        {wallet.name}
                                    </h4>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </IonList>
        </div>
    );
};

const InteractSelector: React.FC<{
    wallets: WalletOption[];
    selectedIndex: number;
    setSelectedIndex: (idx: number) => void;
}> = ({ wallets, selectedIndex, setSelectedIndex }) => {
    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    return (
        <button
            onClick={() => {
                newModal(
                    <InteractSelectorOptions
                        wallets={wallets}
                        selectedIndex={selectedIndex}
                        setSelectedIndex={setSelectedIndex}
                    />
                );
            }}
            className="w-full rounded-full pl-[2px] pr-4 py-[6px] flex items-center justify-between border-[1px] border-solid border-grayscale-100 bg-grayscale-100 mt-4 mb-4"
        >
            <div className="flex items-center justify-start">
                <div className="w-[40px] h-[40px] rounded-full bg-indigo-100 ml-[8px] mr-2 overflow-hidden">
                    {wallets[selectedIndex]?.icon}
                </div>
                <div className="flex flex-col items-start justify-center">
                    <h4 className="text-grayscale-800 text-left text-[17px] line-clamp-1">
                        {wallets[selectedIndex]?.name}
                    </h4>
                </div>
            </div>
            <CaretDown className="w-[20px] h-[20px] text-grayscale-800" />
        </button>
    );
};
