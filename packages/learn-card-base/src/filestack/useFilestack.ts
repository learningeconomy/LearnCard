import React, { MouseEvent, useEffect, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

import { client, UploadOptions } from './ReactFileStackClient';

import useResizePhoto from './useResizePhoto';

const API_KEY = 'A7RsW3VzfSNO2TCsFJ6Eiz';

export const filestack = client.init(API_KEY, { sessionCache: false });

export type UploadRes = {
    filename: string;
    handle: string;
    mimetype: string;
    size: number;
    status: string;
    url: string;
};

type UseFileStack = (args: {
    onUpload: (url: string, file: File, res: UploadRes) => void;
    onFileSelected?: (file: File) => void;
    onPhotoResized?: (file: File) => void;
    fileType?: string | string[];
    options?: UploadOptions;
    resizeBeforeUploading?: boolean;
}) => {
    fileSelector: HTMLInputElement | null;
    handleFileSelect: (e?: MouseEvent) => void;
    isLoading: boolean;
    error: any;
    directUploadFile: (file: File) => void;
};

// Helper function to convert data URL to File
const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
};

export const useFilestack: UseFileStack = ({
    onUpload,
    onFileSelected,
    onPhotoResized,
    fileType = 'image/*',
    options = {},
    resizeBeforeUploading = false,
}) => {
    const resizePhoto = useResizePhoto();
    const [fileSelector, setFileSelector] = useState<HTMLInputElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fileSelectorRef = useRef<HTMLInputElement>();

    const getFileToUpload = async (file: File) => {
        if (!resizeBeforeUploading) return file;

        try {
            if (file.length > 1) {
                return file;
            }

            return await resizePhoto(file);
        } catch (e) {
            console.log('filestack::getFileToUpload::error', e);
            setError(e);
            return false;
        }
    };

    const singleImageUpload = (file: File) => {
        return new Promise((resolve, reject) => {
            filestack // single image upload
                .upload(file, options)
                .then((res: UploadRes) => {
                    onUpload(res.url, file, res);
                    resolve(res.url); // return the url if you await singleImageUpload
                })
                .catch(e => {
                    console.log('filestack::singleImageUpload::error', e);
                    setError(e);
                    reject(e);
                })
                .finally(() => setIsLoading(false));
        });
    };

    const directUploadFile = async (file: File) => {
        setIsLoading(true);

        const fileToUpload = await getFileToUpload(file);

        if (!fileToUpload) {
            setIsLoading(false);
            return;
        }

        if (resizeBeforeUploading) onPhotoResized?.(fileToUpload);

        singleImageUpload(fileToUpload);
    };

    // handles camera on native platforms
    const handleCapacitorCamera = async () => {
        try {
            setIsLoading(true);

            const { Camera, CameraResultType, CameraSource } = await import(
                /* @vite-ignore */ '@capacitor/camera'
            );

            const photo = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Photos,
            });

            if (!photo.dataUrl) {
                setIsLoading(false);
                return;
            }

            const filename = `photo-${Date.now()}.${photo.format || 'jpg'}`;
            const file = await dataUrlToFile(photo.dataUrl, filename);

            onFileSelected?.(file);

            const fileToUpload = await getFileToUpload(file);
            if (!fileToUpload) {
                setIsLoading(false);
                return;
            }

            if (resizeBeforeUploading) onPhotoResized?.(fileToUpload);

            await singleImageUpload(fileToUpload);
        } catch (e) {
            console.log('filestack::handleCapacitorCamera::error', e);
            setError(e);
            setIsLoading(false);
        }
    };

    const uploadFile: GlobalEventHandlers['onchange'] = async event => {
        let file;

        if ((<HTMLInputElement>event.target).files?.length > 1) {
            file = (<HTMLInputElement>event.target).files;
        } else {
            file = (<HTMLInputElement>event.target).files?.[0];
        }

        if (!file) return;

        onFileSelected?.(file);

        setIsLoading(true);

        const fileToUpload = await getFileToUpload(file);

        if (!fileToUpload) {
            setIsLoading(false);
            return;
        }

        if (resizeBeforeUploading) onPhotoResized?.(fileToUpload);

        if (file.length > 1) {
            filestack // multi image upload
                .multiupload(fileToUpload, options)
                .then((res: UploadRes) => onUpload(res.url, fileToUpload, res))
                .catch(e => {
                    console.log('filestack::uploadFile::error', e);
                    setError(e);
                })
                .finally(() => setIsLoading(false));
        } else {
            singleImageUpload(fileToUpload);
        }
    };

    const handleFileSelect = async (e?: MouseEvent) => {
        e?.preventDefault();

        // handle files on native platforms
        if (Capacitor.isNativePlatform()) {
            await handleCapacitorCamera();
        } else {
            // handle files on web platforms
            fileSelector?.click();
        }
    };

    const handleEvent = (e: globalThis.MouseEvent) => {
        if (e) {
            (e.target as HTMLInputElement).value = '';
        }
    };

    const uploadImageFromUrl = async (url: string) => {
        if (!url) return '';

        try {
            // Fetch the file from the URL
            const response = await fetch(url);
            const blob = await response.blob();

            // Extract the filename from the URL or use a fallback name
            const filename = url.split('/').pop() || 'uploaded-file';

            // Convert the Blob into a File
            const file = new File([blob], filename, { type: blob.type });

            // Call the singleImageUpload function with the created File
            return await singleImageUpload(file);
        } catch (error) {
            console.log('filestack::uploadImageFromUrl::error', error);
            return null;
        }
    };

    useEffect(() => {
        // Only create file input for web platform
        if (!Capacitor.isNativePlatform()) {
            const selectorElement = document.createElement('input');
            selectorElement.id = 'file-selector';
            selectorElement.setAttribute('type', 'file');
            selectorElement.setAttribute('accept', fileType.toString());
            // fileSelector.setAttribute('multiple', 'multiple');
            // todo not sure how to fix this type error - MouseEvent not assignable to MouseEvent<Element>
            selectorElement.onclick = handleEvent;
            selectorElement.onchange = uploadFile;
            setFileSelector(selectorElement);
            fileSelectorRef.current = selectorElement;
        }
    }, []);

    return {
        fileSelector,
        fileSelectorRef,
        handleFileSelect,
        isLoading,
        error,
        directUploadFile,
        uploadImageFromUrl,
        singleImageUpload,
    };
};

export default useFilestack;
