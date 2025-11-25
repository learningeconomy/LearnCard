import React from 'react';

import TroopID from '../TroopIDCard';
import IDSleeve from 'learn-card-base/svgs/IDSleeve';
import QRCodeScanner from '../../../svgs/QRCodeScanner';

import { TroopsCMSState, TroopsCMSViewModeEnum } from '../../troopCMSState';

export const TroopIDPreviewFrontFace: React.FC<{
    rootViewMode: TroopsCMSViewModeEnum;
    viewMode: TroopsCMSViewModeEnum;
    state: TroopsCMSState;
}> = ({ rootViewMode, viewMode, state }) => {
    const isInGlobalViewMode = rootViewMode === TroopsCMSViewModeEnum.global;
    const isInNetworkViewMode = rootViewMode === TroopsCMSViewModeEnum.network;
    const isInTroopViewMode = rootViewMode === TroopsCMSViewModeEnum.troop;
    const isInMemberViewMode = viewMode === TroopsCMSViewModeEnum.member;
    const isInLeaderViewMode = viewMode === TroopsCMSViewModeEnum.leader;

    let title = '';
    if (isInGlobalViewMode) {
        title = 'Global Admin Name';
    } else if (isInNetworkViewMode) {
        title = 'National Admin Name';
    } else if (isInTroopViewMode && isInLeaderViewMode) {
        title = 'Leader Name';
    } else if (isInTroopViewMode && isInMemberViewMode) {
        title = 'Scout Name';
    }

    const idState = state;
    const network = state?.parentID;

    let name = state?.basicInfo?.name;
    if (!name) {
        name = isInNetworkViewMode || isInGlobalViewMode ? 'Network Name' : 'Troop';
    } else if (!isInGlobalViewMode && !isInNetworkViewMode) {
        name = `Troop ${name}`;
    }

    return (
        <div className="rounded-t-[20px] rounded-b-[20px] shadow-box-bottom overflow-hidden flex flex-col">
            <div className="w-full flex items-center justify-center flex-col bg-white bg-opacity-70 backdrop-blur-[10px] rounded-t-[20px]">
                <div className="w-full py-4 max-w-[335px]">
                    <TroopID
                        idState={idState}
                        viewMode={viewMode}
                        rootViewMode={rootViewMode}
                        state={state}
                    />
                </div>

                <div className="w-full flex items-center justify-center relative pt-4">
                    <button className="flex items-center justify-center absolute rounded-full bg-white p-2 top-[-0px]">
                        <QRCodeScanner className="h-auto w-8" />
                    </button>

                    <IDSleeve className="h-auto w-full" />

                    <button className="rounded-[20px] py-[5px] px-[14px] bg-grayscale-900 absolute top-[27px] right-[10px] text-[12px] font-notoSans font-[600] text-white">
                        Draft
                    </button>
                </div>

                <div className="w-full bg-white flex flex-col items-center justify-center pt-8 pb-8">
                    <span className="font-notoSans text-[17px] text-center">
                        Issued to {title}
                        <br />
                        by {name}
                    </span>
                    <h4 className="text-[14px] font-notoSans font-semibold text-gray-900">
                        {network?.basicInfo?.name}
                    </h4>
                </div>

                {/* <div className="w-full flex items-center justify-center bg-white">
                    <div className="w-full max-w-[95%] border-b-2 border-b-solid border-b-grayscale-100" />
                </div> */}

                {/* <div className="w-full flex items-center justify-center bg-white text-sp-blue-light font-notoSans pt-4 pb-4 border-b-solid text-xs font-medium">
                    <CredentialVerificationDisplay
                        credential={{
                            issuer: currentLCNUser?.did,
                            credentialSubject: {
                                id: 'did:example:123',
                            },
                        }}
                        iconClassName="!h-[17px] !w-[17px]"
                        showText
                    />
                </div> */}
            </div>
        </div>
    );
};

export default TroopIDPreviewFrontFace;
