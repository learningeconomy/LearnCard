import React from 'react';

import CaretDown from 'learn-card-base/svgs/CaretDown';
import { AdminToolsFamilySelector } from './AdminToolsFamilySelector';

import { ProfilePicture, useModal, ModalTypes } from 'learn-card-base';
import { VC } from '@learncard/types';

export const AdminToolsFamilySelectorButton: React.FC<{
    setSelectedFamily: React.Dispatch<
        React.SetStateAction<
            | {
                  name: string;
                  picture: string;
                  uri: string;
              }
            | undefined
        >
    >;
    families: VC[];
    selectedFamily: VC | undefined;
}> = ({ setSelectedFamily, families, selectedFamily }) => {
    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    return (
        <button
            onClick={() =>
                newModal(
                    <AdminToolsFamilySelector
                        families={families}
                        selectedFamily={selectedFamily}
                        setSelectedFamily={setSelectedFamily}
                    />,
                    { sectionClassName: '!max-w-[400px]' }
                )
            }
            className="w-full rounded-full pl-[2px] pr-4 py-[6px] flex items-center justify-between border-[1px] border-solid border-grayscale-100 bg-grayscale-100 mt-4"
        >
            <div className="flex items-center justify-start">
                <div className="w-[40px] h-[40px] rounded-full bg-grayscale-100 mr-2 overflow-hidden">
                    <ProfilePicture
                        customSize={120}
                        customContainerClass="w-[40px] h-[40px]"
                        customImageClass="w-full h-full object-cover"
                        overrideSrc
                        overrideSrcURL={selectedFamily?.picture}
                    />
                </div>
                <div className="flex flex-col items-start justify-center">
                    <h4 className="text-grayscale-800 text-left text-[17px]">
                        {selectedFamily?.name}
                    </h4>

                    <p className="text-grayscale-600 font-bold text-left text-xs">Family</p>
                </div>
            </div>
            <CaretDown className="w-[20px] h-[20px] text-grayscale-800" />
        </button>
    );
};

export default AdminToolsFamilySelectorButton;
