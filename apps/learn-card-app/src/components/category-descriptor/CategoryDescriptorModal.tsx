import React from 'react';

import { IonPage } from '@ionic/react';
import ModalLayout from '../../layout/ModalLayout';

import CategoryDescriptor from '../../components/category-descriptor/CategoryDescriptor';
import { CredentialCategoryEnum } from 'learn-card-base';
import { WalletCategoryTypes } from 'learn-card-base/components/IssueVC/types';
import { walletSubtypeToDefaultImageSrc, BoostCategoryOptionsEnum } from 'learn-card-base';

const CategoryDescriptorModal: React.FC<{
    handleCloseModal: () => void;
    title: string;
}> = ({ handleCloseModal, title }) => {
    const getCategoryandImgSrc = (title: string) => {
        let imgSrc;
        let category;

        // TODO: swap these out to use categories instead of titles!
        switch (title) {
            case 'Studies':
                imgSrc = walletSubtypeToDefaultImageSrc(WalletCategoryTypes.learningHistory);
                category = BoostCategoryOptionsEnum.learningHistory;
                break;

            case 'Boosts':
                imgSrc = walletSubtypeToDefaultImageSrc(WalletCategoryTypes.socialBadges);
                category = BoostCategoryOptionsEnum.socialBadge;
                break;

            case 'Achievements':
                imgSrc = walletSubtypeToDefaultImageSrc(WalletCategoryTypes.achievements);
                category = BoostCategoryOptionsEnum.achievement;
                break;

            case 'Portfolio':
                imgSrc = walletSubtypeToDefaultImageSrc(WalletCategoryTypes.accomplishments);
                category = BoostCategoryOptionsEnum.accomplishment;
                break;

            case 'Skills Hub':
                imgSrc = walletSubtypeToDefaultImageSrc(WalletCategoryTypes.skills);
                category = BoostCategoryOptionsEnum.skill;
                break;

            case 'Experiences':
                imgSrc = walletSubtypeToDefaultImageSrc(WalletCategoryTypes.jobHistory);
                category = BoostCategoryOptionsEnum.workHistory;
                break;

            case 'Assistance':
                imgSrc = walletSubtypeToDefaultImageSrc(WalletCategoryTypes.accommodations);
                category = BoostCategoryOptionsEnum.accommodation;
                break;

            case 'IDs':
                imgSrc = 'https://cdn.filestackcontent.com/9z6i0x3hSlG43paNZHag'; // not totally sure why this one's different. Leaving it.
                // imgSrc = walletSubtypeToDefaultImageSrc(WalletCategoryTypes.ids)
                category = BoostCategoryOptionsEnum.id;
                break;

            case 'Families':
                imgSrc = walletSubtypeToDefaultImageSrc(WalletCategoryTypes.families);
                category = BoostCategoryOptionsEnum.family;
                break;

            case 'AI Insights Hub':
                imgSrc = 'https://cdn.filestackcontent.com/QAC1JmfQgGFccwM7EF0L';
                category = CredentialCategoryEnum.aiInsight;
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
