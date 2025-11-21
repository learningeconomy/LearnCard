import React from 'react';

import { IonPage } from '@ionic/react';
import ModalLayout from '../../layout/ModalLayout';
import { TYPE_TO_IMG_SRC, WALLET_SUBTYPES } from '@learncard/react';

import CategoryDescriptor from '../../components/category-descriptor/CategoryDescriptor';
import { BoostCategoryOptionsEnum } from '../../components/boost/boost-options/boostOptions';

const CategoryDescriptorModal: React.FC<{
    handleCloseModal: () => void;
    title: string;
}> = ({ handleCloseModal, title }) => {
    const getCategoryandImgSrc = (title: string) => {
        let imgSrc;
        let category;

        switch (title) {
            case 'Studies':
                imgSrc = TYPE_TO_IMG_SRC[WALLET_SUBTYPES.LEARNING_HISTORY];
                category = BoostCategoryOptionsEnum.learningHistory;
                break;

            case 'Boosts':
                imgSrc = TYPE_TO_IMG_SRC[WALLET_SUBTYPES.SOCIAL_BADGES];
                category = BoostCategoryOptionsEnum.socialBadge;
                break;

            case 'Achievements':
                imgSrc = TYPE_TO_IMG_SRC[WALLET_SUBTYPES.ACHIEVEMENTS];
                category = BoostCategoryOptionsEnum.achievement;
                break;

            case 'Portfolio':
                imgSrc = TYPE_TO_IMG_SRC[WALLET_SUBTYPES.ACCOMPLISHMENTS];
                category = BoostCategoryOptionsEnum.accomplishment;
                break;

            case 'Skills':
                imgSrc = TYPE_TO_IMG_SRC[WALLET_SUBTYPES.SKILLS];
                category = BoostCategoryOptionsEnum.skill;
                break;

            case 'Experiences':
                imgSrc = TYPE_TO_IMG_SRC[WALLET_SUBTYPES.JOB_HISTORY];
                category = BoostCategoryOptionsEnum.workHistory;
                break;

            case 'Assistance':
                imgSrc = TYPE_TO_IMG_SRC[WALLET_SUBTYPES.ACCOMMODATIONS];
                category = BoostCategoryOptionsEnum.accommodation;
                break;

            case 'IDs':
                imgSrc = 'https://cdn.filestackcontent.com/9z6i0x3hSlG43paNZHag';
                category = BoostCategoryOptionsEnum.id;
                break;

            case 'Families':
                imgSrc = 'https://cdn.filestackcontent.com/yfeWgdSWQ7Ckl4sVuGLc';
                category = BoostCategoryOptionsEnum.family;
                break;

            default:
                throw new Error('Invalid title provided');
        }

        return { imgSrc, category };
    };

    const { imgSrc, category } = getCategoryandImgSrc(title);

    return (
        <IonPage>
            <ModalLayout handleOnClick={handleCloseModal} buttonText="Got It">
                <div className="p-[30px]">
                    <img
                        src={imgSrc}
                        alt="learning history"
                        className="w-[100px] h-[100px] m-auto"
                    />
                    <p className="text-center text-[22px] font-poppins font-normal leading-[130%] text-grayscale-900">
                        <strong>About {title}</strong>
                    </p>
                    <CategoryDescriptor category={category} className="text-left mt-[10px]" />
                </div>
            </ModalLayout>
        </IonPage>
    );
};

export default CategoryDescriptorModal;
