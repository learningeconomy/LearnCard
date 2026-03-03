type QuantizedPoints = {
    vector: number;
    floor: number;
    ceiling: number;
};

type InterpolationData = {
    ul: number;
    ur: number;
    ll: number;
    lr: number;
    x: number;
    y: number;
};

/**
 * Definitely gets a CanvasRenderingContext2D
 */
export const get2dContext = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Browser does not support 2d context');
    return ctx;
};

/**
 * Scales a given canvas in half
 */
export const halfScaleCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const halfCanvas = document.createElement('canvas');
    halfCanvas.width = canvas.width / 2;
    halfCanvas.height = canvas.height / 2;

    get2dContext(halfCanvas).drawImage(canvas, 0, 0, halfCanvas.width, halfCanvas.height);

    return halfCanvas;
};

export const bilinearInterpolate = (
    sourceImageData: ImageData,
    destinationImageData: ImageData,
    scale: number
) => {
    /**
   * Creates an object containing a scaled vector and its quantized points from
  a given pixel index
   */
    const getQuantizedPoints = (index: number, max: number): QuantizedPoints => ({
        vector: index / scale,
        floor: Math.floor(index / scale),
        ceiling: Math.min(Math.ceil(index / scale), max),
    });

    /**
   * Creates an object containing four the four corners to interpolate, and the
  x and y vectors used to create weights when interpolating
   */
    const getInterpolationData = (
        x: QuantizedPoints,
        y: QuantizedPoints,
        channel: number,
        imageData: ImageData
    ): InterpolationData => ({
        ul: imageData.data[(x.floor + imageData.width * y.floor) * 4 + channel],
        ur: imageData.data[(x.ceiling + imageData.width * y.floor) * 4 + channel],
        ll: imageData.data[(x.floor + imageData.width * y.ceiling) * 4 + channel],
        lr: imageData.data[(x.ceiling + imageData.width * y.ceiling) * 4 + channel],
        x: x.vector - x.floor,
        y: y.vector - y.floor,
    });

    /**
     * Bilinear interpolates between four values using x and y values for weights
     */
    const interpolate = ({ ul, ur, ll, lr, x, y }: InterpolationData): number => {
        const unX = 1.0 - x;
        const unY = 1.0 - y;

        return ul * unX * unY + ur * x * unY + ll * unX * y + lr * x * y;
    };

    for (let row = 0; row < destinationImageData.height; row += 1) {
        const y = getQuantizedPoints(row, sourceImageData.height - 1);

        for (let column = 0; column < destinationImageData.width; column += 1) {
            const x = getQuantizedPoints(column, sourceImageData.width - 1);
            const currentPixel = (column + destinationImageData.width * row) * 4;

            for (let channel = 0; channel < 4; channel += 1) {
                destinationImageData.data[currentPixel + channel] = interpolate(
                    getInterpolationData(x, y, channel, sourceImageData)
                );
            }
        }
    }

    return destinationImageData;
};

/**
 * Scales a given canvas using bilinear interpolation
 */
export const scaleCanvas = async (
    sourceCanvas: HTMLCanvasElement,
    scale: number,
    interpolationFunction: (
        source: ImageData,
        destination: ImageData,
        scale: number
    ) => Promise<ImageData>
): Promise<HTMLCanvasElement> => {
    const scaledCanvas = document.createElement('canvas')!;
    scaledCanvas.width = sourceCanvas.width * scale;
    scaledCanvas.height = sourceCanvas.height * scale;
    const scaledCtx = get2dContext(scaledCanvas);

    const sourceImageData = get2dContext(sourceCanvas).getImageData(
        0,
        0,
        sourceCanvas.width,
        sourceCanvas.height
    );
    const destinationImageData = scaledCtx.createImageData(scaledCanvas.width, scaledCanvas.height);

    scaledCtx.putImageData(
        await interpolationFunction(sourceImageData, destinationImageData, scale),
        0,
        0
    );

    return scaledCanvas;
};
