import React, { useMemo, useState } from 'react';
import { IonList } from '@ionic/react';
import { QRCodeSVG } from 'qrcode.react';
import { useModal, ModalTypes } from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import { useTenantBrandingAssets } from '../../config/brandingAssets';
import { getAppBaseUrl, getResolvedTenantConfig } from '../../config/bootstrapTenantConfig';
import CaretDown from 'learn-card-base/svgs/CaretDown';
import { AlertCircle } from 'lucide-react';

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
    const { brandMark, appIcon } = useTenantBrandingAssets();
    const brandingConfig = useBrandingConfig();
    const tenantId = getResolvedTenantConfig().tenantId;
    const tenantBaseUrl = getAppBaseUrl();
    const isLearnCardTenant = tenantId === 'learncard';

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
        if (workflowId === 'claim') return 'You have a credential to claim';
        if (workflowId === 'verify') return 'Present your credentials';
        return 'Continue in your wallet';
    }, [workflowId]);

    const subheadingText = useMemo(() => {
        if (workflowId === 'claim')
            return 'Open this request in your wallet to accept and store your new credential.';
        if (workflowId === 'verify')
            return 'A service is requesting you to present information for verification.';
        return 'Please use your preferred digital wallet to complete this interaction.';
    }, [workflowId]);

    const buttonText = useMemo(() => {
        if (workflowId === 'claim') return 'Claim in LearnCard';
        if (workflowId === 'verify') return 'Verify with Wallet';
        return 'Open in Wallet';
    }, [workflowId]);

    const wallets: WalletOption[] = useMemo(() => {
        const learnCardWallet: WalletOption = {
            name: 'LearnCard',

            urlTemplate: url =>
                `https://learncard.app/request?vc_request_url=${encodeURIComponent(url)}`,

            // Always use the canonical LearnCard brand mark here so users can
            // recognise the LearnCard option regardless of which tenant they
            // are currently on.
            icon: (
                <img
                    src="https://learncard.app/branding/brand-mark.png"
                    alt="LearnCard brand mark"
                    className="rounded-2xl h-10 w-10"
                />
            ),
        };

        const lcwWallet: WalletOption = {
            name: 'Learner Credential Wallet',

            urlTemplate: url => `https://lcw.app/request?vc_request_url=${encodeURIComponent(url)}`,
        };

        if (isLearnCardTenant) return [learnCardWallet, lcwWallet];

        const tenantWallet: WalletOption = {
            name: brandingConfig?.name ?? 'This App',

            urlTemplate: url =>
                `${tenantBaseUrl}/request?vc_request_url=${encodeURIComponent(url)}`,

            icon: (
                <img
                    src={appIcon}
                    alt={`${brandingConfig?.name ?? 'Tenant'} icon`}
                    className="rounded-2xl h-10 w-10 object-cover"
                />
            ),
        };

        // LearnCard is always listed first for brand consistency; the current
        // tenant sits directly below it for users who prefer staying in-app.
        return [learnCardWallet, tenantWallet, lcwWallet];
    }, [isLearnCardTenant, tenantBaseUrl, brandingConfig?.name, appIcon]);

    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    const deeplink = useMemo(() => {
        if (!vcRequestUrl) return '';

        const selected = wallets[selectedIndex] ?? wallets[0];

        return selected.urlTemplate(vcRequestUrl);
    }, [vcRequestUrl, wallets, selectedIndex]);

    if (!vcRequestUrl) {
        return (
            <div className="min-h-full bg-grayscale-100 flex items-center justify-center p-4 font-poppins">
                <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden safe-area-top-margin animate-fade-in-up">
                    <div className="bg-white px-6 py-8 text-center border-b border-grayscale-200">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-xl font-semibold text-grayscale-900 mb-2">
                            Invalid request link
                        </h1>
                        <p className="text-grayscale-500 text-sm">
                            Missing or invalid vc_request_url.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-grayscale-100 flex items-center justify-center p-4 font-poppins">
            <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden safe-area-top-margin animate-fade-in-up">
                <div className="p-6 flex flex-col items-center text-center">
                    <div className="mb-5 mt-2">
                        <img
                            src={brandMark}
                            alt="Brand mark"
                            className="rounded-2xl h-16 w-16 shadow-sm border border-grayscale-200"
                        />
                    </div>

                    <h1 className="text-xl font-semibold text-grayscale-900 mb-2">{headingText}</h1>
                    <p className="text-grayscale-600 text-sm leading-relaxed mb-6">
                        {subheadingText}
                    </p>

                    <div className="mb-6 p-4 bg-grayscale-10 border border-grayscale-200 rounded-2xl inline-block">
                        <div className="w-[200px] h-[200px] bg-white p-2 rounded-xl">
                            <QRCodeSVG
                                value={deeplink}
                                className="w-full h-full"
                                bgColor="transparent"
                            />
                        </div>
                    </div>

                    <div className="mb-6 w-full text-left">
                        <label className="block text-xs font-medium text-grayscale-700 uppercase tracking-wide mb-2">
                            Open with:
                        </label>
                        <InteractSelector
                            wallets={wallets}
                            selectedIndex={selectedIndex}
                            setSelectedIndex={setSelectedIndex}
                        />
                    </div>

                    <a
                        href={deeplink}
                        className="w-full py-3 px-4 bg-emerald-600 text-white font-medium text-sm rounded-[20px] hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {buttonText}
                    </a>

                    <p className="mt-5 text-xs text-grayscale-500">
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
        <div className="p-6 font-poppins">
            <p className="text-lg font-semibold text-grayscale-900 mb-4">Select a wallet</p>
            <IonList className="w-full h-full bg-transparent">
                {wallets.map((wallet, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                        <li
                            key={wallet.name}
                            onClick={() => {
                                closeModal();
                                setSelectedIndex(idx);
                            }}
                            className={`w-full rounded-[20px] p-3 flex items-center justify-between mb-3 cursor-pointer transition-colors border ${
                                isSelected
                                    ? 'bg-grayscale-10 border-grayscale-300'
                                    : 'bg-white border-transparent hover:bg-grayscale-10'
                            }`}
                        >
                            <div className="flex items-center justify-start">
                                <div className="w-10 h-10 bg-grayscale-100 rounded-2xl mr-3 overflow-hidden flex items-center justify-center">
                                    {wallet.icon}
                                </div>
                                <div className="flex flex-col items-start justify-center">
                                    <h4 className="text-grayscale-900 font-medium text-sm">
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
            className="w-full rounded-[20px] p-2 flex items-center justify-between border border-grayscale-200 bg-grayscale-10 hover:bg-grayscale-100 transition-colors"
        >
            <div className="flex items-center justify-start">
                <div className="w-10 h-10 rounded-2xl bg-grayscale-100 mr-3 overflow-hidden flex items-center justify-center">
                    {wallets[selectedIndex]?.icon}
                </div>
                <div className="flex flex-col items-start justify-center">
                    <h4 className="text-grayscale-900 font-medium text-sm line-clamp-1">
                        {wallets[selectedIndex]?.name}
                    </h4>
                </div>
            </div>
            <CaretDown className="w-5 h-5 text-grayscale-500 mr-2" />
        </button>
    );
};
