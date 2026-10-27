type LinkedInCertification = {
    name: string;
    issuer: string;
    organizationId?: string;
    issuedAt?: string;
    credentialId?: string;
    credentialRecordUri?: string;
    shareLink: string;
};

/** LinkedIn accepts a company ID, not a credential image, for the certification logo. */
export const buildLinkedInCertificationUrl = ({
    name,
    issuer,
    organizationId,
    issuedAt,
    credentialId,
    credentialRecordUri,
    shareLink,
}: LinkedInCertification): string => {
    const url = new URL('https://www.linkedin.com/profile/add');
    url.searchParams.set('startTask', 'CERTIFICATION_NAME');
    url.searchParams.set('name', name);
    if (organizationId && /^\d+$/.test(organizationId)) {
        url.searchParams.set('organizationId', organizationId);
    } else {
        url.searchParams.set('organizationName', issuer);
    }
    if (issuedAt) {
        const date = new Date(issuedAt);
        if (!Number.isNaN(date.getTime())) {
            url.searchParams.set('issueYear', String(date.getUTCFullYear()));
            url.searchParams.set('issueMonth', String(date.getUTCMonth() + 1));
        }
    }
    url.searchParams.set('certUrl', shareLink);
    const requestedCertId = credentialId || credentialRecordUri;
    // LinkedIn limits certId to 80 characters. Preserve the complete identity rather than
    // truncating it into a potentially colliding value.
    if (requestedCertId && requestedCertId.length <= 80) {
        url.searchParams.set('certId', requestedCertId);
    }
    return url.toString();
};

export const buildLinkedInPostUrl = (shareLink: string): string => {
    const url = new URL('https://www.linkedin.com/sharing/share-offsite/');
    url.searchParams.set('url', shareLink);
    return url.toString();
};
