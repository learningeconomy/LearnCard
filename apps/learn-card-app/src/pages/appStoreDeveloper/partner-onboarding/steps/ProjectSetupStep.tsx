import React, { useState, useEffect } from 'react';
import {
    Building2,
    Key,
    Copy,
    Check,
    Loader2,
    Shield,
    ArrowRight,
    ArrowLeft,
    Eye,
    EyeOff,
    RefreshCw,
} from 'lucide-react';

import { useWallet } from 'learn-card-base';
import { Clipboard } from '@capacitor/clipboard';

import { PartnerProject } from '../types';
import { useDeveloperPortal } from '../../useDeveloperPortal';

interface ProjectSetupStepProps {
    project: PartnerProject | null;
    onComplete: (project: PartnerProject) => void;
    onBack?: () => void;
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

export const ProjectSetupStep: React.FC<ProjectSetupStepProps> = ({ project, onComplete, onBack }) => {
    const { initWallet } = useWallet();
    const { useIntegrations, useCreateIntegration } = useDeveloperPortal();
    const { data: existingIntegrations, isLoading: integrationsLoading } = useIntegrations();
    const createIntegrationMutation = useCreateIntegration();

    const [projectName, setProjectName] = useState(project?.name || '');
    const [createdProject, setCreatedProject] = useState<PartnerProject | null>(project);
    const [showCreateNew, setShowCreateNew] = useState(false);

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

    const handleSelectExistingIntegration = (integration: { id: string; name: string; createdAt?: string }) => {
        const selectedProject: PartnerProject = {
            id: integration.id,
            name: integration.name,
            did,
            createdAt: integration.createdAt || new Date().toISOString(),
        };

        setCreatedProject(selectedProject);
        setProjectName(integration.name);
        setShowCreateNew(false);
    };

    const handleCreateProject = async () => {
        if (!projectName.trim()) return;

        try {
            // Create a real integration using the API
            const integrationId = await createIntegrationMutation.mutateAsync(projectName.trim());

            const newProject: PartnerProject = {
                id: integrationId,
                name: projectName.trim(),
                did,
                createdAt: new Date().toISOString(),
            };

            setCreatedProject(newProject);
            setShowCreateNew(false);
        } catch (err) {
            console.error('Failed to create project:', err);
        }
    };

    const isCreating = createIntegrationMutation.isPending;

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
            const grantName = createdProject?.name 
                ? `${createdProject.name} API Key` 
                : `${projectName || 'Partner'} API Key`;
            
            await wallet.invoke.addAuthGrant({
                name: grantName,
                description: `API key for ${createdProject?.name || projectName || 'partner'} integration`,
                scope: '*:*',
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
            {/* Project Selection / Creation */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-cyan-600" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">Select or Create Project</h3>
                        <p className="text-sm text-gray-500">Choose an existing integration or create a new one</p>
                    </div>
                </div>

                {/* Loading state */}
                {integrationsLoading && (
                    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading existing projects...
                    </div>
                )}

                {/* Existing Integrations */}
                {!integrationsLoading && existingIntegrations && existingIntegrations.length > 0 && !showCreateNew && (
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-600">Existing Projects</p>

                        <div className="space-y-2">
                            {existingIntegrations.map((integration) => (
                                <button
                                    key={integration.id}
                                    onClick={() => handleSelectExistingIntegration(integration)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                        createdProject?.id === integration.id
                                            ? 'border-cyan-500 bg-cyan-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-gray-600" />
                                    </div>

                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">{integration.name}</p>
                                        <p className="text-sm text-gray-500">ID: {integration.id.slice(0, 12)}...</p>
                                    </div>

                                    {createdProject?.id === integration.id && (
                                        <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>

                            <div className="relative flex justify-center">
                                <span className="px-2 bg-white text-xs text-gray-500">or</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setShowCreateNew(true);
                                setCreatedProject(null);
                                setProjectName('');
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors"
                        >
                            <Building2 className="w-4 h-4" />
                            Create New Project
                        </button>
                    </div>
                )}

                {/* Create New Project Form */}
                {(!existingIntegrations || existingIntegrations.length === 0 || showCreateNew) && !createdProject && (
                    <div className="space-y-3">
                        {showCreateNew && existingIntegrations && existingIntegrations.length > 0 && (
                            <button
                                onClick={() => setShowCreateNew(false)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                ← Back to existing projects
                            </button>
                        )}

                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="e.g., AARP Skills Builder"
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                            />

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
                        </div>
                    </div>
                )}

                {/* Selected Project Display */}
                {createdProject && !showCreateNew && (
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Check className="w-5 h-5 text-emerald-600" />
                        </div>

                        <div className="flex-1">
                            <p className="font-medium text-emerald-800">{createdProject.name}</p>
                            <p className="text-sm text-emerald-600">Project selected</p>
                        </div>

                        <button
                            onClick={() => {
                                setCreatedProject(null);
                                setProjectName('');
                                setApiToken('');
                                setSelectedGrantId(null);
                            }}
                            className="text-sm text-emerald-600 hover:text-emerald-800"
                        >
                            Change
                        </button>
                    </div>
                )}
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

            {/* Navigation */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                )}

                <button
                    onClick={() => canProceed && onComplete({ ...createdProject!, apiKey: apiToken })}
                    disabled={!canProceed}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Continue to Branding
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
