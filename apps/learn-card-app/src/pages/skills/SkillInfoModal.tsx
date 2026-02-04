import React from 'react';

import {
    useModal,
    useGetSkill,
    useGetSelfAssignedSkillsBoost,
    useGetBoostSkills,
} from 'learn-card-base';

import { IonFooter } from '@ionic/react';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import SkillDetails from './SkillDetails';
import SkillsFrameworkIcon from '../../components/svgs/SkillsFrameworkIcon';
import SkillProficiencyBar, {
    SkillLevel,
    SkillProficiencyBarModeEnum,
} from './SkillProficiencyBar';

import {
    ApiSkillNode,
    convertApiSkillNodeToSkillTreeNode,
} from '../../helpers/skillFramework.helpers';
import { VC } from '@learncard/types';

type SkillInfoModalProps = {
    frameworkId: string;
    skillId: string;
    credentials: VC[];
};

const SkillInfoModal: React.FC<SkillInfoModalProps> = ({ frameworkId, skillId, credentials }) => {
    const { closeModal } = useModal();

    const { data: alignmentData } = useGetSkill(frameworkId ?? '', skillId ?? '');
    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills } = useGetBoostSkills(sasBoostData?.uri);

    const alignment = alignmentData
        ? convertApiSkillNodeToSkillTreeNode(alignmentData as ApiSkillNode)
        : undefined;

    const sasLevel = sasBoostSkills?.find(s => s.id === skillId)?.proficiencyLevel;

    const isTier = false;

    return (
        <div
            onClick={e => e.stopPropagation()}
            className="flex flex-col gap-[10px] bg-transparent mx-auto cursor-auto min-w-[300px] h-full"
        >
            <div className="h-full relative overflow-hidden bg-grayscale-200">
                <div className="h-full overflow-y-auto pb-[150px] pt-[40px] px-[20px] flex flex-col items-center">
                    <div className="my-auto flex flex-col items-center">
                        {/* {showDetails ? (
                        <SkillDetails frameworkId={frameworkId} skillId={skillId} />
                    ) : ( */}
                        <section className="bg-white rounded-[24px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 w-full">
                            <div className="bg-grayscale-50 flex flex-col gap-[10px] items-center p-[20px] border-b-[1px] border-grayscale-200 border-solid">
                                <div
                                    className={`${
                                        isTier
                                            ? 'p-[5px] rounded-[10px] bg-grayscale-900 text-grayscale-100'
                                            : ''
                                    }`}
                                >
                                    <span className="text-[60px] h-[80px] w-[80px] leading-[80px] font-fluentEmoji cursor-none pointer-events-none select-none">
                                        {alignment?.icon}
                                    </span>
                                </div>

                                <h2 className="text-[20px] text-grayscale-900 font-poppins">
                                    {alignment?.targetName}
                                </h2>

                                <div
                                    className={`px-[10px] py-[2px] flex gap-[3px] items-center rounded-[5px] overflow-hidden ${
                                        isTier ? '' : 'bg-violet-100'
                                    }`}
                                >
                                    {isTier ? (
                                        <>
                                            <SkillsFrameworkIcon
                                                className="w-[20px] h-[20px] text-grayscale-800"
                                                color="currentColor"
                                                version="outlined"
                                            />
                                            <p className="text-[12px] text-grayscale-800 font-poppins font-[600] uppercase">
                                                Framework Tier
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <PuzzlePiece
                                                className="w-[20px] h-[20px] text-grayscale-800"
                                                version="filled"
                                            />
                                            <p className="text-[12px] text-grayscale-800 font-poppins font-[600] uppercase">
                                                Skill
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {(alignment?.targetDescription ||
                                (!isTier && alignment?.targetCode)) && (
                                <div className="flex flex-col gap-[15px] p-[20px]">
                                    {alignment?.targetDescription && (
                                        <p className="text-grayscale-700 font-poppins text-[16px] tracking-[-0.25px]">
                                            {alignment?.targetDescription}
                                        </p>
                                    )}
                                    {Boolean(sasLevel) && sasLevel !== SkillLevel.Hidden && (
                                        <div className="border-t-[1px] border-grayscale-200 pt-[20px] flex flex-col gap-[5px] items-start w-full">
                                            <SkillProficiencyBar
                                                proficiencyLevel={sasLevel}
                                                mode={SkillProficiencyBarModeEnum.Display}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                        {/* )} */}
                        <SkillDetails
                            frameworkId={frameworkId}
                            skillId={skillId}
                            credentials={credentials}
                        />
                    </div>
                </div>
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
                        {/* <button
                            // onClick={openDetailsModal}
                            onClick={() => setShowDetails(!showDetails)}
                            className="p-[11px] bg-white rounded-full text-grayscale-900 shadow-button-bottom flex-1 font-poppins text-[17px]"
                        >
                            {showDetails ? 'Info' : 'Details'}
                        </button> */}
                    </div>
                </IonFooter>
            </div>
        </div>
    );
};

export default SkillInfoModal;
