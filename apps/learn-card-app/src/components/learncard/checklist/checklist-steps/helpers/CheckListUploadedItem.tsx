import React from 'react';

import TrashBin from '../../../../svgs/TrashBin';
import CaretDown from 'learn-card-base/svgs/CaretDown';
import JsonDocIcon from 'learn-card-base/svgs/JsonDocIcon';
import CheckListItemSkeleton from '../CheckListItemSkeleton';
import CategorySelector from '../../../../categorySelector/CategorySelector';

import {
    useConfirmation,
    useGetCheckListStatus,
    CredentialCategoryEnum,
    useModal,
    useDeleteChecklistCredentialMutation,
    useUpdateChecklistItemCategoryMutation,
    categoryMetadata,
} from 'learn-card-base';

export type RawVCFileType = {
    id: string; // LearnCloud record id
    fileName: string;
    fileSize: string;
    fileType: string;
    type: string;
    category: CredentialCategoryEnum;
    uri: string;
};

export const CheckListUploadRawVC: React.FC<{ rawVC: RawVCFileType; onSuccess: () => void }> = ({
    rawVC,
    onSuccess = () => {},
}) => {
    const { newModal, closeModal } = useModal();

    const { mutate: deleteChecklistCredentialMutation, isPending: isDeleting } =
        useDeleteChecklistCredentialMutation();
    const { mutate: updateChecklistItemCategoryMutation, isPending: isUpdating } =
        useUpdateChecklistItemCategoryMutation();
    const { refetchCheckListStatus } = useGetCheckListStatus();
    const confirm = useConfirmation();

    const handleDeleteTranscript = async (id: string, uri: string) => {
        deleteChecklistCredentialMutation(
            { id, uri },
            {
                onSuccess: () => {
                    refetchCheckListStatus();
                    onSuccess();
                },
            }
        );
    };

    const confirmDelete = async (id: string, uri: string) => {
        if (
            await confirm({
                text: `Are you sure you want remove your uploaded credential?`,
                cancelButtonClassName:
                    'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px] ',
                confirmButtonClassName:
                    'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
            })
        ) {
            await handleDeleteTranscript(id, uri);
        }
    };

    const handleUpdateCategory = async (category: string, id: string, uri: string) => {
        updateChecklistItemCategoryMutation(
            { id, category, uri },
            {
                onSuccess: () => {
                    refetchCheckListStatus();
                    onSuccess();
                },
            }
        );
        closeModal();
    };

    const handleOpenCategorySelector = (category: string, id: string, uri: string) => {
        newModal(
            <CategorySelector
                hideFamily
                activeCategory={category as CredentialCategoryEnum}
                handleOnClick={(category: string) => handleUpdateCategory(category, id, uri)}
            />
        );
    };

    const { title, IconComponent, color } =
        categoryMetadata[rawVC?.category as CredentialCategoryEnum];

    if (isDeleting || isUpdating) return <CheckListItemSkeleton />;

    return (
        <div className="flex flex-col gap-[10px] py-[10px]">
            <div className="flex items-center justify-between w-full relative h-[64px]">
                <div className="flex items-center justify-start gap-[10px]">
                    <JsonDocIcon className="h-[50px] w-[50px] shrink-0" />
                    <div className="flex items-start justify-center text-left flex-col px-[5px] pr-[5px]">
                        <p className="text-grayscale-900 font-notoSans text-[14px] font-[600] text-left line-clamp-2">
                            {rawVC?.fileName}
                        </p>
                        <p className="w-full text-[12px] text-grayscale-600 font-notoSans">
                            {rawVC?.fileType && rawVC?.fileSize
                                ? `${rawVC?.fileType} • ${rawVC?.fileSize}`
                                : 'JSON • Pasted'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => confirmDelete(rawVC?.id, rawVC?.uri)}
                    className="bg-white overflow-hidden rounded-full shadow-bottom p-2 min-h-[35px] min-w-[35px]"
                >
                    <TrashBin className="text-blue-950 h-[25px] w-[25px]" />
                </button>
            </div>

            <button
                onClick={() => handleOpenCategorySelector(rawVC?.category, rawVC?.id, rawVC?.uri)}
                className="w-full flex gap-[10px] items-center bg-grayscale-100 py-[2px] pl-[2px] pr-[10px] rounded-[30px]"
            >
                <div
                    className={`flex items-center justify-center w-[30px] h-[30px] rounded-full overflow-hidden bg-${color} shrink-0 p-[5px]`}
                >
                    <IconComponent className="w-[25px] h-[25px]" />
                </div>
                <p className="w-full text-[14px] text-grayscale-800 font-[600] text-left font-poppins leading-[130%] line-clamp-1">
                    {title}
                </p>
                <CaretDown className="text-grayscale-800 h-[15px] w-[15px] ml-auto" />
            </button>
        </div>
    );
};

export default CheckListUploadRawVC;
