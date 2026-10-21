import React from 'react';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import { VC } from '@learncard/types';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import * as m from '../../../paraglide/messages.js';

interface TroopButtonProps {
    record: VC;
    credentialUri?: string;
    handleSelectingContactGroup: (group: string, boostId?: string) => void;
    selectedGroup: string | null;
    troopCountsInModal: {
        [key: string]: number;
    };
}

const TroopButton: React.FC<TroopButtonProps> = ({
    record,
    credentialUri,
    handleSelectingContactGroup,
    selectedGroup,
    troopCountsInModal,
}) => {
    const credential = unwrapBoostCredential(record);
    const recordAchievementType = credential?.credentialSubject?.achievement?.achievementType;

    const count = credentialUri ? (troopCountsInModal[credentialUri] ?? null) : null;

    if (!credentialUri) return null;
    if (count === 0) return null;
    if (recordAchievementType === 'ext:NetworkID' || recordAchievementType === 'ext:GlobalID')
        return null;

    return (
        <button
            onClick={() => handleSelectingContactGroup(credentialUri, record?.boostId)}
            className="relative flex bg-white border-solid border-grayscale-200 border rounded-[30px] p-[5px] pt-[10px] pl-[10px] w-full max-w-[550px] mt-[15px]"
        >
            <img className="w-[40px] h-[40px] rounded-[40px] mr-2" src={credential?.image} />
            <div className="flex flex-col items-start text-grayscale-900">
                <p>{credential?.name}</p>
                <p>{m['addressBook.contactsCount']({ count })}</p>
            </div>
            {selectedGroup === credentialUri && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-white rounded-full bg-emerald-700 shadow-3xl w-8 h-8">
                    <Checkmark className="w-7 h-auto" />
                </div>
            )}
        </button>
    );
};

export default TroopButton;
