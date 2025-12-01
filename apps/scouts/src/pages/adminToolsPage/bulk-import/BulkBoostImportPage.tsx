import React, { useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router';
import Papa from 'papaparse';
import JSZip from 'jszip';
import {
    conditionalPluralize,
    isValidUrl,
    ModalTypes,
    BrandingEnum,
    ToastTypeEnum,
    BoostCMSState,
    CredentialBadge,
    useConfirmation,
    useCreateBoost,
    useGetProfile,
    useFilestack,
    useGetBoost,
    useModal,
    useToast,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';

import X from 'learn-card-base/svgs/X';
import BoostLoader from '../../../components/boost/boostLoader/BoostLoader';
import BulkBoostParentSelector from './BulkBoostParentSelector';
import AdminPageStructure from '../AdminPageStructure';
import BoostPreview from '../../../components/boost/boostCMS/BoostPreview/BoostPreview';

import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import { parseBadgeType, parseSkills } from './bulkImport.helpers';
import { LCNBoostStatusEnum } from '../../../components/boost/boost';
import { boostCategoryOptions } from '../../../components/boost/boost-options/boostOptions';
import {
    getBoostCredentialPreview,
    getBoostVerificationPreview,
} from '../../../components/boost/boostHelpers';
import BulkBoostImportInstructions from './BulkImportInstructions';
import BulkImportMissingImagesError from './BulkImportMissingImagesError';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import BulkImportDataRow from './BulkImportDataRow';

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

// aligned with Airtable / CSV headers
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
    [DataKeys.category]: 'Merit Badge' | 'Social Boost';
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

const BulkBoostImportPage: React.FC = () => {
    const history = useHistory();
    const confirm = useConfirmation();
    const { presentToast } = useToast();
    const { newModal, closeModal } = useModal();
    const { data: profile } = useGetProfile();

    const [parentUri, setParentUri] = useState('');
    const [csvData, setCsvData] = useState<BadgeDataRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [numBoostsCreated, setNumBoostsCreated] = useState(0);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploadingImages, setIsUploadingImages] = useState(false);

    const [fileUploaded, setFileUploaded] = useState(false);
    const [zipUploaded, setZipUploaded] = useState(false);
    const fileInputRef = useRef(null);
    const zipInputRef = useRef(null);

    // Store extracted zip images
    const [zipImages, setZipImages] = useState<Map<string, Blob>>(new Map());

    // Track image status for each image field in each row
    //   row index -> image status
    const [imageTracking, setImageTracking] = useState<ImageTrackingType>(new Map());

    const { data: networkBoost } = useGetBoost(parentUri);
    const networkName = networkBoost?.meta?.edits?.name ?? networkBoost?.name;

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

        try {
            setIsLoading(true);
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
        setFileUploaded(false);
        setImageTracking(new Map());

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
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

        const numBoosts = csvData.filter(data => data[DataKeys.category] === 'Social Boost').length;
        const numBadges = csvData.filter(data => data[DataKeys.category] === 'Merit Badge').length;
        await confirm({
            text: `Are you sure you want to upload ${conditionalPluralize(
                numBadges,
                'Merit Badge'
            )} and ${conditionalPluralize(numBoosts, 'Social Boost')} to ${networkName}?`,
            onConfirm: handleBulkImport,
        });
    };

    const csvRowToState = async (csvRow: any) => {
        let badgeThumb = csvRow[DataKeys.image];
        let bgImage = csvRow[DataKeys.backgroundImage];

        // assumes images (thumb + background) have already been uploaded to filestack if necessary

        let defaultBadgeThumb;
        let category = csvRow[DataKeys.category];
        const isMeritBadge = category === 'Merit Badge';

        if (isMeritBadge) {
            // category = category // it's already "Merit Badge" so nothing to do here
            defaultBadgeThumb =
                boostCategoryOptions[BoostCategoryOptionsEnum.meritBadge].CategoryImage;
        } else {
            category = 'Social Badge'; // createBoost expects "Social Badge", not "Social Boost"
            defaultBadgeThumb =
                boostCategoryOptions[BoostCategoryOptionsEnum.socialBadge].CategoryImage;
        }

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
                badgeThumbnail: badgeThumb || defaultBadgeThumb,
                backgroundImage: bgImage,
                backgroundColor: csvRow[DataKeys.backgroundColor],
                displayType: isMeritBadge ? 'award' : 'badge',
            },
            skills: parseSkills(csvRow[DataKeys.skills]),
        };

        return fudgedState;
    };

    const handleBulkImport = async () => {
        setIsLoading(true);
        setNumBoostsCreated(0);

        try {
            await Promise.all(
                csvData.map(async data => {
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

            presentToast('Boosts imported successfully!', {
                duration: 5000,
                hasDismissButton: true,
                type: ToastTypeEnum.Success,
            });

            history.push('/admin-tools');
        } catch (e) {
            console.error('Failed to bulk import boosts: ', e.message);

            presentToast(`Bulk boost import failed! ${e.message}`, {
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

        const isMeritBadge = state.basicInfo.type === 'Merit Badge';

        // const customThumbComponent = isID ? (
        //     <BoostCMSIDCard
        //         state={state}
        //         setState={() => { }}
        //         idClassName="p-0 m-0 mt-4 boost-id-preview-body min-h-[160px]"
        //         idFooterClassName="p-0 m-0 mt-[-15px] boost-id-preview-footer"
        //     />
        // ) : (
        //     <CredentialBadge
        //         achievementType={state?.basicInfo?.achievementType}
        //         boostType={state?.basicInfo?.type}
        //         badgeThumbnail={state?.appearance?.badgeThumbnail}
        //         badgeCircleCustomClass="w-[170px] h-[170px]"
        //     />
        // );

        newModal(
            <BoostPreview
                close
                credential={getBoostCredentialPreview(state)}
                categoryType={state?.basicInfo?.type}
                verificationItems={getBoostVerificationPreview(state)}
                // customThumbComponent={customThumbComponent}
                customThumbComponent={
                    !isMeritBadge ? (
                        <CredentialBadge
                            achievementType={state?.basicInfo?.achievementType}
                            boostType={state?.basicInfo?.type}
                            badgeThumbnail={state?.appearance?.badgeThumbnail}
                            badgeCircleCustomClass="w-[170px] h-[170px]"
                            branding={BrandingEnum.scoutPass}
                        />
                    ) : undefined
                }
                issuerOverride={profile}
                handleCloseModal={() => closeModal?.()}
            />,
            {
                backgroundImage: isMeritBadge ? state?.appearance?.backgroundImage : undefined,
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const handleDeleteRow = (rowIndex: number) => {
        setCsvData(csvData.filter((data, index) => index !== rowIndex));

        function deleteFromMapByIndex(map: Map<number, any>, index: number) {
            const iterator = map.keys(); // Get an iterator over the keys
            let keyToDelete;

            for (let i = 0; i <= index; i++) {
                keyToDelete = iterator.next().value; // Get the key at the given index
            }

            if (keyToDelete !== undefined) {
                map.delete(keyToDelete); // Remove the entry from the Map
            }
        }

        const newImageTracking = new Map(imageTracking); // Copy the Map
        deleteFromMapByIndex(newImageTracking, rowIndex);
        setImageTracking(newImageTracking);
    };

    const loadingText = isUploadingImages
        ? `Uploading images (${uploadProgress}%)...`
        : `Importing boosts (${numBoostsCreated}/${csvData.length})...`;

    const showZipInput = zipUploaded || (fileUploaded && hasMissingImages);

    const showLoader = isLoading || isUploadingImages;

    return (
        <AdminPageStructure title="Bulk Boost Import">
            {showLoader && <BoostLoader text={loadingText} />}
            <section
                className={
                    showLoader
                        ? 'h-0 overflow-hidden'
                        : 'w-full h-full text-grayscale-900 px-[20px] flex flex-col gap-[40px] relative overflow-auto'
                }
            >
                <BulkBoostImportInstructions />

                <div className="flex flex-col gap-[20px] max-w-[600px] mx-auto">
                    <div className="flex gap-[10px] items-center">
                        <span className="font-[600] w-[100px]">CSV Data:</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="flex-1"
                        />
                        {fileUploaded && (
                            <button
                                onClick={clearFile}
                                className="px-4 py-2 bg-red-500 text-white rounded flex items-center justify-center"
                            >
                                <X className="h-[16px] w-[16px]" />
                            </button>
                        )}
                    </div>

                    {showZipInput && (
                        <div className="flex gap-[10px] items-center">
                            <span className="font-[600] w-[100px]">Images ZIP:</span>
                            <input
                                ref={zipInputRef}
                                type="file"
                                accept=".zip"
                                onChange={handleZipUpload}
                                className="flex-1"
                            />
                            {zipUploaded && (
                                <button
                                    onClick={clearZip}
                                    className="px-4 py-2 bg-red-500 text-white rounded flex items-center justify-center"
                                >
                                    <X className="h-[16px] w-[16px]" />
                                </button>
                            )}
                        </div>
                    )}

                    {zipUploaded && (
                        <div className="pl-[100px] text-sm text-green-700 flex items-center">
                            <Checkmark className="h-4 w-4 mr-1" />
                            Found {zipImages.size} images in ZIP file
                        </div>
                    )}

                    <div className="min-w-[400px] mx-auto">
                        <BulkBoostParentSelector
                            parentUri={parentUri}
                            setParentUri={setParentUri}
                        />
                    </div>
                </div>

                {fileUploaded && hasMissingImages && (
                    <BulkImportMissingImagesError csvData={csvData} imageTracking={imageTracking} />
                )}

                {fileUploaded && (
                    <button
                        disabled={
                            isLoading ||
                            !fileUploaded ||
                            csvData?.length === 0 ||
                            !parentUri ||
                            hasMissingImages
                        }
                        onClick={confirmImport}
                        className="px-4 py-3 bg-sp-purple-base text-white text-[22px] rounded max-w-[400px] mx-auto disabled:opacity-60"
                    >
                        Upload!
                    </button>
                )}

                {csvData.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto border-collapse border border-gray-200">
                            <thead>
                                <tr>
                                    <th className="border px-2 py-2"></th>
                                    <th className="border px-2 py-2">{DataKeys.title}</th>
                                    <th className="border px-2 py-2">{DataKeys.category}</th>
                                    <th className="border px-2 py-2">{DataKeys.badgeType}</th>
                                    <th className="border px-2 py-2">{DataKeys.image}</th>
                                    <th className="border px-2 py-2">{DataKeys.backgroundImage}</th>
                                    <th className="border px-2 py-2">{DataKeys.description}</th>
                                    <th className="border px-2 py-2">{DataKeys.criteria}</th>
                                    <th className="border px-2 py-2">{DataKeys.displayType}</th>
                                    <th className="border px-2 py-2">{DataKeys.backgroundColor}</th>
                                    <th className="border px-2 py-2">{DataKeys.skills}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {csvData.map((row, rowIndex) => {
                                    const rowTracking = imageTracking.get(rowIndex) || new Map();
                                    return (
                                        <BulkImportDataRow
                                            key={rowIndex}
                                            row={row}
                                            rowTracking={rowTracking}
                                            handlePreview={() => handlePreview(row)}
                                            handleDeleteRow={() => handleDeleteRow(rowIndex)}
                                        />
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </AdminPageStructure>
    );
};

export default BulkBoostImportPage;
