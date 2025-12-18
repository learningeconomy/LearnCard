import React, { useState, useEffect } from 'react';
import { IonCol, IonRow } from '@ionic/react';
import Plus from 'learn-card-base/svgs/Plus';
import { BoostCMSState, SkillFrameworkNode } from '../../../boost';
import { useModal, ModalTypes, useGetBoostsThatUseFramework } from 'learn-card-base';
import BrowseFrameworkPage from 'apps/scouts/src/pages/SkillFrameworks/BrowseFrameworkPage';
import BoostCMSSkillDisplay from './BoostCMSSkillDisplay';
import { SetState } from 'packages/shared-types/dist';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import SelectFrameworkToManageModal from '../../../../../pages/SkillFrameworks/SelectFrameworkToManageModal';

/**
 * New framework-based skill selector for Scouts
 * Loads skills from Neo4j backend instead of hardcoded categories
 */
export const BoostFrameworkSkillSelector: React.FC<{
    state: BoostCMSState;
    setState: SetState<BoostCMSState>;
    reloadStateTrigger?: boolean;
}> = ({ state, setState, reloadStateTrigger }) => {
    const { newModal, closeModal } = useModal();

    const [selectedSkills, setSelectedSkills] = useState<SkillFrameworkNode[]>(
        (state.alignments as SkillFrameworkNode[]) ?? []
    );

    // const { data } = useGetBoostsThatUseFramework();

    useEffect(() => {
        setState(prev => ({
            ...prev,
            alignments: selectedSkills,
        }));
    }, [selectedSkills]);

    useEffect(() => {
        setSelectedSkills((state.alignments as SkillFrameworkNode[]) ?? []);
    }, [reloadStateTrigger]);

    const handleSelectSkills = () => {
        newModal(
            <SelectFrameworkToManageModal
                hideCreateFramework
                onFrameworkSelectOverride={framework => {
                    newModal(
                        <BrowseFrameworkPage
                            isSelectSkillsFlow
                            selectedSkills={selectedSkills}
                            setSelectedSkills={setSelectedSkills}
                            frameworkInfo={framework}
                            handleClose={closeModal}
                        />,
                        undefined,
                        {
                            desktop: ModalTypes.FullScreen,
                            mobile: ModalTypes.FullScreen,
                        }
                    );
                }}
            />,
            {
                sectionClassName: '!bg-transparent !shadow-none !overflow-visible',
            },
            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
        );
    };

    const handleRemoveSkill = (skill: SkillFrameworkNode) => {
        setSelectedSkills(prev => prev.filter(s => s.id !== skill.id));
    };

    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-4 rounded-[20px]">
            <IonCol size="12" className="w-full bg-white flex items-center justify-between">
                <h1 className="text-grayscale-900 text-xl p-0 m-0 font-notoSans flex items-center gap-[5px]">
                    <PuzzlePiece className="w-6 h-6" version="filled" />
                    Skills
                </h1>
                <button
                    onClick={() => {
                        handleSelectSkills();
                        // boostSearchStore.set.boostUri(parentBoostUri);
                    }}
                    className="flex items-center justify-center text-grayscale-800 rounded-full bg-white w-[38px] h-[38px] shadow-3xl"
                >
                    <Plus className="w-[30px] h-[30px]" />
                </button>
            </IonCol>

            {selectedSkills.map((skill, index) => (
                <BoostCMSSkillDisplay
                    key={index}
                    skill={skill}
                    handleRemoveSkill={handleRemoveSkill}
                />
            ))}
        </IonRow>
    );
};

export default BoostFrameworkSkillSelector;
