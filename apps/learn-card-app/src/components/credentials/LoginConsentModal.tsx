import React from 'react';

type LoginConsentModalProps = {
    appName: string;
    appOrigin: string;
    onAccept: () => void;
    onReject: () => void;
};

export const LoginConsentModal: React.FC<LoginConsentModalProps> = ({
    appName,
    appOrigin,
    onAccept,
    onReject,
}) => {
    return (
        <div className="flex flex-col h-full w-full bg-white max-w-[500px] mx-auto">
            {/* Header */}
            <div 
                className="border-b border-grayscale-200 p-6"
                style={{
                    paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
                }}
            >
                <h2 className="text-2xl font-bold text-grayscale-900 text-center">
                    Login with LearnCard
                </h2>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="flex flex-col items-center text-center space-y-4">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 text-indigo-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                            />
                        </svg>
                    </div>

                    {/* App Info */}
                    <div>
                        <p className="text-lg font-semibold text-grayscale-900 mb-2">
                            <span className="font-bold">{appName}</span> wants to connect to your LearnCard
                        </p>
                        <p className="text-sm text-grayscale-600">
                            {appOrigin}
                        </p>
                    </div>

                    {/* Permissions Info */}
                    <div className="bg-grayscale-50 rounded-lg p-4 w-full text-left">
                        <p className="text-sm font-semibold text-grayscale-900 mb-3">
                            This will allow the app to:
                        </p>
                        <ul className="space-y-2">
                            <li className="flex items-start text-sm text-grayscale-700">
                                <svg
                                    className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                <span>View your profile information (name, profile ID)</span>
                            </li>
                            <li className="flex items-start text-sm text-grayscale-700">
                                <svg
                                    className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                <span>Verify your identity</span>
                            </li>
                            <li className="flex items-start text-sm text-grayscale-700">
                                <svg
                                    className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                <span>Authenticate your session</span>
                            </li>
                        </ul>
                    </div>

                    {/* Privacy Note */}
                    <p className="text-xs text-grayscale-500 italic">
                        Your credentials and private data remain secure. You can revoke access at any time.
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div 
                className="flex items-center justify-center gap-4 p-6 border-t border-grayscale-200 bg-white"
                style={{
                    paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
                    paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
                    paddingRight: 'max(1.5rem, env(safe-area-inset-right))',
                }}
            >
                <button
                    onClick={onReject}
                    className="px-8 py-3 text-lg font-semibold text-grayscale-700 bg-grayscale-100 rounded-full hover:bg-grayscale-200 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onAccept}
                    className="px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors"
                >
                    Connect
                </button>
            </div>
        </div>
    );
};

export default LoginConsentModal;
