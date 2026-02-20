import React, { useRef, useState, useMemo } from 'react';
import Papa from 'papaparse';
import { useHistory } from 'react-router-dom';

import AdminToolsModalFooter from '../AdminToolsModal/AdminToolsModalFooter';
import AdminToolsBulkBoostImportUploadStep from './AdminToolsBulkBoostImportUploadStep';
import AdminToolsBulkBoostImportAssignParent from './AdminToolsBulkBoostImportAssignParent';
import AdminToolsBulkBoostImportPrepareUploadStep from './AdminToolsBulkBoostImportPrepareUploadStep';
import BoostCMSIDCard from 'apps/learn-card-app/src/components/boost/boost-id-card/BoostIDCard';
import BoostPreview from 'apps/learn-card-app/src/components/boost/boostCMS/BoostPreview/BoostPreview';

import {
    useModal,
    useToast,
    useFilestack,
    useGetProfile,
    useCreateBoost,
    useConfirmation,
    conditionalPluralize,
    isValidUrl,
    ModalTypes,
    BoostCMSState,
    ToastTypeEnum,
    CredentialBadge,
    boostCategoryMetadata,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';

import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import { mapCategoryToBoostEnum, parseBadgeType, parseSkills } from './bulkImport.helpers';
import {
    getBoostCredentialPreview,
    getBoostVerificationPreview,
} from 'apps/learn-card-app/src/components/boost/boostHelpers';
import { LCNBoostStatusEnum } from 'apps/learn-card-app/src/components/boost/boost';
import { AdminToolOption } from '../AdminToolsModal/admin-tools.helpers';
import { getFileInfo } from '../../../hooks/useUploadFile';

import { useTheme } from '../../../theme/hooks/useTheme';

export enum ImageStatus {
    validUrl = 'valid-url',
    needsUpload = 'needs-upload',
    uploaded = 'uploaded',
    missing = 'missing',
}

export interface ImageTrackingInfo {
    originalValue: string;
    status: ImageStatus;
    uploadedUrl?: string;
}

export type ImageTrackingType = Map<number, Map<string, ImageTrackingInfo>>;

// Extract just the filename from a path or URL
export const extractFilename = (path: string): string => {
    if (!path) return '';

    // Extract filename from URL or path
    const parts = path.split(/[\/\\]/);
    return parts[parts.length - 1];
};

// aligned with Google Sheet / CSV headers
export const DataKeys = {
    title: 'Badge Title',
    category: 'Badge Category', // Merit Badge or Social Boost
    displayType: 'Display Type',

    description: 'Badge Description (About)',
    criteria: 'Badge Criteria',

    image: 'Badge Image',
    backgroundColor: 'Background Color',
    backgroundImage: 'Background Image',

    skills: 'Badge Skills',
    badgeType: 'Badge Type',
} as const;

export const ImageDataKeys = [DataKeys.image, DataKeys.backgroundImage];

export type BadgeDataRow = {
    [DataKeys.category]: string;
    [DataKeys.title]: string;
    [DataKeys.badgeType]: string;
    [DataKeys.displayType]: string;

    [DataKeys.description]: string;
    [DataKeys.criteria]: string;

    [DataKeys.image]: string;
    [DataKeys.backgroundColor]: string;
    [DataKeys.backgroundImage]: string;

    [DataKeys.skills]: string[]; // e.g. [ "Durable - Adaptability - Flexibility", "Durable - Lifelong Learning - Critical Thinking"]
};

export const deleteFromMapByIndex = (map: Map<number, any>, index: number) => {
    const iterator = map.keys(); // Get an iterator over the keys
    let keyToDelete;

    for (let i = 0; i <= index; i++) {
        keyToDelete = iterator.next().value; // Get the key at the given index
    }

    if (keyToDelete !== undefined) {
        map.delete(keyToDelete); // Remove the entry from the Map
    }
};

export const deleteIndexAndReindex = (map: Map<number, any>, idx: number) => {
    const entries = [...map.entries()].sort(([a], [b]) => a - b);
    entries.splice(idx, 1); // drop the idx-th row
    return new Map(entries.map(([, v], i) => [i, v] as const)); // re-key 0..n-1
};

const AdminToolsBulkBoostImportOption: React.FC<{
    option: AdminToolOption;
    showFooter?: boolean;
}> = ({ option, showFooter }) => {
    const history = useHistory();
    const confirm = useConfirmation();
    const { presentToast } = useToast();
    const { newModal, closeModal, closeAllModals } = useModal();
    const { data: profile } = useGetProfile();

    const [parentUri, setParentUri] = useState('');
    const [csvData, setCsvData] = useState<BadgeDataRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [numBoostsCreated, setNumBoostsCreated] = useState(0);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploadingImages, setIsUploadingImages] = useState(false);

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const [fileInfo, setFileInfo] = useState<{ type: string; size: string; name: string } | null>(
        null
    );
    const [zipInfo, setZipInfo] = useState<{ type: string; size: string; name: string } | null>(
        null
    );
    const [fileUploaded, setFileUploaded] = useState(false);
    const [zipUploaded, setZipUploaded] = useState(false);
    const zipInputRef = useRef(null);

    // Store extracted zip images
    const [zipImages, setZipImages] = useState<Map<string, Blob>>(new Map());

    // Track image status for each image field in each row
    //   row index -> image status
    const [imageTracking, setImageTracking] = useState<ImageTrackingType>(new Map());

    const { uploadImageFromUrl, singleImageUpload } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (url, _file, data) => {},
    });

    // Check if there are any missing images
    const hasMissingImages = useMemo(() => {
        for (const rowMap of imageTracking.values()) {
            for (const imageInfo of rowMap.values()) {
                if (
                    imageInfo.status === ImageStatus.needsUpload ||
                    imageInfo.status === ImageStatus.missing
                ) {
                    return true;
                }
            }
        }
        return false;
    }, [imageTracking]);

    // Function to handle file upload
    const handleFileUpload = event => {
        const file = event.target.files[0];

        if (file) {
            const fileInfo = getFileInfo(file);
            setFileInfo(fileInfo);

            Papa.parse(file, {
                complete: result => {
                    const parsedData = result.data.map(row => {
                        // remove extraneous fields
                        delete row['Badge #'];
                        delete row['Status'];
                        delete row['Tag'];
                        delete row['QR Code'];
                        delete row['SDGs Included'];

                        // parse skills into an array
                        const skills = row[DataKeys.skills];
                        if (typeof skills === 'string') {
                            row[DataKeys.skills] =
                                skills === '' ? [] : skills.split(',').map(skill => skill.trim());
                        }

                        return row;
                    });

                    setCsvData(parsedData);

                    // Initialize image tracking
                    const newImageTracking = new Map<number, Map<string, ImageTrackingInfo>>();

                    parsedData.forEach((row, rowIndex) => {
                        const rowMap = new Map<string, ImageTrackingInfo>();

                        ImageDataKeys.forEach(key => {
                            const value = row[key];
                            if (!value) {
                                rowMap.set(key, {
                                    originalValue: '',
                                    status: ImageStatus.validUrl,
                                });
                            } else if (isValidUrl(value)) {
                                rowMap.set(key, {
                                    originalValue: value,
                                    status: ImageStatus.validUrl,
                                });
                            } else {
                                rowMap.set(key, {
                                    originalValue: value,
                                    status: ImageStatus.needsUpload,
                                });
                            }
                        });

                        newImageTracking.set(rowIndex, rowMap);
                    });

                    setImageTracking(newImageTracking);
                    setFileUploaded(true);
                },
                header: true,
                skipEmptyLines: true,
            });
        }
    };

    // Function to handle zip file upload
    const handleZipUpload = async event => {
        const file = event.target.files[0];
        if (!file || !file.name.endsWith('.zip')) {
            presentToast('Please upload a valid ZIP file', {
                type: ToastTypeEnum.Error,
            });
            return;
        }

        const fileInfo = getFileInfo(file);
        setZipInfo(fileInfo);

        try {
            setIsLoading(true);
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            const zipContents = await zip.loadAsync(file);
            const imageMap = new Map<string, Blob>();

            // Extract all image files from the zip
            const extractionPromises = [];
            const totalFiles = Object.keys(zipContents.files).filter(
                path => !zipContents.files[path].dir && /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(path)
            ).length;

            let processedFiles = 0;

            zipContents.forEach((relativePath, zipEntry) => {
                // Skip directories and non-image files
                if (zipEntry.dir || !/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(relativePath)) {
                    return;
                }

                const filename = relativePath.split('/').pop().toLowerCase();

                const extractionPromise = zipEntry.async('blob').then(blob => {
                    imageMap.set(filename, blob);
                    processedFiles++;
                    setUploadProgress(Math.floor((processedFiles / totalFiles) * 100 * 0.5)); // First 50% is extraction
                });

                extractionPromises.push(extractionPromise);
            });

            await Promise.all(extractionPromises);
            setZipImages(imageMap);

            // Match images with rows and update tracking
            await uploadZipImages(imageMap);

            setZipUploaded(true);
            presentToast(`Successfully processed ${imageMap.size} images from ZIP file`, {
                type: ToastTypeEnum.Success,
            });
        } catch (error) {
            console.error('Error extracting ZIP file:', error);
            presentToast('Error extracting ZIP file', {
                type: ToastTypeEnum.Error,
            });
        } finally {
            setIsLoading(false);
            setUploadProgress(0);
        }
    };

    // Function to upload all images from the zip and update tracked status
    const uploadZipImages = async (imageMap: Map<string, Blob>) => {
        setIsUploadingImages(true);
        const newImageTracking = new Map(imageTracking);

        // Count how many images need uploading
        let totalUploads = 0;
        let completedUploads = 0;

        for (const [rowIndex, rowMap] of imageTracking.entries()) {
            for (const [key, info] of rowMap.entries()) {
                if (info.status === ImageStatus.needsUpload) {
                    const filename = extractFilename(info.originalValue).toLowerCase();
                    if (imageMap.has(filename)) {
                        totalUploads++;
                    }
                }
            }
        }

        // Process each row
        const uploadPromises = [];

        for (const [rowIndex, rowMap] of imageTracking.entries()) {
            const newRowMap = new Map(rowMap);

            for (const [key, info] of rowMap.entries()) {
                if (info.status === ImageStatus.needsUpload) {
                    const filename = extractFilename(info.originalValue).toLowerCase();
                    const blob = imageMap.get(filename);

                    if (blob) {
                        const uploadPromise = (async () => {
                            try {
                                const uploadedUrl = await singleImageUpload(blob);
                                newRowMap.set(key, {
                                    originalValue: info.originalValue,
                                    status: ImageStatus.uploaded,
                                    uploadedUrl,
                                });

                                // Update the CSV data with the new URL
                                const updatedCsvData = [...csvData];
                                updatedCsvData[rowIndex][key] = uploadedUrl;
                                setCsvData(updatedCsvData);

                                completedUploads++;
                                setUploadProgress(
                                    50 + Math.floor((completedUploads / totalUploads) * 100 * 0.5)
                                ); // Last 50% is Filestack upload
                            } catch (error) {
                                console.error(`Failed to upload image ${filename}:`, error);
                                newRowMap.set(key, {
                                    originalValue: info.originalValue,
                                    status: ImageStatus.missing,
                                });
                            }
                        })();

                        uploadPromises.push(uploadPromise);
                    } else {
                        newRowMap.set(key, {
                            originalValue: info.originalValue,
                            status: ImageStatus.missing,
                        });
                    }
                }
            }

            newImageTracking.set(rowIndex, newRowMap);
        }

        await Promise.all(uploadPromises);
        setImageTracking(newImageTracking);
        setIsUploadingImages(false);
        setUploadProgress(100);

        // Reset progress after a delay
        setTimeout(() => setUploadProgress(0), 1000);
    };

    // Function to clear the zip input and extracted images
    const clearZip = () => {
        setZipInfo(null);
        setZipImages(new Map());
        setZipUploaded(false);

        // Reset any 'uploaded' status to 'needs-upload'
        const newImageTracking = new Map(imageTracking);
        for (const [rowIndex, rowMap] of imageTracking.entries()) {
            const newRowMap = new Map(rowMap);

            for (const [key, info] of rowMap.entries()) {
                if (info.status === ImageStatus.uploaded) {
                    newRowMap.set(key, {
                        originalValue: info.originalValue,
                        status: ImageStatus.needsUpload,
                    });

                    // Revert the CSV data back to original filename
                    const updatedCsvData = [...csvData];
                    updatedCsvData[rowIndex][key] = info.originalValue;
                    setCsvData(updatedCsvData);
                }
            }

            newImageTracking.set(rowIndex, newRowMap);
        }

        setImageTracking(newImageTracking);

        if (zipInputRef.current) {
            zipInputRef.current.value = '';
        }
    };

    // Function to clear the file input and CSV data
    const clearFile = () => {
        clearZip(); // must be first otherwise csvData won't get cleared properly
        setCsvData([]);
        setFileInfo(null);
        setFileUploaded(false);
        setImageTracking(new Map());
    };

    const { mutateAsync: createBoost } = useCreateBoost();

    const confirmImport = async () => {
        // Check for missing images
        if (hasMissingImages) {
            presentToast('Please upload all required images before publishing', {
                type: ToastTypeEnum.Error,
                duration: 5000,
            });
            return;
        }

        await confirm({
            text: `Are you sure you want to upload ${conditionalPluralize(
                csvData.length,
                'Boost'
            )}?`,
            onConfirm: handleBulkImport,
        });
    };

    const csvRowToState = async (csvRow: any) => {
        const category = mapCategoryToBoostEnum(csvRow[DataKeys.category]);
        const defaultBadgeThumb = boostCategoryMetadata[category].CategoryImage;
        const isID = category === BoostCategoryOptionsEnum.id;

        // assumes images (thumb + background) have already been uploaded to filestack if necessary

        const fudgedState: BoostCMSState = {
            basicInfo: {
                name: csvRow[DataKeys.title],
                description: csvRow[DataKeys.description],
                narrative: csvRow[DataKeys.criteria],
                type: category,
                achievementType: parseBadgeType(category, csvRow[DataKeys.badgeType]),
                credentialExpires: false,
                expirationDate: null,
            },
            appearance: {
                badgeThumbnail: csvRow[DataKeys.image] || defaultBadgeThumb,
                backgroundImage: isID ? undefined : csvRow[DataKeys.backgroundImage],
                backgroundColor: csvRow[DataKeys.backgroundColor],
                idBackgroundImage: isID ? csvRow[DataKeys.backgroundImage] : undefined,
                displayType: csvRow[DataKeys.displayType]?.toLowerCase() || 'badge',
            },
            skills: parseSkills(csvRow[DataKeys.skills]),
            address: {},
        };

        return fudgedState;
    };

    const handleBulkImport = async () => {
        setIsLoading(true);
        setNumBoostsCreated(0);

        try {
            // Process batch using Promise.all for parallel processing
            await Promise.all(
                csvData.map(async (data, index) => {
                    // upload images if they're not already in filestack
                    let badgeThumb = data[DataKeys.image];
                    if (badgeThumb && !badgeThumb.includes('filestack')) {
                        badgeThumb = await uploadImageFromUrl(badgeThumb);
                    }

                    let bgImage = data[DataKeys.backgroundImage];
                    if (bgImage && !bgImage.includes('filestack')) {
                        bgImage = await uploadImageFromUrl(bgImage);
                    }

                    const fudgedState = await csvRowToState({
                        ...data,
                        [DataKeys.image]: badgeThumb,
                        [DataKeys.backgroundImage]: bgImage,
                    });

                    // create boost
                    const { boostUri } = await createBoost({
                        parentUri,
                        state: fudgedState,
                        status: LCNBoostStatusEnum.live,
                    });

                    setNumBoostsCreated(prev => prev + 1);
                })
            );

            closeAllModals();

            presentToast('Boosts imported successfully!', {
                duration: 5000,
                hasDismissButton: true,
                type: ToastTypeEnum.Success,
            });
        } catch (e) {
            console.error('Failed to bulk import boosts: ', e?.message);

            presentToast(`Bulk boost import failed! ${e?.message}`, {
                duration: 5000,
                hasDismissButton: true,
                type: ToastTypeEnum.Error,
            });
        } finally {
            setNumBoostsCreated(0);
            setIsLoading(false);
        }
    };

    const handlePreview = async (csvRow: any) => {
        const state = await csvRowToState(csvRow);

        const isID = state?.basicInfo.type === 'ID';
        const isBadgeDisplay = state?.appearance.displayType === 'badge';

        const customThumbComponent = isID ? (
            <BoostCMSIDCard
                state={state}
                setState={() => {}}
                idClassName="p-0 m-0 mt-4 boost-id-preview-body min-h-[160px]"
                idFooterClassName="p-0 m-0 mt-[-15px] boost-id-preview-footer"
            />
        ) : (
            <CredentialBadge
                achievementType={state?.basicInfo?.achievementType}
                boostType={state?.basicInfo?.type}
                badgeThumbnail={state?.appearance?.badgeThumbnail}
                badgeCircleCustomClass="w-[170px] h-[170px]"
            />
        );

        newModal(
            <BoostPreview
                close
                credential={getBoostCredentialPreview(state)}
                categoryType={state?.basicInfo?.type}
                verificationItems={getBoostVerificationPreview(state)}
                customThumbComponent={customThumbComponent}
                issuerOverride={profile}
                handleCloseModal={() => closeModal?.()}
            />,
            {
                backgroundImage: !isBadgeDisplay ? state?.appearance?.backgroundImage : undefined,
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const handleDeleteRow = (rowIndex: number) => {
        setCsvData(prev => prev.filter((_, i) => i !== rowIndex));
        setImageTracking(prev => deleteIndexAndReindex(prev, rowIndex));
    };

    const loadingText = `Importing boosts (${numBoostsCreated}/${csvData.length})...`;

    const showLoader = isLoading || isUploadingImages;

    return (
        <section className="h-full w-full flex flex-col items-center justify-start overflow-y-scroll pt-4 gap-4 pb-[100px]">
            <AdminToolsBulkBoostImportPrepareUploadStep />
            <AdminToolsBulkBoostImportUploadStep
                handleUpload={handleFileUpload}
                fileInfo={fileInfo}
                zipInfo={zipInfo}
                clearFile={clearFile}
                clearZip={clearZip}
                fileUploaded={fileUploaded}
                zipUploaded={zipUploaded}
                hasMissingImages={hasMissingImages}
                csvData={csvData}
                imageTracking={imageTracking}
                handleZipUpload={handleZipUpload}
                handlePreview={handlePreview}
                handleDeleteRow={handleDeleteRow}
                showLoader={showLoader}
            />
            <AdminToolsBulkBoostImportAssignParent
                parentUri={parentUri}
                setParentUri={setParentUri}
            />

            <AdminToolsModalFooter
                onSave={confirmImport}
                isDisabled={isLoading || !fileUploaded || csvData?.length === 0 || hasMissingImages}
                showSaveButton
                className="z-[100]"
                isLoading={isLoading}
            />
        </section>
    );
};

export default AdminToolsBulkBoostImportOption;
