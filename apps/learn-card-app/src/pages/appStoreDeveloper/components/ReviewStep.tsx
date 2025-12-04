import React from 'react';
import { CheckCircle2, FileText, Settings, Link2 } from 'lucide-react';

import type { AppStoreListingCreate } from '../types';
import { LAUNCH_TYPE_INFO, CATEGORY_OPTIONS } from '../types';

interface ReviewStepProps {
    data: Partial<AppStoreListingCreate>;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ data }) => {
    const getCategoryLabel = (value?: string) => {
        return CATEGORY_OPTIONS.find(c => c.value === value)?.label || value || 'Not specified';
    };

    const launchTypeInfo = data.launch_type ? LAUNCH_TYPE_INFO[data.launch_type] : null;

    let parsedConfig: Record<string, unknown> = {};

    try {
        parsedConfig = data.launch_config_json ? JSON.parse(data.launch_config_json) : {};
    } catch {
        // Keep empty object
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-3 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>

                <h2 className="text-xl font-semibold text-gray-700">Review Your Submission</h2>

                <p className="text-sm text-gray-500 mt-1">
                    Please review all details before submitting for approval
                </p>
            </div>

            {/* App Preview Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                        {data.icon_url ? (
                            <img
                                src={data.icon_url}
                                alt={data.display_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <FileText className="w-6 h-6" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-700 truncate">
                            {data.display_name || 'Untitled App'}
                        </h3>

                        <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">
                            {data.tagline || 'No tagline provided'}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-500">
                                {getCategoryLabel(data.category)}
                            </span>

                            {launchTypeInfo && (
                                <span className="px-2 py-0.5 bg-cyan-100 rounded-full text-xs font-medium text-cyan-700">
                                    {launchTypeInfo.label}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Sections */}
            <div className="space-y-4">
                {/* Description */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-400" />

                        <h4 className="font-medium text-gray-600 text-sm">Description</h4>
                    </div>

                    <p className="text-sm text-gray-500 whitespace-pre-wrap">
                        {data.full_description || 'No description provided'}
                    </p>
                </div>

                {/* Highlights */}
                {data.highlights && data.highlights.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h4 className="font-medium text-gray-600 text-sm mb-2">Highlights</h4>

                        <ul className="space-y-1">
                            {data.highlights.filter(h => h.trim()).map((highlight, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-500">
                                    <span className="text-emerald-500">•</span>
                                    {highlight}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Launch Configuration */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings className="w-4 h-4 text-gray-400" />

                        <h4 className="font-medium text-gray-600 text-sm">Launch Configuration</h4>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between py-1.5 border-b border-gray-100">
                            <span className="text-sm text-gray-500">Launch Type</span>

                            <span className="text-sm font-medium text-gray-600">
                                {launchTypeInfo?.label || 'Not selected'}
                            </span>
                        </div>

                        {Object.entries(parsedConfig).map(([key, value]) => (
                            <div
                                key={key}
                                className="flex justify-between py-1.5 border-b border-gray-100 last:border-0"
                            >
                                <span className="text-sm text-gray-500">{key}</span>

                                <span className="text-sm font-medium text-gray-600 max-w-[60%] truncate">
                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Additional Links */}
                {(data.privacy_policy_url || data.terms_url) && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Link2 className="w-4 h-4 text-gray-400" />

                            <h4 className="font-medium text-gray-600 text-sm">Additional Links</h4>
                        </div>

                        <div className="space-y-1.5">
                            {data.privacy_policy_url && (
                                <a
                                    href={data.privacy_policy_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-sm text-cyan-600 hover:underline"
                                >
                                    Privacy Policy
                                </a>
                            )}

                            {data.terms_url && (
                                <a
                                    href={data.terms_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-sm text-cyan-600 hover:underline"
                                >
                                    Terms of Service
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Submission Notice */}
            <div className="p-4 bg-gray-100 rounded-xl text-sm text-gray-500 text-center">
                By submitting, your app will be sent for review. You'll be notified once it's
                approved or if changes are required.
            </div>
        </div>
    );
};
