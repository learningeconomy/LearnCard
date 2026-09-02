import React, { MouseEvent, useEffect, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

import type { ImageUploadOptions, UploadRes } from './types';
import { getImageUploadProvider } from './config';
import useResizePhoto from '../../filestack/useResizePhoto';
import { getLogger } from '../../logging/logger';

const log = getLogger('use-image-upload');

export type { UploadRes } from './types';

type UseImageUpload = (args: {
    onUpload: (url: string, file: File, res: UploadRes) => void;
    onFileSelected?: (file: File) => void;
    onPhotoResized?: (file: File) => void;
    fileType?: string | string[];
    options?: ImageUploadOptions;
    resizeBeforeUploading?: boolean;
}) => {
    fileSelector: HTMLInputElement | null;
    fileSelectorRef: React.MutableRefObject<HTMLInputElement | undefined>;
    handleFileSelect: (e?: MouseEvent) => Promise<void>;
    isLoading: boolean;
    error: unknown;
    directUploadFile: (file: File) => Promise<void>;
    uploadImageFromUrl: (url: string) => Promise<string | null>;
    singleImageUpload: (file: File) => Promise<string>;
};

// Helper function to convert data URL to File
const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
};

export const useImageUpload: UseImageUpload = ({
    onUpload,
    onFileSelected,
    onPhotoResized,
    fileType = 'image/*',
    options = {},
    resizeBeforeUploading = false,
}) => {
    const provider = getImageUploadProvider();
    const resizePhoto = useResizePhoto();
    const [fileSelector, setFileSelector] = useState<HTMLInputElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    const fileSelectorRef = useRef<HTMLInputElement>();

    // The web file input's onchange handler is bound once (mount-time effect
    // below) and async uploads resolve later, so callbacks must be read from refs
    // to avoid invoking stale first-render closures.
    const onUploadRef = useRef(onUpload);
    const onFileSelectedRef = useRef(onFileSelected);
    const onPhotoResizedRef = useRef(onPhotoResized);
    onUploadRef.current = onUpload;
    onFileSelectedRef.current = onFileSelected;
    onPhotoResizedRef.current = onPhotoResized;

    const getFileToUpload = async (
        file: File
    ): Promise<{ file: File; resized: boolean } | false> => {
        if (!resizeBeforeUploading) return { file, resized: false };

        try {
            return { file: await resizePhoto(file), resized: true };
        } catch (e) {
            log.debug('image-upload::getFileToUpload::error', e);
            setError(e);
            return false;
        }
    };

    const singleImageUpload = async (file: File): Promise<string> => {
        try {
            const res = await provider.upload(file, options);

            onUploadRef.current(res.url, file, res);

            return res.url;
        } catch (e) {
            log.debug('image-upload::singleImageUpload::error', e);
            setError(e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const directUploadFile = async (file: File): Promise<void> => {
        setIsLoading(true);

        const uploadTarget = await getFileToUpload(file);

        if (!uploadTarget) {
            setIsLoading(false);
            return;
        }

        if (uploadTarget.resized) onPhotoResizedRef.current?.(uploadTarget.file);

        await singleImageUpload(uploadTarget.file);
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

            onFileSelectedRef.current?.(file);

            const uploadTarget = await getFileToUpload(file);

            if (!uploadTarget) {
                setIsLoading(false);
                return;
            }

            if (uploadTarget.resized) onPhotoResizedRef.current?.(uploadTarget.file);

            await singleImageUpload(uploadTarget.file);
        } catch (e) {
            log.debug('image-upload::handleCapacitorCamera::error', e);
            setError(e);
            setIsLoading(false);
        }
    };

    const uploadFile: GlobalEventHandlers['onchange'] = async event => {
        const files = (event.target as HTMLInputElement).files;

        if (!files?.length) return;

        const firstFile = files.item(0);

        if (!firstFile) return;

        if (files.length > 1) {
            onFileSelectedRef.current?.(firstFile);
            setIsLoading(true);

            provider
                .multiupload(files, options)
                .then((res: UploadRes) => onUploadRef.current(res.url, firstFile, res))
                .catch(e => {
                    log.debug('image-upload::uploadFile::error', e);
                    setError(e);
                })
                .finally(() => setIsLoading(false));

            return;
        }

        const file = firstFile;

        onFileSelectedRef.current?.(file);

        await directUploadFile(file);
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
            log.debug('image-upload::uploadImageFromUrl::error', error);
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

export default useImageUpload;
