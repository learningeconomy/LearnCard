import React from 'react';
import { Info, Plus, X, Video, Shield, Smartphone } from 'lucide-react';
import type { AppStoreListingCreate } from '../../types/app-store';
import { CATEGORY_OPTIONS } from '../../types/app-store';
import { ImageUpload, ScreenshotUpload } from '../ui/ImageUpload';

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
        handleArrayChange(field, currentArray.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="section-title">App Information</h2>

                <p className="section-subtitle mt-2">
                    Tell us about your application. This information will be displayed to users.
                </p>
            </div>

            {/* Icon Upload */}
            <div className="flex flex-col items-center gap-4">
                <label className="label">App Icon</label>

                <ImageUpload
                    value={data.icon_url}
                    onChange={url => handleChange('icon_url', url)}
                    onRemove={() => handleChange('icon_url', '')}
                    placeholder="Click to upload icon"
                    previewClassName="w-24 h-24 rounded-apple-xl"
                />

                <p className="text-xs text-apple-gray-400">512×512px recommended</p>

                {errors.icon_url && (
                    <p className="text-sm text-red-500">{errors.icon_url}</p>
                )}
            </div>

            {/* Display Name */}
            <div>
                <label className="label">Display Name</label>

                <input
                    type="text"
                    value={data.display_name || ''}
                    onChange={e => handleChange('display_name', e.target.value)}
                    placeholder="My Amazing App"
                    className={`input ${errors.display_name ? 'input-error' : ''}`}
                    maxLength={50}
                />

                <div className="flex justify-between mt-1">
                    {errors.display_name ? (
                        <p className="text-sm text-red-500">{errors.display_name}</p>
                    ) : (
                        <span />
                    )}

                    <span className="text-xs text-apple-gray-400">
                        {(data.display_name || '').length}/50
                    </span>
                </div>
            </div>

            {/* Tagline */}
            <div>
                <label className="label">Tagline</label>

                <input
                    type="text"
                    value={data.tagline || ''}
                    onChange={e => handleChange('tagline', e.target.value)}
                    placeholder="A short, catchy description of your app"
                    className={`input ${errors.tagline ? 'input-error' : ''}`}
                    maxLength={100}
                />

                <div className="flex justify-between mt-1">
                    {errors.tagline ? (
                        <p className="text-sm text-red-500">{errors.tagline}</p>
                    ) : (
                        <span />
                    )}

                    <span className="text-xs text-apple-gray-400">
                        {(data.tagline || '').length}/100
                    </span>
                </div>
            </div>

            {/* Full Description */}
            <div>
                <label className="label">Full Description</label>

                <textarea
                    value={data.full_description || ''}
                    onChange={e => handleChange('full_description', e.target.value)}
                    placeholder="Describe what your app does, its key features, and how it helps users..."
                    className={`input min-h-[150px] resize-y ${errors.full_description ? 'input-error' : ''}`}
                    maxLength={2000}
                />

                <div className="flex justify-between mt-1">
                    {errors.full_description ? (
                        <p className="text-sm text-red-500">{errors.full_description}</p>
                    ) : (
                        <span />
                    )}

                    <span className="text-xs text-apple-gray-400">
                        {(data.full_description || '').length}/2000
                    </span>
                </div>
            </div>

            {/* Category */}
            <div>
                <label className="label">Category</label>

                <select
                    value={data.category || ''}
                    onChange={e => handleChange('category', e.target.value)}
                    className="input appearance-none cursor-pointer"
                >
                    <option value="">Select a category</option>

                    {CATEGORY_OPTIONS.map(cat => (
                        <option key={cat.value} value={cat.value}>
                            {cat.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Highlights */}
            <div>
                <label className="label">Highlights</label>

                <p className="text-xs text-apple-gray-400 mb-3">
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
                                className="input flex-1"
                                maxLength={200}
                            />

                            <button
                                type="button"
                                onClick={() => removeArrayItem('highlights', index)}
                                className="p-2 text-apple-gray-400 hover:text-red-500 transition-colors"
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
                        className="mt-2 flex items-center gap-2 text-sm text-apple-blue hover:text-apple-blue/80 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add highlight
                    </button>
                )}
            </div>

            {/* Screenshots */}
            <div>
                <label className="label">Screenshots</label>

                <p className="text-xs text-apple-gray-400 mb-3">
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
                        className="mt-2 flex items-center gap-2 text-sm text-apple-blue hover:text-apple-blue/80 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add screenshot
                    </button>
                )}
            </div>

            {/* Promo Video */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Video className="w-4 h-4 text-apple-gray-400" />

                    <label className="label mb-0">Promo Video URL</label>

                    <span className="text-xs text-apple-gray-400">(optional)</span>
                </div>

                <input
                    type="url"
                    value={data.promo_video_url || ''}
                    onChange={e => handleChange('promo_video_url', e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="input"
                />

                <p className="text-xs text-apple-gray-400 mt-1">
                    Add a YouTube or Vimeo video URL showcasing your app
                </p>
            </div>

            {/* Legal Links */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-apple-gray-400" />

                    <label className="label mb-0">Legal &amp; Privacy</label>

                    <span className="text-xs text-apple-gray-400">(optional)</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-apple-gray-500 mb-1 block">
                            Privacy Policy URL
                        </label>

                        <input
                            type="url"
                            value={data.privacy_policy_url || ''}
                            onChange={e => handleChange('privacy_policy_url', e.target.value)}
                            placeholder="https://example.com/privacy"
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-apple-gray-500 mb-1 block">
                            Terms of Service URL
                        </label>

                        <input
                            type="url"
                            value={data.terms_url || ''}
                            onChange={e => handleChange('terms_url', e.target.value)}
                            placeholder="https://example.com/terms"
                            className="input"
                        />
                    </div>
                </div>
            </div>

            {/* App Store IDs */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Smartphone className="w-4 h-4 text-apple-gray-400" />

                    <label className="label mb-0">Native App Store Links</label>

                    <span className="text-xs text-apple-gray-400">(optional)</span>
                </div>

                <p className="text-xs text-apple-gray-400 mb-3">
                    If you have native mobile apps, provide their store IDs for cross-linking
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-apple-gray-500 mb-1 block">
                            iOS App Store ID
                        </label>

                        <input
                            type="text"
                            value={data.ios_app_store_id || ''}
                            onChange={e => handleChange('ios_app_store_id', e.target.value)}
                            placeholder="e.g., 123456789"
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-apple-gray-500 mb-1 block">
                            Android Package Name / Play Store ID
                        </label>

                        <input
                            type="text"
                            value={data.android_app_store_id || ''}
                            onChange={e => handleChange('android_app_store_id', e.target.value)}
                            placeholder="e.g., com.example.myapp"
                            className="input"
                        />
                    </div>
                </div>
            </div>

            {/* Info box */}
            <div className="flex gap-3 p-4 bg-apple-blue/5 rounded-apple border border-apple-blue/10">
                <Info className="w-5 h-5 text-apple-blue flex-shrink-0 mt-0.5" />

                <div className="text-sm text-apple-gray-500">
                    <p className="font-medium text-apple-gray-600 mb-1">Tips for a great listing</p>

                    <ul className="space-y-1">
                        <li>• Use a clear, recognizable app icon (512x512px recommended)</li>
                        <li>• Keep your tagline concise and action-oriented</li>
                        <li>• Highlight key features and benefits in your description</li>
                        <li>• Add 3-5 highlights explaining your app's value</li>
                        <li>• Include screenshots to showcase your app's interface</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
