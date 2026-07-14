import React, { useMemo } from 'react';
import { Info, Plus, X, Video, Shield, Smartphone, Palette, Users } from 'lucide-react';

import * as m from '../../../paraglide/messages.js';
import { useFlags } from 'launchdarkly-react-client-sdk';

import type { AppStoreListingCreate, AgeRating } from '../types';
import { CATEGORY_OPTIONS, AGE_RATING_OPTIONS } from '../types';
import { ImageUpload, ScreenshotUpload } from './ImageUpload';

interface AppDetailsStepProps {
    data: Partial<AppStoreListingCreate>;
    onChange: (data: Partial<AppStoreListingCreate>) => void;
    errors: Record<string, string>;
}

export const AppDetailsStep: React.FC<AppDetailsStepProps> = ({ data, onChange, errors }) => {
    const flags = useFlags();

    // Filter category options based on pluginVisibility flag
    const visibleCategoryOptions = useMemo(() => {
        return CATEGORY_OPTIONS.filter(cat => {
            if (cat.value === 'plugin' && !flags?.pluginVisibility) {
                return false;
            }
            return true;
        });
    }, [flags?.pluginVisibility]);

    const handleChange = (field: keyof AppStoreListingCreate, value: string) => {
        onChange({ [field]: value });
    };

    const handleArrayChange = (field: 'highlights' | 'screenshots', values: string[]) => {
        onChange({ [field]: values });
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
                <h2 className="text-xl font-semibold text-gray-700">
                    {m['developerPortal.components.appDetailsStep.title']()}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                    {m['developerPortal.components.appDetailsStep.description']()}
                </p>
            </div>

            {/* Icon Upload */}
            <div className="flex flex-col items-center gap-3">
                <label className="text-sm font-medium text-gray-600">
                    {m['developerPortal.components.appDetailsStep.appIcon']()}
                </label>

                <ImageUpload
                    value={data.icon_url}
                    onChange={url => handleChange('icon_url', url)}
                    onRemove={() => handleChange('icon_url', '')}
                    placeholder={m['developerPortal.components.appDetailsStep.clickToUpload']()}
                    previewClassName="w-24 h-24 rounded-2xl"
                />

                <p className="text-xs text-gray-400">
                    {m['developerPortal.components.appDetailsStep.resolutionRecommend']()}
                </p>

                {errors.icon_url && <p className="text-sm text-red-500">{errors.icon_url}</p>}
            </div>

            {/* Display Name */}
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                    {m['developerPortal.components.appDetailsStep.displayName']()}
                </label>

                <input
                    type="text"
                    value={data.display_name || ''}
                    onChange={e => handleChange('display_name', e.target.value)}
                    placeholder={m[
                        'developerPortal.components.appDetailsStep.displayNamePlaceholder'
                    ]()}
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

            {/* Slug - disabled until fully implemented (needs uniqueness validation, backend persistence, etc.)
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
            */}

            {/* Tagline */}
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                    {m['developerPortal.components.appDetailsStep.tagline']()}
                </label>

                <input
                    type="text"
                    value={data.tagline || ''}
                    onChange={e => handleChange('tagline', e.target.value)}
                    placeholder={m[
                        'developerPortal.components.appDetailsStep.taglinePlaceholder'
                    ]()}
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
                    {m['developerPortal.components.appDetailsStep.fullDescription']()}
                </label>

                <textarea
                    value={data.full_description || ''}
                    onChange={e => handleChange('full_description', e.target.value)}
                    placeholder={m[
                        'developerPortal.components.appDetailsStep.fullDescriptionPlaceholder'
                    ]()}
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
                <label className="block text-sm font-medium text-gray-600 mb-1">
                    {m['developerPortal.components.appDetailsStep.category']()}
                </label>

                <select
                    value={data.category || ''}
                    onChange={e => handleChange('category', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                    <option value="">
                        {m['developerPortal.components.appDetailsStep.selectCategory']()}
                    </option>

                    {visibleCategoryOptions.map(cat => (
                        <option key={cat.value} value={cat.value}>
                            {(m as any)[cat.labelKey]()}
                        </option>
                    ))}
                </select>
            </div>

            {/* Age Restrictions */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-400" />

                    <label className="text-sm font-medium text-gray-600">
                        {m['developerPortal.components.appDetailsStep.ageRestrictions']()}
                    </label>

                    <span className="text-xs text-gray-400">
                        {m['developerPortal.components.appDetailsStep.optional']()}
                    </span>
                </div>

                <p className="text-xs text-gray-400 mb-3">
                    {m['developerPortal.components.appDetailsStep.ageRestrictionsDesc']()}
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            {m['developerPortal.components.appDetailsStep.ageRating']()}
                        </label>

                        <select
                            value={data.age_rating || ''}
                            onChange={e =>
                                onChange({
                                    ...data,
                                    age_rating: (e.target.value as AgeRating) || undefined,
                                })
                            }
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        >
                            <option value="">
                                {m['developerPortal.components.appDetailsStep.noRating']()}
                            </option>

                            {AGE_RATING_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            {m['developerPortal.components.appDetailsStep.minimumAge']()}
                        </label>

                        <input
                            type="number"
                            min={0}
                            max={18}
                            value={data.min_age ?? ''}
                            onChange={e => {
                                const val = e.target.value;
                                onChange({
                                    ...data,
                                    min_age:
                                        val === ''
                                            ? undefined
                                            : Math.min(18, Math.max(0, parseInt(val, 10))),
                                });
                            }}
                            placeholder={m[
                                'developerPortal.components.appDetailsStep.ageRatingPlaceholder'
                            ]()}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                    </div>
                </div>

                {(data.age_rating || data.min_age !== undefined) && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded-lg space-y-1">
                        {data.min_age !== undefined && (
                            <p className="text-xs text-red-700">
                                <strong>
                                    {m[
                                        'developerPortal.components.appDetailsStep.hardBlockLabel'
                                    ]()}
                                    :
                                </strong>{' '}
                                {m['developerPortal.components.appDetailsStep.hardBlockDesc']({
                                    age: data.min_age,
                                })}
                            </p>
                        )}
                        {data.age_rating && (
                            <p className="text-xs text-amber-700">
                                <strong>
                                    {m[
                                        'developerPortal.components.appDetailsStep.softBlockLabel'
                                    ]()}
                                    :
                                </strong>{' '}
                                {m['developerPortal.components.appDetailsStep.softBlockDesc']({
                                    age:
                                        AGE_RATING_OPTIONS.find(o => o.value === data.age_rating)
                                            ?.minAge ?? 0,
                                })}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Hero Background Color */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Palette className="w-4 h-4 text-gray-400" />

                    <label className="text-sm font-medium text-gray-600">
                        {m['developerPortal.components.appDetailsStep.listingBgColor']()}
                    </label>

                    <span className="text-xs text-gray-400">
                        {m['developerPortal.components.appDetailsStep.optional']()}
                    </span>
                </div>

                <p className="text-xs text-gray-400 mb-2">
                    {m['developerPortal.components.appDetailsStep.listingBgColorDesc']()}
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
                <label className="block text-sm font-medium text-gray-600 mb-1">
                    {m['developerPortal.components.appDetailsStep.highlights']()}
                </label>

                <p className="text-xs text-gray-400 mb-2">
                    {m['developerPortal.components.appDetailsStep.highlightsDesc']()}
                </p>

                <div className="space-y-2">
                    {(data.highlights || []).map((highlight, index) => (
                        <div key={index} className="flex gap-2">
                            <input
                                type="text"
                                value={highlight}
                                onChange={e => updateArrayItem('highlights', index, e.target.value)}
                                placeholder={m[
                                    'developerPortal.components.appDetailsStep.highlightPlaceholder'
                                ]()}
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
                        {m['developerPortal.components.appDetailsStep.addHighlight']()}
                    </button>
                )}
            </div>

            {/* Screenshots */}
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                    {m['developerPortal.components.appDetailsStep.screenshots']()}
                </label>

                <p className="text-xs text-gray-400 mb-2">
                    {m['developerPortal.components.appDetailsStep.screenshotsDesc']()}
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
                        {m['developerPortal.components.appDetailsStep.addScreenshot']()}
                    </button>
                )}
            </div>

            {/* Promo Video */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Video className="w-4 h-4 text-gray-400" />

                    <label className="text-sm font-medium text-gray-600">
                        {m['developerPortal.components.appDetailsStep.promoVideoUrl']()}
                    </label>

                    <span className="text-xs text-gray-400">
                        {m['developerPortal.components.appDetailsStep.optional']()}
                    </span>
                </div>

                <input
                    type="url"
                    value={data.promo_video_url || ''}
                    onChange={e => handleChange('promo_video_url', e.target.value)}
                    placeholder={m[
                        'developerPortal.components.appDetailsStep.promoVideoPlaceholder'
                    ]()}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
            </div>

            {/* Legal Links */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-gray-400" />

                    <label className="text-sm font-medium text-gray-600">
                        {m['developerPortal.components.appDetailsStep.legalPrivacy']()}
                    </label>

                    <span className="text-xs text-gray-400">
                        {m['developerPortal.components.appDetailsStep.optional']()}
                    </span>
                </div>

                <div className="space-y-3">
                    <input
                        type="url"
                        value={data.privacy_policy_url || ''}
                        onChange={e => handleChange('privacy_policy_url', e.target.value)}
                        placeholder={m[
                            'developerPortal.components.appDetailsStep.privacyPolicyUrl'
                        ]()}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />

                    <input
                        type="url"
                        value={data.terms_url || ''}
                        onChange={e => handleChange('terms_url', e.target.value)}
                        placeholder={m[
                            'developerPortal.components.appDetailsStep.termsOfServiceUrl'
                        ]()}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                </div>
            </div>

            {/* App Store IDs */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-gray-400" />

                    <label className="text-sm font-medium text-gray-600">
                        {m['developerPortal.components.appDetailsStep.nativeAppStoreLinks']()}
                    </label>

                    <span className="text-xs text-gray-400">
                        {m['developerPortal.components.appDetailsStep.optional']()}
                    </span>
                </div>

                <div className="space-y-3">
                    <input
                        type="text"
                        value={data.ios_app_store_id || ''}
                        onChange={e => handleChange('ios_app_store_id', e.target.value)}
                        placeholder={m['developerPortal.components.appDetailsStep.iosAppStoreId']()}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />

                    <input
                        type="text"
                        value={data.android_app_store_id || ''}
                        onChange={e => handleChange('android_app_store_id', e.target.value)}
                        placeholder={m[
                            'developerPortal.components.appDetailsStep.androidAppStoreId'
                        ]()}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-2 mt-2">
                        <label className="text-sm font-medium text-gray-600">
                            {m['developerPortal.components.appDetailsStep.contactInformation']()}
                        </label>

                        <span className="text-xs text-gray-400">
                            {m['developerPortal.components.appDetailsStep.optional']()}
                        </span>
                    </div>

                    <p className="text-xs text-gray-400 mb-2">
                        {m['developerPortal.components.appDetailsStep.contactInfoDesc']()}
                    </p>
                    <input
                        type="email"
                        value={data.contact_email || ''}
                        onChange={e => handleChange('contact_email', e.target.value.trim())}
                        placeholder={m['developerPortal.components.appDetailsStep.emailAddress']()}
                        className={`flex-1 w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                            errors.contact_email ? 'border-red-300' : 'border-gray-200'
                        }`}
                    />
                    {errors.contact_email && (
                        <p className="text-red-500 text-xs mt-1">{errors.contact_email}</p>
                    )}
                </div>
            </div>

            {/* Info box */}
            <div className="flex gap-3 p-4 bg-cyan-50 rounded-xl border border-cyan-100">
                <Info className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />

                <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-700 mb-1">
                        {m['developerPortal.components.appDetailsStep.tipsForGreatListing']()}
                    </p>

                    <ul className="space-y-1 text-xs">
                        <li>• {m['developerPortal.components.appDetailsStep.tip1']()}</li>

                        <li>• {m['developerPortal.components.appDetailsStep.tip2']()}</li>

                        <li>• {m['developerPortal.components.appDetailsStep.tip3']()}</li>

                        <li>• {m['developerPortal.components.appDetailsStep.tip4']()}</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
