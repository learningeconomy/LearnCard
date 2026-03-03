import React from 'react';
import { useHistory } from 'react-router-dom';
import { LocationState, SubheaderTypeEnum } from './MainSubHeader.types';
import AddAward from 'learn-card-base/svgs/AddAward';
import BoostSelectMenu from '../boost/boost-select-menu/BoostSelectMenu';
import useBoostModal from '../boost/hooks/useBoostModal';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { useCheckIfUserInNetwork } from '../network-prompts/hooks/useCheckIfUserInNetwork';

interface SubheaderPlusActionButtonProps {
    iconColor?: string;
    location: LocationState;
    handleSelfIssue: () => void;
    handleShareCreds: () => void;
    subheaderType: SubheaderTypeEnum;
}

const SubheaderPlusActionButton: React.FC<SubheaderPlusActionButtonProps> = ({
    iconColor = 'text-white',
    location,
    handleSelfIssue,
    handleShareCreds,
    subheaderType,
}) => {
    const history = useHistory();
    const checkIfUserInNetwork = useCheckIfUserInNetwork();

    const { handlePresentBoostModal } = useBoostModal(
        history,
        BoostCategoryOptionsEnum.socialBadge
    );

    return (
        <>
            <button
                onClick={e => {
                    e.preventDefault();
                    // presentCenterModal({
                    //     cssClass: 'center-modal user-options-modal',
                    //     backdropDismiss: true,
                    //     showBackdrop: false,
                    // });

                    if (!checkIfUserInNetwork()) return;

                    handlePresentBoostModal();
                }}
                className="modal-btn-desktop flex items-center justify-center h-12 w-12 rounded-full bg-white sub-header-plus-btn-desktop"
            >
                <AddAward className="h-[30px] w-[30px] text-grayscale-900" />
            </button>
            <button
                onClick={e => {
                    e.preventDefault();
                    // presentSheetModal({
                    //     cssClass: 'mobile-modal user-options-modal',
                    //     initialBreakpoint: 0.6,
                    //     breakpoints: [0, 0.6, 1],
                    //     handleBehavior: 'cycle',
                    // });

                    if (!checkIfUserInNetwork()) return;

                    handlePresentBoostModal();
                }}
                className="modal-btn-mobile flex items-center justify-center h-12 w-12 rounded-full bg-white sub-header-plus-btn-mobile"
            >
                <AddAward className="h-[30px] w-[30px] text-grayscale-900" />
            </button>
        </>
    );
};

export default SubheaderPlusActionButton;
