import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { Capacitor } from '@capacitor/core';
import { ToastTypeEnum, useToast } from 'learn-card-base';
import { openAttachmentUrl } from 'learn-card-base/helpers/openAttachmentUrl';
import * as m from '../paraglide/messages.js';

const PREVIEW_EXTENSIONS: Record<string, string> = {
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
};

export const useUploadedDocumentPreview = (fileName: string, data: string, disabled = false) => {
    const { presentToast } = useToast();
    const [opening, setOpening] = useState(false);
    const busy = useRef(false);
    const mounted = useRef(true);
    const focusToRestore = useRef<{
        button: HTMLButtonElement;
        fileName: string;
        data: string;
    } | null>(null);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (opening || disabled || !focusToRestore.current) return;
        const previous = focusToRestore.current;
        focusToRestore.current = null;
        if (
            previous.button.isConnected &&
            previous.fileName === fileName &&
            previous.data === data &&
            document.activeElement === document.body
        ) {
            previous.button.focus({ preventScroll: true });
        }
    }, [opening, disabled, fileName, data]);

    const openDocument = async (event: MouseEvent<HTMLButtonElement>) => {
        if (busy.current || disabled || !data) return;
        const button = event.currentTarget;
        const ownedFocus = document.activeElement === button;
        busy.current = true;
        setOpening(true);
        try {
            // Only supported documents may open; HTML/SVG blobs could execute uploaded scripts.
            if (
                !/^data:(?:application\/pdf|text\/plain|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|image\/(?:png|jpeg|webp));base64,/i.test(
                    data
                )
            ) {
                throw new Error('Unsupported preview type');
            }
            const basename = (fileName.split(/[\\/]/).pop() ?? '')
                .replace(/\p{Cc}/gu, '')
                .slice(0, 120);
            const safeName =
                basename && basename !== '.' && basename !== '..' ? basename : 'document';
            const mimeType = data.slice(5, data.indexOf(';')).toLowerCase();
            await openAttachmentUrl(
                data,
                Capacitor.isNativePlatform()
                    ? `upload-${crypto.randomUUID()}-${safeName.replace(/\.[^.]*$/, '')}${PREVIEW_EXTENSIONS[mimeType]}`
                    : safeName
            );
        } catch {
            presentToast(m['passport.buildMyLearnCard.managers.toastGenericError'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            busy.current = false;
            if (mounted.current) {
                if (ownedFocus) focusToRestore.current = { button, fileName, data };
                setOpening(false);
            }
        }
    };

    return { opening, openDocument };
};
