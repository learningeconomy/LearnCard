import React, { useState } from 'react';
import { X } from 'lucide-react';

import type { LMSConnection, LMSProvider } from '../types';

interface ConnectExistingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect: (connection: LMSConnection) => void;
}

const PROVIDER_OPTIONS: { value: LMSProvider; label: string }[] = [
    { value: 'canvas', label: 'Canvas' },
    { value: 'google', label: 'Google Classroom' },
    { value: 'schoology', label: 'Schoology' },
    { value: 'blackboard', label: 'Blackboard' },
    { value: 'moodle', label: 'Moodle' },
    { value: 'brightspace', label: 'Brightspace' },
    { value: 'other', label: 'Other' },
];

export const ConnectExistingModal: React.FC<ConnectExistingModalProps> = ({
    isOpen,
    onClose,
    onConnect,
}) => {
    const [formData, setFormData] = useState({
        integrationId: '',
        accessToken: '',
        sourceId: '',
        sourceName: '',
        provider: 'canvas' as LMSProvider,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const connection: LMSConnection = {
            id: formData.integrationId,
            integrationId: formData.integrationId,
            sourceId: formData.sourceId,
            provider: formData.provider,
            providerName: PROVIDER_OPTIONS.find(p => p.value === formData.provider)?.label || 'LMS',
            institutionName: formData.sourceName,
            status: 'CONNECTED',
            connectedAt: new Date().toISOString(),
            accessToken: formData.accessToken,
        };

        onConnect(connection);
        onClose();

        // Reset form
        setFormData({
            integrationId: '',
            accessToken: '',
            sourceId: '',
            sourceName: '',
            provider: 'canvas',
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Connect Existing Integration
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Integration ID
                        </label>
                        <input
                            type="text"
                            value={formData.integrationId}
                            onChange={e => setFormData(prev => ({ ...prev, integrationId: e.target.value }))}
                            placeholder="d2c73d36-c3e1-4a82-b9b9-b0644ca0df98"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Access Token
                        </label>
                        <input
                            type="text"
                            value={formData.accessToken}
                            onChange={e => setFormData(prev => ({ ...prev, accessToken: e.target.value }))}
                            placeholder="Enter your integration access token"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Source ID
                        </label>
                        <input
                            type="text"
                            value={formData.sourceId}
                            onChange={e => setFormData(prev => ({ ...prev, sourceId: e.target.value }))}
                            placeholder="12feb383-7455-4a3e-8da9-0851d77779cc"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Source Name
                        </label>
                        <input
                            type="text"
                            value={formData.sourceName}
                            onChange={e => setFormData(prev => ({ ...prev, sourceName: e.target.value }))}
                            placeholder="Canvas Sample Source"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Provider
                        </label>
                        <select
                            value={formData.provider}
                            onChange={e => setFormData(prev => ({ ...prev, provider: e.target.value as LMSProvider }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        >
                            {PROVIDER_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-cyan-500 rounded-lg hover:bg-cyan-600 transition-colors"
                        >
                            Connect
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
