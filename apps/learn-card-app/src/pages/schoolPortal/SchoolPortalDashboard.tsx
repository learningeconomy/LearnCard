import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Link2 } from 'lucide-react';

import { ConnectionsSidebar, ConnectionDetail, ConnectExistingModal } from './components';
import { useEdlinkOnboarding } from './hooks';
import type { LMSConnection } from './types';

// LocalStorage key for persisting connections
const CONNECTIONS_STORAGE_KEY = 'schoolPortal_connections';

const SchoolPortalDashboard: React.FC = () => {
    const [connections, setConnections] = useState<LMSConnection[]>(() => {
        // Load from localStorage on mount
        const stored = localStorage.getItem(CONNECTIONS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    });
    const [selectedConnection, setSelectedConnection] = useState<LMSConnection | null>(null);
    const [isExistingModalOpen, setIsExistingModalOpen] = useState(false);

    // Persist connections to localStorage
    useEffect(() => {
        localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(connections));
    }, [connections]);

    const handleConnectionSuccess = (connection: LMSConnection) => {
        setConnections(prev => {
            // Avoid duplicates
            if (prev.some(c => c.id === connection.id)) {
                return prev;
            }
            return [...prev, connection];
        });
        setSelectedConnection(connection);
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
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <Link2 className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-base font-medium text-gray-500 mb-1">
                                        {connections.length === 0
                                            ? 'Connect your first LMS'
                                            : 'Select a connection'}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        {connections.length === 0
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
