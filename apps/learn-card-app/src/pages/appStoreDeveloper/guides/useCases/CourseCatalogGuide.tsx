/**
 * CourseCatalogGuide - issue credentials from a catalog (spreadsheet) of courses.
 */
import React, { useEffect } from 'react';
import type { LCNIntegration } from '@learncard/types';

import * as m from '../../../../paraglide/messages.js';
import { useDeveloperPortal } from '../../useDeveloperPortal';
import type { GuideProps } from '../GuidePage';

// Import the wizard content component (we'll render its inner content)
import { PartnerOnboardingWizardContent } from '../../partner-onboarding/PartnerOnboardingWizard';

const CourseCatalogGuide: React.FC<GuideProps> = ({
    selectedIntegration,
    setSelectedIntegration,
}) => {
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
                <p className="text-gray-500">
                    {m['developerPortal.guides.courseCatalog.noIntegration']()}
                </p>
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
