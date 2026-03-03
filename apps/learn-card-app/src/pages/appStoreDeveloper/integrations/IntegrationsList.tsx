import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import {
    Plus,
    Loader2,
    Rocket,
    ArrowRight,
    LayoutDashboard,
    Award,
    Clock,
    CheckCircle2,
    AlertCircle,
    Settings,
    Zap,
    MoreVertical,
    Trash2,
    Pencil,
} from 'lucide-react';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import { AppStoreHeader } from '../components/AppStoreHeader';
import { useDeveloperPortal } from '../useDeveloperPortal';
import { IntegrationWithConfig, IntegrationStatus } from '../partner-onboarding/types';

interface IntegrationCardProps {
    integration: IntegrationWithConfig;
    templateCount: number;
    onClick: () => void;
}

const STATUS_CONFIG: Record<IntegrationStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
    setup: {
        label: 'Setup Required',
        color: 'text-amber-700',
        bgColor: 'bg-amber-50 border-amber-200',
        icon: AlertCircle,
    },
    active: {
        label: 'Active',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50 border-emerald-200',
        icon: CheckCircle2,
    },
    paused: {
        label: 'Paused',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 border-gray-200',
        icon: Clock,
    },
};

const IntegrationCard: React.FC<IntegrationCardProps> = ({ integration, templateCount, onClick }) => {
    const status = integration.config?.status || 'setup';
    const statusConfig = STATUS_CONFIG[status];
    const StatusIcon = statusConfig.icon;

    const stats = {
        templates: templateCount,
        issued: integration.config?.totalCredentialsIssued || 0,
    };

    return (
        <button
            onClick={onClick}
            className="group w-full p-5 bg-white border border-gray-200 rounded-2xl hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-50 transition-all text-left"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-100">
                        <LayoutDashboard className="w-6 h-6 text-white" />
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-cyan-700 transition-colors">
                            {integration.name}
                        </h3>

                        <p className="text-xs text-gray-500">
                            ID: {integration.id.slice(0, 12)}...
                        </p>
                    </div>
                </div>

                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${statusConfig.bgColor}`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.color}`} />

                    <span className={`text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-400" />

                    <span className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-800">{stats.templates}</span> templates
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-gray-400" />

                    <span className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-800">{stats.issued}</span> issued
                    </span>
                </div>

                {integration.config?.integrationMethod && (
                    <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-gray-400" />

                        <span className="text-sm text-gray-600 capitalize">
                            {integration.config.integrationMethod}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                    {integration.createdAt
                        ? `Created ${new Date(integration.createdAt).toLocaleDateString()}`
                        : 'Recently created'}
                </span>

                <div className="flex items-center gap-1.5 text-cyan-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>{status === 'setup' ? 'Continue Setup' : 'Open Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>
        </button>
    );
};

const IntegrationsList: React.FC = () => {
    const history = useHistory();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const [newProjectName, setNewProjectName] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [templateCounts, setTemplateCounts] = useState<Record<string, number>>({});

    const { useIntegrations, useCreateIntegration } = useDeveloperPortal();
    const { data: integrations, isLoading: isLoadingIntegrations } = useIntegrations();
    const createIntegrationMutation = useCreateIntegration();

    // Load template counts for each integration
    React.useEffect(() => {
        const loadTemplateCounts = async () => {
            if (!integrations?.length) return;

            try {
                const wallet = await initWallet();

                const counts: Record<string, number> = {};

                for (const integration of integrations) {
                    try {
                        const boostsResult = await wallet.invoke.getPaginatedBoosts({
                            limit: 100,
                            query: { meta: { integrationId: integration.id } },
                        });

                        counts[integration.id] = boostsResult?.records?.length || 0;
                    } catch {
                        counts[integration.id] = 0;
                    }
                }

                setTemplateCounts(counts);
            } catch (err) {
                console.warn('Failed to load template counts:', err);
            }
        };

        loadTemplateCounts();
    }, [integrations, initWallet]);

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;

        try {
            const integrationId = await createIntegrationMutation.mutateAsync(newProjectName.trim());

            presentToast(`Created "${newProjectName.trim()}"`, {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });

            setNewProjectName('');
            setShowCreateForm(false);

            // Navigate to the new integration's guides hub to choose a guide
            history.push(`/app-store/developer/integrations/${integrationId}/guides`);
        } catch (error) {
            console.error('Failed to create project:', error);

            presentToast('Failed to create project', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleIntegrationClick = (integration: IntegrationWithConfig) => {
        // Always use guides pattern for consistent navigation experience
        history.push(`/app-store/developer/integrations/${integration.id}/guides`);
    };

    const integrationsWithConfig: IntegrationWithConfig[] = (integrations || []).map(i => {
        const hasTemplates = templateCounts[i.id] > 0;

        return {
            id: i.id,
            name: i.name,
            createdAt: (i as any).createdAt,
            config: {
                status: hasTemplates ? 'active' : 'setup',
                totalTemplates: templateCounts[i.id] || 0,
            },
        };
    });

    const hasIntegrations = integrationsWithConfig.length > 0;

    return (
        <IonPage>
            <AppStoreHeader
                title="My Integrations"
                rightContent={
                    hasIntegrations && !showCreateForm ? (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-200"
                        >
                            <Plus className="w-4 h-4" />
                            New Integration
                        </button>
                    ) : null
                }
            />

            <IonContent className="ion-padding">
                <div className="max-w-4xl mx-auto py-4">
                    {/* Loading state */}
                    {isLoadingIntegrations && (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <Loader2 className="w-10 h-10 text-cyan-500 mx-auto animate-spin" />
                                <p className="text-sm text-gray-500 mt-3">Loading integrations...</p>
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoadingIntegrations && !hasIntegrations && !showCreateForm && (
                        <div className="max-w-lg mx-auto py-16 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-200">
                                <Rocket className="w-10 h-10 text-white" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-800 mb-3">
                                Create Your First Integration
                            </h2>

                            <p className="text-gray-500 mb-8 max-w-md mx-auto">
                                Set up an integration to start issuing verifiable credentials from your platform.
                                We'll guide you through every step.
                            </p>

                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-200"
                            >
                                <Plus className="w-5 h-5" />
                                Create Integration
                            </button>
                        </div>
                    )}

                    {/* Create form */}
                    {showCreateForm && (
                        <div className="max-w-md mx-auto mb-8 p-6 bg-white border border-gray-200 rounded-2xl shadow-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                New Integration
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Integration Name
                                    </label>

                                    <input
                                        type="text"
                                        value={newProjectName}
                                        onChange={e => setNewProjectName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                                        placeholder="e.g., AARP Skills Builder"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                                        autoFocus
                                        disabled={createIntegrationMutation.isPending}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowCreateForm(false);
                                            setNewProjectName('');
                                        }}
                                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                        disabled={createIntegrationMutation.isPending}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={handleCreateProject}
                                        disabled={!newProjectName.trim() || createIntegrationMutation.isPending}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {createIntegrationMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                Create
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Integrations list */}
                    {!isLoadingIntegrations && hasIntegrations && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Your Integrations
                                </h2>

                                <span className="text-sm text-gray-500">
                                    {integrationsWithConfig.length} integration{integrationsWithConfig.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="grid gap-4">
                                {integrationsWithConfig.map(integration => (
                                    <IntegrationCard
                                        key={integration.id}
                                        integration={integration}
                                        templateCount={templateCounts[integration.id] || 0}
                                        onClick={() => handleIntegrationClick(integration)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick actions */}
                    {!isLoadingIntegrations && hasIntegrations && (
                        <div className="mt-10 pt-8 border-t border-gray-100">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                                Quick Actions
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => history.push('/app-store/developer/guides')}
                                    className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                                >
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                        <Rocket className="w-5 h-5 text-violet-500" />
                                    </div>

                                    <div>
                                        <p className="font-medium text-gray-800">Integration Guides</p>
                                        <p className="text-sm text-gray-500">Step-by-step tutorials</p>
                                    </div>
                                </button>

                                <a
                                    href="https://docs.learncard.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                        <Settings className="w-5 h-5 text-gray-600" />
                                    </div>

                                    <div>
                                        <p className="font-medium text-gray-800">API Documentation</p>
                                        <p className="text-sm text-gray-500">Full reference docs</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default IntegrationsList;
