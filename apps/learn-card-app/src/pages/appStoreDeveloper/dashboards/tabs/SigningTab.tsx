import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Loader2, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';

interface SigningTabProps {
    integration: LCNIntegration;
}

export const SigningTab: React.FC<SigningTabProps> = ({ integration: _integration }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [primarySA, setPrimarySA] = useState<{ name: string; endpoint: string } | null>(null);

    const fetchSigningAuthority = useCallback(async () => {
        try {
            setLoading(true);
            const wallet = await initWallet();
            const primary = await wallet.invoke.getPrimaryRegisteredSigningAuthority();

            if (primary?.relationship) {
                setPrimarySA({
                    name: primary.relationship.name,
                    endpoint: primary.signingAuthority?.endpoint ?? '',
                });
            } else {
                setPrimarySA(null);
            }
        } catch (err) {
            console.error('Failed to fetch signing authority:', err);
            setPrimarySA(null);
        } finally {
            setLoading(false);
        }
    }, [initWallet]);

    useEffect(() => {
        fetchSigningAuthority();
    }, []);

    const createOrReplaceSigningAuthority = async () => {
        try {
            setCreating(true);
            const wallet = await initWallet();

            const saName = `sa-${Date.now().toString(36)}`;
            const authority = await wallet.invoke.createSigningAuthority(saName);

            if (!authority) {
                throw new Error('Failed to create signing authority');
            }

            await wallet.invoke.registerSigningAuthority(
                authority.endpoint!,
                authority.name,
                authority.did!
            );

            await wallet.invoke.setPrimaryRegisteredSigningAuthority(
                authority.endpoint!,
                authority.name
            );

            presentToast('Signing authority created!', { hasDismissButton: true });
            fetchSigningAuthority();
        } catch (err) {
            console.error('Failed to create signing authority:', err);
            presentToast('Failed to create signing authority', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setCreating(false);
        }
    };

    const hasSigningAuthority = primarySA !== null;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Signing Authority</h2>
                <p className="text-sm text-gray-500">Configure how credentials are signed</p>
            </div>

            {/* Status */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                loading
                    ? 'bg-gray-50 border-gray-200'
                    : hasSigningAuthority
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
            }`}>
                {loading ? (
                    <Loader2 className="w-5 h-5 text-gray-400 mt-0.5 animate-spin" />
                ) : hasSigningAuthority ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                )}

                <div>
                    <h3 className={`font-medium ${
                        loading ? 'text-gray-600' : hasSigningAuthority ? 'text-emerald-800' : 'text-amber-800'
                    }`}>
                        {loading
                            ? 'Checking...'
                            : hasSigningAuthority
                            ? 'Signing authority configured'
                            : 'No signing authority found'}
                    </h3>

                    {!loading && (
                        <p className={`text-sm mt-1 ${
                            hasSigningAuthority ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                            {hasSigningAuthority
                                ? `Using: ${primarySA?.name}`
                                : 'Create one below to sign credentials'}
                        </p>
                    )}
                </div>
            </div>

            {/* Create button if no SA exists */}
            {!loading && !hasSigningAuthority && (
                <button
                    onClick={createOrReplaceSigningAuthority}
                    disabled={creating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                    {creating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <Shield className="w-4 h-4" />
                            Create Signing Authority
                        </>
                    )}
                </button>
            )}

            {/* Recreate button if SA exists */}
            {!loading && hasSigningAuthority && (
                <button
                    onClick={createOrReplaceSigningAuthority}
                    disabled={creating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                    {creating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Recreating...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4" />
                            Recreate Signing Authority
                        </>
                    )}
                </button>
            )}

            <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p>
                    A signing authority cryptographically signs your credentials, making them verifiable.
                    This proves the credentials actually came from you.
                </p>
            </div>
        </div>
    );
};
