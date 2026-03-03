import React, { useEffect, useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import { QRCodeSVG } from 'qrcode.react';
import moment from 'moment';

import X from 'learn-card-base/svgs/X';
import { IonGrid, IonSpinner } from '@ionic/react';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import IDSleeve from '../../../assets/images/id-sleeve.png';
import FamilyCrest from '../../familyCMS/FamilyCrest/FamilyCrest';
import CredentialVerificationDisplay from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';

import {
    BoostCategoryOptionsEnum,
    CredentialBadge,
    CredentialCategoryEnum,
    ProfilePicture,
    getBoostMetadata,
    truncateWithEllipsis,
    useGetProfile,
    useShareBoostMutation,
    ToastTypeEnum,
    useToast,
} from 'learn-card-base';
import { useAnalytics, AnalyticsEvents } from '@analytics';

import {
    getCredentialName,
    getCredentialSubject,
    getImageUrlFromCredential,
    getIssuerNameNonBoost,
    getUrlFromImage,
    isBoostCredential,
    unwrapBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';

import { UnsignedVC, VC } from '@learncard/types';
import { getEmojiFromDidString } from 'learn-card-base/helpers/walletHelpers';

type ShareBoostLinkProps = {
    handleClose?: () => void;
    boost: VC | UnsignedVC;
    boostUri?: string;
    customClassName?: string;
    categoryType: BoostCategoryOptionsEnum | CredentialCategoryEnum;
    onBackButtonClick?: () => void;
    hideLinkedIn?: boolean;
    isEndorsementRequest?: boolean;
};

const ShareBoostLink: React.FC<ShareBoostLinkProps> = ({
    boost,
    boostUri,
    customClassName,
    handleClose,
    categoryType,
    onBackButtonClick,
    hideLinkedIn = false,
    isEndorsementRequest = false,
}) => {
    const { presentToast } = useToast();
    const [shareLink, setShareLink] = useState<string | undefined>('');

    const { track } = useAnalytics();

    const { mutate: shareEarnedBoost, isPending: isLinkLoading } = useShareBoostMutation();

    const boostMetadata = getBoostMetadata(categoryType);
    const { IconComponent, CategoryImage, title: categoryTitle } = boostMetadata ?? {};

    const isBoost = boost && isBoostCredential(boost);
    const cred = boost && unwrapBoostCredential(boost);

    const displayType = cred?.display?.displayType;
    const isID =
        cred?.display?.displayType === 'id' || categoryType === BoostCategoryOptionsEnum.id;
    const isFamily = categoryType === BoostCategoryOptionsEnum.family;
    const title = isBoost ? boost?.boostCredential?.name : getCredentialName(boost);
    const dateValue = cred?.issuanceDate || cred?.validFrom;
    const issueDate = moment(dateValue).format('MM/D/YYYY');
    const credImg = getUrlFromImage(getCredentialSubject(cred)?.image ?? '');
    const thumbImage = (cred && getImageUrlFromCredential(cred)) || CategoryImage;
    const badgeThumbnail = credImg && credImg?.trim() !== '' ? credImg : thumbImage;
    const achievementType = cred?.credentialSubject?.achievement?.achievementType;
    const emoji = cred?.display?.emoji;

    let issuerName;
    let issueeName;
    let profileId;

    const isIssuerString = typeof cred?.issuer === 'string' || cred?.issuer instanceof String;
    const isIssueeString =
        typeof cred?.credentialSubject?.id === 'string' ||
        cred?.credentialSubject?.id instanceof String;

    const isLCNetworkUrlIssuer = isIssuerString ? cred?.issuer?.includes('did:web') : false;

    const isLCNetworkUrlIssuee = isIssueeString
        ? cred?.credentialSubject?.id?.includes('did:web')
        : false;
    if (isLCNetworkUrlIssuer) {
        const regex = /(users:)(.*)/;
        profileId = cred?.issuer?.match(regex)?.[2];
    }

    const { data: profile, isLoading, isError } = useGetProfile(profileId);
    const {
        data: myProfile,
        isLoading: myProfileLoading,
        isError: myProfileError,
    } = useGetProfile();

    if (isLCNetworkUrlIssuer) {
        issuerName = profile ? profile?.displayName : isLoading ? 'Loading...' : 'Unknown';
    } else {
        issuerName = getIssuerNameNonBoost(cred);
    }

    if (isLCNetworkUrlIssuee) {
        issueeName = myProfile
            ? myProfile?.displayName
            : myProfileLoading
            ? 'Loading...'
            : 'Unknown';

        issueeName = myProfile
            ? myProfile?.displayName
            : myProfileLoading
            ? 'Loading...'
            : 'Unknown';
    } else {
        issueeName = cred?.credentialSubject?.id;
    }

    const subjectProfileImageElement = myProfile ? (
        <ProfilePicture
            customContainerClass="flex justify-center items-center h-[100px] w-[100px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-xl min-w-[100px] min-h-[100px]"
            customImageClass="flex justify-center items-center h-[100px] w-[100px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[100px] min-h-[100px]"
        />
    ) : (
        <div className="flex flex-row items-center justify-center h-full w-full overflow-hidden bg-gray-50 text-emerald-700 font-semibold text-xl">
            {getEmojiFromDidString(cred?.credentialSubject?.id)}
        </div>
    );

    const generateShareLink = async () => {
        shareEarnedBoost(
            { credential: boost, credentialUri: boostUri as string },
            {
                async onSuccess(data) {
                    if (isEndorsementRequest) {
                        const url = new URL(data?.link);
                        const params = new URLSearchParams(url.search);

                        const host = url.host;
                        const uri = params.get('uri');
                        const seed = params.get('seed');
                        const pin = params.get('pin');

                        // generate endorsement request share link
                        setShareLink(
                            `https://${host}/?uri=${uri}&seed=${seed}&pin=${pin}&endorsementRequest=true`
                        );
                    } else {
                        setShareLink(data?.link);
                    }

                    track(AnalyticsEvents.GENERATE_SHARE_LINK, {
                        category: categoryType,
                        boostType: achievementType,
                        method: 'Earned Boost',
                    });
                },
            }
        );
    };

    useEffect(() => {
        generateShareLink();
    }, []);

    const copyBoostLinkToClipBoard = async () => {
        try {
            await Clipboard.write({
                string: shareLink,
            });
            presentToast('Share link copied to clipboard', {
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast('Unable to copy share link to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const backgroundStyle = {
        backgroundColor: cred?.display?.backgroundColor,
        backgroundImage: cred?.display?.backgroundImage
            ? `linear-gradient(180deg, rgba(0,0,0,0.50) 0%, rgba(24,34,78,0.75) 0%), url(${cred?.display?.backgroundImage})`
            : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
    };

    const generateLinkedInUrl = () => {
        const name = encodeURIComponent(title || '');
        const organization = encodeURIComponent(issuerName || '');
        const issueYear = moment(dateValue).format('YYYY');
        const issueMonth = moment(dateValue).format('M');

        // Use shareLink as the base for certUrl, fallback to a generated URL if not available
        const certUrl = encodeURIComponent(
            shareLink || `https://network.learncard.com/credential/${cred.id || 'unknown'}`
        );

        // Use cred.id if available, otherwise use boostId or generate an ID
        const certId = encodeURIComponent(cred.id || cred?.boostId || `boost-${moment().unix()}`);

        const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${name}&organizationName=${organization}&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${certUrl}&certId=${certId}`;

        return linkedInUrl;
    };

    return (
        <>
            <IonGrid
                className={`w-full max-w-[480px] px-[20px] ${customClassName} overflow-y-scroll pb-[50px] disable-scrollbars`}
            >
                <div
                    className="w-full bg-grayscale-900 flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px] border-solid border-white border-2 overflow-hidden"
                    style={backgroundStyle}
                >
                    <div className="w-full flex items-center justify-end ion-padding">
                        <div className="flex justify-between items-center w-full">
                            <div className="flex items-center">
                                {!isID && !onBackButtonClick && (
                                    <ProfilePicture
                                        customContainerClass="flex justify-center items-center h-[40px] w-[40px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-xl min-w-[40px] min-h-[40px]"
                                        customImageClass="flex justify-center items-center h-[40px] w-[40px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[40px] min-h-[40px]"
                                        customSize={120}
                                    />
                                )}
                                {onBackButtonClick && (
                                    <button
                                        className="text-grayscale-50 p-0"
                                        onClick={onBackButtonClick}
                                    >
                                        <LeftArrow className="h-[30px]" opacity="1" />
                                    </button>
                                )}
                            </div>
                            <p className="font-poppins text-xl text-white">Share</p>
                            <button onClick={handleClose}>
                                <X className="text-white h-8 w-8" />
                            </button>
                        </div>
                    </div>
                    <div className="w-[85%] flex flex-col justify-center items-center relative mb-5 mt-5 bg-white rounded-[15px] py-4 px-2">
                        <div className="flex flex-col justify-center items-center w-full relative">
                            {!isLinkLoading && shareLink && shareLink?.length > 0 && (
                                <div className="w-full h-full relative py-4 px-4">
                                    <QRCodeSVG
                                        className="h-full w-full"
                                        value={shareLink}
                                        bgColor="transparent"
                                    />
                                </div>
                            )}

                            {(isLinkLoading || shareLink?.length === 0) && (
                                <div className="min-w-[300px] min-h-[300px] h-full w-full relative flex items-center justify-center">
                                    <IonSpinner
                                        name="crescent"
                                        color="dark"
                                        className="scale-[1]"
                                    />
                                </div>
                            )}
                        </div>

                        {!isLinkLoading && shareLink && shareLink?.length > 0 && (
                            <div className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-grayscale-100">
                                <p className="w-full text-left text-grayscale-500 font-medium text-sm line-clamp-1 overflow-ellipsis">
                                    {shareLink}
                                </p>

                                <button
                                    onClick={() => copyBoostLinkToClipBoard()}
                                    className="min-w-[108px] flex items-center justify-end text-[#2F99F0]"
                                >
                                    Copy Link
                                </button>
                            </div>
                        )}

                        {!isLinkLoading && shareLink && shareLink?.length > 0 && !hideLinkedIn ? (
                            <div className="w-full bg-white px-4 py-3">
                                <a
                                    href={generateLinkedInUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-center w-full bg-white text-grayscale-600 font-semibold py-2 px-4 rounded-full border-2 border-grayscale-20 hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white transition-colors duration-300"
                                >
                                    <svg
                                        className="w-5 h-5 mr-2 fill-[#0A66C2] group-hover:fill-white transition-colors duration-300"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                    Add to LinkedIn
                                </a>
                            </div>
                        ) : (
                            <div className={hideLinkedIn ? 'hidden' : 'w-full bg-white px-4 py-3'}>
                                <button
                                    disabled
                                    className="flex items-center justify-center w-full bg-grayscale-100 text-grayscale-400 font-semibold py-2 px-4 rounded-full border-2 border-grayscale-200 cursor-not-allowed"
                                >
                                    <svg
                                        className="w-5 h-5 mr-2 fill-grayscale-400"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                    Add to LinkedIn
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="w-full flex items-center justify-center">
                        <p className="text-white font-medium text-lg mb-4 flex items-center justify-center w-full">
                            <IconComponent className="mr-1 h-[24px] w-[25px]" /> Verified{' '}
                            {categoryTitle ?? 'Achievement'}
                        </p>
                    </div>

                    <div className="w-full relative mb-[-20px]">
                        <img
                            src={IDSleeve}
                            alt="id-sleeve"
                            className="w-full object-cover absolute top-0 left-0 blur-[1px]"
                        />

                        <img src={IDSleeve} alt="id-sleeve" className="w-full object-cover" />

                        <div className="absolute top-0 left-[50%] translate-x-[-50%]">
                            {isID && subjectProfileImageElement}

                            {!isID && !isFamily && (
                                <CredentialBadge
                                    achievementType={achievementType}
                                    fallbackCircleText={title}
                                    boostType={categoryType as BoostCategoryOptionsEnum}
                                    badgeThumbnail={badgeThumbnail}
                                    badgeContainerCustomClass="mt-[0px] mb-[8px]"
                                    badgeCircleCustomClass="w-[116px] h-[116px] shadow-3xl mt-1"
                                    badgeRibbonContainerCustomClass="left-[38%] bottom-[-20%]"
                                    badgeRibbonCustomClass="w-[26px]"
                                    badgeRibbonIconCustomClass="w-[90%] mt-[4px]"
                                    credential={cred}
                                    displayType={displayType}
                                />
                            )}
                        </div>
                        {isFamily && (
                            <div className="absolute top-[-50px] left-[50%] translate-x-[-50%] w-full">
                                <div className="w-full">
                                    <FamilyCrest
                                        ribbonClassName="!bottom-[45px]"
                                        containerClassName="z-9999"
                                        imageClassName="w-[90px]"
                                        familyName={title}
                                        thumbnail={badgeThumbnail}
                                        showMinified
                                        showSleeve={false}
                                        showEmoji={emoji?.unified}
                                        emoji={emoji}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white pt-4 w-full mt-4">
                        <p className="w-full text-grayscale-900 font-normal text-lg px-4 pb-2 text-center">
                            {title}
                        </p>
                        <p className="w-full text-grayscale-900 font-normal text-sm px-4 text-center">
                            Issued to {truncateWithEllipsis(issueeName ?? '', 25)}
                        </p>
                        <p className="w-full text-grayscale-900 font-normal text-sm px-4 text-center">
                            by {truncateWithEllipsis(issuerName ?? '', 25)}{' '}
                            {issueDate && <span>{issueDate}</span>}
                        </p>
                    </div>

                    <div className="bg-white w-full flex items-center justify-center pt-4 pb-2">
                        <div className="bg-grayscale-300 h-[1px] w-[90%]" />
                    </div>

                    <div className="w-full flex items-center justify-center bg-white pb-2">
                        <CredentialVerificationDisplay credential={cred} showText />
                    </div>
                </div>
            </IonGrid>
        </>
    );
};

export default ShareBoostLink;
