import React, { useState, useEffect } from 'react';
import { useModal, useWallet, useFilestack } from 'learn-card-base';
import { IonInput } from '@ionic/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// oxlint-disable-next-line no-unused-vars
import { SkillFrameworkType } from '@learncard/types';
import UploadIcon from 'learn-card-base/svgs/UploadIcon';

type EditFrameworkModalProps = {
    frameworkId: string;
};

const EditFrameworkModal: React.FC<EditFrameworkModalProps> = ({ frameworkId }) => {
    const { closeModal } = useModal();
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<string | undefined>(undefined);

    const { handleFileSelect, isLoading: isUploadingImage } = useFilestack({
        onUpload: url => setImage(url),
        fileType: 'image/*',
    });

    // Fetch framework details
    const { data: frameworkData, isLoading } = useQuery({
        queryKey: ['skillFramework', frameworkId],
        queryFn: async () => {
            const wallet = await initWallet();
            return await wallet.invoke.getSkillFrameworkById(frameworkId);
        },
    });

    // Extract framework from the response structure { framework, skills }
    const framework = frameworkData?.framework;

    // Set initial values when framework loads
    useEffect(() => {
        if (framework) {
            setName(framework.name || '');
            setDescription(framework.description || '');
            setImage(framework.image);
        }
    }, [framework]);

    // Update framework mutation
    const updateFrameworkMutation = useMutation({
        mutationFn: async (data: { name: string; description: string; image?: string }) => {
            const wallet = await initWallet();
            return await wallet.invoke.updateSkillFramework({
                id: frameworkId,
                name: data.name,
                description: data.description,
                image: data.image,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skillFrameworks'] });
            queryClient.invalidateQueries({ queryKey: ['skillFramework', frameworkId] });
            closeModal();
        },
        onError: error => {
            console.error('Failed to update framework:', error);
            alert('Failed to update framework. Please try again.');
        },
    });

    const handleSave = () => {
        if (!name.trim()) return;

        updateFrameworkMutation.mutate({
            name: name.trim(),
            description: description.trim(),
            image,
        });
    };

    return (
        <div className="flex flex-col gap-[10px]">
            <section className="bg-white p-[20px] rounded-[15px] flex flex-col gap-[10px]">
                <div className="flex flex-col items-center gap-[10px] py-[20px]">
                    <h1 className="font-poppins text-[20px] text-grayscale-900 leading-[130%] tracking-[-0.25px]">
                        Edit Skill Framework
                    </h1>
                    <p className="font-poppins text-[14px] text-grayscale-600 leading-[130%] tracking-[-0.25px] text-center">
                        Update the framework name and description
                    </p>
                </div>

                {isLoading ? (
                    <div className="py-[20px] text-center text-grayscale-600">Loading...</div>
                ) : (
                    <>
                        <IonInput
                            onIonInput={e => setName(e.detail.value ?? '')}
                            className="bg-grayscale-100 text-grayscale-800 rounded-[16px] py-[8px] !px-[15px] !h-[40px]"
                            placeholder="Framework Name *"
                            value={name}
                        />

                        <IonInput
                            onIonInput={e => setDescription(e.detail.value ?? '')}
                            className="bg-grayscale-100 text-grayscale-800 rounded-[16px] py-[8px] !px-[15px] !h-[40px]"
                            placeholder="Framework Description"
                            value={description}
                        />

                        {/* Image Upload */}
                        <div className="flex flex-col items-start gap-[10px] py-[10px]">
                            <p className="font-poppins text-[14px] text-grayscale-900 leading-[130%] tracking-[-0.25px]">
                                Framework Image
                            </p>
                            {image ? (
                                <div className="relative w-full">
                                    <img
                                        src={image}
                                        alt="Framework"
                                        className="w-full h-[150px] object-cover rounded-[10px]"
                                    />
                                    <button
                                        onClick={() => setImage(undefined)}
                                        className="absolute top-[10px] right-[10px] bg-red-600 text-white p-[8px] rounded-full hover:bg-red-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleFileSelect}
                                    disabled={isUploadingImage}
                                    className="flex gap-[10px] items-center py-[5px] pl-[5px] pr-[10px] rounded-[30px] border-solid border-[1px] border-grayscale-200 w-full hover:bg-grayscale-50 disabled:opacity-50"
                                >
                                    <div className="bg-grayscale-900 p-[5px] rounded-full">
                                        <UploadIcon className="w-[25px] h-[25px]" strokeWidth="2" />
                                    </div>
                                    <span className="text-grayscale-800 font-poppins text-[14px] leading-[130%]">
                                        {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                                    </span>
                                </button>
                            )}
                        </div>
                    </>
                )}
            </section>

            <button
                onClick={handleSave}
                disabled={!name.trim() || updateFrameworkMutation.isPending || isLoading}
                className="bg-emerald-700 text-white pl-[20px] pr-[15px] py-[10px] rounded-[30px] flex gap-[10px] items-center justify-center text-[17px] font-[600] font-poppins leading-[130%] tracking-[-0.25px] w-full shadow-bottom-4-4 disabled:bg-grayscale-600"
            >
                {updateFrameworkMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );
};

export default EditFrameworkModal;
