import React, { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { VP } from '@learncard/types';
import { useWallet, useIsLoggedIn } from 'learn-card-base';
import { useHistory } from 'react-router-dom';
import { VCAPIRequestStrategy } from './ClaimFromRequest';
import { Gift, Shield, CheckCircle, Info } from 'lucide-react';
import { getLogger } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';
const log = getLogger('exchange-did-auth');

interface ExchangeDidAuthProps {
    verifiablePresentationRequest?: {
        query: object[];
        challenge: string;
        domain: string;
    };
    strategy?: VCAPIRequestStrategy;
    onSubmit: (body: VP | { verifiablePresentation: VP }) => void;
    onDecline?: () => void;
}

const ExchangeDidAuth: React.FC<ExchangeDidAuthProps> = ({
    verifiablePresentationRequest,
    onSubmit,
    onDecline,
    strategy,
}) => {
    const { initWallet } = useWallet();
    const isLoggedIn = useIsLoggedIn();
    const history = useHistory();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAccept = async () => {
        setIsLoading(true);
        setError(null);

        const wallet = await initWallet();

        if (!isLoggedIn || !wallet) {
            setError(m['claim.didAuth.loginRequired']());
            setIsLoading(false);
            return;
        }

        try {
            const didAuthVp: VP = await wallet.invoke.getDidAuthVp({
                challenge: verifiablePresentationRequest?.challenge,
                domain: verifiablePresentationRequest?.domain,
            });

            if (strategy === VCAPIRequestStrategy.Wrapped) {
                onSubmit({ verifiablePresentation: didAuthVp });
            } else {
                onSubmit(didAuthVp);
            }
        } catch (err) {
            log.error('Failed to create DID Auth VP:', err);
            setError(m['error.generic']());
            setIsLoading(false);
        }
    };

    const handleDecline = () => {
        if (onDecline) {
            onDecline();
        } else {
            history.push('/home');
        }
    };

    return (
        <IonPage>
            <IonContent fullscreen>
                <div className="min-h-full bg-grayscale-100 flex items-center justify-center p-4 font-poppins">
                    <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden safe-area-top-margin animate-fade-in-up">
                        {/* Header with icon */}
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-8 text-center">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <Gift className="w-8 h-8 text-white" />
                            </div>

                            <h1 className="text-xl font-semibold text-white mb-2">
                                {m['claim.didAuth.title']()}
                            </h1>

                            <p className="text-emerald-50 text-sm">
                                {m['claim.didAuth.subtitle']()}
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="space-y-5 mb-6">
                                <div className="space-y-1">
                                    <h2 className="text-lg font-semibold text-grayscale-900 text-center">
                                        {m['claim.didAuth.ready']()}
                                    </h2>

                                    <p className="text-grayscale-600 text-center text-sm leading-relaxed">
                                        {m['claim.didAuth.intro']()}
                                    </p>
                                </div>

                                {/* What happens section */}
                                <div className="bg-grayscale-10 rounded-2xl p-5 space-y-4 border border-grayscale-200">
                                    <p className="text-xs font-medium text-grayscale-700 uppercase tracking-wide">
                                        {m['claim.didAuth.whatHappens']()}
                                    </p>

                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        </div>

                                        <p className="text-sm text-grayscale-800 leading-relaxed">
                                            {m['claim.didAuth.step1']()}
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        </div>

                                        <p className="text-sm text-grayscale-800 leading-relaxed">
                                            {m['claim.didAuth.step2']()}
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        </div>

                                        <p className="text-sm text-grayscale-800 leading-relaxed">
                                            {m['claim.didAuth.step3']()}
                                        </p>
                                    </div>
                                </div>

                                {/* Privacy note */}
                                <div className="flex items-start gap-2.5 text-xs text-grayscale-500">
                                    <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-grayscale-400" />

                                    <p className="leading-relaxed">
                                        {m['claim.didAuth.privacy']()}
                                    </p>
                                </div>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                                    <Info className="text-red-400 w-5 h-5 mt-0.5 shrink-0" />
                                    <span className="text-sm text-red-700 leading-relaxed">
                                        {error}
                                    </span>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleAccept}
                                    disabled={isLoading}
                                    className="w-full py-3 px-4 bg-emerald-600 text-white font-medium text-sm rounded-[20px] hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {m['claim.didAuth.connecting']()}
                                        </>
                                    ) : (
                                        <>{m['claim.didAuth.claimButton']()}</>
                                    )}
                                </button>

                                <button
                                    onClick={handleDecline}
                                    disabled={isLoading}
                                    className="w-full py-3 px-4 text-sm text-grayscale-600 font-medium rounded-[20px] hover:text-grayscale-900 hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {m['claim.didAuth.decline']()}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ExchangeDidAuth;
