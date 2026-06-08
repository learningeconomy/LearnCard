import React, { useMemo } from 'react';

import { ModalTypes, useModal } from 'learn-card-base';
import { calculateAge } from 'learn-card-base/helpers/dateHelpers';
import { useDeviceTypeByWidth } from 'learn-card-base';

import DatePickerInput from '../date-picker/DatePickerInput';
import OnboardingHeader from './onboardingHeader/OnboardingHeader';
import CountrySelectorModal from './onboardingNetworkForm/components/CountrySelectorModal';
import LocationIcon from '../svgs/LocationIcon';
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
    const { isDesktop } = useDeviceTypeByWidth();
    const canContinue = Boolean(dob && country);

    const countryLabel = useMemo(() => {
        if (!country) return 'Country of residence';
        return COUNTRIES[country] ?? country;
    }, [country]);

    const age = useMemo(() => {
        if (!dob) return null;

        const parsedAge = calculateAge(dob);

        return Number.isNaN(parsedAge) ? null : parsedAge;
    }, [dob]);

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
                <OnboardingHeader
                    text="Please enter your age and country to continue"
                    secondaryText="We ask for this information to make sure we comply with privacy laws and keep you safe"
                />

                {error && (
                    <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl">
                        <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                    </div>
                )}

                <div className="space-y-4 mt-8">
                    <div className="flex flex-col items-center justify-center w-full mt-2">
                        <DatePickerInput
                            value={dob || ''}
                            onChange={onDobChange}
                            isMobile={!isDesktop}
                            label="Date of Birth"
                        />

                        {age !== null && (
                            <p className="p-0 m-0 w-full text-left mt-1 text-grayscale-700 text-xs">
                                Age: {age}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col items-center justify-center w-full mt-2">
                        <button
                            className="w-full flex items-center justify-between bg-grayscale-100 text-grayscale-500 rounded-[15px] font-poppins font-normal px-[16px] pr-[10px] py-[5px] tracking-wider text-base"
                            onClick={handlePickCountry}
                            type="button"
                        >
                            {country ? countryLabel : 'Country of Residence'}
                            <LocationIcon className="w-[44px] text-grayscale-700" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full flex gap-[10px] justify-center px-[10px] left-[0px] items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-white !max-h-[100px] safe-area-bottom">
                <div className="w-full max-w-[700px] flex gap-[10px]">
                    <button
                        type="button"
                        onClick={onContinue}
                        disabled={isLoading || !canContinue}
                        className="shadow-button-bottom font-semibold flex-1 py-[10px] text-[17px] bg-emerald-700 rounded-[40px] text-white shadow-box-bottom flex items-center justify-center min-h-[46px] disabled:opacity-60 disabled:bg-grayscale-200 disabled:text-grayscale-500 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Checking...' : 'Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingAgeGate;
