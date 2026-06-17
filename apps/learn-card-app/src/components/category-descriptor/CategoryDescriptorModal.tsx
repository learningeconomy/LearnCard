import React from 'react';

import { IonPage } from '@ionic/react';
import ModalLayout from '../../layout/ModalLayout';

import * as m from '../../paraglide/messages.js';
import CategoryDescriptor from '../../components/category-descriptor/CategoryDescriptor';
import { CredentialCategoryEnum } from 'learn-card-base';
import { WalletCategoryTypes } from 'learn-card-base/components/IssueVC/types';
import { walletSubtypeToDefaultImageSrc, BoostCategoryOptionsEnum } from 'learn-card-base';

const AI_IMG_SRC = 'https://cdn.filestackcontent.com/QAC1JmfQgGFccwM7EF0L';

// Resolve the descriptor image + the category key used to look up the
// description. Keyed off the CredentialCategoryEnum the page already passes
// (previously keyed off the English title string, which broke once the title
// became translated). The descriptor category preserves the exact values the
// old title-based switch returned so the description lookup is unchanged.
const getCategoryandImgSrc = (
    category?: CredentialCategoryEnum
): { imgSrc?: string; descriptorCategory: BoostCategoryOptionsEnum | string } => {
    switch (category) {
        case CredentialCategoryEnum.learningHistory:
            return {
                imgSrc: walletSubtypeToDefaultImageSrc(WalletCategoryTypes.learningHistory),
                descriptorCategory: BoostCategoryOptionsEnum.learningHistory,
            };
        case CredentialCategoryEnum.socialBadge:
            return {
                imgSrc: walletSubtypeToDefaultImageSrc(WalletCategoryTypes.socialBadges),
                descriptorCategory: BoostCategoryOptionsEnum.socialBadge,
            };
        case CredentialCategoryEnum.achievement:
            return {
                imgSrc: walletSubtypeToDefaultImageSrc(WalletCategoryTypes.achievements),
                descriptorCategory: BoostCategoryOptionsEnum.achievement,
            };
        case CredentialCategoryEnum.accomplishment:
            return {
                imgSrc: walletSubtypeToDefaultImageSrc(WalletCategoryTypes.accomplishments),
                descriptorCategory: BoostCategoryOptionsEnum.accomplishment,
            };
        case CredentialCategoryEnum.skill:
            return {
                imgSrc: walletSubtypeToDefaultImageSrc(WalletCategoryTypes.skills),
                descriptorCategory: BoostCategoryOptionsEnum.skill,
            };
        case CredentialCategoryEnum.workHistory:
        case CredentialCategoryEnum.experience:
            return {
                imgSrc: walletSubtypeToDefaultImageSrc(WalletCategoryTypes.jobHistory),
                descriptorCategory: BoostCategoryOptionsEnum.workHistory,
            };
        case CredentialCategoryEnum.accommodation:
            return {
                imgSrc: walletSubtypeToDefaultImageSrc(WalletCategoryTypes.accommodations),
                descriptorCategory: BoostCategoryOptionsEnum.accommodation,
            };
        case CredentialCategoryEnum.id:
            return {
                imgSrc: 'https://cdn.filestackcontent.com/9z6i0x3hSlG43paNZHag', // not totally sure why this one's different. Leaving it.
                descriptorCategory: BoostCategoryOptionsEnum.id,
            };
        case CredentialCategoryEnum.family:
            return {
                imgSrc: walletSubtypeToDefaultImageSrc(WalletCategoryTypes.families),
                descriptorCategory: BoostCategoryOptionsEnum.family,
            };
        case CredentialCategoryEnum.aiInsight:
            return { imgSrc: AI_IMG_SRC, descriptorCategory: CredentialCategoryEnum.aiInsight };
        case CredentialCategoryEnum.aiPathway:
            return { imgSrc: AI_IMG_SRC, descriptorCategory: 'aiPathway' };
        default:
            // Defensive: never throw (that black-screened the page). Fall back to
            // passing the category straight through so the descriptor still renders.
            return { imgSrc: undefined, descriptorCategory: category ?? '' };
    }
};

const CategoryDescriptorModal: React.FC<{
    handleCloseModal: () => void;
    title: string;
    category?: CredentialCategoryEnum;
}> = ({ handleCloseModal, title, category }) => {
    const { imgSrc, descriptorCategory } = getCategoryandImgSrc(category);

    return (
        <IonPage>
            <ModalLayout
                handleOnClick={handleCloseModal}
                buttonText={m['wallet.categoryDescriptor.gotIt']()}
            >
                <div className="p-[30px]">
                    {imgSrc && (
                        <img src={imgSrc} alt={title} className="w-[100px] h-[100px] m-auto" />
                    )}
                    <p className="text-center text-[22px] font-poppins font-normal leading-[130%] text-grayscale-900">
                        <strong>{m['wallet.categoryDescriptor.about']({ name: title })}</strong>
                    </p>
                    <CategoryDescriptor
                        category={descriptorCategory}
                        className="text-left mt-[10px]"
                    />
                </div>
            </ModalLayout>
        </IonPage>
    );
};

export default CategoryDescriptorModal;
