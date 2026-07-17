import { getCoverImageUrl, isYoutubeUrl } from './youtube.helpers';
import { isKnownImageUploadUrl } from '../storage/image-upload';
import { getMetadata } from '../filestack/images/images.helpers';

export const getFileMetadata = async (url: string) => {
    if (!isKnownImageUploadUrl(url)) return;

    const metadata = await getMetadata(url);
    const fileExtension = metadata.filename.split('.').pop()?.toLowerCase();

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
