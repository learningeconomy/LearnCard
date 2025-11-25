import React from 'react';

import CategoryEmptyPlaceholder from '../../components/empty-placeholder/CategoryEmptyPlaceHolder';

import { BoostCategoryOptionsEnum } from 'learn-card-base';

const SkillsPageEmptyPlaceholder: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
    return (
        <section className="w-full flex flex-col relative items-center achievements-list-container pt-[10px] px-[20px] text-center justify-center">
            <CategoryEmptyPlaceholder category={BoostCategoryOptionsEnum.skill} />
            <p className="text-black mt-10">
                <strong>{isLoading ? 'Loading Skills...' : 'No Skills yet.'}</strong>
            </p>
        </section>
    );
};

export default SkillsPageEmptyPlaceholder;
