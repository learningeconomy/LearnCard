/**
 * TemplatesTab - Dashboard version of credential template management
 * 
 * Re-exports TemplateBuilderStep for full functionality including:
 * - Master templates with child boosts
 * - CSV catalog import
 * - Full CredentialBuilder editing
 */

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
                display: currentLCNUser.display as Record<string, unknown> || {},
            };
        }
        return null;
    }, [propBranding, currentLCNUser]);

    const project = useMemo(() => ({
        id: integrationId,
        name: 'Integration',
    }), [integrationId]);

    const handleComplete = () => {
        onRefresh?.();
    };

    const handleBack = () => {
        // No-op in dashboard context - no wizard navigation
    };

    return (
        <div className="dashboard-templates-tab">
            <TemplateBuilderStep
                templates={templates as any}
                branding={branding as any}
                project={project as any}
                onComplete={handleComplete}
                onBack={handleBack}
            />
        </div>
    );
};
