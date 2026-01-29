import React from 'react';
import { Inbox, Plus, Link } from 'lucide-react';

import { StatusBadge } from './StatusBadge';
import type { LMSConnection } from '../types';

interface ConnectionsSidebarProps {
    connections: LMSConnection[];
    selectedConnection: LMSConnection | null;
    onSelectConnection: (connection: LMSConnection) => void;
    onConnect: () => void;
    onConnectExisting: () => void;
    isHidden?: boolean;
}

export const ConnectionsSidebar: React.FC<ConnectionsSidebarProps> = ({
    connections,
    selectedConnection,
    onSelectConnection,
    onConnect,
    onConnectExisting,
    isHidden,
}) => {
    return (
        <div
            className={`w-full md:w-80 border-r border-gray-200 bg-white flex flex-col flex-shrink-0 ${
                isHidden ? 'hidden md:flex' : ''
            }`}
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-gray-700">LMS Connections</h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onConnect}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500 text-white hover:bg-cyan-600 transition-colors"
                    >
                        <Plus className="w-3 h-3" />
                        Connect LMS
                    </button>
                    <button
                        onClick={onConnectExisting}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <Link className="w-3 h-3" />
                        Use Existing
                    </button>
                </div>
            </div>

            {/* Connections List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {connections.length === 0 ? (
                    <div className="text-center py-12">
                        <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No connections yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Click "Connect LMS" to get started
                        </p>
                    </div>
                ) : (
                    connections.map(connection => (
                        <button
                            key={connection.id}
                            onClick={() => onSelectConnection(connection)}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${
                                selectedConnection?.id === connection.id
                                    ? 'border-cyan-500 bg-cyan-50 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-bold">C</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-gray-700 text-sm truncate">
                                            {connection.institutionName}
                                        </h4>
                                        <StatusBadge status={connection.status} />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {connection.providerName}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};
