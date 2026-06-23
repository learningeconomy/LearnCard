import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Loader2, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';
import * as m from '../../../../paraglide/messages.js';
import { getLogger } from 'learn-card-base';
const log = getLogger('signing-tab');

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
            log.error('Failed to fetch signing authority:', err);
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

            presentToast(m['developerPortal.dashboards.tabs.signing.createSuccess'](), { hasDismissButton: true });
            fetchSigningAuthority();
        } catch (err) {
            log.error('Failed to create signing authority:', err);
            presentToast(m['developerPortal.dashboards.tabs.signing.createError'](), {
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
                <h2 className="text-lg font-semibold text-gray-800">{m['developerPortal.dashboards.tabs.signing.title']()}</h2>
                <p className="text-sm text-gray-500">{m['developerPortal.dashboards.tabs.signing.description']()}</p>
            </div>

            {/* Status */}
            <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                    loading
                        ? 'bg-gray-50 border-gray-200'
                        : hasSigningAuthority
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-amber-50 border-amber-200'
                }`}
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 text-gray-400 mt-0.5 animate-spin" />
                ) : hasSigningAuthority ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                )}

                <div>
                    <h3
                        className={`font-medium ${
                            loading
                                ? 'text-gray-600'
                                : hasSigningAuthority
                                ? 'text-emerald-800'
                                : 'text-amber-800'
                        }`}
                    >
                        {loading
                            ? m['developerPortal.dashboards.tabs.signing.checking']()
                            : hasSigningAuthority
                            ? m['developerPortal.dashboards.tabs.signing.configured']()
                            : m['developerPortal.dashboards.tabs.signing.notFound']()}
                    </h3>

                    {!loading && (
                        <p
                            className={`text-sm mt-1 ${
                                hasSigningAuthority ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                        >
                            {hasSigningAuthority
                                ? m['developerPortal.dashboards.tabs.signing.using']({ name: primarySA?.name || '' })
                                : m['developerPortal.dashboards.tabs.signing.createOne']()}
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
                            {m['developerPortal.dashboards.tabs.signing.creating']()}
                        </>
                    ) : (
                        <>
                            <Shield className="w-4 h-4" />
                            {m['developerPortal.dashboards.tabs.signing.createSigningAuthority']()}
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
                            {m['developerPortal.dashboards.tabs.signing.recreating']()}
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4" />
                            {m['developerPortal.dashboards.tabs.signing.recreate']()}
                        </>
                    )}
                </button>
            )}

            <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p>
                    {m['developerPortal.dashboards.tabs.signing.infoText']()}
                </p>
            </div>
        </div>
    );
};
