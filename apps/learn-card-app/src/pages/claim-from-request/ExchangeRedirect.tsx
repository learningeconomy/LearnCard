import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { Home } from 'lucide-react';
import * as m from '../../paraglide/messages.js';

interface ExchangeRedirectProps {
    redirectUrl: string; // Contains the redirectUrl from the server
}

const ExchangeRedirect: React.FC<ExchangeRedirectProps> = ({ redirectUrl }) => {
    const handleRedirect = () => {
        if (redirectUrl) {
            window.open(redirectUrl, '_blank', 'noopener,noreferrer');
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
                                <Home className="w-8 h-8 text-white" />
                            </div>

                            <h1 className="text-xl font-semibold text-white mb-2">
                                {m['claim.redirect.heading']()}
                            </h1>

                            <p className="text-emerald-50 text-sm">
                                {m['claim.redirect.subtitle']()}
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="space-y-5 mb-6">
                                <p className="text-grayscale-600 text-center text-sm leading-relaxed">
                                    {m['claim.redirect.description']()}
                                </p>
                            </div>

                            {/* Action buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleRedirect}
                                    disabled={!redirectUrl}
                                    className="w-full py-3 px-4 bg-emerald-600 text-white font-medium text-sm rounded-[20px] hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {m['common.continue']()}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ExchangeRedirect;
