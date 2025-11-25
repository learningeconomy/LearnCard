import React from 'react';
import { Image, Info } from 'lucide-react';
import type { AppStoreListingCreate } from '../../types/app-store';
import { CATEGORY_OPTIONS } from '../../types/app-store';

interface AppDetailsStepProps {
    data: Partial<AppStoreListingCreate>;
    onChange: (data: Partial<AppStoreListingCreate>) => void;
    errors: Record<string, string>;
}

export const AppDetailsStep: React.FC<AppDetailsStepProps> = ({ data, onChange, errors }) => {
    const handleChange = (field: keyof AppStoreListingCreate, value: string) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="section-title">App Information</h2>

                <p className="section-subtitle mt-2">
                    Tell us about your application. This information will be displayed to users.
                </p>
            </div>

            {/* Icon Preview */}
            <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-apple-xl bg-apple-gray-100 border-2 border-dashed border-apple-gray-300 flex items-center justify-center overflow-hidden">
                    {data.icon_url ? (
                        <img
                            src={data.icon_url}
                            alt="App icon"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Image className="w-8 h-8 text-apple-gray-400" />
                    )}
                </div>

                <div className="w-full max-w-md">
                    <label className="label">Icon URL</label>

                    <input
                        type="url"
                        value={data.icon_url || ''}
                        onChange={e => handleChange('icon_url', e.target.value)}
                        placeholder="https://example.com/icon.png"
                        className={`input ${errors.icon_url ? 'input-error' : ''}`}
                    />

                    {errors.icon_url && (
                        <p className="text-sm text-red-500 mt-1">{errors.icon_url}</p>
                    )}
                </div>
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

            {/* Info box */}
            <div className="flex gap-3 p-4 bg-apple-blue/5 rounded-apple border border-apple-blue/10">
                <Info className="w-5 h-5 text-apple-blue flex-shrink-0 mt-0.5" />

                <div className="text-sm text-apple-gray-500">
                    <p className="font-medium text-apple-gray-600 mb-1">Tips for a great listing</p>

                    <ul className="space-y-1">
                        <li>• Use a clear, recognizable app icon (512x512px recommended)</li>
                        <li>• Keep your tagline concise and action-oriented</li>
                        <li>• Highlight key features and benefits in your description</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
