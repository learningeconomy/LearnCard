import React, { useState, useEffect } from 'react';

import {
    ModalTypes,
    useModal,
    useWallet,
    useFilestack,
    conditionalPluralize,
    BoostUserTypeEnum,
    ShortBoostState,
    useGetSkillFrameworkAdmins,
    useGetBoostsThatUseFramework,
    CredentialCategoryEnum,
} from 'learn-card-base';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Plus from 'apps/scouts/src/components/svgs/Plus';
import Pencil from 'apps/scouts/src/components/svgs/Pencil';
import BoostSearch from '../../components/boost/boost-search/BoostSearch';
import FrameworkImage from './FrameworkImage';
import SkillsFrameworkIcon from 'apps/scouts/src/components/svgs/SkillsFrameworkIcon';
import SimpleFrameworkAdminDisplay from './SimpleFrameworkAdminDisplay';
import SimpleAttachedNetworkDisplay from './SimpleAttachedNetworkDisplay';
import FrameworkCreatedSuccessModal from './FrameworkCreatedSuccessModal';
import SkillsFrameworkAdminSelector from './SkillsFrameworkAdminSelector';
import SkillsFrameworkNetworkSelector from './SkillsFrameworkNetworkSelector';
import { IonFooter, IonInput, IonSpinner, IonTextarea } from '@ionic/react';

import { SkillFramework } from '../../components/boost/boost';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import { ApiFrameworkInfo } from '../../helpers/skillFramework.helpers';

type CreateFrameworkModalProps = {
    isEdit?: boolean;
    frameworkInfo?: ApiFrameworkInfo;
};

// oxlint-disable-next-line no-empty-pattern
const CreateFrameworkModal: React.FC<CreateFrameworkModalProps> = ({ isEdit, frameworkInfo }) => {
    const { newModal, closeModal, closeAllModals } = useModal();
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    const [name, setName] = useState(isEdit ? frameworkInfo?.name ?? '' : '');
    const [description, setDescription] = useState(isEdit ? frameworkInfo?.description ?? '' : '');
    const [image, setImage] = useState<string | undefined>(
        isEdit ? frameworkInfo?.image : undefined
    );
    const [selectedAdmins, setSelectedAdmins] = useState<ShortBoostState>({
        issueTo: [],
    });

    const { handleFileSelect, isLoading: isUploadingImage } = useFilestack({
        onUpload: url => setImage(url),
        fileType: IMAGE_MIME_TYPES,
    });

    const { data: existingAdmins } = useGetSkillFrameworkAdmins(frameworkInfo?.id, {
        enabled: isEdit,
    });

    const { data: existingNetworks } = useGetBoostsThatUseFramework(
        frameworkInfo?.id,
        {
            category: {
                $in: [
                    CredentialCategoryEnum.nationalNetworkAdminId,
                    CredentialCategoryEnum.globalAdminId,
                ],
            },
        },
        {
            enabled: isEdit,
        }
    );


    useEffect(() => {
        if (existingAdmins) {
            // TODO doesn't handle pagination
            setSelectedAdmins({
                issueTo: existingAdmins,
            });
        }
    }, [existingAdmins]);

    // Create framework mutation
    const createFrameworkMutation = useMutation({
        mutationFn: async (data: {
            name: string;
            description: string;
            image?: string;
            boostUris: string[];
            adminProfileIds: string[];
        }) => {
            const wallet = await initWallet();
            const frameworkId = `fw-${Date.now()}`;

            // Create managed skill framework with boost attachments
            const framework = await wallet.invoke.createManagedSkillFramework({
                id: frameworkId,
                name: data.name,
                description: data.description,
                image: data.image,
                status: 'active',
                boostUris: data.boostUris,
            });

            return framework;
        },
        onSuccess: async (framework: SkillFramework) => {
            await queryClient.invalidateQueries({
                queryKey: ['skillFrameworks'],
                refetchType: 'all',
            });
            await queryClient.invalidateQueries({
                queryKey: ['listMySkillFrameworks'],
                refetchType: 'all',
            });
            closeModal();

            setTimeout(() => {
                newModal(
                    <FrameworkCreatedSuccessModal framework={framework} />,
                    { sectionClassName: '!bg-transparent !shadow-none' },
                    {
                        desktop: ModalTypes.Center,
                        mobile: ModalTypes.Center,
                    }
                );
            }, 301);
        },
        onError: error => {
            console.error('Failed to create framework:', error);
            alert('Failed to create framework. Please try again.');
        },
    });

    const handleSelectAdmin = () => {
        newModal(
            <BoostSearch
                boostUserType={BoostUserTypeEnum.someone}
                handleCloseModal={closeModal}
                handleCloseUserOptionsModal={closeModal}
                cssClass="boost-search-modal safe-area-top-margin"
                state={selectedAdmins}
                setState={setSelectedAdmins}
                history={history}
                preserveStateIssueTo={false}
                ignoreBoostSearchRestriction
            />,
            {
                className: '!p-0',
                sectionClassName: '!p-0',
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
        // newModal(
        //     <SkillsFrameworkAdminSelector
        //         selectedAdmins={selectedAdmins}
        //         onSelectAdmins={admins => setSelectedAdmins(admins)}
        //     />,
        //     { sectionClassName: '!max-w-[500px]' },
        //     {
        //         desktop: ModalTypes.Center,
        //         mobile: ModalTypes.Center,
        //     }
        // );
    };

    // Update framework mutation
    const updateFrameworkMutation = useMutation({
        mutationFn: async (data: {
            id: string;
            name: string;
            description: string;
            image?: string;
            boostUris: string[];
            adminProfileIds: string[];
        }) => {
            const wallet = await initWallet();

            // Create managed skill framework with boost attachments
            const framework = await wallet.invoke.updateSkillFramework({
                id: data.id,
                name: data.name,
                description: data.description,
                image: data.image,
            });

            const adminsToAdd = data.adminProfileIds.filter(
                adminProfileId => !existingAdmins?.some(admin => admin.profileId === adminProfileId)
            );
            const addAdminPromises =
                adminsToAdd.map(async adminProfileId => {
                    await wallet.invoke.addSkillFrameworkAdmin(framework.id, adminProfileId);
                }) ?? [];

            const adminsToRemove = existingAdmins?.filter(
                admin => !data.adminProfileIds.includes(admin.profileId)
            );
            const removeAdminPromises =
                adminsToRemove?.map(async admin => {
                    await wallet.invoke.removeSkillFrameworkAdmin(framework.id, admin.profileId);
                }) ?? [];

            const frameworksToAdd = data.boostUris.filter(
                boostUri => !existingNetworks?.records?.some(network => network.uri === boostUri)
            );
            const addFrameworkPromises =
                frameworksToAdd.map(async boostUri => {
                    await wallet.invoke.attachFrameworkToBoost(boostUri, framework.id);
                }) ?? [];

            const frameworksToRemove = existingNetworks?.records?.filter(
                network => !data.boostUris.includes(network.uri)
            );
            const removeFrameworkPromises =
                frameworksToRemove?.map(async network => {
                    await wallet.invoke.detachFrameworkFromBoost(network.uri, framework.id);
                }) ?? [];

            await Promise.all([
                ...addAdminPromises,
                ...removeAdminPromises,
                ...addFrameworkPromises,
                ...removeFrameworkPromises,
            ]);

            return framework;
        },
        onSuccess: async (framework: SkillFramework) => {
            await queryClient.invalidateQueries({
                queryKey: ['skillFrameworks'],
                refetchType: 'all',
            });
            await queryClient.invalidateQueries({
                queryKey: ['listMySkillFrameworks'],
                refetchType: 'all',
            });
            await queryClient.invalidateQueries({
                queryKey: ['getSkillFrameworkById', framework.id],
                refetchType: 'all',
            });
            queryClient.invalidateQueries({ queryKey: ['frameworkAdmins', framework.id] });

            closeAllModals();

            // setTimeout(() => {
            //     newModal(
            //         <FrameworkCreatedSuccessModal isUpdate framework={framework} />,
            //         { sectionClassName: '!bg-transparent !shadow-none' },
            //         {
            //             desktop: ModalTypes.Center,
            //             mobile: ModalTypes.Center,
            //         }
            //     );
            // }, 301);
        },
        onError: error => {
            console.error('Failed to update framework:', error);
            alert('Failed to update framework. Please try again.');
        },
    });

    const handleCreate = () => {
        if (!name.trim()) return;

        createFrameworkMutation.mutate({
            name: name.trim(),
            description: description.trim(),
            image,
            boostUris: [],
            adminProfileIds: selectedAdmins.issueTo.map(issueTo => issueTo.profileId),
        });
    };

    const handleEdit = () => {
        if (!name.trim()) return;

        updateFrameworkMutation.mutate({
            id: frameworkInfo!.id,
            name: name.trim(),
            description: description.trim(),
            image,
            boostUris: [],
            adminProfileIds: selectedAdmins.issueTo.map(issueTo => issueTo.profileId),
        });
    };

    return (
        <div className="h-full relative bg-grayscale-50 overflow-hidden">
            <div className="px-[20px] py-[20px] bg-white safe-area-top-margin flex flex-col gap-[10px] z-20 relative border-b-[1px] border-grayscale-200 border-solid rounded-b-[30px]">
                <div className="flex items-center gap-[10px] text-grayscale-900">
                    <SkillsFrameworkIcon className="w-[40px] h-[40px]" color="currentColor" />
                    <h5 className="text-[22px] font-poppins font-[600] leading-[24px]">
                        {isEdit ? 'Edit Framework' : 'Create Framework'}
                    </h5>
                </div>
            </div>

            <section className="h-full flex flex-col gap-[10px] pt-[20px] px-[20px] pb-[222px] overflow-y-auto z-0">
                <div className="flex flex-col gap-[20px] bg-white p-[20px] rounded-[20px] shadow-bottom-0-4">
                    {!isEdit && (
                        <p className="font-poppins text-[14px] text-grayscale-90 w-full text-center">
                            Start a new framework. You can add skills manually or import a file
                            after creating it.
                        </p>
                    )}

                    <div className="flex flex-col gap-[10px] items-center">
                        <div className="relative">
                            {isUploadingImage && (
                                <div className="absolute top-0 left-0 z-10 bg-white bg-opacity-60 h-full w-full flex items-center justify-center">
                                    <IonSpinner
                                        name="crescent"
                                        color="dark"
                                        className="scale-[1.75]"
                                    />
                                </div>
                            )}
                            <FrameworkImage
                                image={image}
                                sizeClassName="w-[65px] h-[65px]"
                                iconSizeClassName="w-[30px] h-[30px]"
                            />
                        </div>

                        <button
                            onClick={handleFileSelect}
                            className="flex gap-[5px] items-center text-grayscale-700"
                            disabled={isUploadingImage}
                        >
                            <Pencil className="w-[24px] h-[24px]" />
                            <span className="font-poppins text-[14px] font-[600]">
                                Edit thumbnail
                            </span>
                        </button>
                    </div>

                    <IonInput
                        onIonInput={e => setName(e.detail.value ?? '')}
                        className="bg-grayscale-100 text-grayscale-800 rounded-[16px] py-[8px] !px-[15px] !h-[40px] text-[17px] font-poppins"
                        placeholder="Framework Name *"
                        value={name}
                    />

                    <IonTextarea
                        onIonInput={e => setDescription(e.detail.value ?? '')}
                        className="bg-grayscale-100 text-grayscale-800 rounded-[16px] py-[8px] !px-[15px]"
                        placeholder="Framework Description"
                        value={description}
                        rows={4}
                    />
                </div>

                <div className="flex flex-col gap-[20px] bg-white p-[20px] rounded-[20px] shadow-bottom-0-4">
                    <div className="font-poppins text-[20px] text-grayscale-900 flex items-center">
                        {conditionalPluralize(selectedAdmins.issueTo.length, 'Admin')}
                        <button
                            onClick={handleSelectAdmin}
                            className="ml-auto bg-emerald-700 p-[10px] rounded-full"
                        >
                            <Plus className="w-[20px] h-[20px] text-white" />
                        </button>
                    </div>

                    {selectedAdmins.issueTo.length > 0 && (
                        <div className="flex flex-col">
                            {selectedAdmins.issueTo.map(admin => (
                                <SimpleFrameworkAdminDisplay
                                    key={admin.profileId}
                                    profileId={admin.profileId}
                                />
                            ))}
                        </div>
                    )}
                </div>
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
                        onClick={isEdit ? handleEdit : handleCreate}
                        className="px-[15px] py-[7px] bg-emerald-700 text-white rounded-[30px] text-[17px] font-[600] font-poppins leading-[24px] tracking-[0.25px] shadow-button-bottom h-[44px] flex-1 disabled:bg-grayscale-300"
                        disabled={
                            !name.trim() ||
                            (isEdit
                                ? updateFrameworkMutation.isPending
                                : createFrameworkMutation.isPending)
                        }
                    >
                        {isEdit ? (
                            <>{updateFrameworkMutation.isPending ? 'Updating...' : 'Update'}</>
                        ) : (
                            <>{createFrameworkMutation.isPending ? 'Creating...' : 'Create'}</>
                        )}
                    </button>
                </div>
            </IonFooter>
        </div>
    );
};

export default CreateFrameworkModal;
