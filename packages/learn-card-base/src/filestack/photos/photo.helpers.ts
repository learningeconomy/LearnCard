import { getCanvasFromFile, getFileFromCanvas } from './file.helpers';
import {
    bilinearInterpolate,
    halfScaleCanvas,
    scaleCanvas,
} from './canvas.helpers';
import { IMAGE_MIME_TYPES } from '../constants/filestack';

const MAX_WIDTH = 3000;
const QUALITY = 1;

/**
 * Resizes a photo to be within a max width.
 *
 * Please use useResizePhoto instead of this function whenever possible, as useResizePhoto leverages
 * web workers to prevent blocking the UI during the expensive bilinear interpolation process.
 */
export const resizePhoto = async (photo: File): Promise<File> => {
    // gracefully handle non-photos
    if (!IMAGE_MIME_TYPES.includes(photo.type)) return photo;

    let canvas = await getCanvasFromFile(photo);

    // only resize large photos
    if (canvas.width < MAX_WIDTH) return photo;

    // don't resize GIFs
    if (photo.type === 'image/gif')
        throw new Error('Oops! This image is too large! Please try again with a smaller file.');

    while (canvas.width >= 2 * MAX_WIDTH) {
        canvas = halfScaleCanvas(canvas);
    }

    if (canvas.width > MAX_WIDTH) {
        canvas = await scaleCanvas(canvas, MAX_WIDTH / canvas.width, async (source, dest, scale) =>
            bilinearInterpolate(source, dest, scale)
        );
    }

    return getFileFromCanvas(canvas, QUALITY, photo);
};
