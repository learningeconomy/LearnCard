/** Useful for debugging how long a function takes! This probably shouldn't make it to prod tho */
export const time = async <T>(callback: () => Promise<T>, message: string): Promise<T> => {
    const start = performance.now();

    const returnValue = await callback();

    console.log(message, performance.now() - start, 'ms');

    return returnValue;
};
