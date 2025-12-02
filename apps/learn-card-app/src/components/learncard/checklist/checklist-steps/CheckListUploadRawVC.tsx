import React, { useEffect, useRef, useState } from 'react';

import { IonHeader, IonTextarea, IonToolbar } from '@ionic/react';
import X from 'learn-card-base/svgs/X';
import Plus from 'learn-card-base/svgs/Plus';
import UploadIcon from 'learn-card-base/svgs/UploadIcon';
import AlertTriangle from '../../../svgs/AlertTriangle';
import ChecklistLoader from '../loader/ChecklistLoader';
import CheckListItemSkeleton from './CheckListItemSkeleton';
import CheckListUploadedItem from './helpers/CheckListUploadedItem';
import CheckListManagerFooter from '../CheckListManager/CheckListManagerFooter';
import BulkImportWithPlusIcon from 'learn-card-base/svgs/BulkImportWithPlusIcon';

import {
    useToast,
    useWallet,
    checklistStore,
    ToastTypeEnum,
    UploadTypesEnum,
    CredentialCategoryEnum,
    conditionalPluralize,
} from 'learn-card-base';
import { useUploadFile } from '../../../../hooks/useUploadFile';
import { useUploadVcFromText } from '../../../../hooks/useUploadVcFromText';
import useTheme from '../../../../theme/hooks/useTheme';

export type RawVCFileType = {
    id: string;
    fileName: string;
    fileSize: string;
    fileType: string;
    type: string;
    category: CredentialCategoryEnum;
    uri: string;
};

export const CheckListUploadRawVC: React.FC = () => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { getJsonFiles, isUploading, isSaving } = useUploadFile(UploadTypesEnum.RawVC);
    const { uploadVcFromText, validateTextVC } = useUploadVcFromText();

    const [rawVcText, setRawVcText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isUploadingRawVC, setIsUploadingRawVC] = useState<boolean>(false);
    const [rawTextErrors, setRawTextErrors] = useState<string[]>([]);
    const [fileErrors, setFileErrors] = useState<string[]>([]);

    const [rawVCs, setRawVCs] = useState<RawVCFileType[]>([]);

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const loadRawVCs = async () => {
        try {
            setIsLoading(true);
            const wallet = await initWallet();
            const records = await wallet.index.LearnCloud.get({
                uploadType: UploadTypesEnum.RawVC,
            });

            const recordUris =
                records?.map(
                    ({
                        uri,
                        id,
                        fileName,
                        fileSize,
                        fileType,
                        uploadType,
                        category,
                    }: {
                        uri: string;
                        id: string;
                        fileName: string;
                        fileSize: string;
                        fileType: string;
                        uploadType: string;
                        category: CredentialCategoryEnum;
                    }) => ({ uri, id, fileName, fileSize, fileType, uploadType, category })
                ) ?? [];
            if (recordUris?.length === 0) {
                setRawVCs([]);
                setIsLoading(false);
                return;
            }
            const rawVCsCredentials = await Promise.all(
                recordUris.map(
                    async ({
                        uri,
                        id,
                        fileName,
                        fileSize,
                        fileType,
                        uploadType,
                        category,
                    }: {
                        uri: string;
                        id: string;
                        fileName: string;
                        fileSize: string;
                        fileType: string;
                        uploadType: string;
                        category: CredentialCategoryEnum;
                    }) => {
                        return {
                            ...(await wallet.read.get(uri)),
                            recordId: id,
                            fileName,
                            fileSize,
                            fileType,
                            uploadType,
                            category,
                            uri,
                        };
                    }
                )
            );

            const _rawVCs = rawVCsCredentials.map(
                ({ recordId, fileName, fileSize, fileType, category, uri }: any) => ({
                    id: recordId,
                    fileName,
                    fileSize,
                    fileType,
                    type: UploadTypesEnum.RawVC,
                    category,
                    uri,
                })
            );
            setRawVCs(_rawVCs);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            console.error('handleSetRawVCs::error', error);
        }
    };

    useEffect(() => {
        loadRawVCs();
    }, []);

    // Validate VC on input change
    useEffect(() => {
        const errors = validateTextVC(rawVcText);
        if (errors?.length > 0) {
            setRawTextErrors(errors);
        } else {
            setRawTextErrors([]);
        }
    }, [rawVcText]);

    const handleAddRawVcText = async () => {
        try {
            setIsUploadingRawVC(true);
            if (rawTextErrors.length > 0) {
                return;
            }

            const result = await uploadVcFromText(rawVcText, {
                uploadType: UploadTypesEnum.RawVC,
            });

            if (result?.success) {
                setRawVcText('');
                loadRawVCs();
                presentToast(`Your journey is now reflected in portable, trusted credentials.`, {
                    title: `JSON VC Successfully Parsed`,
                    hasDismissButton: true,
                    type: ToastTypeEnum.Success,
                    hasCheckmark: true,
                    duration: 5000,
                });
            } else {
                setRawTextErrors([`Failed to parse JSON VC. ${result?.error}`]);
            }
        } catch (error: any) {
            setRawTextErrors([error.message]);
        } finally {
            setIsUploadingRawVC(false);
        }
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    return (
        <div className="h-full relative bg-grayscale-100">
            <IonHeader
                color="light"
                className="rounded-b-[30px] safe-area-top-margin overflow-hidden shadow-md "
            >
                <IonToolbar color="light" className="text-white px-4 !py-4">
                    <div className="flex items-center justify-normal p-2">
                        <div className="flex items-center gap-[10px]">
                            <BulkImportWithPlusIcon className="w-[65px] h-[65px]" />
                            <h5 className="text-[22px] font-semibold text-grayscale-900 font-poppins leading-[24px]">
                                Add Credentials
                            </h5>
                        </div>
                    </div>
                </IonToolbar>
            </IonHeader>
            <section className="h-full bg-grayscale-100 ion-padding overflow-y-scroll pb-[200px]">
                {(isSaving || checklistStore.get.isParsing().rawVC) && (
                    <ChecklistLoader fileType={UploadTypesEnum.RawVC} />
                )}
                <div className="w-full bg-white flex flex-col gap-[20px] items-center justify-center shadow-bottom-2-4 p-[15px] mt-4 rounded-[15px]">
                    <div className="flex flex-col items-start justify-center gap-[5px]">
                        <h4 className="text-[20px] text-grayscale-900 font-notoSans text-left">
                            Verifiable Credentials
                        </h4>
                        <p className="text-[14px] text-grayscale-600 font-notoSans text-left">
                            Upload or paste raw JSON credentials to add them to your wallet.
                        </p>
                    </div>

                    <input
                        multiple
                        type="file"
                        accept=".json"
                        onChange={async e => {
                            setFileErrors([]);
                            const results = await getJsonFiles(e, error => {
                                setFileErrors(Array.isArray(error) ? error : [error]);
                            });

                            if (results) {
                                setRawVCs(prev => [
                                    ...prev,
                                    ...results?.map((result: any) => ({
                                        id: result?.id,
                                        fileName: result?.fileInfo?.name,
                                        fileSize: result?.fileInfo?.size,
                                        fileType: result?.fileInfo?.type,
                                        type: UploadTypesEnum.RawVC,
                                        category: result?.category as CredentialCategoryEnum,
                                        uri: result?.credentialUri,
                                    })),
                                ]);
                            }
                        }}
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                    />

                    {fileErrors.length > 0 && (
                        <div className="flex flex-col gap-[5px] p-[10px] bg-orange-100 rounded-[10px] text-orange-700 w-full">
                            <h5 className="font-poppins text-[17px] font-[600] flex items-center gap-[8px]  ">
                                <AlertTriangle className="w-[24px] h-[24px]" />
                                {conditionalPluralize(fileErrors.length, 'Error', {
                                    includeCount: false,
                                })}
                                <button
                                    className="ml-auto"
                                    onClick={() => {
                                        setFileErrors([]);
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }}
                                >
                                    <X className="w-[18px] h-[18px]" />
                                </button>
                            </h5>
                            <ul className="list-disc list-inside pl-[6px]">
                                {fileErrors.map((error, index) => (
                                    <li key={index} className="font-poppins text-[14px]">
                                        {error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        onClick={triggerFileInput}
                        className={`w-full flex gap-[10px] rounded-[30px] items-center justify-center py-[7px] px-[15px] font-[600] text-[17px] leading-[24px] tracking-[0.25px] bg-${primaryColor} text-white disabled:opacity-60`}
                        disabled={isUploading}
                    >
                        <UploadIcon className="w-[25px] h-[25px] text-white" strokeWidth="2" />
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>

                    <div className="w-full h-[1px] bg-grayscale-200" />

                    <div className="flex flex-col gap-[10px] w-full">
                        <IonTextarea
                            value={rawVcText}
                            onIonInput={e => {
                                setRawVcText(e.detail.value);
                            }}
                            className="ion-no-padding !mb-0 h-[112px] overflow-hidden bg-grayscale-100 rounded-[10px] text-grayscale-800 text-[15px] font-notoSans"
                            // For some reason placeholder-grayscale-400 doesn't work
                            style={{
                                '--placeholder-color': 'rgb(156 163 175)', // grayscale-400 equivalent
                                '--placeholder-opacity': '0.7',
                                '--padding-top': '10px',
                                '--padding-start': '10px',
                                '--padding-end': '10px',
                                '--padding-bottom': '10px',
                            }}
                            placeholder="Paste your JSON here..."
                            rows={4}
                        />

                        {rawTextErrors.length > 0 && (
                            <div className="flex flex-col gap-[5px] p-[10px] bg-orange-100 rounded-[10px] text-orange-700">
                                <h5 className="font-poppins text-[17px] font-[600] flex items-center gap-[8px]  ">
                                    <AlertTriangle className="w-[24px] h-[24px]" />
                                    {conditionalPluralize(rawTextErrors.length, 'Error', {
                                        includeCount: false,
                                    })}
                                </h5>
                                <ul className="list-disc list-inside pl-[6px]">
                                    {rawTextErrors.map((error, index) => (
                                        <li key={index} className="font-poppins text-[14px]">
                                            {error}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={handleAddRawVcText}
                            className={`w-full flex gap-[10px] rounded-[30px] items-center justify-center py-[7px] px-[15px] font-[600] text-[17px] leading-[24px] tracking-[0.25px] text-white ${
                                isUploadingRawVC ? 'opacity-60' : ''
                            } ${
                                !rawVcText || rawTextErrors.length > 0
                                    ? 'bg-grayscale-300'
                                    : `bg-${primaryColor}`
                            }`}
                            disabled={!rawVcText || isUploadingRawVC || rawTextErrors.length > 0}
                        >
                            <Plus className="w-[25px] h-[25px] text-white" />
                            {isUploadingRawVC ? 'Parsing...' : 'Add'}
                        </button>
                    </div>
                </div>

                {rawVCs?.length !== 0 && (
                    <div className="w-full bg-white flex flex-col gap-[20px] justify-center shadow-bottom-2-4 p-[15px] mt-4 mb-12 rounded-[15px]">
                        <h4 className="text-[20px] text-grayscale-900 font-notoSans text-left">
                            {isLoading ? '...' : rawVCs?.length ?? 0} Verifiable Credential
                            {rawVCs?.length === 1 ? '' : 's'}
                        </h4>

                        {isLoading && <CheckListItemSkeleton />}

                        {!isLoading &&
                            rawVCs?.length > 0 &&
                            rawVCs?.map?.((rawVC: RawVCFileType) => {
                                return (
                                    <CheckListUploadedItem
                                        key={rawVC?.id}
                                        rawVC={rawVC}
                                        onSuccess={() => loadRawVCs()}
                                    />
                                );
                            })}
                    </div>
                )}

                <CheckListManagerFooter
                    loading={isSaving || checklistStore.get.isParsing().rawVC}
                />
            </section>
        </div>
    );
};

export default CheckListUploadRawVC;
