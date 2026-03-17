/**
 * AppsLandingPage - Landing page for Apps tab when no integration is selected
 *
 * Shows list of integrations with their app counts, allowing user to select one
 * to manage its apps.
 */

import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import {
    Rocket,
    ArrowRight,
    Loader2,
    Sparkles,
    Code2,
    LayoutDashboard,
    Settings,
    ChevronRight,
} from 'lucide-react';

import { AppStoreHeader } from './components/AppStoreHeader';
import { useDeveloperPortalContext } from './DeveloperPortalContext';
import { useDeveloperPortal } from './useDeveloperPortal';
import { useDeviceTypeByWidth } from 'learn-card-base';

const AppsLandingPage: React.FC = () => {
    const history = useHistory();
    const [newProjectName, setNewProjectName] = useState('');
    const { isMobile } = useDeviceTypeByWidth();

    const { integrations, isLoadingIntegrations, createIntegration, isCreatingIntegration } =
        useDeveloperPortalContext();

    const { useListingsForIntegration } = useDeveloperPortal();

    const handleCreateFirstProject = async () => {
        if (!newProjectName.trim()) return;

        try {
            const id = await createIntegration(newProjectName.trim());
            setNewProjectName('');
            // Navigate to the new integration's apps page
            history.push(`/app-store/developer/integrations/${id}/apps`);
        } catch (error) {
            console.error('Failed to create project:', error);
        }
    };

    const handleSelectIntegration = (integrationId: string) => {
        history.push(`/app-store/developer/integrations/${integrationId}/apps`);
    };

    // Loading state
    if (isLoadingIntegrations) {
        return (
            <IonPage>
                <AppStoreHeader title="Developer Portal" />

                <IonContent className="ion-padding">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Loader2 className="w-10 h-10 text-cyan-500 mx-auto animate-spin" />
                            <p className="text-sm text-gray-500 mt-3">Loading projects...</p>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    // No integrations - show create first project
    if (integrations.length === 0) {
        return (
            <IonPage>
                <AppStoreHeader title="Developer Portal" />

                <IonContent className="ion-padding">
                    <div className="max-w-2xl mx-auto py-8">
                        {/* Beta Banner */}
                        <div className="mb-6 mx-auto max-w-md">
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-amber-600" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-amber-800">
                                        Developer Portal Beta
                                    </p>
                                    <p className="text-xs text-amber-600">
                                        Early access — features may change
                                    </p>
                                </div>

                                <span className="flex-shrink-0 px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-semibold rounded-full uppercase">
                                    Beta
                                </span>
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-cyan-200">
                                <Rocket className="w-8 h-8 text-white" />
                            </div>

                            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                                Publish Your App
                            </h2>

                            <p className="text-gray-500 max-w-md mx-auto">
                                Share your app with thousands of users. Create a project to get
                                started.
                            </p>
                        </div>

                        <div className="max-w-md mx-auto">
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                Name your first project
                            </label>

                            <div className={`${isMobile ? 'flex-col' : ''} flex gap-2`}>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={e => setNewProjectName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateFirstProject()}
                                    placeholder="e.g. My Awesome Project"
                                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 shadow-sm"
                                    disabled={isCreatingIntegration}
                                />

                                <button
                                    onClick={handleCreateFirstProject}
                                    disabled={!newProjectName.trim() || isCreatingIntegration}
                                    className="px-5 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-200 flex items-center gap-2"
                                >
                                    {isCreatingIntegration ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Get Started
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="text-xs text-gray-400 mt-3 text-center">
                                Free to publish • No coding required
                            </p>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    // Has integrations - show list to select
    return (
        <IonPage>
            <AppStoreHeader title="Developer Portal" />

            <IonContent className="ion-padding">
                <div className="max-w-3xl mx-auto py-6">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Your Projects</h1>
                        <p className="text-gray-500">Select a project to manage its app listings</p>
                    </div>

                    <div className="space-y-3">
                        {integrations.map(integration => {
                            const isActive = (integration.status as string) === 'active';

                            return (
                                <button
                                    key={integration.id}
                                    onClick={() => handleSelectIntegration(integration.id)}
                                    className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50/50 transition-all flex items-center gap-4 text-left group"
                                >
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                            isActive
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-amber-100 text-amber-600'
                                        }`}
                                    >
                                        {isActive ? (
                                            <LayoutDashboard className="w-6 h-6" />
                                        ) : (
                                            <Settings className="w-6 h-6" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-800 group-hover:text-cyan-700 transition-colors">
                                            {integration.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {isActive ? 'Live' : 'In Setup'} •{' '}
                                            {integration.guideType || 'No guide selected'}
                                        </p>
                                    </div>

                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-500 transition-colors" />
                                </button>
                            );
                        })}
                    </div>

                    {/* Create New Project */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={e => setNewProjectName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateFirstProject()}
                                placeholder="New project name..."
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                disabled={isCreatingIntegration}
                            />

                            <button
                                onClick={handleCreateFirstProject}
                                disabled={!newProjectName.trim() || isCreatingIntegration}
                                className="px-4 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isCreatingIntegration ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Code2 className="w-4 h-4" />
                                        Create Project
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default AppsLandingPage;
