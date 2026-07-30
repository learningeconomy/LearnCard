export type ImageMetadata = {
    filename: string;
    mimetype: string;
    size: number;
    uploaded: number;
    writeable: boolean;
    height: number;
    width: number;
};

export const DefaultMetadata: ImageMetadata = {
    filename: '',
    mimetype: '',
    size: 1,
    uploaded: 1,
    writeable: false,
    height: 1,
    width: 1,
};

/**
 * Gets an array of URLs from an HTML srcSet string.
 */
export const getUrlsFromSrcSet = (srcSet: string): [string, string][] =>
    srcSet.split(/,? /).reduce<[string, string][]>((accumulator, current, index, array) => {
        if (index % 2 === 0) return accumulator;

        accumulator.push([array[index - 1], current]);

        return accumulator;
    }, []);
