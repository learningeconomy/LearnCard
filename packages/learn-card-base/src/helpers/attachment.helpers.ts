import { getCoverImageUrl, isYoutubeUrl } from './youtube.helpers';
import { getImageUploadProvider } from '../storage/image-upload';


export const getFileMetadata = async (url: string) => {
    const provider = getImageUploadProvider();

    if (!provider.ownsUrl(url) && !url.includes('filestack')) return;

    const metadata = await provider.getMetadata(url);
    const fileExtension = metadata.filename ? metadata.filename.split('.')[1] : undefined;

    return {
        fileExtension,
        sizeInBytes: metadata.size,
        numberOfPages: undefined,
    };
};

export const getVideoMetadata = async (url: string) => {
    const isYoutube = isYoutubeUrl(url);
    if (!isYoutube) return;

    const metadataUrl = `https://youtube.com/oembed?url=${url}&format=json`;

    let fetchFailed = false;
    const metadata = await fetch(metadataUrl)
        .then(res => res.json())
        .catch(() => (fetchFailed = true));

    const coverImageUrl = getCoverImageUrl(url);

    if (fetchFailed) return { imageUrl: coverImageUrl };

    return {
        title: metadata.title,
        imageUrl: coverImageUrl,
        videoLength: '', // TODO figure out how to get this
    };
};
