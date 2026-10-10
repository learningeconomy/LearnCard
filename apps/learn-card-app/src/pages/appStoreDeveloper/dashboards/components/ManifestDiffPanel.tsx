import React from 'react';
import { AppManifestDiff } from '@learncard/types';
import { IonIcon } from '@ionic/react';
import {
    alertCircleOutline,
    addOutline,
    removeOutline,
    swapHorizontalOutline,
} from 'ionicons/icons';

interface ManifestDiffPanelProps {
    diff: AppManifestDiff;
}

export const ManifestDiffPanel: React.FC<ManifestDiffPanelProps> = ({ diff }) => {
    const hasChanges =
        diff.permissions.added.length > 0 ||
        diff.permissions.removed.length > 0 ||
        diff.permissions.changed.length > 0 ||
        diff.templates.added.length > 0 ||
        diff.templates.removed.length > 0 ||
        diff.templates.changed.length > 0 ||
        diff.consentScopes.added.length > 0 ||
        diff.consentScopes.removed.length > 0 ||
        diff.consentScopes.changed.length > 0 ||
        diff.featurePaths.added.length > 0 ||
        diff.featurePaths.removed.length > 0 ||
        diff.featurePaths.changed.length > 0 ||
        diff.counterKeys.added.length > 0 ||
        diff.counterKeys.removed.length > 0 ||
        diff.counterKeys.changed.length > 0;

    if (!hasChanges) {
        return <div className="text-sm text-grayscale-600">No changes in this version.</div>;
    }

    const renderStringDiff = (
        title: string,
        stringDiff: { added: string[]; removed: string[]; changed: string[] }
    ) => {
        if (
            stringDiff.added.length === 0 &&
            stringDiff.removed.length === 0 &&
            stringDiff.changed.length === 0
        ) {
            return null;
        }

        return (
            <div className="mb-4 last:mb-0">
                <h4 className="text-xs font-medium text-grayscale-700 mb-2 uppercase tracking-wider">
                    {title}
                </h4>
                <div className="space-y-1.5">
                    {stringDiff.added.map((item, i) => (
                        <div
                            key={`added-${i}`}
                            className="flex items-start gap-2 p-2 bg-emerald-50 rounded-lg text-sm text-emerald-900"
                        >
                            <IonIcon
                                icon={addOutline}
                                className="mt-0.5 shrink-0 text-emerald-600"
                            />
                            <span>{item}</span>
                        </div>
                    ))}
                    {stringDiff.removed.map((item, i) => (
                        <div
                            key={`removed-${i}`}
                            className="flex items-start gap-2 p-2 bg-red-50 rounded-lg text-sm text-red-900"
                        >
                            <IonIcon
                                icon={removeOutline}
                                className="mt-0.5 shrink-0 text-red-600"
                            />
                            <span className="line-through opacity-75">{item}</span>
                        </div>
                    ))}
                    {stringDiff.changed.map((item, i) => (
                        <div
                            key={`changed-${i}`}
                            className="flex items-start gap-2 p-2 bg-grayscale-100 rounded-lg text-sm text-grayscale-900"
                        >
                            <IonIcon
                                icon={swapHorizontalOutline}
                                className="mt-0.5 shrink-0 text-grayscale-600"
                            />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderTemplateDiff = () => {
        if (
            diff.templates.added.length === 0 &&
            diff.templates.removed.length === 0 &&
            diff.templates.changed.length === 0
        ) {
            return null;
        }

        return (
            <div className="mb-4 last:mb-0">
                <h4 className="text-xs font-medium text-grayscale-700 mb-2 uppercase tracking-wider">
                    Templates
                </h4>
                <div className="space-y-1.5">
                    {diff.templates.added.map((item, i) => (
                        <div
                            key={`added-${i}`}
                            className="flex items-start gap-2 p-2 bg-emerald-50 rounded-lg text-sm text-emerald-900"
                        >
                            <IonIcon
                                icon={addOutline}
                                className="mt-0.5 shrink-0 text-emerald-600"
                            />
                            <span>
                                {item.alias} (v{item.version})
                            </span>
                        </div>
                    ))}
                    {diff.templates.removed.map((item, i) => (
                        <div
                            key={`removed-${i}`}
                            className="flex items-start gap-2 p-2 bg-red-50 rounded-lg text-sm text-red-900"
                        >
                            <IonIcon
                                icon={removeOutline}
                                className="mt-0.5 shrink-0 text-red-600"
                            />
                            <span className="line-through opacity-75">
                                {item.alias} (v{item.version})
                            </span>
                        </div>
                    ))}
                    {diff.templates.changed.map((item, i) => (
                        <div
                            key={`changed-${i}`}
                            className="flex items-start gap-2 p-2 bg-grayscale-100 rounded-lg text-sm text-grayscale-900"
                        >
                            <IonIcon
                                icon={swapHorizontalOutline}
                                className="mt-0.5 shrink-0 text-grayscale-600"
                            />
                            <span>
                                {item.alias} (v{item.fromVersion} → v{item.toVersion})
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="font-poppins">
            {diff.requiresReview && (
                <div className="mb-5 p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon
                        icon={alertCircleOutline}
                        className="text-amber-600 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-amber-800 leading-relaxed">
                        These changes expand what your app can access and may require review.
                    </span>
                </div>
            )}

            {renderStringDiff('Permissions', diff.permissions)}
            {renderTemplateDiff()}
            {renderStringDiff('Consent Scopes', diff.consentScopes)}
            {renderStringDiff('Feature Paths', diff.featurePaths)}
            {renderStringDiff('Counter Keys', diff.counterKeys)}
        </div>
    );
};
