import React, { useEffect, useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import { QRCodeSVG } from 'qrcode.react';
import moment from 'moment';

import { IonGrid, IonSpinner } from '@ionic/react';
import X from 'learn-card-base/svgs/X';
import {
    BoostCategoryOptionsEnum,
    BrandingEnum,
    CredentialBadge,
    ProfilePicture,
    truncateWithEllipsis,
    useGetProfile,
    useShareBoostMutation,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import IDSleeve from '../../../assets/images/id-sleeve.png';

import {
    getCredentialName,
    getCredentialSubject,
    getImageUrlFromCredential,
    getIssuerNameNonBoost,
    getUrlFromImage,
    isBoostCredential,
    unwrapBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';

import { VC } from '@learncard/types';
import { boostCategoryOptions } from '../boost-options/boostOptions';
import { getEmojiFromDidString } from 'learn-card-base/helpers/walletHelpers';
import useFirebaseAnalytics from '../../../hooks/useFirebaseAnalytics';

const ShareBoostLink: React.FC<{
    handleClose: () => void;
    boost: VC;
    boostUri: string;
    customClassName?: string;
    categoryType: string;
}> = ({ boost, boostUri, customClassName, handleClose, categoryType }) => {
    const { presentToast } = useToast();
    const [shareLink, setShareLink] = useState<string | undefined>('');

    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const { mutate: shareEarnedBoost, isPending: isLinkLoading } = useShareBoostMutation();

    const categoryConfig =
        boostCategoryOptions?.[categoryType as string] ??
        boostCategoryOptions[BoostCategoryOptionsEnum.achievement];

    const IconComponent = (categoryConfig?.IconComponent as React.ElementType) || (() => null);
    const CategoryImage = categoryConfig?.CategoryImage as string;
    const categoryTitle = categoryConfig?.title;

    const isBoost = boost && isBoostCredential(boost);
    const cred = boost && unwrapBoostCredential(boost);

    const displayType = cred?.display?.displayType;
    const isID = cred?.display?.displayType === 'id' || categoryType === 'ID';
    const title = isBoost ? boost?.boostCredential?.name : getCredentialName(boost);
    const issueDate = moment(cred?.issuanceDate).format('MM/D/YYYY');
    const credImg = getUrlFromImage(getCredentialSubject(cred)?.image ?? '');
    const backgroundImage = cred?.display?.backgroundImage;
    const thumbImage = (cred && getImageUrlFromCredential(cred)) || CategoryImage;
    const badgeThumbnail = credImg && credImg?.trim() !== '' ? credImg : thumbImage;
    const achievementType = cred?.credentialSubject?.achievement?.achievementType;

    let issuerName;
    let issueeName;
    let profileId;
    let subjectProfileImageElement;

    const isIssuerString = typeof cred?.issuer === 'string' || cred?.issuer instanceof String;
    const isIssueeString =
        typeof cred?.credentialSubject?.id === 'string' ||
        cred?.credentialSubject?.id instanceof String;

    const issuerDid = isIssuerString ? (cred?.issuer as string) : (cred?.issuer?.id as string);
    const issueeDid = isIssueeString
        ? (cred?.credentialSubject?.id as string)
        : (cred?.credentialSubject?.id as string);

    const issuerProfileId = issuerDid?.includes(':users:') ? issuerDid.split(':').pop() : undefined;
    const issueeProfileId = issueeDid?.includes(':users:') ? issueeDid.split(':').pop() : undefined;

    const { data: issuerProfile, isLoading: isIssuerLoading } = useGetProfile(issuerProfileId);
    const { data: issueeProfile, isLoading: isIssueeLoading } = useGetProfile(issueeProfileId);
    const { data: myProfile, isLoading: myProfileLoading } = useGetProfile();

    if (issuerProfileId) {
        issuerName = issuerProfile ? issuerProfile?.displayName : isIssuerLoading ? 'Loading...' : 'Unknown';
    } else {
        issuerName = getIssuerNameNonBoost(cred);
    }

    if (issueeProfileId) {
        issueeName = issueeProfile ? issueeProfile?.displayName : isIssueeLoading ? 'Loading...' : 'Unknown';
    } else {
        issueeName = myProfile ? myProfile?.displayName : myProfileLoading ? 'Loading...' : 'Unknown';
    }

    if (issueeProfileId || issueeDid?.includes('did:web:scoutnetwork.org')) {
        subjectProfileImageElement =
            issueeProfile || myProfile ? (
                <ProfilePicture
                    overrideSrc={!!(issueeProfile?.image || myProfile?.image)}
                    overrideSrcURL={issueeProfile?.image || myProfile?.image}
                    customContainerClass="flex justify-center items-center h-[100px] w-[100px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-3xl min-w-[100px] min-h-[100px]"
                    customImageClass="flex justify-center items-center h-[100px] w-[100px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[100px] min-h-[100px]"
                />
            ) : (
                <div className="flex flex-row items-center justify-center h-[100px] w-[100px] rounded-full overflow-hidden bg-gray-50 text-emerald-700 font-semibold text-xl">
                    {getEmojiFromDidString(issueeDid)}
                </div>
            );
    } else {
        issueeName = issueeDid;
    }

    const generateShareLink = async () => {
        shareEarnedBoost(
            { credential: boost, credentialUri: boostUri },
            {
                async onSuccess(data) {
                    setShareLink(data?.link);
                    logAnalyticsEvent('generate_share_link', {
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
                type: ToastTypeEnum.Success,
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

    return (
        <>
            <IonGrid
                className={`w-full max-w-[440px] px-[20px] ${customClassName} overflow-y-auto vc-preview-modal-safe-area disable-scrollbars`}
            >
                <div
                    className="w-full bg-grayscale-900 flex flex-col items-center justify-center max-w-[600px] rounded-[20px] border-solid border-white border-2 overflow-hidden"
                    style={backgroundStyle}
                >
                    <div className="w-full flex items-center justify-end ion-padding">
                        <div className="flex justify-between items-center w-full">
                            <ProfilePicture
                                customContainerClass="flex justify-center items-center h-[40px] w-[40px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-3xl min-w-[40px] min-h-[40px]"
                                customImageClass="flex justify-center items-center h-[40px] w-[40px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[40px] min-h-[40px]"
                                customSize={120}
                            />

                            <p className="text-2xl text-white">Share</p>

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
                                <div className="w-[50%] flex flex-grow justify-start items-center text-left overflow-ellipsis">
                                    <p className="w-full flex items-center justify-start text-left text-grayscale-500 font-medium text-sm line-clamp-1 overflow-ellipsis">
                                        {shareLink}
                                    </p>
                                </div>
                                <button
                                    onClick={() => copyBoostLinkToClipBoard()}
                                    className="min-w-[88px] flex items-center justify-end text-[#2F99F0]"
                                >
                                    Copy Link
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="w-full flex items-center justify-center">
                        <p className="text-white font-medium text-lg mb-4 flex items-center justify-center w-full">
                            <IconComponent className="mr-1 h-[24px] w-[25px]" />
                            {categoryTitle ?? 'Achievement'}
                        </p>
                    </div>

                    <div className="w-full relative">
                        <img
                            src={IDSleeve}
                            alt="id-sleeve"
                            className="w-full object-cover absolute top-0 left-0 blur-[1px]"
                        />

                        <img src={IDSleeve} alt="id-sleeve" className="w-full object-cover" />

                        <div className="absolute top-0 left-[50%] translate-x-[-50%]">
                            {isID ? (
                                subjectProfileImageElement
                            ) : (
                                <CredentialBadge
                                    achievementType={achievementType}
                                    fallbackCircleText={title}
                                    boostType={categoryConfig?.value as BoostCategoryOptionsEnum}
                                    badgeThumbnail={badgeThumbnail}
                                    badgeContainerCustomClass="mt-[0px] mb-[8px]"
                                    badgeCircleCustomClass="w-[116px] h-[116px] mt-1"
                                    badgeRibbonContainerCustomClass="left-[38%] bottom-[-20%]"
                                    badgeRibbonCustomClass="w-[26px]"
                                    badgeRibbonIconCustomClass="w-[90%] mt-[4px]"
                                    credential={cred}
                                    displayType={displayType}
                                    branding={BrandingEnum.scoutPass}
                                    showBackgroundImage={false}
                                    backgroundImage={''}
                                    backgroundColor={''}
                                />
                            )}
                        </div>
                    </div>

                    <div className="bg-white pt-8 w-full mt-[-2px]">
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

                    <div className="bg-white w-full flex items-center justify-center pt-4 pb-6">
                        <div className="bg-grayscale-300 h-[1px] w-[90%]" />
                    </div>
                </div>
            </IonGrid>
        </>
    );
};

export default ShareBoostLink;
