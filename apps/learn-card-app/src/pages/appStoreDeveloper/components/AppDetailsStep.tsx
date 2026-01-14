import React from 'react';
import { Info, Plus, X, Video, Shield, Smartphone, Palette } from 'lucide-react';

import type { AppStoreListingCreate } from '../types';
import { CATEGORY_OPTIONS } from '../types';
import { ImageUpload, ScreenshotUpload } from './ImageUpload';

interface AppDetailsStepProps {
    data: Partial<AppStoreListingCreate>;
    onChange: (data: Partial<AppStoreListingCreate>) => void;
    errors: Record<string, string>;
}

export const AppDetailsStep: React.FC<AppDetailsStepProps> = ({ data, onChange, errors }) => {
    const handleChange = (field: keyof AppStoreListingCreate, value: string) => {
        onChange({ ...data, [field]: value });
    };

    const handleArrayChange = (field: 'highlights' | 'screenshots', values: string[]) => {
        onChange({ ...data, [field]: values });
    };

    const addArrayItem = (field: 'highlights' | 'screenshots') => {
        const currentArray = data[field] || [];
        handleArrayChange(field, [...currentArray, '']);
    };

    const updateArrayItem = (field: 'highlights' | 'screenshots', index: number, value: string) => {
        const currentArray = data[field] || [];
        const newArray = [...currentArray];
        newArray[index] = value;
        handleArrayChange(field, newArray);
    };

    const removeArrayItem = (field: 'highlights' | 'screenshots', index: number) => {
        const currentArray = data[field] || [];
        handleArrayChange(
            field,
            currentArray.filter((_, i) => i !== index)
        );
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-700">App Information</h2>

                <p className="text-sm text-gray-500 mt-1">
                    Tell us about your application. This information will be displayed to users.
                </p>
            </div>

            {/* Icon Upload */}
            <div className="flex flex-col items-center gap-3">
                <label className="text-sm font-medium text-gray-600">App Icon</label>

                <ImageUpload
                    value={data.icon_url}
                    onChange={url => handleChange('icon_url', url)}
                    onRemove={() => handleChange('icon_url', '')}
                    placeholder="Click to upload icon"
                    previewClassName="w-24 h-24 rounded-2xl"
                />

                <p className="text-xs text-gray-400">512×512px recommended</p>

                {errors.icon_url && <p className="text-sm text-red-500">{errors.icon_url}</p>}
            </div>

            {/* Display Name */}
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Display Name</label>

                <input
                    type="text"
                    value={data.display_name || ''}
                    onChange={e => handleChange('display_name', e.target.value)}
                    placeholder="My Amazing App"
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                        errors.display_name ? 'border-red-300' : 'border-gray-200'
                    }`}
                    maxLength={50}
                />

                <div className="flex justify-between mt-1">
                    {errors.display_name ? (
                        <p className="text-sm text-red-500">{errors.display_name}</p>
                    ) : (
                        <span />
                    )}

                    <span className="text-xs text-gray-400">
                        {(data.display_name || '').length}/50
                    </span>
                </div>
            </div>

            {/* Slug */}
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                    App Slug
                    <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>

                <input
                    type="text"
                    value={data.slug || ''}
                    onChange={e =>
                        handleChange(
                            'slug',
                            e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                        )
                    }
                    placeholder="my-amazing-app"
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                        errors.slug ? 'border-red-300' : 'border-gray-200'
                    }`}
                    maxLength={50}
                />

                <p className="text-xs text-gray-400 mt-1">
                    Unique identifier for your app (lowercase, alphanumeric, hyphens). Used for
                    credential issuance.
                </p>

                {errors.slug && <p className="text-sm text-red-500 mt-1">{errors.slug}</p>}
            </div>

            {/* Tagline */}
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Tagline</label>

                <input
                    type="text"
                    value={data.tagline || ''}
                    onChange={e => handleChange('tagline', e.target.value)}
                    placeholder="A short, catchy description of your app"
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                        errors.tagline ? 'border-red-300' : 'border-gray-200'
                    }`}
                    maxLength={100}
                />

                <div className="flex justify-between mt-1">
                    {errors.tagline ? (
                        <p className="text-sm text-red-500">{errors.tagline}</p>
                    ) : (
                        <span />
                    )}

                    <span className="text-xs text-gray-400">{(data.tagline || '').length}/100</span>
                </div>
            </div>

            {/* Full Description */}
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                    Full Description
                </label>

                <textarea
                    value={data.full_description || ''}
                    onChange={e => handleChange('full_description', e.target.value)}
                    placeholder="Describe what your app does, its key features, and how it helps users..."
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 min-h-[120px] resize-y ${
                        errors.full_description ? 'border-red-300' : 'border-gray-200'
                    }`}
                    maxLength={2000}
                />

                <div className="flex justify-between mt-1">
                    {errors.full_description ? (
                        <p className="text-sm text-red-500">{errors.full_description}</p>
                    ) : (
                        <span />
                    )}

                    <span className="text-xs text-gray-400">
                        {(data.full_description || '').length}/2000
                    </span>
                </div>
            </div>

            {/* Category */}
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>

                <select
                    value={data.category || ''}
                    onChange={e => handleChange('category', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                    <option value="">Select a category</option>

                    {CATEGORY_OPTIONS.map(cat => (
                        <option key={cat.value} value={cat.value}>
                            {cat.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Hero Background Color */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Palette className="w-4 h-4 text-gray-400" />

                    <label className="text-sm font-medium text-gray-600">
                        Listing Background Color
                    </label>

                    <span className="text-xs text-gray-400">(optional)</span>
                </div>

                <p className="text-xs text-gray-400 mb-2">
                    Choose a background color for your app's detail page
                </p>

                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        value={data.hero_background_color || '#00BA88'}
                        onChange={e => handleChange('hero_background_color', e.target.value)}
                        className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-white"
                        style={{ WebkitAppearance: 'none' }}
                    />

                    <input
                        type="text"
                        value={data.hero_background_color || ''}
                        onChange={e => handleChange('hero_background_color', e.target.value)}
                        placeholder="#00BA88"
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono"
                        maxLength={7}
                    />

                    {data.hero_background_color && (
                        <button
                            type="button"
                            onClick={() => handleChange('hero_background_color', '')}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {data.hero_background_color && (
                    <div
                        className="mt-2 h-8 rounded-lg border border-gray-200"
                        style={{ backgroundColor: data.hero_background_color }}
                    />
                )}
            </div>

            {/* Highlights */}
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Highlights</label>

                <p className="text-xs text-gray-400 mb-2">
                    Add key benefits or reasons to use your app (displayed as bullet points)
                </p>

                <div className="space-y-2">
                    {(data.highlights || []).map((highlight, index) => (
                        <div key={index} className="flex gap-2">
                            <input
                                type="text"
                                value={highlight}
                                onChange={e => updateArrayItem('highlights', index, e.target.value)}
                                placeholder="e.g., All your learning stored in one place"
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                maxLength={200}
                            />

                            <button
                                type="button"
                                onClick={() => removeArrayItem('highlights', index)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>

                {(data.highlights?.length || 0) < 5 && (
                    <button
                        type="button"
                        onClick={() => addArrayItem('highlights')}
                        className="mt-2 flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add highlight
                    </button>
                )}
            </div>

            {/* Screenshots */}
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Screenshots</label>

                <p className="text-xs text-gray-400 mb-2">
                    Upload or paste screenshot URLs (392×696 recommended, 9:16 aspect ratio)
                </p>

                <div className="space-y-3">
                    {(data.screenshots || []).map((screenshot, index) => (
                        <ScreenshotUpload
                            key={index}
                            value={screenshot}
                            onChange={url => updateArrayItem('screenshots', index, url)}
                            onRemove={() => removeArrayItem('screenshots', index)}
                            index={index}
                        />
                    ))}
                </div>

                {(data.screenshots?.length || 0) < 10 && (
                    <button
                        type="button"
                        onClick={() => addArrayItem('screenshots')}
                        className="mt-3 flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add screenshot
                    </button>
                )}
            </div>

            {/* Promo Video */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Video className="w-4 h-4 text-gray-400" />

                    <label className="text-sm font-medium text-gray-600">Promo Video URL</label>

                    <span className="text-xs text-gray-400">(optional)</span>
                </div>

                <input
                    type="url"
                    value={data.promo_video_url || ''}
                    onChange={e => handleChange('promo_video_url', e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
            </div>

            {/* Legal Links */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-gray-400" />

                    <label className="text-sm font-medium text-gray-600">Legal &amp; Privacy</label>

                    <span className="text-xs text-gray-400">(optional)</span>
                </div>

                <div className="space-y-3">
                    <input
                        type="url"
                        value={data.privacy_policy_url || ''}
                        onChange={e => handleChange('privacy_policy_url', e.target.value)}
                        placeholder="Privacy Policy URL"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />

                    <input
                        type="url"
                        value={data.terms_url || ''}
                        onChange={e => handleChange('terms_url', e.target.value)}
                        placeholder="Terms of Service URL"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                </div>
            </div>

            {/* App Store IDs */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-gray-400" />

                    <label className="text-sm font-medium text-gray-600">
                        Native App Store Links
                    </label>

                    <span className="text-xs text-gray-400">(optional)</span>
                </div>

                <div className="space-y-3">
                    <input
                        type="text"
                        value={data.ios_app_store_id || ''}
                        onChange={e => handleChange('ios_app_store_id', e.target.value)}
                        placeholder="iOS App Store ID (e.g., 123456789)"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />

                    <input
                        type="text"
                        value={data.android_app_store_id || ''}
                        onChange={e => handleChange('android_app_store_id', e.target.value)}
                        placeholder="Android Package Name (e.g., com.example.app)"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                </div>
            </div>

            {/* Info box */}
            <div className="flex gap-3 p-4 bg-cyan-50 rounded-xl border border-cyan-100">
                <Info className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />

                <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-700 mb-1">Tips for a great listing</p>

                    <ul className="space-y-1 text-xs">
                        <li>• Use a clear, recognizable app icon (512x512px recommended)</li>

                        <li>• Keep your tagline concise and action-oriented</li>

                        <li>• Highlight key features and benefits in your description</li>

                        <li>• Add 3-5 highlights explaining your app's value</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
