import React, { useState } from 'react';

import { TextInput, useModal } from 'learn-card-base';

import { X } from 'lucide-react';
import Search from 'learn-card-base/svgs/Search';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import { ExperiencesIconSolid } from 'learn-card-base/svgs/wallet/ExperiencesIcon';
import { AiPathwaysIconWithShape } from 'learn-card-base/svgs/wallet/AiPathwaysIcon';

type ExplorePathwaysModalProps = { initialSearchQuery?: string };

const ExplorePathwaysModal: React.FC<ExplorePathwaysModalProps> = ({ initialSearchQuery = '' }) => {
    const { closeModal } = useModal();

    const [search, setSearch] = useState(initialSearchQuery);

    return (
        <div className="h-full relative bg-grayscale-50 overflow-hidden text-grayscale-900">
            <div className="px-[15px] py-[20px] bg-white safe-area-top-margin flex flex-col gap-[15px] z-20 relative shadow-bottom-1-5 rounded-b-[20px]">
                <div className="flex items-center gap-[10px] text-grayscale-900">
                    <AiPathwaysIconWithShape className="w-[50px] h-[50px]" />
                    <h5 className="text-[21px] font-poppins font-[600] leading-[24px]">
                        Explore Pathways
                    </h5>
                </div>
                <button onClick={closeModal} className="absolute top-[20px] right-[20px]">
                    <X />
                </button>

                <TextInput
                    placeholder="Search by skill, goal, or job..."
                    value={search}
                    onChange={setSearch}
                    startIcon={<Search className="text-grayscale-900 w-[25px] h-[25px]" />}
                    endIcon={
                        search ? (
                            <button onClick={() => setSearch('')}>
                                <X className="text-grayscale-500 h-[25px] w-[25px]" />
                            </button>
                        ) : undefined
                    }
                />
            </div>

            {/* {isUpdating && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-30">
                    <IonSpinner color="dark" name="crescent" />
                </div>
            )} */}

            <section className="h-full pt-[20px] px-[20px] pb-[222px] overflow-y-auto z-0 relative">
                Main Stuff
            </section>

            <footer className="w-full flex justify-center bg-opacity-70 backdrop-blur-[5px] p-[20px] absolute bottom-0 left-0 bg-white border-solid border-[1px] border-white">
                <div className="w-full flex flex-col items-center justify-center gap-[10px] max-w-[600px]">
                    <button
                        onClick={closeModal}
                        className="w-full bg-violet-500 text-white font-bold flex items-center justify-center gap-[5px] py-[7px] px-[15px] rounded-[30px] shadow-bottom-3-4 font-poppins text-[17px] leading-[24px] tracking-[0.25px]"
                    >
                        <PuzzlePiece className="w-[30px] h-[30px]" version="filled" />
                        Grow Skills
                    </button>

                    <button
                        onClick={closeModal}
                        className="w-full bg-cyan-501 text-white font-bold flex items-center justify-center gap-[5px] py-[7px] px-[15px] rounded-[30px] shadow-bottom-3-4 font-poppins text-[17px] leading-[24px] tracking-[0.25px]"
                    >
                        <ExperiencesIconSolid inverseColors className="w-[30px] h-[30px]" />
                        Explore Roles
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default ExplorePathwaysModal;
