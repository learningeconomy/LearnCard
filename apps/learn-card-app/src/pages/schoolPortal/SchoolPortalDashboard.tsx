import React, { useState, useEffect, useCallback } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Link2, Loader2 } from 'lucide-react';

import { ConnectionsSidebar, ConnectionDetail, ConnectExistingModal } from './components';
import { useEdlinkOnboarding } from './hooks';
import { edlinkApi } from './api/client';
import type { LMSConnection, LMSProvider, ConnectionStatus } from './types';

const SchoolPortalDashboard: React.FC = () => {
    const [connections, setConnections] = useState<LMSConnection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedConnection, setSelectedConnection] = useState<LMSConnection | null>(null);
    const [isExistingModalOpen, setIsExistingModalOpen] = useState(false);

    // Fetch connections from backend on mount
    const fetchConnections = useCallback(async () => {
        try {
            const data = await edlinkApi.edlink.getConnections.query();
            // Map backend type to frontend type
            const mapped: LMSConnection[] = data.map(c => ({
                ...c,
                provider: c.provider as LMSProvider,
                status: c.status as ConnectionStatus,
            }));
            setConnections(mapped);
        } catch (error) {
            console.error('Failed to fetch connections:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    const handleConnectionSuccess = async (connection: LMSConnection) => {
        try {
            // Save to backend
            await edlinkApi.edlink.createConnection.mutate({
                id: connection.id,
                integrationId: connection.integrationId,
                sourceId: connection.sourceId,
                accessToken: connection.accessToken || '',
                provider: connection.provider,
                providerName: connection.providerName,
                institutionName: connection.institutionName,
                status: connection.status,
                connectedAt: connection.connectedAt,
            });
            // Refetch to get updated list
            await fetchConnections();
            setSelectedConnection(connection);
        } catch (error) {
            console.error('Failed to save connection:', error);
            // Still update local state for UX
            setConnections(prev => {
                if (prev.some(c => c.id === connection.id)) return prev;
                return [...prev, connection];
            });
            setSelectedConnection(connection);
        }
    };

    const { startOnboarding } = useEdlinkOnboarding({
        onSuccess: handleConnectionSuccess,
        onError: error => {
            console.error('Onboarding failed:', error);
            // TODO: Show error toast/notification
        },
    });

    const handleStatusChange = (connectionId: string, newStatus: LMSConnection['status']) => {
        setConnections(prev =>
            prev.map(c => (c.id === connectionId ? { ...c, status: newStatus } : c))
        );
        // Also update the selected connection if it's the one that changed
        if (selectedConnection?.id === connectionId) {
            setSelectedConnection(prev => (prev ? { ...prev, status: newStatus } : null));
        }
    };

    const handleDeleteConnection = (connectionId: string) => {
        setConnections(prev => prev.filter(c => c.id !== connectionId));
        setSelectedConnection(null);
    };

    return (
        <IonPage>
            <IonContent>
                <div className="flex h-full">
                    {/* Sidebar */}
                    <ConnectionsSidebar
                        connections={connections}
                        selectedConnection={selectedConnection}
                        onSelectConnection={setSelectedConnection}
                        onConnect={startOnboarding}
                        onConnectExisting={() => setIsExistingModalOpen(true)}
                        isHidden={!!selectedConnection}
                    />

                    {/* Detail Panel */}
                    <div className={`flex-1 bg-gray-50 ${!selectedConnection ? 'hidden md:block' : ''}`}>
                        {selectedConnection ? (
                            <ConnectionDetail
                                connection={selectedConnection}
                                onBack={() => setSelectedConnection(null)}
                                onStatusChange={handleStatusChange}
                                onDelete={handleDeleteConnection}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    {isLoading ? (
                                        <Loader2 className="w-14 h-14 text-gray-300 mx-auto mb-3 animate-spin" />
                                    ) : (
                                        <Link2 className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                                    )}
                                    <h3 className="text-base font-medium text-gray-500 mb-1">
                                        {isLoading
                                            ? 'Loading connections...'
                                            : connections.length === 0
                                              ? 'Connect your first LMS'
                                              : 'Select a connection'}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        {isLoading
                                            ? ''
                                            : connections.length === 0
                                              ? 'Click "Connect LMS" to get started with Ed.link'
                                              : 'Choose an LMS connection from the sidebar'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </IonContent>

            {/* Connect Existing Modal */}
            <ConnectExistingModal
                isOpen={isExistingModalOpen}
                onClose={() => setIsExistingModalOpen(false)}
                onConnect={handleConnectionSuccess}
            />
        </IonPage>
    );
};

export default SchoolPortalDashboard;
