import React from 'react';
import { useHistory } from 'react-router-dom';
import { ModalTypes, useModal } from 'learn-card-base';
import { ProfilePicture } from 'learn-card-base';
import SolidCircleIcon from 'learn-card-base/svgs/SolidCircleIcon';
import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';

const getIconForActionButton = (label: string) => {
    switch (label) {
        case 'New AI Session':
            return <BlueMagicWand className="w-[50px] h-auto" />;
        case 'Boost Someone':
            return <BlueMagicWand className="w-[50px] h-auto" />;
        case 'Create Resume':
            return <BlueMagicWand className="w-[50px] h-auto" />;
        case 'Add Studies':
            return <BlueMagicWand className="w-[50px] h-auto" />;
        case 'Add Credential':
            return <BlueMagicWand className="w-[50px] h-auto" />;
    }
};

const ActionButton: React.FC<{
    label: string;
    bg: string;
    to?: string;
}> = ({ label, bg, to }) => {
    const history = useHistory();
    const { closeModal } = useModal({ desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel });

    return (
        <button
            type="button"
            onClick={() => {
                if (to) {
                    history.push(to);
                }
                closeModal();
            }}
            className={`${bg} w-full text-lef flex px-5 py-4  text-[18px] font-poppins font-semibold text-grayscale-900 rounded-[20px] border border-solid border-[3px] border-white shadow-[0_2px_6px_0_rgba(0,0,0,0.25)]`}
        >
            <div className="flex items-center justify-center">
                <span className="mr-2">{getIconForActionButton(label)}</span> {label}
            </div>
        </button>
    );
};

const LaunchPadActionModal: React.FC = () => {
    return (
        <div className="w-full flex flex-col items-stretch p-4 gap-3 max-w-[380px]">
            <div className="rounded-[15px] bg-white shadow-[0_2px_6px_0_rgba(0,0,0,0.25)] px-[10px] py-[15px]">
                <div className="w-full flex items-center justify-center">
                    <ProfilePicture
                        customContainerClass="flex justify-center items-center h-[48px] w-[48px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-xl min-w-[48px] min-h-[48px]"
                        customImageClass="flex justify-center items-center h-[48px] w-[48px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[48px] min-h-[48px]"
                        customSize={120}
                    />
                </div>

                <div className="w-full flex items-center justify-center">
                    <div className="px-3 py-1 rounded-full border border-solid border-[#E2E3E9] bg-grayscale-white text-grayscale-700 text-sm font-poppins font-semibold">
                        Learner ▼
                    </div>
                </div>

                <h3 className="text-center text-[22px] font-poppins font-semibold text-grayscale-900 mt-[12px]">
                    What would you like to do?
                </h3>
            </div>

            <div className="mt-1 flex flex-col gap-3">
                <ActionButton label="New AI Session" bg="bg-[#7DE3F6]" to="/ai/topics" />
                <ActionButton label="Boost Someone" bg="bg-[#6E8BFF]" to="/boost" />
                <ActionButton label="Create Resume" bg="bg-[#B8F36B]" to="/ai/insights" />
                <ActionButton label="Add Studies" bg="bg-[#69D7AE]" to="/learninghistory" />
                <ActionButton label="Add Credential" bg="bg-[#F7D54D]" to="/store" />
            </div>
        </div>
    );
};

export default LaunchPadActionModal;
