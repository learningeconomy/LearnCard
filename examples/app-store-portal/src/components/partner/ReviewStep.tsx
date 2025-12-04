import React from 'react';
import { CheckCircle2, FileText, Settings, Link2 } from 'lucide-react';
import type { AppStoreListingCreate } from '../../types/app-store';
import { LAUNCH_TYPE_INFO, CATEGORY_OPTIONS } from '../../types/app-store';

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
        <div className="space-y-8 animate-fade-in">
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>

                <h2 className="section-title">Review Your Submission</h2>

                <p className="section-subtitle mt-2">
                    Please review all details before submitting for approval
                </p>
            </div>

            {/* App Preview Card */}
            <div className="card-elevated">
                <div className="flex items-start gap-5">
                    <div className="w-20 h-20 rounded-apple-lg bg-apple-gray-100 overflow-hidden flex-shrink-0">
                        {data.icon_url ? (
                            <img
                                src={data.icon_url}
                                alt={data.display_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-apple-gray-400">
                                <FileText className="w-8 h-8" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-apple-gray-600 truncate">
                            {data.display_name || 'Untitled App'}
                        </h3>

                        <p className="text-apple-gray-500 mt-1 line-clamp-2">
                            {data.tagline || 'No tagline provided'}
                        </p>

                        <div className="flex items-center gap-3 mt-3">
                            <span className="px-2.5 py-1 bg-apple-gray-100 rounded-full text-xs font-medium text-apple-gray-500">
                                {getCategoryLabel(data.category)}
                            </span>

                            {launchTypeInfo && (
                                <span className="px-2.5 py-1 bg-apple-blue/10 rounded-full text-xs font-medium text-apple-blue">
                                    {launchTypeInfo.label}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Sections */}
            <div className="grid gap-6">
                {/* Description */}
                <div className="card">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-apple-gray-400" />
                        <h4 className="font-medium text-apple-gray-600">Description</h4>
                    </div>

                    <p className="text-sm text-apple-gray-500 whitespace-pre-wrap">
                        {data.full_description || 'No description provided'}
                    </p>
                </div>

                {/* Launch Configuration */}
                <div className="card">
                    <div className="flex items-center gap-2 mb-3">
                        <Settings className="w-4 h-4 text-apple-gray-400" />
                        <h4 className="font-medium text-apple-gray-600">Launch Configuration</h4>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-apple-gray-100">
                            <span className="text-sm text-apple-gray-500">Launch Type</span>

                            <span className="text-sm font-medium text-apple-gray-600">
                                {launchTypeInfo?.label || 'Not selected'}
                            </span>
                        </div>

                        {Object.entries(parsedConfig).map(([key, value]) => (
                            <div
                                key={key}
                                className="flex justify-between py-2 border-b border-apple-gray-100 last:border-0"
                            >
                                <span className="text-sm text-apple-gray-500">{key}</span>

                                <span className="text-sm font-medium text-apple-gray-600 max-w-[60%] truncate">
                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Additional Links */}
                {(data.privacy_policy_url || data.terms_url) && (
                    <div className="card">
                        <div className="flex items-center gap-2 mb-3">
                            <Link2 className="w-4 h-4 text-apple-gray-400" />
                            <h4 className="font-medium text-apple-gray-600">Additional Links</h4>
                        </div>

                        <div className="space-y-2">
                            {data.privacy_policy_url && (
                                <a
                                    href={data.privacy_policy_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-sm text-apple-blue hover:underline"
                                >
                                    Privacy Policy
                                </a>
                            )}

                            {data.terms_url && (
                                <a
                                    href={data.terms_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-sm text-apple-blue hover:underline"
                                >
                                    Terms of Service
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Submission Notice */}
            <div className="p-4 bg-apple-gray-100 rounded-apple text-sm text-apple-gray-500 text-center">
                By submitting, your app will be sent for review. You'll be notified once it's
                approved or if changes are required.
            </div>
        </div>
    );
};
