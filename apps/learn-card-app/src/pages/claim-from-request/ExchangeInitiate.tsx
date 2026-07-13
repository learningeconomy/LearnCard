import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { Gift } from 'lucide-react';

interface ExchangeInitiateProps {
    onStart: () => void;
}

const ExchangeInitiate: React.FC<ExchangeInitiateProps> = ({ onStart }) => {
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
                                You've been sent a request
                            </h1>

                            <p className="text-emerald-50 text-sm">
                                A credential exchange is ready
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="space-y-5 mb-6">
                                <p className="text-grayscale-600 text-center text-sm leading-relaxed">
                                    Click the button below to begin the exchange process and see
                                    what was sent to you.
                                </p>
                            </div>

                            {/* Action buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={onStart}
                                    className="w-full py-3 px-4 bg-emerald-600 text-white font-medium text-sm rounded-[20px] hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    Begin
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ExchangeInitiate;
