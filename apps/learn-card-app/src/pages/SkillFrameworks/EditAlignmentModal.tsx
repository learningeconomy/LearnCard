import React, { useEffect, useRef, useState } from 'react';
import { ModalTypes, useDeviceTypeByWidth, useModal } from 'learn-card-base';

import X from '../../components/svgs/X';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import CaretDown from 'learn-card-base/svgs/CaretDown';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import FrameworkImage from './FrameworkImage';
import AlignmentToggle from './AlignmentToggle';
import SkillBreadcrumbText from './SkillBreadcrumbText';
import SkillsFrameworkIcon from 'apps/learn-card-app/src/components/svgs/SkillsFrameworkIcon';
import ConfirmAlignmentDeletionModal from './ConfirmAlignmentDeletionModal';
import { IonFooter, IonInput, IonTextarea } from '@ionic/react';

import {
    FrameworkNodeRole,
    SkillFramework,
    SkillFrameworkNode,
} from 'apps/learn-card-app/src/components/boost/boost';

type EditAlignmentModalProps = {
    framework: SkillFramework;
    node?: SkillFrameworkNode;
    selectedPath?: SkillFrameworkNode[];
    handleAdd?: (
        parentNodeId: string,
        node: SkillFrameworkNode,
        parentPath: SkillFrameworkNode[]
    ) => void;
    handleEdit?: (node: SkillFrameworkNode, path: SkillFrameworkNode[]) => void;
    handleDelete?: (
        node: SkillFrameworkNode,
        numberOfSkillsDeleted: number,
        parentPathIds: string[]
    ) => void;
    isCreate?: boolean;
    countOverride?: number;
    countAdjustment?: number;
};

const EditAlignmentModal: React.FC<EditAlignmentModalProps> = ({
    framework,
    node: _node,
    selectedPath = [],
    handleAdd,
    handleEdit,
    handleDelete,
    isCreate,
    countOverride,
    countAdjustment = 0,
}) => {
    const { newModal, closeModal } = useModal();

    const { isDesktop, isMobile } = useDeviceTypeByWidth();

    const parentNodeId = selectedPath[selectedPath.length - 1]?.id ?? 'root';

    const defaultTierIcon = '🗃️';
    const defaultSkillIcon = '🧩';
    const emptyNode: SkillFrameworkNode = {
        targetName: '',
        targetCode: '',
        role: FrameworkNodeRole.tier,
        icon: defaultTierIcon,
        subskills: [],
        type: 'Alignment',
    };

    const [node, setNode] = useState<SkillFrameworkNode>(_node || emptyNode);

    const isTier = node.role === FrameworkNodeRole.tier;

    // used to track if the click originated in the content area
    //   fixes case where a click that started inside {content} but ended outside of it would
    //   close the modal. e.g. highlighting input text and releasing mouse when the cursor is off of the modal
    const mouseDownInsideContent = useRef(false);
    const handleMouseDown = (e: React.MouseEvent) => {
        // Only set to true if the click originated in the content area
        if (e.target === e.currentTarget) {
            mouseDownInsideContent.current = true;
        }
    };
    const handleIntentionalClose = (e: React.MouseEvent) => {
        // Only close if the click started and ended on the backdrop
        if (mouseDownInsideContent.current && e.target === e.currentTarget) {
            closeModal();
        }
        mouseDownInsideContent.current = false;
    };

    useEffect(() => {
        // update the main structure whenever a local change is made
        if (!isCreate) {
            handleEdit?.(node, selectedPath);
        }
    }, [node]);

    useEffect(() => {
        if (isCreate) {
            // if role has changed from tier to competency and icon = default tier icon, change it to default skill icon
            // and vice versa
            if (node.role === FrameworkNodeRole.competency && node.icon === defaultTierIcon) {
                setNode(prev => ({
                    ...prev,
                    icon: defaultSkillIcon,
                }));
            }
            if (node.role === FrameworkNodeRole.tier && node.icon === defaultSkillIcon) {
                setNode(prev => ({
                    ...prev,
                    icon: defaultTierIcon,
                }));
            }
        }
    }, [isCreate, node.role]);

    const handleDeleteButtonClick = () => {
        newModal(
            <ConfirmAlignmentDeletionModal
                frameworkId={framework.id}
                node={node}
                onDelete={numberOfSkillsDeleted => {
                    handleDelete?.(
                        node,
                        numberOfSkillsDeleted,
                        selectedPath.map(node => node.id)
                    );
                    setTimeout(() => {
                        // close this edit alignment modal w/ delay because the deletion modal will call closeModal for itself
                        //   needs delay to handle animation delay
                        closeModal();
                    }, 301);
                }}
                countOverride={countOverride}
                countAdjustment={countAdjustment}
            />,
            {
                sectionClassName: '!bg-transparent !shadow-none !max-w-[450px]',
                cancelButtonTextOverride: 'Cancel',
            },
            {
                desktop: ModalTypes.Cancel,
                mobile: ModalTypes.Cancel,
            }
        );
    };

    const handleSaveButtonClick = () => {
        handleAdd?.(parentNodeId, node, selectedPath);
        closeModal();
    };

    const presentEmojiPicker = () => {
        newModal(
            <div className="p-2">
                <Picker
                    data={data}
                    onEmojiSelect={(emoji: any) => {
                        setNode(prev => ({
                            ...prev,
                            icon: emoji.native,
                        }));
                        closeModal();
                    }}
                    theme="auto"
                    previewPosition="none"
                    skinTonePosition="search"
                    emojiButtonSize={32}
                    emojiSize={22}
                    perLine={8}
                />
            </div>,
            { sectionClassName: '!bg-transparent !shadow-none !w-fit' },
            {
                desktop: ModalTypes.Center,
                mobile: ModalTypes.Center,
            }
        );
    };

    const content = (
        <div
            onClick={e => e.stopPropagation()}
            className="flex flex-col gap-[10px] bg-transparent max-w-[450px] mx-auto cursor-auto"
        >
            <section className="bg-white rounded-[24px] flex flex-col overflow-y-auto shadow-box-bottom">
                <div className="flex flex-col gap-[5px] px-[20px] py-[10px]">
                    <div className="flex items-center gap-[10px]">
                        <FrameworkImage
                            image={framework.image}
                            sizeClassName="w-[40px] h-[40px]"
                            iconSizeClassName="w-[24px] h-[24px]"
                        />
                        <h5 className="text-[14px] text-grayscale-900 font-poppins font-[600] line-clamp-2">
                            {framework.name}
                        </h5>
                    </div>

                    <SkillBreadcrumbText path={selectedPath} />
                </div>

                <div className="bg-grayscale-50 flex flex-col gap-[10px] items-center p-[20px] border-t-[1px] border-b-[1px] border-grayscale-200 border-solid">
                    <button
                        onClick={presentEmojiPicker}
                        className={`p-[5px] rounded-[10px] flex gap-[10px] items-center ${
                            isTier
                                ? 'bg-grayscale-900 text-grayscale-100'
                                : 'bg-grayscale-100 text-grayscale-700'
                        }`}
                    >
                        <span className="text-[60px] h-[80px] w-[80px] leading-[80px] font-fluentEmoji cursor-none pointer-events-none select-none">
                            {node?.icon}
                        </span>
                        <CaretDown className="w-[15px] h-[15px]" />
                    </button>

                    {!isTier && (
                        <div className="flex flex-col gap-[5px] w-full">
                            <label className="text-grayscale-600 font-poppins text-[12px] font-[600]">
                                Code
                            </label>
                            <IonInput
                                onIonInput={e => {
                                    setNode(prev => ({
                                        ...prev,
                                        targetCode: e.detail.value ?? '',
                                    }));
                                }}
                                className="bg-grayscale-100 text-grayscale-800 rounded-[10px] !py-[5px] !px-[10px]"
                                placeholder="Code"
                                value={node.targetCode}
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-[5px] w-full">
                        <label className="text-grayscale-600 font-poppins text-[12px] font-[600]">
                            Title*
                        </label>
                        <IonInput
                            onIonInput={e => {
                                setNode(prev => ({
                                    ...prev,
                                    targetName: e.detail.value ?? '',
                                }));
                            }}
                            className="bg-grayscale-100 text-grayscale-800 rounded-[10px] !py-[5px] !px-[10px]"
                            placeholder="Title"
                            value={node.targetName}
                        />
                    </div>

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

                    <AlignmentToggle
                        role={node.role}
                        onRoleChange={role => setNode(prev => ({ ...prev, role }))}
                    />

                    {isTier ? (
                        <p className="text-center font-poppins text-[14px] text-grayscale-700 tracking-[-0.25px]">
                            A <span className="font-[600]">framework tier</span> serves as a
                            structural container for skills.
                        </p>
                    ) : (
                        <p className="text-center font-poppins text-[14px] text-grayscale-700 tracking-[-0.25px]">
                            A <span className="font-[600]">skill</span> is a verified credential
                            that can be awarded and earned.
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-[15px] p-[20px]">
                    <div className="flex flex-col gap-[5px] w-full">
                        <label className="text-grayscale-600 font-poppins text-[12px] font-[600]">
                            Statement
                        </label>
                        <IonTextarea
                            onIonInput={e => {
                                setNode(prev => ({
                                    ...prev,
                                    targetDescription: e.detail.value ?? '',
                                }));
                            }}
                            className="bg-grayscale-100 text-grayscale-800 rounded-[10px] !py-[5px] !px-[10px]"
                            placeholder="Statement"
                            value={node.targetDescription}
                            rows={4}
                        />
                    </div>
                </div>
            </section>

            {!isCreate && (
                <>
                    <button
                        onClick={closeModal}
                        className="bg-white text-grayscale-900 py-[10px] pl-[20px] pr-[15px] rounded-[30px] flex gap-[10px] items-center justify-center shadow-bottom-3-4 font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px]"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleDeleteButtonClick}
                        className="bg-rose-600 py-[10px] pl-[20px] pr-[15px] rounded-[30px] flex gap-[10px] items-center justify-center shadow-bottom-3-4 font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white"
                    >
                        <TrashBin className="w-[24px] h-[24px]" version="thin" />
                        Delete
                    </button>
                </>
            )}

            {isDesktop && isCreate && (
                <button
                    onClick={handleSaveButtonClick}
                    className="py-[10px] pl-[20px] pr-[15px] bg-emerald-500 font-[600] rounded-[30px] text-white shadow-button-bottom font-poppins text-[17px] disabled:bg-grayscale-300"
                    disabled={!node.targetName}
                >
                    Create
                </button>
            )}
        </div>
    );

    return isDesktop ? (
        <div
            role="button"
            onMouseDown={handleMouseDown}
            onClick={handleIntentionalClose}
            className="h-full w-full flex items-center justify-center relative"
        >
            <button
                className="absolute top-[20px] right-[20px] bg-white rounded-full p-[12px] shadow-bottom-4-4"
                onClick={closeModal}
            >
                <X className="h-[20px] w-[20px] text-grayscale-800" />
            </button>

            {content}
        </div>
    ) : (
        <div className="h-full w-full relative overflow-y-auto bg-grayscale-200">
            <div className="h-full overflow-y-auto pb-[150px] pt-[60px] px-[20px] ">{content}</div>
            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center bg-opacity-80 backdrop-blur-[5px] p-[20px] absolute bottom-0 left-0 bg-white border-solid border-[1px] border-white"
            >
                <div className="w-full flex items-center justify-center gap-[10px] max-w-[600px]">
                    <button
                        onClick={closeModal}
                        className="py-[7px] px-[20px] bg-white rounded-full text-grayscale-900 shadow-button-bottom flex-1 font-poppins text-[17px]"
                    >
                        {isCreate ? 'Cancel' : 'Back'}
                    </button>
                    {isCreate && (
                        <button
                            onClick={handleSaveButtonClick}
                            className="py-[7px] px-[20px] bg-emerald-500 font-[600] rounded-full text-white shadow-button-bottom flex-1 font-poppins text-[17px] disabled:bg-grayscale-300"
                            disabled={!node.targetName}
                        >
                            Create
                        </button>
                    )}
                </div>
            </IonFooter>
        </div>
    );
};

export default EditAlignmentModal;
