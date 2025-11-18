import React, { useState } from 'react';
import { BoostCategoryOptionsEnum } from '../boost-options/boostOptions';
import { BoostPageViewMode, BoostPageViewModeType } from 'learn-card-base';
import BoostTemplateSelectorHeader from './BoostTemplateSelectorHeader';
import BoostTemplateSelectorFooter from './BoostTemplateSelectorFooter';
import BoostTemplateSelectorBody from './BoostTemplateSelectorBody';

type BoostTemplateSelectorProps = {
    initialCategory?: BoostCategoryOptionsEnum;
    otherUserProfileId?: string;
};

const BoostTemplateSelector: React.FC<BoostTemplateSelectorProps> = ({
    initialCategory,
    otherUserProfileId,
}) => {
    const [selectedCategory, setSelectedCategory] = useState<BoostCategoryOptionsEnum>(
        initialCategory || BoostCategoryOptionsEnum.socialBadge
    );
    const [viewMode, setViewMode] = useState<BoostPageViewModeType>(BoostPageViewMode.List);

    return (
        <div className="flex flex-col bg-grayscale-100 h-full max-h-screen overflow-hidden">
            <BoostTemplateSelectorHeader
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />
            <BoostTemplateSelectorBody
                selectedCategory={selectedCategory}
                viewMode={viewMode}
                otherUserProfileId={otherUserProfileId}
            />
            <BoostTemplateSelectorFooter
                selectedCategory={selectedCategory}
                otherUserProfileId={otherUserProfileId}
            />
        </div>
    );
};

export default BoostTemplateSelector;
