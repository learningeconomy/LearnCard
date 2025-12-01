import React from 'react';

import { IonPage } from '@ionic/react';
import ModalLayout from '../../layout/ModalLayout';

import CategoryDescriptor from '../../components/category-descriptor/CategoryDescriptor';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { BlueBoostOutline2 } from 'learn-card-base/svgs/BoostOutline2';
import { GreenScoutsPledge2 } from 'learn-card-base/svgs/ScoutsPledge2';
import { PurpleMeritBadgesIcon } from 'learn-card-base/svgs/MeritBadgesIcon';

type CategoryDescriptorModalProps = {
    handleCloseModal: () => void;
    title: string;
};

const CategoryDescriptorModal: React.FC<CategoryDescriptorModalProps> = ({
    handleCloseModal,
    title,
}) => {
    const getCategoryandImgSrc = (title: string) => {
        let ImageComponent;
        let category;

        switch (title) {
            case 'Social Badges':
                ImageComponent = BlueBoostOutline2;
                category = BoostCategoryOptionsEnum.socialBadge;
                break;

            case 'Social Boosts':
                ImageComponent = BlueBoostOutline2;
                category = BoostCategoryOptionsEnum.socialBadge;
                break;

            case 'Troops':
                ImageComponent = GreenScoutsPledge2;
                category = BoostCategoryOptionsEnum.membership;
                break;

            case 'Merit Badges':
                ImageComponent = PurpleMeritBadgesIcon;
                category = BoostCategoryOptionsEnum.meritBadge;
                break;

            default:
                throw new Error('Invalid title provided');
        }

        return { ImageComponent, category };
    };

    const { ImageComponent, category } = getCategoryandImgSrc(title);

    return (
        <IonPage>
            <ModalLayout handleOnClick={handleCloseModal} buttonText="Got It">
                <div className="p-[30px]">
                    <ImageComponent className="h-[100px] w-[100px] m-auto" />
                    <p className="text-center text-[22px] font-poppins font-normal leading-[130%] text-grayscale-900">
                        About {title}
                    </p>
                    <CategoryDescriptor category={category} className="text-left mt-[10px]" />
                </div>
            </ModalLayout>
        </IonPage>
    );
};

export default CategoryDescriptorModal;
