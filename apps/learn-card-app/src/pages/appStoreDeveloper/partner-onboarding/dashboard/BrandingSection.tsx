import React, { useState, useRef } from 'react';
import {
    Save,
    Loader2,
    Palette,
    Image as ImageIcon,
    User,
    FileText,
    Upload,
    CheckCircle2,
} from 'lucide-react';

import { useWallet, useFilestack } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

import { BrandingConfig, ProfileDisplay } from '../types';

const DEFAULT_WALLPAPERS = [
    'https://cdn.filestackcontent.com/DbOxscSWQsC5roJK7FH6',
    'https://cdn.filestackcontent.com/ohKxz345R6m4jupj9Ny5',
    'https://cdn.filestackcontent.com/EnAa9K5pRnO4NYe1I0dC',
];

interface BrandingSectionProps {
    branding: BrandingConfig | null;
    onUpdate: (branding: BrandingConfig) => void;
}

export const BrandingSection: React.FC<BrandingSectionProps> = ({
    branding,
    onUpdate,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const [formData, setFormData] = useState<BrandingConfig>({
        displayName: branding?.displayName || '',
        image: branding?.image || '',
        shortBio: branding?.shortBio || '',
        bio: branding?.bio || '',
        display: branding?.display || {},
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const handleChange = (field: keyof BrandingConfig, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleDisplayChange = (field: keyof ProfileDisplay, value: string) => {
        setFormData(prev => ({
            ...prev,
            display: { ...prev.display, [field]: value },
        }));
        setIsDirty(true);
    };

    const { handleFileSelect: handleLogoUpload, isLoading: isUploadingLogo } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => {
            if (data?.url) {
                handleChange('image', data.url);
            }
        },
    });

    const { handleFileSelect: handleBackgroundUpload, isLoading: isUploadingBackground } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => {
            if (data?.url) {
                handleDisplayChange('backgroundImage', data.url);
            }
        },
    });

    const handleSave = async () => {
        setIsSaving(true);

        try {
            const wallet = await initWalletRef.current();

            await wallet.invoke.updateProfile({
                displayName: formData.displayName,
                image: formData.image,
                shortBio: formData.shortBio,
                bio: formData.bio,
                display: formData.display,
            } as Parameters<typeof wallet.invoke.updateProfile>[0]);

            onUpdate(formData);
            setIsDirty(false);

            presentToast('Branding saved successfully!', { type: ToastTypeEnum.Success, hasDismissButton: true });
        } catch (err) {
            console.error('Failed to save branding:', err);
            presentToast('Failed to save branding', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Branding & Profile</h2>
                    <p className="text-sm text-gray-500">Customize how your organization appears to credential recipients</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving || !isDirty}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Info */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                        <User className="w-5 h-5 text-gray-500" />
                        <h3 className="font-medium text-gray-700">Organization Profile</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => handleChange('displayName', e.target.value)}
                                placeholder="Your Organization"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                            <div className="flex items-center gap-4">
                                {formData.image ? (
                                    <img
                                        src={formData.image}
                                        alt="Logo"
                                        className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                                        <ImageIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                )}

                                <button
                                    onClick={handleLogoUpload}
                                    disabled={isUploadingLogo}
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                                >
                                    {isUploadingLogo ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Upload className="w-4 h-4" />
                                    )}
                                    Upload Logo
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Short Bio</label>
                            <input
                                type="text"
                                value={formData.shortBio}
                                onChange={(e) => handleChange('shortBio', e.target.value)}
                                placeholder="A brief description of your organization"
                                maxLength={140}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">{formData.shortBio.length}/140 characters</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Bio</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => handleChange('bio', e.target.value)}
                                placeholder="Tell recipients more about your organization..."
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Card Styling */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                        <Palette className="w-5 h-5 text-gray-500" />
                        <h3 className="font-medium text-gray-700">Card Styling</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={formData.display.backgroundColor || '#1e293b'}
                                    onChange={(e) => handleDisplayChange('backgroundColor', e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                                />
                                <input
                                    type="text"
                                    value={formData.display.backgroundColor || '#1e293b'}
                                    onChange={(e) => handleDisplayChange('backgroundColor', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={formData.display.accentColor || '#06b6d4'}
                                    onChange={(e) => handleDisplayChange('accentColor', e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                                />
                                <input
                                    type="text"
                                    value={formData.display.accentColor || '#06b6d4'}
                                    onChange={(e) => handleDisplayChange('accentColor', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Background Image</label>

                            <div className="space-y-3">
                                <div className="grid grid-cols-4 gap-2">
                                    {DEFAULT_WALLPAPERS.map((url, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleDisplayChange('backgroundImage', url)}
                                            className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                                                formData.display.backgroundImage === url
                                                    ? 'border-cyan-500 ring-2 ring-cyan-200'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <img src={url} alt={`Wallpaper ${idx + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}

                                    <button
                                        onClick={handleBackgroundUpload}
                                        disabled={isUploadingBackground}
                                        className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                                    >
                                        {isUploadingBackground ? (
                                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                        ) : (
                                            <Upload className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>

                                {formData.display.backgroundImage && !DEFAULT_WALLPAPERS.includes(formData.display.backgroundImage) && (
                                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Custom background applied
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Preview Card */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                        <div
                            className="relative h-32 rounded-xl overflow-hidden"
                            style={{
                                backgroundColor: formData.display.backgroundColor || '#1e293b',
                                backgroundImage: formData.display.backgroundImage ? `url(${formData.display.backgroundImage})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                            <div className="absolute bottom-3 left-3 flex items-center gap-3">
                                {formData.image ? (
                                    <img src={formData.image} alt="" className="w-10 h-10 rounded-lg object-cover border-2 border-white/30" />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                )}

                                <div>
                                    <p className="text-white font-medium text-sm">
                                        {formData.displayName || 'Organization Name'}
                                    </p>
                                    <p className="text-white/70 text-xs">Issuer</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
