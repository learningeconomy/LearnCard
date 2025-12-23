import React, { useState, useEffect } from 'react';
import {
    Building2,
    Key,
    Copy,
    Check,
    Loader2,
    Shield,
    ArrowRight,
    Eye,
    EyeOff,
    RefreshCw,
} from 'lucide-react';

import { useWallet } from 'learn-card-base';
import { Clipboard } from '@capacitor/clipboard';

import { PartnerProject } from '../types';

interface ProjectSetupStepProps {
    project: PartnerProject | null;
    onComplete: (project: PartnerProject) => void;
}

type AuthGrant = {
    id: string;
    name: string;
    challenge: string;
    createdAt: string;
    status: 'revoked' | 'active';
    scope: string;
    description?: string;
};

export const ProjectSetupStep: React.FC<ProjectSetupStepProps> = ({ project, onComplete }) => {
    const { initWallet } = useWallet();

    const [projectName, setProjectName] = useState(project?.name || '');
    const [isCreating, setIsCreating] = useState(false);
    const [createdProject, setCreatedProject] = useState<PartnerProject | null>(project);

    const [did, setDid] = useState<string>('');
    const [apiToken, setApiToken] = useState<string>('');
    const [showToken, setShowToken] = useState(false);
    const [copiedDid, setCopiedDid] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);

    const [authGrants, setAuthGrants] = useState<Partial<AuthGrant>[]>([]);
    const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
    const [isCreatingGrant, setIsCreatingGrant] = useState(false);
    const [loadingGrants, setLoadingGrants] = useState(false);

    // Fetch DID and grants on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoadingGrants(true);
            try {
                const wallet = await initWallet();
                const userDid = wallet.id.did();
                setDid(userDid);

                const grants = await wallet.invoke.getAuthGrants() || [];
                const activeGrants = grants.filter((g: Partial<AuthGrant>) => g.status === 'active');
                setAuthGrants(activeGrants);
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setLoadingGrants(false);
            }
        };
        fetchData();
    }, []);

    const handleCreateProject = async () => {
        if (!projectName.trim()) return;

        setIsCreating(true);
        try {
            // Simulate project creation (in real implementation, this would call an API)
            const newProject: PartnerProject = {
                id: `proj_${Date.now()}`,
                name: projectName.trim(),
                did,
                createdAt: new Date().toISOString(),
            };

            setCreatedProject(newProject);
        } catch (err) {
            console.error('Failed to create project:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleSelectGrant = async (grantId: string) => {
        try {
            const wallet = await initWallet();
            const token = await wallet.invoke.getAPITokenForAuthGrant(grantId);
            setApiToken(token);
            setSelectedGrantId(grantId);
        } catch (err) {
            console.error('Failed to get token:', err);
        }
    };

    const handleCreateGrant = async () => {
        setIsCreatingGrant(true);
        try {
            const wallet = await initWallet();
            const grantName = `${projectName} API Key`;
            
            await wallet.invoke.createAuthGrant({
                name: grantName,
                description: `API key for ${projectName} partner integration`,
                scope: 'full',
            });

            // Refresh grants list
            const grants = await wallet.invoke.getAuthGrants() || [];
            const activeGrants = grants.filter((g: Partial<AuthGrant>) => g.status === 'active');
            setAuthGrants(activeGrants);

            // Auto-select the newly created grant
            const newGrant = activeGrants.find((g: Partial<AuthGrant>) => g.name === grantName);
            if (newGrant?.id) {
                await handleSelectGrant(newGrant.id);
            }
        } catch (err) {
            console.error('Failed to create grant:', err);
        } finally {
            setIsCreatingGrant(false);
        }
    };

    const handleCopyDid = async () => {
        await Clipboard.write({ string: did });
        setCopiedDid(true);
        setTimeout(() => setCopiedDid(false), 2000);
    };

    const handleCopyToken = async () => {
        await Clipboard.write({ string: apiToken });
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
    };

    const canProceed = createdProject && apiToken;

    return (
        <div className="space-y-6">
            {/* Project Name */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-cyan-600" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">Project Name</h3>
                        <p className="text-sm text-gray-500">What should we call this integration?</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g., AARP Skills Builder"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                        disabled={!!createdProject}
                    />

                    {!createdProject ? (
                        <button
                            onClick={handleCreateProject}
                            disabled={!projectName.trim() || isCreating}
                            className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Project'
                            )}
                        </button>
                    ) : (
                        <div className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-medium flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Created
                        </div>
                    )}
                </div>
            </div>

            {/* DID Display */}
            {createdProject && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-violet-600" />
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-800">Issuer DID</h3>
                            <p className="text-sm text-gray-500">Your decentralized identifier for signing credentials</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl">
                        <code className="flex-1 text-sm text-gray-600 font-mono truncate">
                            {did || 'Loading...'}
                        </code>

                        <button
                            onClick={handleCopyDid}
                            disabled={!did}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {copiedDid ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            )}

            {/* API Token Selection */}
            {createdProject && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Key className="w-5 h-5 text-amber-600" />
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-800">API Key</h3>
                            <p className="text-sm text-gray-500">Used to authenticate your backend requests</p>
                        </div>
                    </div>

                    {loadingGrants ? (
                        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading API keys...
                        </div>
                    ) : apiToken ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl">
                                <code className="flex-1 text-sm text-gray-600 font-mono truncate">
                                    {showToken ? apiToken : '••••••••••••••••••••••••'}
                                </code>

                                <button
                                    onClick={() => setShowToken(!showToken)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>

                                <button
                                    onClick={handleCopyToken}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    {copiedToken ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>

                            <p className="text-xs text-amber-600 flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Store this securely. Never commit API keys to code.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {authGrants.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">Select an existing API key:</p>

                                    {authGrants.map((grant) => (
                                        <button
                                            key={grant.id}
                                            onClick={() => handleSelectGrant(grant.id!)}
                                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                                selectedGrantId === grant.id
                                                    ? 'bg-cyan-50 border-cyan-300'
                                                    : 'bg-white border-gray-200 hover:border-cyan-300'
                                            }`}
                                        >
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-gray-700">{grant.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    Created {new Date(grant.createdAt!).toLocaleDateString()}
                                                </p>
                                            </div>

                                            {selectedGrantId === grant.id && (
                                                <Check className="w-5 h-5 text-cyan-600" />
                                            )}
                                        </button>
                                    ))}

                                    <div className="relative py-2">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200" />
                                        </div>

                                        <div className="relative flex justify-center">
                                            <span className="px-2 bg-white text-xs text-gray-500">or</span>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <button
                                onClick={handleCreateGrant}
                                disabled={isCreatingGrant}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors"
                            >
                                {isCreatingGrant ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating API Key...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4" />
                                        Create New API Key
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Continue Button */}
            <div className="pt-4 border-t border-gray-100">
                <button
                    onClick={() => canProceed && onComplete({ ...createdProject!, apiKey: apiToken })}
                    disabled={!canProceed}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Continue to Branding
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
