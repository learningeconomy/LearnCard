import React, { useState, useEffect } from 'react';
import { VCDisplayCard2 } from '@learncard/react';
import { VC, VerificationItem, CredentialRecord } from '@learncard/types';
import { getCredentialSubject } from '../IssueVC/helpers';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { CredentialCategory, categoryMetadata, useWallet } from 'learn-card-base';
import { getEmojiFromDidString } from 'learn-card-base/helpers/walletHelpers';
import X from 'learn-card-base/svgs/X';
import { IonContent, IonPage, IonRow } from '@ionic/react';
import {
    getUrlFromImage,
    getImageUrlFromCredential,
    getCredentialName,
    getDetailsFromCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import ProfilePicture from '../profilePicture/ProfilePicture';
import {
    DetailsFieldType,
    getDefaultCategoryForCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';

const DetailsDisplay: React.FC<VC> = ({ credential }) => {
    const renderDetails = getDetailsFromCredential(credential)?.map(
        (detail: DetailsFieldType, index) => {
            return (
                <>
                    <h6
                        key={index}
                        className="line-clamp-1 text-grayscale-900 font-bold uppercase text-xs tracking-wider subpixel-antialiased my-[5px]"
                    >
                        {detail?.fieldName}
                    </h6>
                    <p className="line-clamp-3 subpixel-antialiased text-grayscale-600 text-[14px] lc-line-clamp">
                        {detail?.fieldValue}
                    </p>
                </>
            );
        }
    );

    return <div className="width-full">{renderDetails}</div>;
};

export const VCDisplayCardWrapper = ({
    credential,
    cr,
    lc,
    className = '',
    walletDid: _walletDid,
    overrideCardImageUrl,
    overrideCardTitle,
    overrideIssueName,
    handleCloseModal,
    categoryType,
}: {
    credential: VC;
    cr?: CredentialRecord;
    className?: string;
    lc?: BespokeLearnCard;
    walletDid?: string;
    overrideCardImageUrl?: string;
    overrideCardTitle?: string;
    overrideDetails?: React.ReactNode;
    overrideIssueName?: string;
    handleCloseModal?: () => void;
    categoryType?: string;
}) => {
    const currentUser = useCurrentUser();
    const [loading, setLoading] = useState(true);
    const [dids, setDids] = useState<string[]>([]);
    const [VcCategory, setVcCategory] = useState<any | null | undefined>(categoryType ?? '');
    const [vcVerifications, setVCVerifications] = useState<VerificationItem[]>([]);
    const { initWallet } = useWallet();

    useEffect(() => {
        const getCategory = async () => {
            const cat = getDefaultCategoryForCredential(credential);
            setVcCategory(cat);
        };

        if (!categoryType) {
            getCategory();
        }
    }, [credential]);

    const getWalletDid = async () => {
        const wallet = lc ?? (await initWallet());
        const defaultDid = wallet.id.did();
        const keyDid = wallet.id.did('key');

        setDids(defaultDid === keyDid ? [defaultDid] : [defaultDid, keyDid]);
    };

    useEffect(() => {
        getWalletDid();
    }, []);

    useEffect(() => {
        const verify = async () => {
            const wallet = lc ?? (await initWallet());
            const verifications = await wallet?.invoke?.verifyCredential(credential, {}, true);
            console.log('//verifications', verifications);

            setVCVerifications(verifications);
            setLoading(false);
        };

        verify();
    }, [credential]);

    const userName = currentUser?.name ?? '';
    const credentialSubject = getCredentialSubject(credential);
    const isSubjectCurrentUser = dids.includes(credentialSubject?.id ?? '');
    let issueeText = 'Loading...';
    let issuerText = 'Loading...';

    issueeText =
        overrideIssueName || isSubjectCurrentUser
            ? userName
            : dids.length > 0
            ? `${credentialSubject?.id?.slice(0, 20)}...`
            : 'Loading...';
    const issuerId = credential?.issuer?.id || credential?.issuer;
    const issuerName = credential?.issuer?.name;

    const isIssuerCurrentUser = dids.includes(issuerId);
    issuerText = isIssuerCurrentUser
        ? userName
        : issuerName
        ? issuerName
        : dids
        ? issuerId
        : 'Loading...';

    const subjectElEmoji = getEmojiFromDidString(credentialSubject?.id);
    const issuerElEmoji = getEmojiFromDidString(issuerId);

    const getCurrentUserEl = () => {
        if (currentUser?.profileImage) {
            return (
                <ProfilePicture
                    customContainerClass="w-full h-full object-cover"
                    customImageClass="w-full h-full object-cover"
                />
            );
        } else {
            return userName?.slice(0, 1);
        }
    };

    const subjectElPlaceholder = (
        <div className="flex flex-row items-center justify-center h-full w-full overflow-hidden bg-gray-50  text-emerald-700 font-semibold text-3xl">
            {isSubjectCurrentUser
                ? getCurrentUserEl()
                : subjectElEmoji
                ? subjectElEmoji
                : credentialSubject?.id?.slice(0, 1)}
        </div>
    );

    const getIssuerElPlaceholder = () => {
        const issuerImg = getUrlFromImage(credential?.issuer?.image);
        const issuerImgEl = (
            <img className="issuer-img w-full h-full object-cover" src={issuerImg} alt="" />
        );

        let el = issuerImg ? issuerImgEl : issuerElEmoji ? issuerElEmoji : issuerId?.slice(0, 1);

        if (isIssuerCurrentUser) {
            el = (
                <ProfilePicture
                    customContainerClass="w-full h-full object-cover"
                    customImageClass="w-full h-full object-cover"
                />
            );
        }

        const className = `flex flex-row items-center justify-center h-full w-full overflow-hidden bg-gray-50 text-emerald-700 font-semibold text-3xl`;

        return <div className={className}>{el}</div>;
    };

    const getDisplayComponent = (type: 'issuee' | 'issuer') => {
        if (type === 'issuee') {
            return subjectElPlaceholder;
        }

        if (type === 'issuer') {
            return getIssuerElPlaceholder();
        }

        return null;
    };

    const subjectImageComp = getDisplayComponent('issuee');
    const issuerImageComp = getDisplayComponent('issuer');

    const category: CredentialCategory = VcCategory || cr?.category || 'Achievement';
    const categoryImgUrl = categoryMetadata[category].defaultImageSrc;

    //override default image component in vc display which depends on assumption of a default vc data shape
    const cardImgUrl =
        overrideCardImageUrl || getImageUrlFromCredential(credential) || categoryImgUrl;
    const cardImgOverride = (
        <img
            className="h-full w-full object-cover rounded-full object-cover"
            src={cardImgUrl}
            alt="Credential Achievement Image"
        />
    );

    const cardTitle = overrideCardTitle || getCredentialName(credential);

    const renderDetailsEl = <DetailsDisplay credential={credential} />;

    return (
        <IonPage>
            <IonContent
                className="flex items-center justify-center ion-padding boost-cms-preview"
                fullscreen
            >
                <IonRow className="flex flex-col items-center justify-center px-6">
                    <div className="flex items-center justify-cente mb-2 vc-preview-modal-safe-area">
                        <button
                            onClick={handleCloseModal}
                            className="w-[50px] h-[50px] bg-white rounded-full flex items-center justify-center shadow-3xl"
                        >
                            <X className="text-black w-[30px]" />
                        </button>
                    </div>
                    <VCDisplayCard2
                        className={className}
                        credential={credential}
                        issueeOverride={issueeText}
                        issuerOverride={issuerText}
                        issuerImageComponent={issuerImageComp}
                        subjectImageComponent={subjectImageComp}
                        overrideCardImageComponent={cardImgOverride}
                        verificationItems={vcVerifications}
                        overrideCardTitle={cardTitle}
                        overrideDetailsComponent={renderDetailsEl}
                        categoryType={category}
                    />
                </IonRow>
            </IonContent>
        </IonPage>
    );
};

export default VCDisplayCardWrapper;
