import React, { useState } from 'react';

import { IonItem, IonList } from '@ionic/react';
import { Checkmark } from '@learncard/react';

import {
    LearnerInsightsFilterOptionsEnum,
    LearnerInsightsSortOptionsEnum,
    LEARNER_INSIGHTS_FILTER_OPTIONS,
    LEARNER_INSIGHTS_SORT_OPTIONS,
} from './learner-insights.helpers';
import { useModal } from 'learn-card-base';

export const LearnerInsightsFilterSortingOptionsModal: React.FC<{
    filterBy: LearnerInsightsFilterOptionsEnum;
    setFilterBy: React.Dispatch<React.SetStateAction<LearnerInsightsFilterOptionsEnum>>;
    sortBy: LearnerInsightsSortOptionsEnum;
    setSortBy: React.Dispatch<React.SetStateAction<LearnerInsightsSortOptionsEnum>>;
}> = ({ filterBy, setFilterBy, sortBy, setSortBy }) => {
    const { closeModal } = useModal();

    const [_filterBy, _setFilterBy] = useState<LearnerInsightsFilterOptionsEnum>(filterBy);
    const [_sortBy, _setSortBy] = useState<LearnerInsightsSortOptionsEnum>(sortBy);

    const handleSetState = () => {
        setFilterBy(_filterBy);
        setSortBy(_sortBy);
        closeModal();
    };

    return (
        <>
            <IonList className="py-4 rounded-[20px] bg-white">
                {LEARNER_INSIGHTS_SORT_OPTIONS.map(option => {
                    return (
                        <IonItem
                            className="font-notoSans text-sm flex items-center justify-start text-left"
                            key={option.id}
                            lines="none"
                            button={true}
                            detail={false}
                            onClick={() => _setSortBy(option.type)}
                        >
                            {option.type === _sortBy ? (
                                <Checkmark className="text-grayscale-800 w-[24px] h-[24px] mr-1" />
                            ) : (
                                <div className="w-[24px] h-[24px] mr-1" />
                            )}
                            Sort by {option.title}
                        </IonItem>
                    );
                })}
                <div className="w-full flex items-center justify-center">
                    <div className="w-[90%] h-[1px] bg-grayscale-100 mt-2 mb-2" />
                </div>
                {LEARNER_INSIGHTS_FILTER_OPTIONS.map(option => {
                    return (
                        <IonItem
                            className="font-notoSans text-sm flex items-center justify-start text-left"
                            key={option.id}
                            lines="none"
                            button={true}
                            detail={false}
                            onClick={() => _setFilterBy(option.type)}
                        >
                            {option.type === _filterBy ? (
                                <Checkmark className="text-grayscale-800 w-[24px] h-[24px] mr-1" />
                            ) : (
                                <div className="w-[24px] h-[24px] mr-1" />
                            )}
                            {option.title}
                        </IonItem>
                    );
                })}
            </IonList>
            <div className="w-full flex items-center justify-center mt-4">
                <button
                    onClick={handleSetState}
                    type="button"
                    className="shrink-0 w-full py-2 h-full font-notoSans flex items-center justify-center text-xl bg-grayscale-900 rounded-[20px] shadow-bottom text-white"
                >
                    Set
                </button>
            </div>
        </>
    );
};

export default LearnerInsightsFilterSortingOptionsModal;
