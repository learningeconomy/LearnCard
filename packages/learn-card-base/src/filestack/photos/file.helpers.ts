import { get2dContext } from './canvas.helpers';

/**
 * Creates a blob from a given canvas
 */
export const getBlobFromCanvas = (
    canvas: HTMLCanvasElement,
    quality: number,
    type = 'image/jpeg'
): Promise<Blob> =>
    new Promise((resolve, reject): void => {
        canvas.toBlob(
            blob => (blob ? resolve(blob) : reject(new Error('Error creating blob from canvas!'))),
            type,
            quality
        );
    });

interface FileMetadata extends FilePropertyBag {
    name: string;
}

/**
 * Creates a File object from a given canvas with given metadata
 */
export const getFileFromCanvas = async (
    canvas: HTMLCanvasElement,
    quality: number,
    metadata: FileMetadata = { name: 'default.jpg', lastModified: Date.now(), type: 'image/jpeg' }
): Promise<File> => {
    const blob = await getBlobFromCanvas(canvas, quality, metadata.type);
    return new File([blob], metadata.name, metadata);
};

/**
 * Creates an HTML img element from a given photo
 */
export const getImgFromFile = async (photo: File): Promise<HTMLImageElement> => {
    const img = document.createElement('img');

    img.src = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => {
            if (event.target && typeof event.target.result === 'string') {
                resolve(event.target.result);
            } else {
                reject(new Error('Error reading photo'));
            }
        };
        reader.readAsDataURL(photo);
    });

    await new Promise(resolve => {
        img.onload = resolve;
    });

    return img;
};

/**
 * Creates a canvas element from a given photo
 */
export const getCanvasFromFile = async (photo: File): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    const img = await getImgFromFile(photo);

    // draw image in canvas element
    canvas.width = img.width;
    canvas.height = img.height;
    get2dContext(canvas).drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas;
};
