import { getCoverImageUrl, isYoutubeUrl } from './youtube.helpers';

export const getFileMetadata = async (url: string) => {
    const isFilestack = url.includes('filestack');
    if (!isFilestack) return;

    const urlParams = url.split('.com/')[1]?.split('/');
    if (!urlParams) return;
    const handle = urlParams[urlParams.length - 1];

    let fetchFailed = false;
    const data = await fetch(`https://cdn.filestackcontent.com/${handle}/metadata`)
        .then(res => res.json())
        .catch(() => (fetchFailed = true));

    if (fetchFailed) return;

    const fileExtension = data.filename.split('.')[1];

    return {
        fileExtension,
        sizeInBytes: data.size,
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
