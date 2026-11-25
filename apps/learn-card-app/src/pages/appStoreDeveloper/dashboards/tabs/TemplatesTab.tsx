/**
 * TemplatesTab - Dashboard version of credential template management
 *
 * Re-exports TemplateBuilderStep for full functionality including:
 * - Master templates with child boosts
 * - CSV catalog import
 * - Full CredentialBuilder editing
 */

import * as m from '../../../../paraglide/messages.js';
import { useLocale } from '../../../../i18n';
import React, { useMemo } from 'react';
import { useGetCurrentLCNUser } from 'learn-card-base';

import type { CredentialTemplate, BrandingConfig } from '../types';
import { TemplateBuilderStep } from '../../partner-onboarding/steps/TemplateBuilderStep';

interface TemplatesTabProps {
    templates: CredentialTemplate[];
    integrationId: string;
    branding?: BrandingConfig | null;
    onRefresh?: () => void;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
    templates,
    integrationId,
    branding: propBranding,
    onRefresh,
}) => {
    const { currentLCNUser } = useGetCurrentLCNUser();

    const branding = useMemo(() => {
        if (propBranding) return propBranding;
        if (currentLCNUser) {
            return {
                displayName: currentLCNUser.displayName || '',
                image: currentLCNUser.image || '',
                shortBio: currentLCNUser.shortBio || '',
                bio: currentLCNUser.bio || '',
                display: (currentLCNUser.display as Record<string, unknown>) || {},
            };
        }
        return null;
    }, [propBranding, currentLCNUser]);

    const locale = useLocale();

    const project = useMemo(
        () => ({
            id: integrationId,
            name: m['developerPortal.dashboards.tabs.templates.projectName'](),
        }),
        [integrationId, locale]
    );

    const handleComplete = () => {
        onRefresh?.();
    };

    const handleBack = () => {
        // No-op in dashboard context - no wizard navigation
    };

    return (
        <div className="dashboard-templates-tab">
            <TemplateBuilderStep
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for this lint-only PR
                templates={templates as any}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for this lint-only PR
                branding={branding as any}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for this lint-only PR
                project={project as any}
                onComplete={handleComplete}
                onBack={handleBack}
                hideNavigation
                onTemplateChange={onRefresh}
            />

            <p className="text-xs text-gray-400 mt-4 text-center">
                {m['developerPortal.dashboards.tabs.templates.footnote']()}
            </p>
        </div>
    );
};
