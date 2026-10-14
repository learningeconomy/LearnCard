import React from 'react';

import ModalLayout from '../../layout/ModalLayout';

import * as m from '../../paraglide/messages.js';
import CategoryDescriptor from '../../components/category-descriptor/CategoryDescriptor';
import { CredentialCategoryEnum, categoryMetadata } from 'learn-card-base';

const CategoryDescriptorModal: React.FC<{
    handleCloseModal: () => void;
    title?: string;
    category: CredentialCategoryEnum;
}> = ({ handleCloseModal, title, category }) => {
    const categoryTitle = title ?? categoryMetadata[category].title;
    const imgSrc =
        category === CredentialCategoryEnum.id
            ? 'https://cdn.filestackcontent.com/9z6i0x3hSlG43paNZHag'
            : category === CredentialCategoryEnum.aiInsight ||
                category === CredentialCategoryEnum.aiPathway
              ? 'https://cdn.filestackcontent.com/QAC1JmfQgGFccwM7EF0L'
              : categoryMetadata[category].defaultImageSrc;

    return (
        <div className="relative h-full">
            <ModalLayout
                handleOnClick={handleCloseModal}
                buttonText={m['wallet.categoryDescriptor.gotIt']()}
            >
                <div className="p-[30px]">
                    <img src={imgSrc} alt="" className="w-[100px] h-[100px] m-auto" />
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
