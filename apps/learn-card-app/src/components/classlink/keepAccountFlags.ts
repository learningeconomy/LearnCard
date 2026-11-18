/** Tenant flags for the "keep your account" entry points (inside the personal-email switch). */
export const isKeepAccountEnabled = (features: {
    classlinkSso?: boolean;
    classlinkPersonalEmail?: boolean;
    classlinkKeepAccount?: boolean;
}): boolean =>
    features.classlinkSso === true &&
    features.classlinkPersonalEmail === true &&
    features.classlinkKeepAccount === true;
