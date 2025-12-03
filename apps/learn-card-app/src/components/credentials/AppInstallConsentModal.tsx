import React from 'react';

// Permission types matching the app-store-portal
type AppPermission =
    | 'request_identity'
    | 'send_credential'
    | 'launch_feature'
    | 'credential_search'
    | 'credential_by_id'
    | 'request_consent'
    | 'template_issuance';

const PERMISSION_INFO: Record<AppPermission, { label: string; description: string }> = {
    request_identity: {
        label: 'Request Identity',
        description: 'View your profile information and verify your identity',
    },
    send_credential: {
        label: 'Send Credentials',
        description: 'Send verifiable credentials to your wallet',
    },
    launch_feature: {
        label: 'Launch Features',
        description: 'Open wallet features programmatically',
    },
    credential_search: {
        label: 'Search Credentials',
        description: 'Search through your stored credentials',
    },
    credential_by_id: {
        label: 'Access Credentials',
        description: 'Retrieve specific credentials by their ID',
    },
    request_consent: {
        label: 'Request Consent',
        description: 'Ask for your consent to access or share data',
    },
    template_issuance: {
        label: 'Issue Credentials',
        description: 'Create and issue credentials from templates',
    },
};

type AppInstallConsentModalProps = {
    appName: string;
    appIcon?: string;
    permissions: string[];
    onAccept: () => void;
    onReject: () => void;
};

export const AppInstallConsentModal: React.FC<AppInstallConsentModalProps> = ({
    appName,
    appIcon,
    permissions,
    onAccept,
    onReject,
}) => {
    // Filter to only known permissions
    const validPermissions = permissions.filter(
        (p): p is AppPermission => p in PERMISSION_INFO
    );

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
                    Install App
                </h2>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="flex flex-col items-center text-center space-y-4">
                    {/* App Icon */}
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-grayscale-100 flex items-center justify-center shadow-md">
                        {appIcon ? (
                            <img
                                src={appIcon}
                                alt={appName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                        'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';
                                }}
                            />
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-10 w-10 text-grayscale-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        )}
                    </div>

                    {/* App Info */}
                    <div>
                        <p className="text-lg font-semibold text-grayscale-900 mb-1">
                            Install <span className="font-bold">{appName}</span>?
                        </p>

                        <p className="text-sm text-grayscale-600">
                            This app is requesting the following permissions
                        </p>
                    </div>

                    {/* Permissions List */}
                    {validPermissions.length > 0 ? (
                        <div className="bg-grayscale-50 rounded-lg p-4 w-full text-left">
                            <p className="text-sm font-semibold text-grayscale-900 mb-3">
                                This app will be able to:
                            </p>

                            <ul className="space-y-3">
                                {validPermissions.map((permission) => {
                                    const info = PERMISSION_INFO[permission];

                                    return (
                                        <li
                                            key={permission}
                                            className="flex items-start text-sm"
                                        >
                                            <svg
                                                className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0 mt-0.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                />
                                            </svg>

                                            <div>
                                                <span className="font-medium text-grayscale-900">
                                                    {info.label}
                                                </span>

                                                <p className="text-grayscale-600 text-xs mt-0.5">
                                                    {info.description}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ) : (
                        <div className="bg-green-50 rounded-lg p-4 w-full text-left">
                            <div className="flex items-center text-sm text-green-800">
                                <svg
                                    className="h-5 w-5 text-green-600 mr-2 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>

                                <span>This app doesn't require any special permissions.</span>
                            </div>
                        </div>
                    )}

                    {/* Privacy Note */}
                    <p className="text-xs text-grayscale-500 italic">
                        You can uninstall this app at any time from your installed apps.
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
                    Install
                </button>
            </div>
        </div>
    );
};

export default AppInstallConsentModal;
