import React from 'react';
import { useGetProfile } from 'learn-card-base';
import {
    getCredentialSubject,
    getIssuerDid,
    getProfileIdFromLCNDidWeb,
} from 'learn-card-base/helpers/credentialHelpers';
import { UserProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';
import BoostPreview, { type BoostPreviewProps } from '../boost/boostCMS/BoostPreview/BoostPreview';

/** Resolve public display profiles, without changing the signed credential. */
const ShareCredentialProfilePreview = (props: BoostPreviewProps) => {
    const issuerId = getProfileIdFromLCNDidWeb(getIssuerDid(props.credential));
    const subjectId = getProfileIdFromLCNDidWeb(getCredentialSubject(props.credential)?.id);
    const { data: issuer } = useGetProfile(issuerId, Boolean(issuerId));
    const { data: subject } = useGetProfile(subjectId, Boolean(subjectId));
    const picture = (profile: NonNullable<typeof issuer>) => (
        <UserProfilePicture
            user={profile}
            customImageClass="w-full h-full object-cover"
            customContainerClass="flex items-center justify-center h-full text-white font-medium text-lg"
        />
    );
    return (
        <BoostPreview
            {...props}
            issuerOverride={issuer?.displayName || props.issuerOverride}
            issueeOverride={subject?.displayName || props.issueeOverride}
            issuerImageComponent={issuer ? picture(issuer) : props.issuerImageComponent}
            subjectImageComponent={subject ? picture(subject) : props.subjectImageComponent}
        />
    );
};

export default ShareCredentialProfilePreview;
