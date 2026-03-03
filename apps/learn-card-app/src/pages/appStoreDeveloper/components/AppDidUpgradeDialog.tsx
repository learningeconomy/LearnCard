import { useState } from 'react';
import type React from 'react';
import { X, Shield, Loader2, CheckCircle2, AlertCircle, ArrowUpCircle } from 'lucide-react';
import type { AppStoreListing } from '@learncard/types';

interface AppDidUpgradeDialogProps {
    isOpen: boolean;
    listing: AppStoreListing;
    integrationId: string;
    onUpgrade: () => Promise<boolean>;
    onDismiss: () => void;
}

export const AppDidUpgradeDialog: React.FC<AppDidUpgradeDialogProps> = ({
    isOpen,
    listing,
    onUpgrade,
    onDismiss,
}) => {
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [upgradeSuccess, setUpgradeSuccess] = useState(false);
    const [upgradeError, setUpgradeError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleUpgrade = async () => {
        setIsUpgrading(true);
        setUpgradeError(null);

        try {
            const success = await onUpgrade();
            if (success) {
                setUpgradeSuccess(true);
                setTimeout(() => {
                    onDismiss();
                }, 2000);
            } else {
                setUpgradeError('Upgrade failed. Please try again.');
            }
        } catch (error) {
            console.error('Upgrade failed:', error);
            setUpgradeError(
                error instanceof Error ? error.message : 'An unexpected error occurred'
            );
        } finally {
            setIsUpgrading(false);
        }
    };

    if (upgradeSuccess) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 animate-fade-in">
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">
                            Upgrade Complete!
                        </h2>
                        <p className="text-sm text-gray-500">
                            Your app &quot;{listing.display_name}&quot; now has its own unique
                            identity for issuing credentials.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onDismiss}
                onKeyDown={e => e.key === 'Escape' && onDismiss()}
                role="button"
                tabIndex={0}
                aria-label="Close dialog"
            />

            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 animate-fade-in">
                <div className="p-6">
                    <button
                        type="button"
                        onClick={onDismiss}
                        disabled={isUpgrading}
                        className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                            <ArrowUpCircle className="w-6 h-6 text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                Upgrade Your App
                            </h2>
                            <p className="text-sm text-gray-500">One-time setup required</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                        {listing.icon_url ? (
                            <img
                                src={listing.icon_url}
                                alt={listing.display_name}
                                className="w-10 h-10 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-gray-400" />
                            </div>
                        )}
                        <div>
                            <p className="font-medium text-gray-800">{listing.display_name}</p>
                            <p className="text-xs text-gray-500">
                                {listing.slug ? `Slug: ${listing.slug}` : 'No slug assigned'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        <p className="text-sm text-gray-600">
                            Your app is using an older authentication method. Upgrading to App DIDs
                            will give your app its own unique identity for issuing credentials,
                            separate from your personal account.
                        </p>

                        <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl">
                            <p className="text-sm font-medium text-violet-800 mb-2">
                                This upgrade will:
                            </p>
                            <ul className="text-sm text-violet-700 space-y-1">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Generate a unique identifier for your app</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Create a dedicated signing authority</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Enable credentials to be issued as the app</span>
                                </li>
                            </ul>
                        </div>

                        <p className="text-xs text-gray-500">
                            This is a one-time upgrade and your app will continue working normally.
                        </p>
                    </div>

                    {upgradeError && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">{upgradeError}</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={handleUpgrade}
                            disabled={isUpgrading}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 transition-colors disabled:opacity-50"
                        >
                            {isUpgrading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Upgrading...
                                </>
                            ) : (
                                <>
                                    <ArrowUpCircle className="w-4 h-4" />
                                    Upgrade Now
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={onDismiss}
                            disabled={isUpgrading}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            Remind Me Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppDidUpgradeDialog;
