import React, { useState } from 'react';
import {
    Webhook,
    Code,
    FileSpreadsheet,
    ArrowRight,
    ArrowLeft,
    Check,
    Zap,
    Shield,
    Clock,
} from 'lucide-react';

import { IntegrationMethod } from '../types';

interface IntegrationMethodStepProps {
    selectedMethod: IntegrationMethod | null;
    onComplete: (method: IntegrationMethod) => void;
    onBack: () => void;
}

interface MethodOption {
    id: IntegrationMethod;
    title: string;
    subtitle: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    color: string;
    bgColor: string;
    features: string[];
    recommended?: boolean;
    comingSoon?: boolean;
}

const METHODS: MethodOption[] = [
    {
        id: 'api',
        title: 'REST API',
        subtitle: 'Full control',
        description: 'Call our API directly from your backend code when you want to issue credentials.',
        icon: Code,
        color: 'text-violet-600',
        bgColor: 'bg-violet-100',
        features: [
            'Complete programmatic control',
            'Custom business logic',
            'Batch operations supported',
            'SDK available for Node.js',
        ],
        recommended: true,
    },
    {
        id: 'csv',
        title: 'CSV Upload',
        subtitle: 'Simple batch import',
        description: 'Upload a spreadsheet of completions and we\'ll issue credentials in bulk.',
        icon: FileSpreadsheet,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        features: [
            'No technical integration needed',
            'Great for initial migration',
            'Scheduled uploads supported',
            'Template download available',
        ],
    },
    {
        id: 'webhook',
        title: 'Webhook Integration',
        subtitle: 'Real-time, automated',
        description: 'Your external system sends events to LearnCard when courses are completed. Credentials are issued automatically.',
        icon: Webhook,
        color: 'text-gray-400',
        bgColor: 'bg-gray-100',
        features: [
            'Real-time credential issuance',
            'No manual intervention needed',
            'Works with most platforms',
            'Visual field mapping tool',
        ],
        comingSoon: true,
    },
];

export const IntegrationMethodStep: React.FC<IntegrationMethodStepProps> = ({
    selectedMethod,
    onComplete,
    onBack,
}) => {
    const [selected, setSelected] = useState<IntegrationMethod | null>(selectedMethod);

    return (
        <div className="space-y-6">
            {/* Info */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

                <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Choose Your Integration Method</p>
                    <p>
                        How will your system communicate with LearnCard? We recommend the REST API for 
                        full programmatic control over credential issuance.
                    </p>
                </div>
            </div>

            {/* Method Cards */}
            <div className="space-y-4">
                {METHODS.map((method) => {
                    const Icon = method.icon;
                    const isSelected = selected === method.id;

                    return (
                        <button
                            key={method.id}
                            onClick={() => !method.comingSoon && setSelected(method.id)}
                            disabled={method.comingSoon}
                            className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                                method.comingSoon
                                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                    : isSelected
                                        ? 'border-cyan-500 bg-cyan-50 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 ${method.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                    <Icon className={`w-6 h-6 ${method.color}`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className={`font-semibold ${method.comingSoon ? 'text-gray-500' : 'text-gray-800'}`}>{method.title}</h3>

                                        {method.recommended && (
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                                Recommended
                                            </span>
                                        )}

                                        {method.comingSoon && (
                                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                                                Coming Soon
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-gray-500 mb-2">{method.subtitle}</p>

                                    <p className={`text-sm mb-3 ${method.comingSoon ? 'text-gray-400' : 'text-gray-600'}`}>{method.description}</p>

                                    <div className="flex flex-wrap gap-2">
                                        {method.features.map((feature, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                                            >
                                                <Check className="w-3 h-3" />
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    isSelected
                                        ? 'border-cyan-500 bg-cyan-500'
                                        : 'border-gray-300'
                                }`}>
                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Selected Method Details */}
            {selected && (
                <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-800 mb-2">Next Steps</h4>

                    {selected === 'webhook' && (
                        <p className="text-sm text-gray-600">
                            We'll provide you with a webhook URL to configure in your external system. When a course is completed, 
                            your external system will send an event to this URL, and we'll map the data to your credential template.
                        </p>
                    )}

                    {selected === 'api' && (
                        <p className="text-sm text-gray-600">
                            You'll receive API documentation and code samples for calling our credential issuance endpoint. 
                            Use your API key from Step 1 to authenticate requests.
                        </p>
                    )}

                    {selected === 'csv' && (
                        <p className="text-sm text-gray-600">
                            We'll provide a CSV template with the fields from your credential templates. 
                            Upload completed spreadsheets to issue credentials in bulk.
                        </p>
                    )}
                </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={() => selected && onComplete(selected)}
                    disabled={!selected}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Continue to Data Mapping
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
