/**
 * CourseCatalogGuide - Enterprise LMS integration guide
 * 
 * Full guided setup for LMS partners. Configure webhooks, build credential
 * templates, map your data, and go live with automatic credential issuance.
 */
import React, { useEffect } from 'react';
import type { LCNIntegration } from '@learncard/types';

import { useDeveloperPortal } from '../../useDeveloperPortal';
import type { GuideProps } from '../GuidePage';

// Import the wizard content component (we'll render its inner content)
import { PartnerOnboardingWizardContent } from '../../partner-onboarding/PartnerOnboardingWizard';

const CourseCatalogGuide: React.FC<GuideProps> = ({ selectedIntegration, setSelectedIntegration }) => {
    const { useUpdateIntegration } = useDeveloperPortal();
    const updateIntegrationMutation = useUpdateIntegration();

    // Ensure guideType is set to 'course-catalog' when entering this guide
    useEffect(() => {
        if (selectedIntegration && selectedIntegration.guideType !== 'course-catalog') {
            updateIntegrationMutation.mutate({
                id: selectedIntegration.id,
                updates: { guideType: 'course-catalog' },
            });
        }
    }, [selectedIntegration?.id, selectedIntegration?.guideType]);

    if (!selectedIntegration) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Please select an integration from the header dropdown to continue.</p>
            </div>
        );
    }

    return (
        <PartnerOnboardingWizardContent
            integrationId={selectedIntegration.id}
            selectedIntegration={selectedIntegration}
        />
    );
};

export default CourseCatalogGuide;
