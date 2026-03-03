import { BoostCMSState, BoostMediaOptionsEnum, BoostCMSMediaAttachment } from 'learn-card-base';
import { useImmer } from 'use-immer';

export type BoostCMSMediaState = {
    photos: BoostCMSMediaAttachment[];
    links: BoostCMSMediaAttachment[];
    videos: BoostCMSMediaAttachment[];
    documents: BoostCMSMediaAttachment[];
};

export const useBoostCMSMediaState = (state?: BoostCMSState) => {
    const getCategoriesFromBoostCMSState = (state: BoostCMSState, type: BoostMediaOptionsEnum) => {
        return state.mediaAttachments?.filter(
            attachment => attachment.type === type
        ) as BoostCMSMediaAttachment[];
    };

    return useImmer<BoostCMSMediaState>({
        photos: state ? getCategoriesFromBoostCMSState(state, BoostMediaOptionsEnum.photo) : [],
        links: state ? getCategoriesFromBoostCMSState(state, BoostMediaOptionsEnum.link) : [],
        videos: state ? getCategoriesFromBoostCMSState(state, BoostMediaOptionsEnum.video) : [],
        documents: state
            ? getCategoriesFromBoostCMSState(state, BoostMediaOptionsEnum.document)
            : [],
    });
};

