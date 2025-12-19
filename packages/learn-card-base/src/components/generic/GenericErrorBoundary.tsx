import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { isLocalhost } from 'learn-card-base';

import SpilledCup from '../../svgs/SpilledCup';

type ErrorFallbackProps = {
    error: Error;
    resetErrorBoundary: () => void;
    hideGoHome?: boolean;
    extraButtons?: { label: string; onClick: () => void }[];
};

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
    error,
    resetErrorBoundary,
    hideGoHome = false,
    extraButtons,
}) => {
    const showError = process.env.NODE_ENV === 'development' || isLocalhost;

    return (
        <div className="text-grayscale-900 h-full w-full flex flex-col gap-[50px] items-center justify-center p-4">
            <div className="text-[17px] text-black font-poppins flex flex-col gap-[10px] items-center leading-[130%] tracking-[-0.25px] w-full mx-[20px]">
                <SpilledCup />
                Something went wrong.
                {showError && (
                    <div className="bg-red-50 p-4 rounded-lg mb-4 w-full max-w-md">
                        <p className="text-red-800 font-medium">Error:</p>
                        <p className="text-red-700 text-sm mt-1 break-words">{error.message}</p>
                        {error.stack && (
                            <details className="mt-2">
                                <summary className="text-sm text-red-600 cursor-pointer">
                                    View stack trace
                                </summary>
                                <pre className="bg-black/5 p-2 rounded text-xs mt-1 overflow-auto max-h-40">
                                    {error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                )}
            </div>
            <div className="flex gap-[10px]">
                <button
                    className="bg-white py-[7px] px-[15px] rounded-[30px] text-grayscale-900 text-[14px] shadow-button-bottom font-poppins border-[1px] border-grayscale-200 border-solid"
                    onClick={
                        resetErrorBoundary ? resetErrorBoundary : () => window.location.reload()
                    }
                >
                    Try Again
                </button>
                {extraButtons?.map(button => (
                    <button
                        key={button.label}
                        className="bg-white py-[7px] px-[15px] rounded-[30px] text-grayscale-900 text-[14px] shadow-button-bottom font-poppins border-[1px] border-grayscale-200 border-solid"
                        onClick={button.onClick}
                    >
                        {button.label}
                    </button>
                ))}
                {!hideGoHome && (
                    <button
                        className="bg-indigo-500 py-[7px] px-[15px] rounded-[30px] text-[14px] text-white font-[600] leading-[24px] tracking-[0.25px] shadow-button-bottom font-poppins"
                        onClick={() => (window.location.href = '/')}
                    >
                        Go Home
                    </button>
                )}
            </div>
        </div>
    );
};

type GenericErrorBoundaryProps = {
    children: React.ReactNode;
    onReset?: () => void;
    hideGoHome?: boolean;
    extraButtons?: { label: string; onClick: () => void }[];
};

const GenericErrorBoundary: React.FC<GenericErrorBoundaryProps> = ({
    children,
    onReset,
    hideGoHome = false,
    extraButtons,
}) => {
    return (
        <ErrorBoundary
            FallbackComponent={({ error, resetErrorBoundary }) => (
                <ErrorFallback
                    error={error}
                    resetErrorBoundary={resetErrorBoundary}
                    hideGoHome={hideGoHome}
                    extraButtons={extraButtons}
                />
            )}
            onReset={onReset}
            onError={(error: Error, info: { componentStack: string }) => {
                // You can also log the error to an error reporting service here
                console.error('ErrorBoundary caught an error:', error, info);
            }}
        >
            {children}
        </ErrorBoundary>
    );
};

export default GenericErrorBoundary;
