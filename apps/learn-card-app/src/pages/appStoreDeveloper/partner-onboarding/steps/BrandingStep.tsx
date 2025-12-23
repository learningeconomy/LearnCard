import React, { useState, useRef } from 'react';
import {
    Palette,
    Upload,
    Image as ImageIcon,
    ArrowRight,
    ArrowLeft,
    Building2,
    FileText,
    Loader2,
    X,
} from 'lucide-react';

import { useFilestack } from 'learn-card-base';

import { BrandingConfig } from '../types';

interface BrandingStepProps {
    branding: BrandingConfig | null;
    onComplete: (branding: BrandingConfig) => void;
    onBack: () => void;
}

const DEFAULT_COLORS = [
    { name: 'Blue', primary: '#3B82F6', secondary: '#DBEAFE' },
    { name: 'Violet', primary: '#8B5CF6', secondary: '#EDE9FE' },
    { name: 'Emerald', primary: '#10B981', secondary: '#D1FAE5' },
    { name: 'Rose', primary: '#F43F5E', secondary: '#FFE4E6' },
    { name: 'Amber', primary: '#F59E0B', secondary: '#FEF3C7' },
    { name: 'Cyan', primary: '#06B6D4', secondary: '#CFFAFE' },
];

export const BrandingStep: React.FC<BrandingStepProps> = ({ branding, onComplete, onBack }) => {
    const [config, setConfig] = useState<BrandingConfig>(branding || {
        logoUrl: '',
        primaryColor: '#3B82F6',
        secondaryColor: '#DBEAFE',
        issuerName: '',
        issuerDescription: '',
    });

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { handleFileSelect: handleLogoUpload } = useFilestack({
        onUpload: (url: string) => {
            setConfig(prev => ({ ...prev, logoUrl: url }));
            setIsUploading(false);
        },
        fileType: 'image/*',
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            // Trigger the file picker with a synthetic click event
            handleLogoUpload(e as unknown as React.MouseEvent);
        }
    };

    const handleColorSelect = (primary: string, secondary: string) => {
        setConfig(prev => ({ ...prev, primaryColor: primary, secondaryColor: secondary }));
    };

    const canProceed = config.issuerName.trim() && config.primaryColor;

    return (
        <div className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-pink-600" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">Organization Logo</h3>
                        <p className="text-sm text-gray-500">This will appear on credentials you issue</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    {config.logoUrl ? (
                        <div className="relative">
                            <img
                                src={config.logoUrl}
                                alt="Logo preview"
                                className="w-24 h-24 object-contain bg-white border border-gray-200 rounded-xl"
                            />

                            <button
                                onClick={() => setConfig(prev => ({ ...prev, logoUrl: '' }))}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-cyan-400 hover:text-cyan-500 transition-colors"
                        >
                            {isUploading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <Upload className="w-6 h-6" />
                                    <span className="text-xs">Upload</span>
                                </>
                            )}
                        </button>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <div className="flex-1 text-sm text-gray-500">
                        <p>Recommended: Square image, at least 256x256px</p>
                        <p>Formats: PNG, JPG, SVG</p>
                    </div>
                </div>
            </div>

            {/* Brand Colors */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                        <Palette className="w-5 h-5 text-violet-600" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">Brand Colors</h3>
                        <p className="text-sm text-gray-500">Choose colors that match your brand</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {DEFAULT_COLORS.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => handleColorSelect(color.primary, color.secondary)}
                            className={`p-3 rounded-xl border-2 transition-all ${
                                config.primaryColor === color.primary
                                    ? 'border-gray-900 shadow-md'
                                    : 'border-transparent hover:border-gray-300'
                            }`}
                        >
                            <div
                                className="w-full h-8 rounded-lg mb-2"
                                style={{ backgroundColor: color.primary }}
                            />

                            <span className="text-xs text-gray-600">{color.name}</span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Primary Color</label>

                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={config.primaryColor}
                                onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                                className="w-10 h-10 rounded cursor-pointer"
                            />

                            <input
                                type="text"
                                value={config.primaryColor}
                                onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Secondary Color</label>

                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={config.secondaryColor}
                                onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                className="w-10 h-10 rounded cursor-pointer"
                            />

                            <input
                                type="text"
                                value={config.secondaryColor}
                                onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Issuer Profile */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">Issuer Profile</h3>
                        <p className="text-sm text-gray-500">How your organization appears on credentials</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Issuer Name <span className="text-red-500">*</span>
                        </label>

                        <input
                            type="text"
                            value={config.issuerName}
                            onChange={(e) => setConfig(prev => ({ ...prev, issuerName: e.target.value }))}
                            placeholder="e.g., AARP Skills Builder"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>

                        <textarea
                            value={config.issuerDescription}
                            onChange={(e) => setConfig(prev => ({ ...prev, issuerDescription: e.target.value }))}
                            placeholder="Brief description of your organization..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-3">Preview</p>

                <div
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: config.secondaryColor }}
                >
                    <div className="flex items-center gap-3">
                        {config.logoUrl ? (
                            <img
                                src={config.logoUrl}
                                alt="Logo"
                                className="w-12 h-12 object-contain rounded-lg bg-white"
                            />
                        ) : (
                            <div
                                className="w-12 h-12 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: config.primaryColor }}
                            >
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                        )}

                        <div>
                            <p className="font-semibold text-gray-800">
                                {config.issuerName || 'Your Organization'}
                            </p>

                            <p className="text-sm text-gray-600">
                                {config.issuerDescription || 'Organization description'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

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
                    onClick={() => canProceed && onComplete(config)}
                    disabled={!canProceed}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Continue to Templates
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
