import React from 'react';
import { useHistory } from 'react-router-dom';
import { LocationState } from './MainSubHeader.types';

import AddAward from 'learn-card-base/svgs/AddAward';
import BoostTemplateSelector from '../boost/boost-template/BoostTemplateSelector';

import { ModalTypes, useModal } from 'learn-card-base';

interface SubheaderPlusActionButtonProps {
    iconColor?: string;
    location: LocationState;
    handleSelfIssue: () => void;
    handleShareCreds: () => void;
}

const SubheaderPlusActionButton: React.FC<SubheaderPlusActionButtonProps> = ({
    iconColor = 'text-white',
    location,
    handleSelfIssue,
    handleShareCreds,
}) => {
    const history = useHistory();
    const { newModal } = useModal({ desktop: ModalTypes.Cancel });

    return (
        <button
            onClick={e => {
                e.preventDefault();
                newModal(
                    <BoostTemplateSelector />,
                    {
                        hideButton: true,
                    },
                    {
                        desktop: ModalTypes.FullScreen,
                        mobile: ModalTypes.FullScreen,
                    }
                );
            }}
            className="flex items-center justify-center h-12 w-12 rounded-full bg-white"
        >
            <AddAward className="h-[30px] w-[30px] text-grayscale-900" />
        </button>
    );
};

export default SubheaderPlusActionButton;
