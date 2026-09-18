import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

// Map technical error messages to user-friendly explanations
export const getFriendlyErrorInfo = (
    errorMessage: string
): { title: string; description: string; suggestion: string } => {
    const lowerMessage = errorMessage.toLowerCase();

    // Credential/Boost not found errors
    if (lowerMessage.includes('not found') || lowerMessage.includes('could not find boost')) {
        return {
            title: 'Credential Not Found',
            description:
                "The credential you're trying to claim doesn't exist or is no longer available.",
            suggestion:
                'The link may have expired or the credential may have been removed. Contact the issuer for a new link.',
        };
    }

    // Expired or invalid claim token
    if (lowerMessage.includes('expired') || lowerMessage.includes('invalid claim token')) {
        return {
            title: 'Link Expired',
            description: 'This claim link has expired or is no longer valid.',
            suggestion: 'Request a new claim link from the issuer.',
        };
    }

    // Draft boost error
    if (lowerMessage.includes('draft')) {
        return {
            title: 'Credential Not Ready',
            description: "This credential is still being prepared and isn't ready to claim yet.",
            suggestion: 'Check back later or contact the issuer.',
        };
    }

    // Challenge/verification errors
    if (lowerMessage.includes('challenge') || lowerMessage.includes('verification failed')) {
        return {
            title: 'Verification Failed',
            description: "We couldn't verify your identity for this claim.",
            suggestion:
                'Try again. If the problem persists, you may need to request a new claim link.',
        };
    }

    // No pending credentials
    if (lowerMessage.includes('no pending credentials')) {
        return {
            title: 'Nothing to Claim',
            description: 'There are no pending credentials waiting for you with this link.',
            suggestion:
                'You may have already claimed this credential, or it was sent to a different account.',
        };
    }

    // Invalid exchange ID
    if (lowerMessage.includes('invalid exchange')) {
        return {
            title: 'Invalid Link',
            description: 'This claim link appears to be malformed or corrupted.',
            suggestion:
                'Check that you copied the full link, or request a new one from the issuer.',
        };
    }

    // Server/issuing errors
    if (lowerMessage.includes('failed to issue') || lowerMessage.includes('internal')) {
        return {
            title: 'Server Error',
            description: 'Something went wrong on our end while processing your claim.',
            suggestion: 'This is usually temporary. Wait a moment and try again.',
        };
    }

    // Signing authority errors
    if (lowerMessage.includes('signing authority')) {
        return {
            title: 'Issuer Configuration Error',
            description:
                "The issuer's signing setup isn't configured correctly for this credential.",
            suggestion: 'Contact the issuer to resolve this issue.',
        };
    }

    // Default fallback
    return {
        title: 'Something Went Wrong',
        description: 'We encountered an unexpected error while processing your request.',
        suggestion: 'Try again, or contact support if the problem persists.',
    };
};

export const ExchangeErrorDisplay: React.FC<{
    errorData: unknown;
    onRetry: () => void;
    onCancel: () => void;
}> = ({ errorData, onRetry, onCancel }) => {
    const rawErrorMessage =
        typeof errorData === 'string'
            ? errorData
            : errorData &&
                typeof errorData === 'object' &&
                'message' in errorData &&
                typeof errorData.message === 'string'
              ? errorData.message
              : 'An unexpected error occurred.';

    const friendlyError = getFriendlyErrorInfo(rawErrorMessage);

    return (
        <div className="min-h-full bg-grayscale-100 flex items-center justify-center p-4 font-poppins">
            <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden safe-area-top-margin animate-fade-in-up">
                {/* Header with icon */}
                <div className="bg-white px-6 py-8 text-center border-b border-grayscale-200">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>

                    <h1 className="text-xl font-semibold text-grayscale-900 mb-2">
                        {friendlyError.title}
                    </h1>

                    <p className="text-grayscale-600 text-sm">We couldn't complete your request</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="space-y-5 mb-6">
                        <p className="text-grayscale-600 text-center text-sm leading-relaxed">
                            {friendlyError.description}
                        </p>

                        {/* Suggestion box */}
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                            <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
                                What to do
                            </p>

                            <p className="text-sm text-amber-800 leading-relaxed">
                                {friendlyError.suggestion}
                            </p>
                        </div>

                        {/* Technical details (collapsed by default feeling) */}
                        {Boolean(errorData) && rawErrorMessage !== friendlyError.description && (
                            <details className="group">
                                <summary className="text-xs text-grayscale-600 cursor-pointer hover:text-grayscale-900 transition-colors">
                                    Show technical details
                                </summary>

                                <div className="mt-3 bg-grayscale-100 rounded-xl p-4">
                                    <p className="text-xs text-grayscale-600 font-mono break-words">
                                        {rawErrorMessage}
                                    </p>
                                </div>
                            </details>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => onRetry()}
                            className="w-full py-3 px-4 bg-grayscale-900 text-white font-medium text-sm rounded-[20px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try again
                        </button>

                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-full py-3 px-4 text-sm text-grayscale-600 font-medium rounded-[20px] hover:text-grayscale-900 hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2"
                        >
                            <Home className="w-4 h-4" />
                            Go back home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExchangeErrorDisplay;
