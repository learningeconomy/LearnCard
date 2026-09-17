import React, { useState } from 'react';
import { useToast, ToastTypeEnum } from 'learn-card-base';
import { useSampleWallet } from './useSampleWallet';
import { SAMPLE_PERSONAS } from './samplePersonas';

type PersonaSelectorModalProps = {
    onClose: () => void;
};

const PersonaSelectorModal: React.FC<PersonaSelectorModalProps> = ({ onClose }) => {
    const { enterSampleWallet } = useSampleWallet();
    const { presentToast } = useToast();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleSelect = async (personaId: string) => {
        setLoadingId(personaId);
        try {
            await enterSampleWallet(personaId);
            onClose();
        } catch (error) {
            presentToast('Something went wrong. Please try again.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            setLoadingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-[480px] bg-white rounded-[20px] p-6 animate-fade-in-up shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="mb-6 text-center">
                    <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                        Choose a Sample Wallet
                    </h2>
                    <p className="text-sm text-grayscale-600">
                        Pick a persona to explore. You can switch or exit anytime.
                    </p>
                </div>

                <div className="space-y-3 mb-6">
                    {SAMPLE_PERSONAS.map(persona => (
                        <button
                            key={persona.id}
                            className="w-full text-left border border-grayscale-200 rounded-[16px] p-4 hover:bg-grayscale-10 transition-colors cursor-pointer flex items-center gap-4 disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={() => handleSelect(persona.id)}
                            disabled={loadingId !== null}
                        >
                            <img
                                src={persona.portrait}
                                alt={persona.name}
                                className="w-12 h-12 rounded-full object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-grayscale-900 truncate">
                                    {persona.name}
                                </div>
                                <div className="text-sm text-grayscale-600 line-clamp-2 mb-1">
                                    {persona.tagline}
                                </div>
                                <div className="text-xs text-grayscale-500">
                                    {persona.credentials.length} sample credentials
                                </div>
                            </div>
                            {loadingId === persona.id && (
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs font-medium text-grayscale-900">
                                        Opening...
                                    </span>
                                    <span className="w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-900 rounded-full animate-spin" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="text-center">
                    <button
                        className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors font-medium"
                        onClick={onClose}
                        disabled={loadingId !== null}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PersonaSelectorModal;
