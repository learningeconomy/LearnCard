import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { Media } from '@capacitor-community/media';
import { Filesystem, Directory } from '@capacitor/filesystem';

import { useModal, useWallet, useIsCurrentUserLCNUser } from 'learn-card-base';
import { useJoinLCNetworkModal } from '../../../components/network-prompts/hooks/useJoinLCNetworkModal';

import { IonSpinner } from '@ionic/react';
import { QrCodeDownloadOptionsEnum, userQrCodeDownloadOptions } from './user-share-options.helpers';

const APP_ALBUM_NAME = 'LearnCard';

const QrCodeUserCardShareOptions: React.FC = () => {
    const { initWallet } = useWallet();
    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();

    const [walletDid, setWalletDid] = useState<string>('');
    const [isSavingPng, setIsSavingPng] = useState<boolean>(false);
    const [isSavingPdf, setIsSavingPdf] = useState<boolean>(false);

    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();
    const { closeModal } = useModal();

    const ensureAlbumExists = async (): Promise<string | undefined> => {
        if (Capacitor.getPlatform() !== 'android') return undefined;

        // fetch existing albums
        let { albums } = await Media.getAlbums();
        // find existing LearnCard album
        let album = albums.find(a => a.name === APP_ALBUM_NAME);

        // return existing album
        if (album?.identifier) return album?.identifier;

        // create album, if it doesn't exist
        await Media.createAlbum({ name: APP_ALBUM_NAME });
        ({ albums } = await Media.getAlbums());
        album = albums.find(a => a.name === APP_ALBUM_NAME);

        // return created album
        return album?.identifier;
    };

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

                for (const file of sorted.slice(50)) {
                    await Filesystem.deleteFile({
                        directory: Directory.Documents,
                        path: file.name,
                    });
                }
            } catch {
                // no-op
            }
        };

        if (Capacitor.isNativePlatform()) cleanupDocuments();
    }, []);

    useEffect(() => {
        const loadWalletDid = async () => {
            const wallet = await initWallet();
            setWalletDid(wallet?.id?.did() || '');
        };

        if (!walletDid) loadWalletDid();
    }, [walletDid, initWallet]);

    // Save PNG
    const savePng = async () => {
        const element = document.getElementById('qr-code-user-card-screenshot');
        if (!element) return;

        try {
            setIsSavingPng(true);
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
            });

            const imgData = canvas.toDataURL('image/png');

            // web
            if (!Capacitor.isNativePlatform()) {
                const link = document.createElement('a');
                link.download = 'qrcode-card.png';
                link.href = imgData;
                link.click();
                setIsSavingPng(false);
                closeModal();
                return;
            }

            // Native
            const base64 = imgData.split(',')[1];
            const fileName = `qrcode_${Date.now()}.png`;

            const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: base64,
                directory: Directory.Documents,
            });

            const albumIdentifier = await ensureAlbumExists();

            await Media.savePhoto({
                path: savedFile.uri,
                fileName,
                ...(albumIdentifier ? { albumIdentifier } : {}),
            });

            setIsSavingPng(false);
            closeModal();
            alert('QR Code saved to Photos!');
        } catch (err) {
            setIsSavingPng(false);
            console.error('QR save failed:', err);
            alert('Failed to save QR Code.');
        }
    };

    // save pdf
    const savePdf = async () => {
        const element = document.getElementById('qr-code-user-card-screenshot');
        if (!element) return;

        try {
            setIsSavingPdf(true);
            const canvas = await html2canvas(element, {
                useCORS: true,
            });

            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a6',
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            // web
            if (!Capacitor.isNativePlatform()) {
                pdf.save('qrcode-card.pdf');
            } else {
                // native
                const pdfData = pdf.output('datauristring').split(',')[1];
                const fileName = `qrcode_${Date.now()}.pdf`;

                await Filesystem.writeFile({
                    path: fileName,
                    data: pdfData,
                    directory: Directory.Documents,
                });
            }

            setIsSavingPdf(false);
            closeModal();
            if (Capacitor.isNativePlatform()) alert('QR Code saved to Documents!');
        } catch (err) {
            setIsSavingPdf(false);
            console.error('PDF save failed:', err);
            alert('Failed to save QR Code PDF.');
        }
    };

    const handleDownloadOptionClick = (option: QrCodeDownloadOptionsEnum) => {
        if (!currentLCNUser && !currentLCNUserLoading) {
            closeModal();
            handlePresentJoinNetworkModal();
            return;
        }

        option === QrCodeDownloadOptionsEnum.saveToPhotos ? savePng() : savePdf();
    };

    return (
        <div className="w-full flex items-center justify-center my-6 px-6">
            <div className="w-full max-w-[400px]">
                <h2 className="text-[24px] font-semibold text-grayscale-900">Download QR Code</h2>
                <p className="text-grayscale-700 text-[17px] my-2">
                    Share or print your LearnCard QR code.
                </p>

                {userQrCodeDownloadOptions.map(option => {
                    let text = option.label;
                    let icon = <option.icon className="w-[35px] mr-2" />;

                    if (isSavingPng && option.type === QrCodeDownloadOptionsEnum.saveToPhotos) {
                        text = 'Saving...';
                        icon = (
                            <IonSpinner name="crescent" color="dark" className="scale-[1] mr-1" />
                        );
                    }

                    if (isSavingPdf && option.type === QrCodeDownloadOptionsEnum.saveToFiles) {
                        text = 'Saving...';
                        icon = (
                            <IonSpinner name="crescent" color="dark" className="scale-[1] mr-1" />
                        );
                    }

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleDownloadOptionClick(option.type)}
                            disabled={isSavingPng || isSavingPdf}
                            className={`flex items-center my-6 text-grayscale-700 text-lg w-full text-left ${
                                isSavingPng || isSavingPdf ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {icon}
                            {text}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default QrCodeUserCardShareOptions;
