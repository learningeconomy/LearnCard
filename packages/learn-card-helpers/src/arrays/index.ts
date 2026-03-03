/** Quantizes a number to the closest number in an array of numbers */
export const quantizeValue = (value: number, array: number[]) => {
    const foundIndex = array.findIndex((number) => number === value);

    if (foundIndex > -1) return array[foundIndex];

    const closestIndex = array.reduce(
        (closest, current, index) => {
            const currentDistance = Math.abs(current - value);

            if (currentDistance <= closest.distance)
                return { index, distance: currentDistance };

            return closest;
        },
        { index: 0, distance: Infinity },
    ).index;

    return array[closestIndex];
};
