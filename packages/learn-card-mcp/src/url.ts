/** Strips trailing slashes without a regex (avoids ReDoS on untrusted config). */
export const trimTrailingSlashes = (value: string): string => {
    let end = value.length;
    while (end > 0 && value.charCodeAt(end - 1) === 47) end -= 1;
    return value.slice(0, end);
};
