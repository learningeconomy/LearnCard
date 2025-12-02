import React from 'react';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import SkillsFrameworkIcon from '../../components/svgs/SkillsFrameworkIcon';
import { FrameworkNodeRole } from '../../components/boost/boost';

type AlignmentToggleProps = {
    role: FrameworkNodeRole;
    onRoleChange: (role: FrameworkNodeRole) => void;
};

const AlignmentToggle: React.FC<AlignmentToggleProps> = ({ role, onRoleChange }) => {
    const isTier = role === FrameworkNodeRole.tier;

    const icon = isTier ? (
        <SkillsFrameworkIcon
            version="outlined"
            className="text-grayscale-900 h-[20px] w-[20px]"
            color="currentColor"
        />
    ) : (
        <PuzzlePiece className="h-[20px] w-[20px] text-grayscale-900" version="filled" />
    );

    return (
        <button
            className={`h-[36px] w-[64px] rounded-[40px] flex items-center relative ${
                isTier ? 'bg-grayscale-900' : 'bg-violet-700'
            }`}
            onClick={() =>
                onRoleChange(isTier ? FrameworkNodeRole.competency : FrameworkNodeRole.tier)
            }
        >
            <div
                className={`w-[32px] h-[32px] rounded-full bg-white flex items-center justify-center absolute transition-transform duration-200 ease-in-out ${
                    isTier ? 'translate-x-[2px]' : 'translate-x-[30px]'
                }`}
            >
                {icon}
            </div>
        </button>
    );
};

export default AlignmentToggle;
