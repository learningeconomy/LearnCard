import React, { useState } from 'react';
import { useModal } from 'learn-card-base';

import X from 'learn-card-base/svgs/X';
import Search from 'learn-card-base/svgs/Search';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import { IonFooter, IonInput } from '@ionic/react';

type SelfAssignSkillsModalProps = {};

const SelfAssignSkillsModal: React.FC<SelfAssignSkillsModalProps> = ({}) => {
    const { closeModal } = useModal();
    const [searchInput, setSearchInput] = useState('');

    return (
        <div className="h-full relative bg-grayscale-50 overflow-hidden">
            <div className="px-[20px] py-[20px] bg-white safe-area-top-margin flex flex-col gap-[10px] z-20 relative border-b-[1px] border-grayscale-200 border-solid rounded-b-[30px]">
                <div className="flex items-center gap-[10px] text-grayscale-900">
                    <PuzzlePiece className="w-[40px] h-[40px]" version="filled" />
                    <h5 className="text-[22px] font-poppins font-[600] leading-[24px]">
                        Add Skills
                    </h5>
                </div>
            </div>

            <section className="h-full flex flex-col gap-[10px] pt-[20px] px-[20px] pb-[222px] overflow-y-auto z-0">
                <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <Search className="text-grayscale-900 w-[24px] h-[24px]" />
                    </div>
                    <IonInput
                        type="text"
                        value={searchInput}
                        placeholder="Search by skill or occupation..."
                        onIonInput={e => setSearchInput(e.detail.value)}
                        className="bg-grayscale-100 text-grayscale-800 rounded-[10px] !py-[4px] font-normal !font-notoSans text-[14px] !pl-[44px] !text-left !pr-[36px]"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchInput('');
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-grayscale-600 hover:text-grayscale-800 transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <p className="py-[10px] text-grayscale-600 text-[17px] font-[600] font-poppins border-solid border-t-[1px] border-grayscale-200">
                    Suggested Skills
                </p>
            </section>

            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center bg-opacity-80 backdrop-blur-[5px] p-[20px] absolute bottom-0 left-0 bg-white border-solid border-[1px] border-white"
            >
                <div className="w-full flex items-center justify-center gap-[10px] max-w-[600px]">
                    <button
                        onClick={closeModal}
                        className="p-[11px] bg-white rounded-full text-grayscale-900 shadow-button-bottom flex-1 font-poppins text-[17px]"
                    >
                        Close
                    </button>

                    <button
                        // onClick={isEdit ? handleEdit : handleCreate}
                        className="px-[15px] py-[7px] bg-emerald-700 text-white rounded-[30px] text-[17px] font-[600] font-poppins leading-[24px] tracking-[0.25px] shadow-button-bottom h-[44px] flex-1 disabled:bg-grayscale-300"
                    >
                        Action Button
                    </button>
                </div>
            </IonFooter>
        </div>
    );
};

export default SelfAssignSkillsModal;
