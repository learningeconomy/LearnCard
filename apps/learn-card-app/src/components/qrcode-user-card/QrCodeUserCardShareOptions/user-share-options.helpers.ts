import ShareIcon from 'learn-card-base/svgs/Share';
import ScanIcon from 'learn-card-base/svgs/ScanIcon';
import FolderIcon from 'learn-card-base/svgs/FolderIcon';
import GalleryIcon from 'learn-card-base/svgs/GalleryIcon';
import DownloadIcon from 'learn-card-base/svgs/DownloadIcon';

export enum ShareOptionsEnum {
    share = 'share',
    download = 'download',
    scan = 'scan',
}

export type UserShareOptions = {
    id: number;
    label: string;
    type: ShareOptionsEnum;
    icon: React.FC<{ className?: string }>;
};

export const userShareOptions: UserShareOptions[] = [
    {
        id: 1,
        label: 'Share',
        type: ShareOptionsEnum.share,
        icon: ShareIcon,
    },
    {
        id: 2,
        label: 'Download',
        type: ShareOptionsEnum.download,
        icon: DownloadIcon,
    },
    {
        id: 3,
        label: 'Scan',
        type: ShareOptionsEnum.scan,
        icon: ScanIcon,
    },
];

export enum QrCodeDownloadOptionsEnum {
    saveToPhotos = 'saveToPhotos',
    saveToFiles = 'saveToFiles',
}

export type QrCodeDownloadOptions = {
    id: number;
    label: string;
    type: QrCodeDownloadOptionsEnum;
    icon: React.FC<{ className?: string }>;
};

export const userQrCodeDownloadOptions: QrCodeDownloadOptions[] = [
    {
        id: 1,
        label: 'Save to Photos',
        type: QrCodeDownloadOptionsEnum.saveToPhotos,
        icon: GalleryIcon,
    },
    {
        id: 2,
        label: 'Save to Files',
        type: QrCodeDownloadOptionsEnum.saveToFiles,
        icon: FolderIcon,
    },
];
