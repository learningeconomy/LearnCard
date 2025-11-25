import React from 'react';

import EndorsementBadge from '../EndorsementBadge';
import { VC } from '@learncard/types';

import {
    CredentialCategoryEnum,
    useGetVCInfo,
    boostPreviewStore,
    BoostPreviewTabsEnum,
} from 'learn-card-base';

import EndorsementListItem from './EndorsementListItem';

export const EndorsementsList: React.FC<{
    credential: VC;
    categoryType: CredentialCategoryEnum;
    existingEndorsements?: VC[]; // existing endorsements from the boost preview | presentation
}> = ({ credential, categoryType, existingEndorsements = [] }) => {
    const maxEndorsementsDisplayed = 2;

    const { endorsements } = useGetVCInfo(credential, categoryType); // endorsements from the credential (Owners POV)

    const endorsementItems =
        endorsements.length > 0
            ? endorsements
                  .slice(0, maxEndorsementsDisplayed)
                  .map(({ endorsement, metadata }, index) => (
                      <EndorsementListItem
                          endorsement={endorsement}
                          metadata={metadata}
                          key={index}
                      />
                  ))
            : null;

    const existingEndorsementItems =
        existingEndorsements.length > 0
            ? existingEndorsements
                  .slice(0, maxEndorsementsDisplayed)
                  .map((endorsement, index) => (
                      <EndorsementListItem endorsement={endorsement} key={index} />
                  ))
            : null;

    const noEndorsements = !endorsementItems && !existingEndorsementItems;
    if (noEndorsements) return null;

    return (
        <div className="py-4 px-4 gap-4 bg-white flex flex-col items-start rounded-[20px] w-full shadow-bottom-2-4">
            <div className="flex items-center justify-between w-full">
                <h1 className="text-[17px] text-grayscale-900">Endorsements</h1>
                <EndorsementBadge
                    credential={credential}
                    categoryType={categoryType}
                    className="!px-[8px] !mt-0"
                    existingEndorsements={existingEndorsements}
                />
            </div>

            <div className="flex flex-col items-start justify-start w-full gap-4">
                {endorsementItems}
                {existingEndorsementItems}
            </div>
            {(endorsements.length > maxEndorsementsDisplayed ||
                existingEndorsements.length > maxEndorsementsDisplayed) && (
                <div className="flex items-center justify-center w-full">
                    <button
                        onClick={() => {
                            boostPreviewStore.set.updateSelectedTab(
                                BoostPreviewTabsEnum.Endorsements
                            );
                        }}
                        className="text-sm text-grayscale-900 font-semibold"
                    >
                        View All
                    </button>
                </div>
            )}
        </div>
    );
};

export default EndorsementsList;
