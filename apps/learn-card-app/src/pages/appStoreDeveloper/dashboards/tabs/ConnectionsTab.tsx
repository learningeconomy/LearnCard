import React from 'react';
import { Users } from 'lucide-react';

interface ConnectionsTabProps {
    connections?: unknown[];
}

export const ConnectionsTab: React.FC<ConnectionsTabProps> = ({ connections = [] }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Connected Users</h2>
                <p className="text-sm text-gray-500">Users who have consented to share data with you</p>
            </div>

            <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Connection management coming soon</p>
                <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                    Users who grant consent via your redirect flow will appear here.
                    You can query connected users via the API using{' '}
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">getConsentFlowData()</code>.
                </p>
            </div>
        </div>
    );
};
