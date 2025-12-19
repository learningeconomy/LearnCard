'use client';
import ReaperGhost from '../../../assets/lotties/reaperghost.json';
import Lottie from 'react-lottie-player';
import { useErrorBoundary } from 'react-error-boundary';

const BoostErrorsDisplay: React.FC<{
    errorMessage?: string;
    refetch: () => void;
}> = ({ refetch, errorMessage }) => {
    const handleRefetch = async () => {
        await refetch?.();
    };

    const message = errorMessage ? errorMessage : 'There was an error';

    return (
        <section className="mt-[-60px] relative z-10 boost-error-container w-full h-full flex flex-col items-center justify-center">
            <div className="max-w-[280px] mt-[-40px]">
                <Lottie
                    loop
                    animationData={ReaperGhost}
                    play
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
            <p className="font-semibold text-black">{message}</p>
            <button
                className="fle font-medium items-center mt-[20px] justify-center max-w-[200px] bg-indigo-500 rounded-full w-full px-[18px] py-[12px] text-white text-[20px]"
                onClick={handleRefetch}
            >
                Try again!
            </button>
        </section>
    );
};

export default BoostErrorsDisplay;

export const ErrorBoundaryFallback: React.FC<{
    error?: any;
}> = ({ error }) => {
    const { resetBoundary } = useErrorBoundary();

    return (
        <div role="alert" className="flex flex-col items-center justify-center w-full h-full">
            <p className="font-semibold text-black">Something went wrong:</p>
            <p>{error?.message || 'There was an error'}</p>
            <button
                className="flex items-center mt-[20px] font-medium justify-center max-w-[200px] bg-indigo-500 rounded-full w-full px-[18px] py-[12px] text-white text-[20px]"
                onClick={resetBoundary}
            >
                Try again!
            </button>
        </div>
    );
};
