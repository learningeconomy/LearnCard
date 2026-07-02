import React, { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { VP } from '@learncard/types';
import { useWallet, useIsLoggedIn } from 'learn-card-base';
import { useHistory } from 'react-router-dom';
import { VCAPIRequestStrategy } from './ClaimFromRequest';
import { Gift, Shield, ChevronRight, X, Loader2, CheckCircle, Info } from 'lucide-react';
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
                <div className="min-h-full bg-gradient-to-br from-emerald-50 via-white to-cyan-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden safe-area-top-margin">
                        {/* Header with icon */}
                        <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-8 text-center">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Gift className="w-10 h-10 text-white" />
                            </div>

                            <h1 className="text-2xl font-bold text-white mb-2">
                                {m['claim.didAuth.title']()}
                            </h1>

                            <p className="text-emerald-100 text-sm">
                                {m['claim.didAuth.subtitle']()}
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="space-y-4 mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 text-center">
                                    {m['claim.didAuth.ready']()}
                                </h2>

                                <p className="text-gray-600 text-center text-sm">
                                    {m['claim.didAuth.intro']()}
                                </p>

                                {/* What happens section */}
                                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        {m['claim.didAuth.whatHappens']()}
                                    </p>

                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        </div>

                                        <p className="text-sm text-gray-700">
                                            {m['claim.didAuth.step1']()}
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        </div>

                                        <p className="text-sm text-gray-700">
                                            {m['claim.didAuth.step2']()}
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        </div>

                                        <p className="text-sm text-gray-700">
                                            {m['claim.didAuth.step3']()}
                                        </p>
                                    </div>
                                </div>

                                {/* Privacy note */}
                                <div className="flex items-start gap-2 text-xs text-gray-500">
                                    <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />

                                    <p>{m['claim.didAuth.privacy']()}</p>
                                </div>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                                    <Info className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleAccept}
                                    disabled={isLoading}
                                    className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {m['claim.didAuth.connecting']()}
                                        </>
                                    ) : (
                                        <>
                                            {m['claim.didAuth.claimButton']()}
                                            <ChevronRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleDecline}
                                    disabled={isLoading}
                                    className="w-full py-3 px-6 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" />
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
