import React from 'react';

import { TroopsCMSState, TroopsCMSViewModeEnum } from './troopCMSState';
import { getDefaultBadgeThumbForViewMode } from '../../helpers/troop.helpers';
import { getBadgeThumbnail } from './troops.helpers';

type TroopsCMSThumbnailProps = {
    viewMode: TroopsCMSViewModeEnum;
    state: TroopsCMSState;
};

export const TroopsCMSThumbnail: React.FC<TroopsCMSThumbnailProps> = ({ viewMode, state }) => {
    const thumbnail = getBadgeThumbnail(state);

    return (
        <div className="w-full flex items-center justify-center mt-4 mb-4">
            <div className="overflow-hidden flex items-center justify-center max-w-[100px] max-h-[100px] h-[100px] w-[100px] object-contain rounded-full bg-white border-solid border-white border-[1px]">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt="network thumb"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    getDefaultBadgeThumbForViewMode(viewMode, 'h-full w-full')
                )}
            </div>
        </div>
    );
};

export default TroopsCMSThumbnail;
