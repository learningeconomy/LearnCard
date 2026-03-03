import React, { useState, useEffect, useRef } from 'react';
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
    ChevronDown,
    Fingerprint,
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
    const [showDidDetails, setShowDidDetails] = useState(false);

    const [authGrants, setAuthGrants] = useState<Partial<AuthGrant>[]>([]);
    const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
    const [isCreatingGrant, setIsCreatingGrant] = useState(false);
    const [loadingGrants, setLoadingGrants] = useState(false);
    
    const autoCreatedApiKey = useRef(false);

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

    // Auto-create API key when project is selected and no grants exist
    useEffect(() => {
        const autoCreateKey = async () => {
            if (createdProject && !loadingGrants && authGrants.length === 0 && !apiToken && !autoCreatedApiKey.current) {
                autoCreatedApiKey.current = true;
                await handleCreateGrant();
            }
        };
        autoCreateKey();
    }, [createdProject, loadingGrants, authGrants.length, apiToken]);

    const canProceed = createdProject && apiToken;
    const projectSelected = !!createdProject;

    return (
        <div className="space-y-6">
            {/* Step 1: Project Selection */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        projectSelected ? 'bg-emerald-500 text-white' : 'bg-cyan-500 text-white'
                    }`}>
                        {projectSelected ? <Check className="w-4 h-4" /> : '1'}
                    </div>

                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">Select Project</h3>
                        {!projectSelected && (
                            <p className="text-sm text-gray-500">Choose an existing project or create a new one</p>
                        )}
                    </div>
                </div>

                {/* Loading state */}
                {integrationsLoading && !projectSelected && (
                    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl text-gray-500 ml-11">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading projects...
                    </div>
                )}

                {/* Selected Project - Compact Display */}
                {projectSelected && !showCreateNew && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl ml-11">
                        <Building2 className="w-5 h-5 text-emerald-600" />

                        <div className="flex-1">
                            <p className="font-medium text-emerald-800">{createdProject?.name}</p>
                        </div>

                        <button
                            onClick={() => {
                                setCreatedProject(null);
                                setProjectName('');
                                setApiToken('');
                                setSelectedGrantId(null);
                                autoCreatedApiKey.current = false;
                            }}
                            className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                        >
                            Change
                        </button>
                    </div>
                )}

                {/* Project Selection UI - only when not selected */}
                {!projectSelected && !integrationsLoading && (
                    <div className="ml-11 space-y-3">
                        {/* Existing Integrations */}
                        {existingIntegrations && existingIntegrations.length > 0 && !showCreateNew && (
                            <>
                                <div className="space-y-2">
                                    {existingIntegrations.map((integration) => (
                                        <button
                                            key={integration.id}
                                            onClick={() => handleSelectExistingIntegration(integration)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-cyan-400 transition-all text-left"
                                        >
                                            <Building2 className="w-5 h-5 text-gray-500" />

                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800">{integration.name}</p>
                                                <p className="text-xs text-gray-500">ID: {integration.id.slice(0, 12)}...</p>
                                            </div>
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
                                    onClick={() => setShowCreateNew(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors"
                                >
                                    <Building2 className="w-4 h-4" />
                                    Create New Project
                                </button>
                            </>
                        )}

                        {/* Create New Project Form */}
                        {(!existingIntegrations || existingIntegrations.length === 0 || showCreateNew) && (
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
                                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                                    />

                                    <button
                                        onClick={handleCreateProject}
                                        disabled={!projectName.trim() || isCreating}
                                        className="px-5 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Step 2: Credentials - only shows after project selected */}
            {projectSelected && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            apiToken ? 'bg-emerald-500 text-white' : 'bg-cyan-500 text-white'
                        }`}>
                            {apiToken ? <Check className="w-4 h-4" /> : '2'}
                        </div>

                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">Get Credentials</h3>
                            {!apiToken && (
                                <p className="text-sm text-gray-500">Your DID and API key for issuing credentials</p>
                            )}
                        </div>
                    </div>

                    <div className="ml-11 space-y-4">
                        {/* Issuer DID - Compact collapsible */}
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <button
                                onClick={() => setShowDidDetails(!showDidDetails)}
                                className="w-full flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <Fingerprint className="w-4 h-4 text-violet-500" />
                                    <span className="text-sm font-medium text-gray-700">Issuer DID</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 font-mono truncate max-w-[120px]">
                                        {did ? `${did.slice(0, 20)}...` : 'Loading...'}
                                    </span>

                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDidDetails ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            {showDidDetails && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-xs text-gray-600 font-mono break-all">
                                            {did || 'Loading...'}
                                        </code>

                                        <button
                                            onClick={handleCopyDid}
                                            disabled={!did}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                                        >
                                            {copiedDid ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    <p className="text-xs text-gray-500 mt-2">
                                        Your decentralized identifier for signing credentials
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* API Key */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Key className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-medium text-gray-700">API Key</span>
                            </div>

                            {loadingGrants || isCreatingGrant ? (
                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-gray-500 text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {isCreatingGrant ? 'Creating API key...' : 'Loading...'}
                                </div>
                            ) : apiToken ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                                        <code className="flex-1 text-sm text-gray-600 font-mono truncate">
                                            {showToken ? apiToken : '••••••••••••••••••••••••'}
                                        </code>

                                        <button
                                            onClick={() => setShowToken(!showToken)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>

                                        <button
                                            onClick={handleCopyToken}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            {copiedToken ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    <p className="text-xs text-amber-600 flex items-center gap-1">
                                        <Shield className="w-3 h-3" />
                                        Store securely. Never commit to code.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {authGrants.length > 0 && (
                                        <>
                                            <div className="space-y-1.5">
                                                {authGrants.map((grant) => (
                                                    <button
                                                        key={grant.id}
                                                        onClick={() => handleSelectGrant(grant.id!)}
                                                        className="w-full flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:border-cyan-300 transition-colors text-left"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700">{grant.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                Created {new Date(grant.createdAt!).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="relative py-1">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-gray-200" />
                                                </div>
                                                <div className="relative flex justify-center">
                                                    <span className="px-2 bg-white text-xs text-gray-500">or</span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <button
                                        onClick={handleCreateGrant}
                                        disabled={isCreatingGrant}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors text-sm"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Create New API Key
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
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
