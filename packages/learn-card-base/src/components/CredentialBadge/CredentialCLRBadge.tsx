import React from 'react';

import TrustedCertIcon from 'learn-card-base/svgs/TrustedCertIcon';
import { UserProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';

import { VC } from '@learncard/types';

import { useGetVCInfo } from 'learn-card-base/hooks/useGetVCInfo';

type CredentialCLRBadgeProps = {
    credential: VC;
    logoSrc?: string;
    issuerName?: string;
    badgeCircleCustomClass?: string;
};

export const CredentialCLRBadge: React.FC<CredentialCLRBadgeProps> = ({
    credential,
    logoSrc,
    issuerName,
    badgeCircleCustomClass = '',
}) => {
    const { issueeName, issueeProfile, issuerProfile, issuerAppListing } = useGetVCInfo(credential);

    const subjectUser = issueeProfile ?? { displayName: issueeName, name: issueeName };
    let issuerLabel = issuerName;
    if (!issuerLabel) {
        issuerLabel = issuerProfile?.displayName;
    }
    if (!issuerLabel) {
        issuerLabel = issuerAppListing?.display_name;
    }
    if (!issuerLabel) {
        issuerLabel = 'Issuer';
    }

    const issuerImage = logoSrc ?? issuerProfile?.image ?? issuerAppListing?.icon_url;
    const hasExplicitIssuerData = logoSrc !== undefined || issuerName !== undefined;
    let issuerUser: React.ComponentProps<typeof UserProfilePicture>['user'] = issuerProfile;

    if (hasExplicitIssuerData) {
        issuerUser = issuerImage
            ? { displayName: issuerLabel, image: issuerImage }
            : { displayName: issuerLabel };
    } else if (!issuerUser) {
        issuerUser = issuerImage
            ? { displayName: issuerLabel, image: issuerImage }
            : { displayName: issuerLabel };
    }

    return (
        <div
            className={`relative z-50 flex items-center justify-center !shadow-none ${badgeCircleCustomClass}`}
        >
            <div
                className={`absolute top-[5%] left-[50%] -translate-x-1/2 rounded-full border-grayscale-600 border-solid border-[3px]  overflow-hidden shadow-[0_12px_24px_rgba(24,34,78,0.18)]`}
            >
                <UserProfilePicture
                    user={subjectUser}
                    customContainerClass="flex justify-center items-center w-[65px] h-[65px] min-w-[65px] min-h-[65px] rounded-full overflow-hidden text-white font-medium text-2xl"
                    customImageClass="flex justify-center items-center w-[65px] h-[65px] min-w-[65px] min-h-[65px] rounded-full overflow-hidden object-cover"
                />
            </div>

            <div
                className={`absolute bottom-[25%] left-[70%] -translate-x-1/2 rounded-full border-grayscale-600 border-solid border-[3px]  overflow-hidden shadow-[0_10px_20px_rgba(24,34,78,0.16)]`}
            >
                <UserProfilePicture
                    user={issuerUser}
                    customContainerClass="flex justify-center items-center w-[30px] h-[30px] min-w-[30px] min-h-[30px] rounded-full overflow-hidden text-white !font-medium text-lg"
                    customImageClass="flex justify-center items-center w-[30px] h-[30px] min-w-[30px] min-h-[30px] rounded-full overflow-hidden object-cover !font-medium text-lg"
                />
            </div>

            <div
                className={`absolute bottom-[25%] left-[40%] flex h-[24px] w-[24px] items-center justify-center rounded-full border-grayscale-600 border-solid border-[3px] z-2 bg-white shadow-[0_8px_16px_rgba(24,34,78,0.16)]`}
            >
                <TrustedCertIcon className="h-full w-full" />
            </div>
        </div>
    );
};

export default CredentialCLRBadge;
