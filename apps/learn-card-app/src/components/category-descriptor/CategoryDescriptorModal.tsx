import React from 'react';

import ModalLayout from '../../layout/ModalLayout';

import * as m from '../../paraglide/messages.js';
import CategoryDescriptor from '../../components/category-descriptor/CategoryDescriptor';
import { CredentialCategoryEnum, categoryMetadata } from 'learn-card-base';
import useTheme from '../../theme/hooks/useTheme';

const CategoryDescriptorModal: React.FC<{
    handleCloseModal: () => void;
    title?: string;
    category: CredentialCategoryEnum;
}> = ({ handleCloseModal, title, category }) => {
    const { getThemedCategoryIcons } = useTheme();
    const { Icon: CategoryIcon } = getThemedCategoryIcons(category);
    const categoryTitle = title ?? categoryMetadata[category].title;

    return (
        <div className="relative h-full">
            <ModalLayout
                handleOnClick={handleCloseModal}
                buttonText={m['wallet.categoryDescriptor.gotIt']()}
            >
                <div className="p-[30px]">
                    {CategoryIcon && (
                        <div className="mb-4 flex justify-center">
                            <CategoryIcon className="w-[100px] h-[100px]" />
                        </div>
                    )}
                    <p className="text-center text-[22px] font-poppins font-normal leading-[130%] text-grayscale-900">
                        <strong>
                            {m['wallet.categoryDescriptor.about']({ name: categoryTitle })}
                        </strong>
                    </p>
                    <CategoryDescriptor category={category} className="text-left mt-[10px]" />
                </div>
            </ModalLayout>
        </div>
    );
};

export default CategoryDescriptorModal;
