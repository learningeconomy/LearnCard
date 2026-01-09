import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

interface SigningAuthorityStepProps {
    onComplete: () => void;
    onBack: () => void;
}

export const SigningAuthorityStep: React.FC<SigningAuthorityStepProps> = ({ onComplete, onBack }) => {
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

    const createSigningAuthority = async () => {
        try {
            setCreating(true);
            const wallet = await initWallet();

            const authority = await wallet.invoke.createSigningAuthority('default-sa');

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
            presentToast('Failed to create signing authority', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setCreating(false);
        }
    };

    const hasSigningAuthority = primarySA !== null;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Set Up Signing Authority</h3>

                <p className="text-gray-600">
                    A signing authority cryptographically signs your credentials, making them verifiable. 
                    This proves the credentials actually came from you.
                </p>
            </div>

            {/* Status */}
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                loading 
                    ? 'bg-gray-50 border-gray-200' 
                    : hasSigningAuthority 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-amber-50 border-amber-200'
            }`}>
                {loading ? (
                    <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                ) : hasSigningAuthority ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                )}

                <div>
                    <p className={`font-medium ${
                        loading 
                            ? 'text-gray-700' 
                            : hasSigningAuthority 
                                ? 'text-emerald-800' 
                                : 'text-amber-800'
                    }`}>
                        {loading 
                            ? 'Checking...' 
                            : hasSigningAuthority 
                                ? 'Signing authority configured' 
                                : 'No signing authority found'}
                    </p>

                    <p className={`text-sm ${
                        loading 
                            ? 'text-gray-500' 
                            : hasSigningAuthority 
                                ? 'text-emerald-700' 
                                : 'text-amber-700'
                    }`}>
                        {hasSigningAuthority 
                            ? `Using: ${primarySA?.name}` 
                            : 'Create one to sign credentials'}
                    </p>
                </div>
            </div>

            {/* Create button if needed */}
            {!loading && !hasSigningAuthority && (
                <button
                    onClick={createSigningAuthority}
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

            {/* Info about what it does */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-medium text-blue-800 mb-2">What does this do?</h4>

                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Creates a cryptographic key pair for signing</li>
                    <li>• Registers the key with LearnCard's verification network</li>
                    <li>• Allows anyone to verify credentials you issue</li>
                </ul>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={onComplete}
                    disabled={!hasSigningAuthority}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
