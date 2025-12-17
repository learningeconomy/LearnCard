import React, { useEffect, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { QRCodeSVG } from 'qrcode.react';
import { Capacitor } from '@capacitor/core';
import { Media } from '@capacitor-community/media';
import { Filesystem, Directory } from '@capacitor/filesystem';

import { useModal, useWallet, useIsCurrentUserLCNUser } from 'learn-card-base';
import { useJoinLCNetworkModal } from '../../../components/network-prompts/hooks/useJoinLCNetworkModal';

import { QrCodeDownloadOptionsEnum, userQrCodeDownloadOptions } from './user-share-options.helpers';

import { QR_CODE_LOGO } from '../UserQRCode/UserQRCode';

const QrCodeUserCardShareOptions: React.FC = () => {
    const { initWallet } = useWallet();
    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();
    const qrCodeRef = useRef<SVGSVGElement | null>(null);

    const [walletDid, setWalletDid] = useState<string>('');

    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();
    const { closeModal } = useModal();

    // -----------------------------
    // Cleanup ─ old QR files (PDF)
    // -----------------------------
    useEffect(() => {
        const cleanupDocuments = async () => {
            try {
                const result = await Filesystem.readdir({
                    directory: Directory.Documents,
                    path: '',
                });

                const qrFiles = result.files.filter(
                    f =>
                        f.name.startsWith('qrcode_') &&
                        (f.name.endsWith('.png') || f.name.endsWith('.pdf'))
                );

                const sorted = qrFiles.sort((a, b) => (b.mtime ?? 0) - (a.mtime ?? 0));
                const oldFiles = sorted.slice(50);

                for (const file of oldFiles) {
                    await Filesystem.deleteFile({
                        directory: Directory.Documents,
                        path: file.name,
                    });
                }
            } catch (err) {
                console.log('Cleanup not needed:', err);
            }
        };

        if (Capacitor.isNativePlatform()) cleanupDocuments();
    }, []);

    // -----------------------------
    // Fetch DID
    // -----------------------------
    useEffect(() => {
        const getWalletDid = async () => {
            const wallet = await initWallet();
            setWalletDid(wallet?.id?.did());
        };

        if (!walletDid) getWalletDid();
    }, [walletDid]);

    // -----------------------------
    // Convert SVG → PNG
    // -----------------------------
    const convertSvgToPng = async () => {
        const svg = qrCodeRef.current;
        if (!svg) return null;

        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.src = svgUrl;

        await new Promise(resolve => (img.onload = resolve));

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        return canvas.toDataURL('image/png');
    };

    const cleanBase64 = (dataUrl: string) =>
        dataUrl.replace(/^data:.*;base64,/, '').replace(/[^A-Za-z0-9+/=]/g, '');

    // -----------------------------
    // Save PNG → Photos/Gallery (Media plugin)
    // -----------------------------
    const savePng = async () => {
        try {
            const pngDataUrl = await convertSvgToPng();
            if (!pngDataUrl) return;

            const base64 = cleanBase64(pngDataUrl);
            const fileName = `qrcode_${Date.now()}.png`;

            // WEB fallback
            if (!Capacitor.isNativePlatform()) {
                const link = document.createElement('a');
                link.href = `data:image/png;base64,${base64}`;
                link.download = fileName;
                link.click();
                closeModal();
                return;
            }

            // Write temp file to Documents (Media plugin requires a real file path)
            const writeResult = await Filesystem.writeFile({
                path: fileName,
                directory: Directory.Documents,
                data: base64,
            });

            // writeResult.uri ⇒ file:///... path needed for Media.savePhoto
            const fileUri = writeResult.uri;

            // Save to Photos using Media plugin
            await Media.savePhoto({
                path: fileUri,
                fileName,
            });

            alert('QR Code saved to Photos!');
            closeModal();
        } catch (error) {
            console.error('QR Code Save Error:', error);
            alert('Failed to save QR Code.');
        }
    };

    // -----------------------------
    // Save PDF → Files app
    // -----------------------------
    const savePdf = async () => {
        try {
            const pngDataUrl = await convertSvgToPng();
            if (!pngDataUrl) return;

            const pngBase64 = cleanBase64(pngDataUrl);
            const fileName = `qrcode_${Date.now()}.pdf`;

            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([500, 500]);

            const pngImage = await pdfDoc.embedPng(pngBase64);
            const { width, height } = pngImage.scale(1);

            page.drawImage(pngImage, {
                x: (500 - width) / 2,
                y: (500 - height) / 2,
                width,
                height,
            });

            const pdfBase64 = cleanBase64(await pdfDoc.saveAsBase64({ dataUri: false }));

            // Web fallback
            if (!Capacitor.isNativePlatform()) {
                const url = `data:application/pdf;base64,${pdfBase64}`;
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
                closeModal();
                return;
            }

            // Save PDF to Files
            await Filesystem.writeFile({
                path: fileName,
                directory: Directory.Documents,
                data: pdfBase64,
            });

            alert('QR Code saved to Files!');
            closeModal();
        } catch (error) {
            console.error('QR Code Save Error:', error);
            alert('Failed to save QR Code.');
        }
    };

    // -----------------------------
    // Download option handler
    // -----------------------------
    const handleDownloadOptionClick = (optionType: QrCodeDownloadOptionsEnum) => {
        if (!currentLCNUser && !currentLCNUserLoading) {
            closeModal();
            handlePresentJoinNetworkModal();
            return;
        }

        switch (optionType) {
            case QrCodeDownloadOptionsEnum.saveToPhotos:
                savePng();
                break;
            case QrCodeDownloadOptionsEnum.saveToFiles:
                savePdf();
                break;
        }
    };

    return (
        <div className="w-full flex items-center justify-center my-6 px-6">
            <QRCodeSVG
                ref={qrCodeRef}
                className="hidden"
                value={`https://learncard.app/connect?connect=true&did=${walletDid}`}
                bgColor="transparent"
                imageSettings={{
                    src: QR_CODE_LOGO,
                    height: 40,
                    width: 40,
                    excavate: false,
                }}
            />

            <div className="w-full max-w-[400px]">
                <h2 className="text-[24px] font-semibold text-grayscale-900">Download QR Code</h2>
                <p className="text-grayscale-700 text-[17px] my-2">
                    Share or print your LearnCard QR code.
                </p>

                {userQrCodeDownloadOptions.map(option => {
                    return (
                        <button
                            key={option.id}
                            onClick={() => handleDownloadOptionClick(option.type)}
                            className="flex items-center my-6 text-grayscale-700 text-lg"
                        >
                            <option.icon className="w-[35px] mr-2" />
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default QrCodeUserCardShareOptions;
