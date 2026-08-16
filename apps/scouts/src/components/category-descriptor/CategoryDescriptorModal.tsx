import React from 'react';

import { IonPage } from '@ionic/react';
import ModalLayout from '../../layout/ModalLayout';
import * as m from '../../paraglide/messages.js';

import CategoryDescriptor from '../../components/category-descriptor/CategoryDescriptor';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { BlueBoostOutline2 } from 'learn-card-base/svgs/BoostOutline2';
import { GreenScoutsPledge2 } from 'learn-card-base/svgs/ScoutsPledge2';
import { PurpleMeritBadgesIcon } from 'learn-card-base/svgs/MeritBadgesIcon';
import { SkillsIconWithShape } from 'learn-card-base/svgs/wallet/SkillsIcon';
import { getScoutPassCategoryCopy } from './scoutPassCategoryCopy';

type CategoryDescriptorModalProps = {
    handleCloseModal: () => void;
    category: BoostCategoryOptionsEnum;
};

const getCategoryIcon = (category: BoostCategoryOptionsEnum) => {
    switch (category) {
        case BoostCategoryOptionsEnum.socialBadge:
            return BlueBoostOutline2;
        case BoostCategoryOptionsEnum.membership:
            return GreenScoutsPledge2;
        case BoostCategoryOptionsEnum.meritBadge:
            return PurpleMeritBadgesIcon;
        case BoostCategoryOptionsEnum.skill:
            return SkillsIconWithShape;
        default:
            return SkillsIconWithShape;
    }
};

const CategoryDescriptorModal: React.FC<CategoryDescriptorModalProps> = ({
    handleCloseModal,
    category,
}) => {
    const copy = getScoutPassCategoryCopy(m, category);
    if (!copy) return null;

    const ImageComponent = getCategoryIcon(category);

    return (
        <IonPage>
            <ModalLayout handleOnClick={handleCloseModal} buttonText={m['common.gotIt']()}>
                <div className="w-full max-w-[400px] mx-auto p-[30px]">
                    <ImageComponent className="h-[100px] w-[100px] m-auto" />
                    <p className="text-center text-[22px] font-poppins font-normal leading-[130%] text-grayscale-900">
                        {m['credsBundle.aboutTitle']({ title: copy.titleOther })}
                    </p>
                    <CategoryDescriptor
                        description={copy.descriptor}
                        className="text-left mt-[10px]"
                    />
                </div>
            </ModalLayout>
        </IonPage>
    );
};

export default CategoryDescriptorModal;
