import React, { useState } from 'react';
import { Key, Copy, Check, Trash2, Plus, Loader2 } from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import type { AuthGrant } from '../types';

interface ApiTokensTabProps {
    authGrants: AuthGrant[];
    onRefresh: () => void;
    guideType?: string;
}

export const ApiTokensTab: React.FC<ApiTokensTabProps> = ({ authGrants, onRefresh, guideType }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const copyChallenge = async (challenge: string, id: string) => {
        await Clipboard.write({ string: challenge });
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        presentToast('Token copied!', { hasDismissButton: true });
    };

    const revokeToken = async (grantId: string) => {
        setRevokingId(grantId);
        try {
            const wallet = await initWallet();
            await wallet.invoke.revokeAuthGrant(grantId);
            presentToast('Token revoked', { hasDismissButton: true });
            onRefresh();
        } catch (err) {
            console.error('Failed to revoke token:', err);
            presentToast('Failed to revoke token', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setRevokingId(null);
        }
    };

    const activeGrants = authGrants.filter(g => g.status === 'active');
    const revokedGrants = authGrants.filter(g => g.status === 'revoked');

    const createTokenUrl = guideType 
        ? `/app-store/developer/guides/${guideType}`
        : '/app-store/developer/guides/issue-credentials';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">API Tokens</h2>
                    <p className="text-sm text-gray-500">Manage tokens for server-side credential issuance</p>
                </div>

                <a
                    href={createTokenUrl}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create Token
                </a>
            </div>

            {activeGrants.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
                    <Key className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No active API tokens</p>
                    <p className="text-sm text-gray-400 mt-1">Create a token to start issuing credentials via API</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activeGrants.map(grant => (
                        <div key={grant.id} className="p-4 border border-gray-200 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <Key className="w-5 h-5 text-emerald-600" />
                                    </div>

                                    <div>
                                        <h3 className="font-medium text-gray-800">{grant.name}</h3>
                                        <p className="text-xs text-gray-500">
                                            Created {new Date(grant.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copyChallenge(grant.challenge, grant.id)}
                                        className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                        title="Copy token"
                                    >
                                        {copiedId === grant.id ? (
                                            <Check className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() => revokeToken(grant.id)}
                                        disabled={revokingId === grant.id}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="Revoke token"
                                    >
                                        {revokingId === grant.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {revokedGrants.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Revoked Tokens</h3>

                    <div className="space-y-2 opacity-60">
                        {revokedGrants.map(grant => (
                            <div key={grant.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <Key className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-500">{grant.name}</span>
                                    <span className="text-xs text-red-500 ml-auto">Revoked</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
