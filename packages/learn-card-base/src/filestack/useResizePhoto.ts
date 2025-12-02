import { useWorker } from '@koale/useworker';

import { getCanvasFromFile, getFileFromCanvas } from './photos/file.helpers';
import {
    bilinearInterpolate,
    halfScaleCanvas,
    scaleCanvas,
} from './photos/canvas.helpers';
import { IMAGE_MIME_TYPES } from './constants/filestack';

const MAX_WIDTH = 3000;
const QUALITY = 1;

/**
 * React hook for resizing a photo to be within a max width.
 *
 * Use like so:
 *
 * const TestPhotoResize = () => {
 *     const resizePhoto = useResizePhoto();
 *
 *     const onChange = async e => {
 *         const photo = e.target.files[0];
 *
 *         const resizedPhoto = await resizePhoto(photo);
 *
 *         console.log({ resizedPhoto });
 *     }
 *
 *     return (
 *         <input type="file" onChange={onChange} />
 *     );
 * }
 */
const useResizePhoto = () => {
    const [interpolateWorker] = useWorker(bilinearInterpolate);

    const resizePhoto = async (photo: File): Promise<File> => {
        // gracefully handle non-photos
        if (!IMAGE_MIME_TYPES.includes(photo.type)) return photo;

        let canvas = await getCanvasFromFile(photo);

        // only resize large photos
        if (canvas.width < MAX_WIDTH) return photo;

        // don't resize GIFs
        if (photo.type === 'image/gif') {
            throw new Error('Oops! This image is too large! Please try again with a smaller file.');
        }

        while (canvas.width >= 2 * MAX_WIDTH) {
            canvas = halfScaleCanvas(canvas);
        }

        if (canvas.width > MAX_WIDTH) {
            canvas = await scaleCanvas(canvas, MAX_WIDTH / canvas.width, interpolateWorker);
        }

        return getFileFromCanvas(canvas, QUALITY, photo);
    };

    return resizePhoto;
};

export default useResizePhoto;
