import React, { useMemo } from 'react';

import { ModalTypes, useModal } from 'learn-card-base';

import CountrySelectorModal from './onboardingNetworkForm/components/CountrySelectorModal';
import countries from '../../constants/countries.json';

const COUNTRIES: Record<string, string> = countries as Record<string, string>;

type OnboardingAgeGateProps = {
    dob: string;
    country?: string;
    error?: string | null;
    isLoading?: boolean;
    onDobChange: (value: string) => void;
    onCountryChange: (value: string) => void;
    onContinue: () => void;
};

const OnboardingAgeGate: React.FC<OnboardingAgeGateProps> = ({
    dob,
    country,
    error,
    isLoading = false,
    onDobChange,
    onCountryChange,
    onContinue,
}) => {
    const { newModal, closeModal } = useModal();

    const countryLabel = useMemo(() => {
        if (!country) return 'Country of residence';
        return COUNTRIES[country] ?? country;
    }, [country]);

    const handlePickCountry = () => {
        newModal(
            <CountrySelectorModal
                selected={country}
                onSelect={code => {
                    onCountryChange(code);
                    closeModal();
                }}
            />,
            {
                sectionClassName: '!bg-transparent !border-none !shadow-none !rounded-none',
            },
            {
                desktop: ModalTypes.Cancel,
                mobile: ModalTypes.Cancel,
            }
        );
    };

    return (
        <div className="w-full h-full bg-white flex flex-col overflow-y-auto relative">
            <div className="max-w-[600px] mx-auto pt-[50px] px-4 relative">
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <p className="text-sm text-emerald-800 font-medium leading-relaxed">
                        Tell us your birthday and country so we can set up the right account path.
                    </p>
                </div>

                <h1 className="text-xl font-semibold text-grayscale-900 mb-2 font-poppins">
                    Before we continue
                </h1>
                <p className="text-sm text-grayscale-600 leading-relaxed mb-6 font-poppins">
                    We use this to check age rules and consent requirements.
                </p>

                {error && (
                    <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl">
                        <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-grayscale-700">Date of birth</label>
                        <input
                            type="date"
                            value={dob}
                            onChange={e => onDobChange(e.target.value)}
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-grayscale-700">Country</label>
                        <button
                            type="button"
                            onClick={handlePickCountry}
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-left text-sm text-grayscale-900 bg-white hover:bg-grayscale-10 transition-colors flex items-center justify-between"
                        >
                            <span className={country ? 'text-grayscale-900' : 'text-grayscale-400'}>
                                {countryLabel}
                            </span>
                            <span className="text-grayscale-400">▾</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full flex gap-[10px] justify-center px-[10px] left-[0px] items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-white !max-h-[100px] safe-area-bottom">
                <div className="w-full max-w-[700px] flex gap-[10px]">
                    <button
                        type="button"
                        onClick={onContinue}
                        disabled={isLoading}
                        className="shadow-button-bottom font-semibold flex-1 py-[10px] text-[17px] bg-emerald-700 rounded-[40px] text-white shadow-box-bottom flex items-center justify-center min-h-[46px] disabled:opacity-60"
                    >
                        {isLoading ? 'Checking...' : 'Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingAgeGate;
