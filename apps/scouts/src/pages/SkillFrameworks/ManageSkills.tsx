import React, { useState, useRef, useCallback } from 'react';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';

import { useModal, ModalTypes, useWallet, useGetSkillFrameworkById } from 'learn-card-base';

import { IonFooter, IonSpinner } from '@ionic/react';
import X from 'learn-card-base/svgs/X';
import Pencil from '../../components/svgs/Pencil';
import CodeIcon from 'learn-card-base/svgs/CodeIcon';
import CaretDown from 'learn-card-base/svgs/CaretDown';
import SlimCaretLeft from '../../components/svgs/SlimCaretLeft';
import FrameworkImage from './FrameworkImage';
import BrowseFrameworkPage from './BrowseFrameworkPage';
import ManageSkillsNoSkillsBody from './ManageSkillsNoSkillsBody';
import FrameworkUpdatedSucessModal from './FrameworkUpdatedSucessModal';
import SelectFrameworkToManageModal from './SelectFrameworkToManageModal';
import ManageSkillsJsonUploadedBody, { FrameworkJsonError } from './ManageSkillsJsonUploadedBody';
import ManageSkillsCancelUpdateModal from './ManageSkillsCancelUpdateModal';
import ManageSkillsConfirmationModal from './ManageSkillsConfirmationModal';
import ManageSkillsExistingSkillsBody from './ManageSkillsExistingSkillsBody';

import { getFileInfo } from 'apps/scouts/src/hooks/useUploadFile';
import {
    SkillFramework,
    SkillFrameworkNode,
    FrameworkNodeRole,
} from '../../components/boost/boost';
import {
    convertSkillsToBackendFormat,
    countNodeRoles,
    generateSkillId,
} from '../../helpers/skillFramework.helpers';
import { ReplaceSkillFrameworkSkillsResult } from '@learncard/types';

// Define the base schema for SkillFrameworkNode
const BaseSkillFrameworkNodeSchema = z.object({
    // From BoostCMSAlignment
    type: z.literal('Alignment').optional(),
    targetName: z.string().min(1, 'Skill name is required'),
    targetFramework: z.string().optional(),
    targetUrl: z.string().optional(),
    targetDescription: z.string().optional(),
    targetCode: z.string().optional(),
    targetType: z.string().optional(),

    // From SkillFrameworkNode
    id: z.string().optional(),
    role: z.nativeEnum(FrameworkNodeRole),
    icon: z.string().optional(),
});

// Define the recursive type for subskills
type SkillFrameworkNodeType = z.infer<typeof BaseSkillFrameworkNodeSchema> & {
    subskills?: SkillFrameworkNodeType[];
};

// Create the final schema with recursive subskills
const SkillFrameworkNodeSchema: z.ZodType<SkillFrameworkNodeType> =
    BaseSkillFrameworkNodeSchema.extend({
        subskills: z.lazy(() => z.array(SkillFrameworkNodeSchema).optional()),
    });

// Define Zod schema for SkillFramework
const SkillFrameworkSchema = z.object({
    skills: z.array(SkillFrameworkNodeSchema).min(1, 'At least one skill is required'),
});

type ManageSkillsProps = {
    initialFrameworkId?: string;
    isManageJsonVersion?: boolean;
    handleBrowseFramework?: () => void;
    onSuccessClose?: () => void;
};

// oxlint-disable-next-line no-empty-pattern
const ManageSkills: React.FC<ManageSkillsProps> = ({
    initialFrameworkId,
    isManageJsonVersion,
    handleBrowseFramework,
    onSuccessClose,
}) => {
    const { newModal, closeModal, closeAllModals } = useModal();
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(
        initialFrameworkId ?? null
    );

    const { data: skillFramework } = useGetSkillFrameworkById(selectedFrameworkId ?? '');
    const { framework, skills: paginatedFrameworkSkills } = skillFramework ?? {};

    const frameworkSkills = paginatedFrameworkSkills?.records ?? [];
    const hasSkills = frameworkSkills.length > 0;

    const [isSaving, setIsSaving] = useState(false);
    const [isPrematureSave, setIsPrematureSave] = useState(false);
    const [frameworkApproved, setFrameworkApproved] = useState(false);
    const [isFileUploading, setIsFileUploading] = useState(false);
    const [iconsGenerating, setIconsGenerating] = useState(false);
    const [jsonError, setJsonError] = useState<FrameworkJsonError | null>(null);
    const [fileInfo, setFileInfo] = useState<{ type: string; size: string; name: string } | null>(
        null
    );
    const [fileSkillFramework, setFileSkillFramework] = useState<SkillFramework | null>(null);

    const collectSkillNames = useCallback((nodes?: SkillFrameworkNode[]): string[] => {
        if (!nodes) return [];
        const names: string[] = [];
        const stack: SkillFrameworkNode[] = [...nodes];
        const seen = new Set<string>();

        while (stack.length > 0) {
            const node = stack.pop()!;
            // Only collect names for skills that don't have an icon
            if (node.targetName && !node.icon) {
                names.push(node.targetName);
            }
            if (node.subskills) stack.push(...node.subskills);
        }

        return names.filter(n => (seen.has(n) ? false : (seen.add(n), true)));
    }, []);

    const applyIcons = useCallback(
        (
            nodes: SkillFrameworkNode[] | undefined,
            iconMap: Record<string, string>
        ): SkillFrameworkNode[] | undefined => {
            if (!nodes) return nodes;
            return nodes.map(n => ({
                ...n,
                icon: iconMap[n.targetName] ?? n.icon,
                subskills: applyIcons(n.subskills, iconMap),
            }));
        },
        []
    );

    const annotateWithIcons = useCallback(
        async (framework: SkillFramework): Promise<SkillFramework> => {
            try {
                setIconsGenerating(true);
                const names = collectSkillNames(framework.skills);

                if (names.length === 0) return framework;

                const wallet = await initWallet();
                const iconMap = await wallet.invoke.generateSkillIcons(names);
                const skillsWithIcons = applyIcons(framework.skills, iconMap) ?? framework.skills;

                return { ...framework, skills: skillsWithIcons };
            } catch (e) {
                console.error('Error generating icons for skills:', e);

                setJsonError({
                    type: 'processing',
                    errors: ['Icons failed to generate', e.message],
                });
                return framework;
            } finally {
                setIconsGenerating(false);
            }
        },
        [applyIcons, collectSkillNames, initWallet]
    );

    const retryIconGeneration = () => {
        if (!fileSkillFramework?.skills) return;
        setJsonError(null);
        annotateWithIcons(fileSkillFramework).then(updated => setFileSkillFramework(updated));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsFileUploading(true);
        setIsPrematureSave(false);
        setJsonError(null);

        const file = event.target.files?.[0];

        if (file) {
            let fileInfo = getFileInfo(file);
            fileInfo = {
                ...fileInfo,
                type: fileInfo?.type.toLowerCase(),
                size: fileInfo?.size.replace('KB', 'kB'),
            };
            setFileInfo(fileInfo);

            const isJSON =
                file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');

            if (isJSON) {
                const reader = new FileReader();
                reader.onload = e => {
                    try {
                        const text = (e.target?.result as string) ?? '';
                        const framework = JSON.parse(text) as SkillFramework;

                        // Validate framework structure using Zod
                        const validationResult = SkillFrameworkSchema.safeParse(framework);

                        if (!validationResult.success) {
                            // Format Zod errors into a more readable format
                            const errorMessages = validationResult.error.issues.map(issue => {
                                // Convert path to use array notation (e.g., skills.0.role -> skills[0].role)
                                const formattedPath = issue.path.reduce((acc, part, index) => {
                                    // If part is a number, it's an array index
                                    if (typeof part === 'number' || /^\d+$/.test(part.toString())) {
                                        return `${acc}[${part}]`;
                                    }
                                    // If it's the first part, just add it
                                    if (index === 0) return part.toString();
                                    // Otherwise add dot notation
                                    return `${acc}.${part}`;
                                }, '');

                                return `${formattedPath}: ${issue.message}`;
                            });

                            setJsonError({
                                type: 'format',
                                errors: errorMessages,
                            });
                            setIsFileUploading(false);
                            return;
                        }

                        // Set immediately for preview, then asynchronously annotate with icons
                        setIconsGenerating(true); // set icons generating early so "Review Framework" button doesn't flash
                        // Set file data for preview
                        setFrameworkApproved(false);

                        // Recursively add IDs to all skills and subskills
                        const addIdsToNodes = (nodes: any[]): any[] => {
                            return nodes.map(node => ({
                                ...node,
                                id: node.id || generateSkillId(),
                                subskills: node.subskills ? addIdsToNodes(node.subskills) : [],
                            }));
                        };

                        framework.skills = addIdsToNodes(framework.skills);

                        annotateWithIcons(framework)
                            .then(updated => {
                                setFileSkillFramework(updated);
                                setIsFileUploading(false);
                            })
                            .catch(err => {
                                console.error('Failed to annotate icons:', err);
                                setJsonError({
                                    type: 'processing',
                                    errors: ['Icons failed to generate', err.message],
                                });
                                setIconsGenerating(false);
                                setIsFileUploading(false);
                            });
                    } catch (err) {
                        console.error('Failed to parse JSON file:', err);
                        setJsonError({
                            type: 'format',
                            errors: [`Failed to parse JSON file: ${err}`],
                        });
                        setIconsGenerating(false);
                        setIsFileUploading(false);
                    }
                };
                reader.onerror = e => {
                    console.error('Error reading JSON file:', e);
                    setJsonError({
                        type: 'processing',
                        errors: [`Error reading JSON file: ${e}`],
                    });
                    setIconsGenerating(false);
                    setIsFileUploading(false);
                };
                reader.readAsText(file);
                return;
            } else {
                setJsonError({
                    type: 'format',
                    errors: ['File is not a valid JSON file'],
                });
            }
        }
    };

    const openViewFrameworkModal = () => {
        if (!fileSkillFramework) return;

        newModal(
            <BrowseFrameworkPage
                isApproveFlow
                fullSkillTree={fileSkillFramework.skills}
                frameworkInfo={{
                    ...fileSkillFramework,
                    name: framework?.name ?? '',
                    image: framework?.image ?? '',
                    description: framework?.description ?? '',
                    status: '',
                }}
                handleClose={() => {
                    closeModal();
                }}
                handleApproveOverride={updatedSkillTree => {
                    // Adds, edits, and deletes may have been made
                    const updatedFileSkillFramework = {
                        ...fileSkillFramework,
                        skills: updatedSkillTree,
                    };
                    setFileSkillFramework(updatedFileSkillFramework);

                    setFrameworkApproved(true);
                    closeModal();
                }}
            />,
            undefined,
            {
                desktop: ModalTypes.FullScreen,
                mobile: ModalTypes.FullScreen,
            }
        );

        setTimeout(() => {
            // slight delay so the state doesn't change before the modal opens
            setIsPrematureSave(false);
        }, 300);
    };

    const handleSave = async () => {
        if (!fileSkillFramework) {
            console.error('No framework data to save');
            return;
        }

        if (!frameworkApproved) {
            setIsPrematureSave(true);
            return;
        }

        if (!selectedFrameworkId) {
            alert('Please select a framework first');
            return;
        }

        setIsSaving(true);

        try {
            console.log('Adding skills to framework:', selectedFrameworkId);
            const wallet = await initWallet();

            const skillsToAdd = convertSkillsToBackendFormat(fileSkillFramework.skills);

            console.log('Adding skills:', skillsToAdd);

            // Add skills to the selected framework using createSkills
            const results: ReplaceSkillFrameworkSkillsResult =
                await wallet.invoke.replaceSkillFrameworkSkills({
                    frameworkId: selectedFrameworkId,
                    skills: skillsToAdd,
                });

            console.log('✅ Skills added successfully!');

            // Invalidate queries to refresh data
            await queryClient.invalidateQueries({
                queryKey: ['getSkillFrameworkById', selectedFrameworkId],
            });
            await queryClient.invalidateQueries({
                queryKey: ['countSkillsInFramework', selectedFrameworkId],
            });
            await queryClient.invalidateQueries({
                queryKey: ['getSkillChildren', selectedFrameworkId],
            });
            await queryClient.invalidateQueries({
                queryKey: ['searchFrameworkSkills', selectedFrameworkId],
            });

            closeModal(); // close ManageSkills modal

            const { tiers: numberOfTiers, competencies: numberOfCompetencies } = countNodeRoles(
                fileSkillFramework.skills
            );

            // setTimeout(() => {
            newModal(
                <FrameworkUpdatedSucessModal
                    frameworkInfo={framework}
                    changeCounts={{
                        // this is the most sensical information we can provide here without doing a lot more work
                        skillsCreated: numberOfCompetencies,
                        tiersCreated: numberOfTiers,
                        skillsUpdated: 0,
                        tiersUpdated: 0,
                        skillsDeleted: 0,
                        tiersDeleted: 0,

                        // skillsCreated: results.created,
                        // tiersCreated: 0,
                        // skillsUpdated: results.updated,
                        // tiersUpdated: 0,
                        // skillsDeleted: results.deleted,
                        // tiersDeleted: 0,

                        // we don't have proper data for these
                        // tiersDeleted: results.deletedTiers,
                        // tiersCreated: results.createdTiers,
                        // tiersUpdated: results.updatedTiers,
                    }}
                    handleBrowseFramework={handleBrowseFramework}
                    onClose={onSuccessClose}
                    useCloseAllModals
                />,
                {
                    sectionClassName: '!bg-transparent !shadow-none !overflow-visible',
                    onClose: () => {
                        // close modals if they exist success modal via clicking on background space
                        // closeAllModals();
                    },
                },
                {
                    desktop: ModalTypes.Center,
                    mobile: ModalTypes.Center,
                }
            );
            // }, 301);
        } catch (error) {
            console.error('Failed to add skills to framework:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            alert(`Failed to add skills: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    const resetState = () => {
        setFileSkillFramework(null);
        setFileInfo(null);
        setIconsGenerating(false);
        setIsPrematureSave(false);
        setFrameworkApproved(false);
        setJsonError(null);
    };

    const openCancelUpdateModal = (type: 'back' | 'close') => {
        if (jsonError) {
            resetState();
            return;
        }

        const confirmationText = type === 'back' ? 'Yes, Start Over' : 'Yes, Cancel & Exit';
        newModal(
            <ManageSkillsCancelUpdateModal
                confirmationText={confirmationText}
                onCancel={() => {
                    if (type === 'back') {
                        resetState();
                    } else {
                        closeAllModals();
                    }
                }}
            />,
            { sectionClassName: '!bg-transparent !shadow-none !overflow-visible' },
            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
        );
    };

    const handleClose = () => {
        if (fileInfo && !isFileUploading) {
            openCancelUpdateModal('close');
        } else {
            closeModal();
        }
    };

    return (
        <div className="h-full relative bg-grayscale-100 flex flex-col">
            {isSaving && (
                <div className="absolute top-0 left-0 w-full h-full bg-white bg-opacity-30 backdrop-blur-[2px] z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-[15px]">
                        <IonSpinner name="crescent" color="dark" className="h-[60px] w-[60px]" />
                        <span className="text-grayscale-900 font-poppins font-[600] text-[16px]">
                            Saving...
                        </span>
                    </div>
                </div>
            )}
            <div className="ion-padding p-[20px] bg-white safe-area-top-margin rounded-b-[30px] shadow-bottom-1-5 flex flex-col gap-[10px] z-20 relative">
                <div className="flex gap-[10px] items-center">
                    {isManageJsonVersion ? (
                        <CodeIcon
                            className="w-[40px] h-[40px] text-grayscale-900"
                            version="with-slash"
                        />
                    ) : (
                        <Pencil className="w-[40px] h-[40px] text-grayscale-900" version={3} />
                    )}
                    <h5 className="text-[22px] font-[600] text-grayscale-900 font-poppins leading-[24px]">
                        {isManageJsonVersion ? 'Manage JSON' : 'Manage Skills'}
                    </h5>
                    {isManageJsonVersion && (
                        <button
                            onClick={handleClose}
                            className="ml-auto p-[10px] bg-grayscale-100 rounded-full"
                        >
                            <X className="w-[20px] h-[20px] text-grayscale-800" />
                        </button>
                    )}
                </div>

                {!isManageJsonVersion && (
                    <button
                        onClick={() => {
                            newModal(
                                <SelectFrameworkToManageModal
                                    onFrameworkSelectOverride={framework =>
                                        setSelectedFrameworkId(framework.id)
                                    }
                                />,
                                {
                                    sectionClassName:
                                        '!bg-transparent !shadow-none !overflow-visible',
                                },
                                { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
                            );
                        }}
                        className="w-full bg-grayscale-100 rounded-[15px] py-[5px] pl-[5px] pr-[10px] flex items-center gap-[5px]"
                    >
                        <div className="flex items-center gap-[10px]">
                            <FrameworkImage
                                image={framework?.image}
                                sizeClassName="w-[35px] h-[35px]"
                                iconSizeClassName="w-[20px] h-[20px]"
                            />
                            <div className="flex flex-col items-start">
                                <span className="text-grayscale-600 font-poppins text-[12px] font-[700]">
                                    Skills Framework
                                </span>
                                <span className="text-grayscale-900 font-poppins text-[14px] font-[600] leading-[130%] line-clamp-1 text-left">
                                    {framework?.name}
                                </span>
                            </div>
                        </div>

                        <CaretDown className="w-[15px] h-[15px] text-grayscale-800 ml-auto" />
                    </button>
                )}
            </div>

            <section className="flex-1 bg-grayscale-100 z-0 overflow-y-auto">
                <div className="flex flex-col gap-[20px] pb-[200px] pt-[20px] px-[20px] w-full">
                    {!fileSkillFramework && !jsonError && (
                        <>
                            {hasSkills ? (
                                <ManageSkillsExistingSkillsBody
                                    skillFramework={skillFramework}
                                    handleFileUpload={handleFileUpload}
                                    isFileUploading={isFileUploading}
                                    isManageJsonVersion={isManageJsonVersion}
                                />
                            ) : (
                                <ManageSkillsNoSkillsBody
                                    handleFileUpload={handleFileUpload}
                                    isFileUploading={isFileUploading}
                                />
                            )}
                        </>
                    )}

                    {(fileSkillFramework || jsonError) && (
                        <ManageSkillsJsonUploadedBody
                            fileInfo={fileInfo}
                            frameworkApproved={frameworkApproved}
                            fileSkillFramework={fileSkillFramework}
                            jsonError={jsonError}
                            handleFileUpload={handleFileUpload}
                            isFileUploading={isFileUploading}
                            isPrematureSave={isPrematureSave}
                            retryIconGeneration={retryIconGeneration}
                        />
                    )}
                </div>
            </section>

            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] p-[20px] absolute bottom-0 left-0 bg-white"
            >
                <div className="w-full flex flex-col items-center gap-[10px] max-w-[600px]">
                    {fileInfo && (
                        <>
                            {!iconsGenerating && !isFileUploading && !jsonError && (
                                <button
                                    onClick={openViewFrameworkModal}
                                    className={`${
                                        frameworkApproved ? 'bg-grayscale-900' : 'bg-emerald-700'
                                    } disabled:bg-grayscale-300 text-white pl-[20px] pr-[15px] py-[10px] rounded-[30px] flex gap-[10px] items-center justify-center text-[17px] font-[600] font-poppins leading-[24px] tracking-[0.25px] w-full`}
                                >
                                    <Pencil className="w-[25px] h-[25px]" version={3} />
                                    Review Framework
                                </button>
                            )}
                        </>
                    )}
                    <div className="w-full flex items-center gap-[10px] max-w-[600px]">
                        {fileInfo && !isFileUploading && (
                            <button
                                onClick={() => openCancelUpdateModal('back')}
                                className="p-[12px] bg-white rounded-full shadow-bottom-3-4"
                            >
                                <SlimCaretLeft
                                    className="w-[20px] h-[20px] text-grayscale-900"
                                    color="currentColor"
                                />
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="py-[7px] px-[15px] bg-white rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom h-[44px]"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                if (hasSkills) {
                                    newModal(
                                        <ManageSkillsConfirmationModal
                                            mainText="Update Framework?"
                                            secondaryText="Saving will permanently replace your current framework and cannot be undone."
                                            confirmationButtonText="Yes, Update"
                                            onConfirm={() => {
                                                setTimeout(() => {
                                                    handleSave();
                                                }, 301);
                                            }}
                                        />,
                                        {
                                            sectionClassName:
                                                '!bg-transparent !shadow-none !overflow-visible',
                                        },
                                        { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
                                    );
                                } else {
                                    handleSave();
                                }
                            }}
                            disabled={!selectedFrameworkId || !fileSkillFramework || isSaving}
                            className={`py-[7px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-white w-full shadow-button-bottom font-[600] leading-[24px] tracking-[0.25px] h-[44px] ${
                                !frameworkApproved || !selectedFrameworkId
                                    ? 'bg-grayscale-300 cursor-default'
                                    : 'bg-emerald-700'
                            }`}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </IonFooter>
        </div>
    );
};

export default ManageSkills;
