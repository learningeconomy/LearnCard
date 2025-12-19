import React, { useState } from 'react';
import { useModal } from 'learn-card-base';
import CaretDown from 'apps/scouts/src/components/svgs/CaretDown';
import ScoutsTroopIcon from 'apps/scouts/src/assets/icons/ScoutsTroopIcon';

type SkillsFrameworkAdminSelectorProps = {
    selectedAdmins?: string[];
    onSelectAdmins?: (admins: string[]) => void;
};

const SkillsFrameworkAdminSelector: React.FC<SkillsFrameworkAdminSelectorProps> = ({
    selectedAdmins = [],
    onSelectAdmins,
}) => {
    const { closeModal } = useModal();
    const [selected, setSelected] = useState<string[]>(selectedAdmins);

    const handleSave = () => {
        onSelectAdmins?.(selected);
        closeModal();
    };

    return (
        <section className="bg-grayscale-100 rounded-[20px] flex flex-col max-w-[600px]">
            <div className="py-[10px] pl-[10px] pr-[20px] flex gap-[10px] items-center shadow-bottom-1-5">
                <ScoutsTroopIcon className="w-[65px] h-[65px]" />
                <p className="text-grayscale-800 font-poppins text-[20px] leading-[130%] tracking-[-0.25px]">
                    Select Admins
                </p>
                <CaretDown className="ml-auto text-grayscale-800" />
            </div>

            <div className="grow p-[15px] min-h-[300px] overflow-y-auto">
                <p className="text-grayscale-600 text-center">
                    Admin selection coming soon...
                </p>
            </div>

            <div className="bg-white p-[15px] flex gap-[10px] items-center">
                <button
                    onClick={closeModal}
                    className="bg-white text-grayscale-900 px-[20px] py-[7px] rounded-[30px] text-[17px] font-poppins flex-1 shadow-button-bottom"
                >
                    Close
                </button>
                <button
                    onClick={handleSave}
                    className="bg-emerald-700 text-white px-[20px] py-[7px] rounded-[30px] text-[17px] font-poppins flex-1 font-[600] leading-[130%] tracking-[-0.25px] shadow-button-bottom"
                >
                    Save ({selected.length})
                </button>
            </div>
        </section>
    );
};

export default SkillsFrameworkAdminSelector;
