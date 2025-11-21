import React from 'react';
import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import { ModalTypes, useModal } from 'learn-card-base';
import ScoutConnectModal from './ScoutConnectModal';
import { VC, Boost } from '../../../../../../LearnCard/packages/learn-card-types/dist';
import { getTroopIdThumbOrDefault } from '../../helpers/troop.helpers';

type TroopInviteSelectionModalProps = {
    scoutBoostUri: string;
    troopBoostUri: string;
    credential: VC | Boost;
};
const TroopInviteSelectionModal: React.FC<TroopInviteSelectionModalProps> = ({
    troopBoostUri,
    scoutBoostUri,
    credential,
}) => {
    const { newModal } = useModal({ desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel });

    return (
        <div className="p-4 flex flex-col gap-4">
            {/* Scout Option */}
            <div
                className="flex items-center ml-2 mt-2 cursor-pointer"
                onClick={() => {
                    newModal(
                        <ScoutConnectModal
                            boostUriForClaimLink={scoutBoostUri}
                            credential={credential}
                            type="Scout"
                        />
                    );
                }}
            >
                {getTroopIdThumbOrDefault(scoutBoostUri, 'h-[40px] w-[40px] rounded-full')}
                <span className="flex-grow font-['Noto_Sans'] text-[17px] leading-[23px] text-[#18224E] pl-2">
                    Scout
                </span>
                <SkinnyCaretRight className="text-grayscale-400 w-[20px] h-[20px]" />
            </div>
            <div className="bottom-0 h-[1px] bg-gray-200 w-[100%]"></div>
            {/* Leader Option */}
            <div
                className="flex items-center ml-2 mt-2 cursor-pointer"
                onClick={() => {
                    newModal(
                        <ScoutConnectModal
                            boostUriForClaimLink={troopBoostUri}
                            credential={credential}
                            type="Leader"
                        />
                    );
                }}
            >
                {getTroopIdThumbOrDefault(credential, 'h-[40px] w-[40px] rounded-full')}
                <p className="flex-grow font-['Noto_Sans'] text-[17px] leading-[23px] text-[#18224E] pl-2">
                    Leader
                </p>
                <SkinnyCaretRight className="text-grayscale-400 w-[20px] h-[20px]" />
            </div>
        </div>
    );
};

export default TroopInviteSelectionModal;
