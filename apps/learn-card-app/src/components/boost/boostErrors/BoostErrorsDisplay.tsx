'use client';

import SpilledCup from 'learn-card-base/svgs/SpilledCup';
import ArrowCircle from 'learn-card-base/svgs/ArrowCircle';

import { useErrorBoundary } from 'react-error-boundary';

import { CredentialCategoryEnum } from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';
import { ColorSetEnum } from '../../../theme/colors/index';

type CategoryType = keyof typeof CredentialCategoryEnum | 'Hidden' | 'Course';

const BoostErrorsDisplay: React.FC<{
    errorMessage?: string;
    refetch: () => void;
    category: CategoryType;
}> = ({ refetch, errorMessage, category }) => {
    const { getColorSet } = useTheme();

    const placeholders = getColorSet(ColorSetEnum.placeholders);
    const { spilledCup } = placeholders?.[category as CredentialCategoryEnum] ?? {};

    const handleRefetch = async () => {
        await refetch?.();
    };

    const message = errorMessage ? errorMessage : 'Oops, there was an error.';

    return (
        <section className="mt-[-60px] relative z-10 boost-error-container w-full h-full flex flex-col items-center justify-center">
            <SpilledCup
                version="2"
                backsplash={spilledCup?.backsplash}
                spill={spilledCup?.spill}
                cupOutline={spilledCup?.cupOutline}
            />
            <p className="font-bold text-grayscale-900 text-[15px] font-montserrat">{message}</p>
            <button
                className="font-poppins flex items-center mt-[20px] justify-center max-w-[200px] bg-[#FFFFFF] rounded-full w-full px-[18px] py-[12px] text-grayscale-900 text-[17px] font-semibold"
                onClick={handleRefetch}
            >
                Try again
                <ArrowCircle className="ml-[5px]" />
            </button>
        </section>
    );
};

export default BoostErrorsDisplay;

export const ErrorBoundaryFallback: React.FC<{
    error?: any;
}> = ({ error }) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { resetBoundary } = useErrorBoundary();

    return (
        <div role="alert">
            <p className="font-semibold text-black">Something went wrong:</p>
            <pre style={{ color: 'red' }}>{error?.message || 'There was an error'}</pre>
            <button
                className={`font-poppins flex items-center mt-[20px] justify-center max-w-[200px] bg-${primaryColor} rounded-full w-full px-[18px] py-[12px] text-white text-[28px]`}
                onClick={resetBoundary}
            >
                Try again!
            </button>
        </div>
    );
};
