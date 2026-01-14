import React, { useState } from 'react';
import { Key, Copy, Check, Trash2, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import type { AuthGrant } from '../types';

const SCOPE_OPTIONS = [
    { label: 'Full Access', value: '*:*', description: 'Complete access to all resources' },
    { label: 'Credentials Only', value: 'credential:* presentation:*', description: 'Issue and manage credentials' },
];

interface ApiTokensTabProps {
    authGrants: AuthGrant[];
    onRefresh: () => void;
    guideType?: string;
}

export const ApiTokensTab: React.FC<ApiTokensTabProps> = ({ authGrants, onRefresh }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [copyingId, setCopyingId] = useState<string | null>(null);

    // Create form state
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTokenName, setNewTokenName] = useState('');
    const [selectedScope, setSelectedScope] = useState('*:*');
    const [creating, setCreating] = useState(false);

    const createToken = async () => {
        if (!newTokenName.trim()) return;

        try {
            setCreating(true);
            const wallet = await initWallet();

            await wallet.invoke.addAuthGrant({
                name: newTokenName.trim(),
                description: 'Created from Integration Dashboard',
                scope: selectedScope,
            });

            presentToast('API Token created!', { hasDismissButton: true });
            setNewTokenName('');
            setSelectedScope('*:*');
            setShowCreateForm(false);
            onRefresh();
        } catch (err) {
            console.error('Failed to create token:', err);
            presentToast('Failed to create token', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setCreating(false);
        }
    };

    const copyToken = async (grantId: string) => {
        setCopyingId(grantId);
        try {
            const wallet = await initWallet();
            const token = await wallet.invoke.getAPITokenForAuthGrant(grantId);

            await Clipboard.write({ string: token });
            setCopiedId(grantId);
            setTimeout(() => setCopiedId(null), 2000);
            presentToast('Token copied!', { hasDismissButton: true });
        } catch (err) {
            console.error('Failed to copy token:', err);
            presentToast('Failed to copy token', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setCopyingId(null);
        }
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">API Tokens</h2>
                    <p className="text-sm text-gray-500">Manage tokens for server-side credential issuance</p>
                </div>

                {!showCreateForm && (
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create Token
                    </button>
                )}
            </div>

            {/* Create Token Form */}
            {showCreateForm && (
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl space-y-4">
                    <h3 className="font-medium text-gray-800">Create New API Token</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Token Name</label>
                        <input
                            type="text"
                            value={newTokenName}
                            onChange={(e) => setNewTokenName(e.target.value)}
                            placeholder="e.g., Production Server"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                        <select
                            value={selectedScope}
                            onChange={(e) => setSelectedScope(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {SCOPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            {SCOPE_OPTIONS.find(o => o.value === selectedScope)?.description}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={createToken}
                            disabled={creating || !newTokenName.trim()}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {creating ? 'Creating...' : 'Create Token'}
                        </button>
                        <button
                            onClick={() => { setShowCreateForm(false); setNewTokenName(''); }}
                            className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Security Warning */}
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                    <strong>Security:</strong> Never expose your API token in client-side code or commit it to version control.
                </p>
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
                                        onClick={() => copyToken(grant.id)}
                                        disabled={copyingId === grant.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-lg transition-colors disabled:opacity-50"
                                        title="Copy token"
                                    >
                                        {copyingId === grant.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : copiedId === grant.id ? (
                                            <Check className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                        Copy
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
