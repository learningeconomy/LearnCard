import React from 'react';
import * as m from '../../../paraglide/messages.js';
import { mDynamic } from '../../../i18n/mDynamic';
import { CheckCircle2, FileText, Settings, Link2, ExternalLink, Smartphone } from 'lucide-react';

import type { AppStoreListingCreate } from '../types';
import { LAUNCH_TYPE_INFO, CATEGORY_OPTIONS } from '../types';
import type { CapturedAppManifest } from '@learncard/partner-connect-core';
import { IonIcon } from '@ionic/react';
import { shieldCheckmarkOutline } from 'ionicons/icons';

interface ReviewStepProps {
    data: Partial<AppStoreListingCreate>;
    capturedManifest?: CapturedAppManifest;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ data, capturedManifest }) => {
    const getCategoryLabel = (value?: string) => {
        const cat = CATEGORY_OPTIONS.find(c => c.value === value);
        return cat
            ? mDynamic(cat.labelKey)
            : value || m['developerPortal.components.reviewStep.notSpecified']();
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

                <h2 className="text-xl font-semibold text-gray-700">
                    {m['developerPortal.components.reviewStep.title']()}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                    {m['developerPortal.components.reviewStep.description']()}
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
                            {data.display_name ||
                                m['developerPortal.components.reviewStep.untitledApp']()}
                        </h3>

                        <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">
                            {data.tagline || m['developerPortal.components.reviewStep.noTagline']()}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                            <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                                {getCategoryLabel(data.category)}
                            </span>

                            {launchTypeInfo && (
                                <span className="px-2 py-0.5 bg-cyan-100 rounded-full text-xs font-medium text-cyan-700">
                                    {mDynamic(launchTypeInfo.labelKey)}
                                </span>
                            )}
                            {data.age_rating && (
                                <span className="inline-block px-2 py-0.5 bg-grayscale-100 text-grayscale-700 text-xs font-medium rounded-full">
                                    {m['appStoreAdmin.listing.age']({ rating: data.age_rating })}
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

                        <h4 className="font-medium text-gray-600 text-sm">
                            {m['developerPortal.components.reviewStep.description']()}
                        </h4>
                    </div>

                    <p className="text-sm text-gray-500 whitespace-pre-wrap">
                        {data.full_description ||
                            m['developerPortal.components.reviewStep.noDescription']()}
                    </p>
                </div>

                {/* Highlights */}
                {data.highlights && data.highlights.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h4 className="font-medium text-gray-600 text-sm mb-2">
                            {m['developerPortal.components.reviewStep.highlights']()}
                        </h4>

                        <ul className="space-y-1">
                            {data.highlights
                                .filter(h => h.trim())
                                .map((highlight, index) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-2 text-sm text-gray-500"
                                    >
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

                        <h4 className="font-medium text-gray-600 text-sm">
                            {m['developerPortal.components.reviewStep.launchConfiguration']()}
                        </h4>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between py-1.5 border-b border-gray-100">
                            <span className="text-sm text-gray-500">
                                {m['developerPortal.components.reviewStep.launchType']()}
                            </span>

                            <span className="text-sm font-medium text-gray-600">
                                {launchTypeInfo
                                    ? mDynamic(launchTypeInfo.labelKey)
                                    : m['developerPortal.components.reviewStep.notSelected']()}
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

                {capturedManifest && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <h4 className="font-medium text-gray-600 text-sm">
                                Captured Integrations
                            </h4>
                        </div>

                        <div className="space-y-4">
                            {capturedManifest.templates.length > 0 && (
                                <div>
                                    <h5 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                                        Credential Templates
                                    </h5>
                                    <div className="space-y-2">
                                        {capturedManifest.templates.map(t => (
                                            <div
                                                key={t.alias}
                                                className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-sm"
                                            >
                                                <div className="font-medium text-gray-700">
                                                    {t.template.name || t.alias}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    Alias: {t.alias}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {capturedManifest.consentRequests.length > 0 && (
                                <div>
                                    <h5 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                                        Consent Requests
                                    </h5>
                                    <div className="space-y-2">
                                        {capturedManifest.consentRequests.map((c, i) => (
                                            <div
                                                key={i}
                                                className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-sm"
                                            >
                                                <div className="flex flex-wrap gap-1.5">
                                                    {c.scopes.read.personalFields.map(f => (
                                                        <span
                                                            key={`read-pf-${f}`}
                                                            className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs flex items-center gap-1"
                                                        >
                                                            <IonIcon
                                                                icon={shieldCheckmarkOutline}
                                                                className="w-3 h-3"
                                                            />{' '}
                                                            Read: {f}
                                                        </span>
                                                    ))}
                                                    {c.scopes.read.credentialCategories.map(cat => (
                                                        <span
                                                            key={`read-cat-${cat}`}
                                                            className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs flex items-center gap-1"
                                                        >
                                                            <IonIcon
                                                                icon={shieldCheckmarkOutline}
                                                                className="w-3 h-3"
                                                            />{' '}
                                                            Read: {cat}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {data.min_age && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            {/* <Link2 className="w-4 h-4 text-gray-400" /> */}

                            <h4 className="font-medium text-gray-600 text-sm">
                                {m['developerPortal.components.reviewStep.minimumAge']()}
                            </h4>
                        </div>

                        <p className="text-sm text-gray-500 whitespace-pre-wrap">
                            {m['developerPortal.components.reviewStep.minimumAgeDesc']({
                                age: data.min_age,
                            })}
                        </p>
                    </div>
                )}

                {/* Additional Links */}
                {(data.privacy_policy_url || data.terms_url) && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Link2 className="w-4 h-4 text-gray-400" />

                            <h4 className="font-medium text-gray-600 text-sm">
                                {m['developerPortal.components.reviewStep.additionalLinks']()}
                            </h4>
                        </div>

                        <div className="space-y-1.5">
                            {data.privacy_policy_url && (
                                <a
                                    href={data.privacy_policy_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-sm text-cyan-600 hover:underline"
                                >
                                    {m['developerPortal.components.reviewStep.privacyPolicy']()}
                                </a>
                            )}

                            {data.terms_url && (
                                <a
                                    href={data.terms_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-sm text-cyan-600 hover:underline"
                                >
                                    {m['developerPortal.components.reviewStep.termsOfService']()}
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Native App Links */}
                {(data.ios_app_store_id || data.android_app_store_id) && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Smartphone className="w-4 h-4 text-gray-400" />

                            <h4 className="font-medium text-gray-600 text-sm">
                                {m['developerPortal.components.reviewStep.nativeAppLinks']()}
                            </h4>
                        </div>

                        <div className="space-y-2">
                            {data.ios_app_store_id && (
                                <a
                                    href={`https://apps.apple.com/us/app/id${data.ios_app_store_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-cyan-600 hover:underline"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    {m['appStoreAdmin.listing.iosAppStore']({
                                        id: data.ios_app_store_id,
                                    })}
                                </a>
                            )}

                            {data.android_app_store_id && (
                                <a
                                    href={`https://play.google.com/store/apps/details?id=${data.android_app_store_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-cyan-600 hover:underline"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    {m['appStoreAdmin.listing.googlePlayStore']({
                                        id: data.android_app_store_id,
                                    })}
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Submission Notice */}
            <div className="p-4 bg-gray-100 rounded-xl text-sm text-gray-500 text-center">
                {m['developerPortal.components.reviewStep.submissionNotice']()}
            </div>
        </div>
    );
};
