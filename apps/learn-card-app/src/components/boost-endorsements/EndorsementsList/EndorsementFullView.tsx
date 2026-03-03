import React, { useState, useEffect } from 'react';

// import Pencil from '../../svgs/Pencil';
import { IonToggle, IonRow } from '@ionic/react';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import EndorsementDeletedCard from './EndorsementDeletedCard';
import DeleteEndorsementOverlay from './DeleteEndorsementOverlay';
import { EndorsmentThumbWithCircle } from 'learn-card-base/svgs/EndorsementThumb';
import EndorsementAttachmentListItem from '../EndorsementMediaAttachments/EndorsementAttachmentListItem';

import { VC } from '@learncard/types';
import {
    EndorsementMediaOptionsEnum,
    EndorsementMediaAttachment,
} from '../EndorsementForm/endorsement-state.helpers';
import {
    BoostEndorsementStatusEnum,
    EndorsementModeEnum,
    BoostEndorsement,
} from '../boost-endorsement.helpers';
import {
    CredentialCategoryEnum,
    useGetVCInfo,
    useGetCurrentLCNUser,
    useWallet,
    ProfilePicture,
} from 'learn-card-base';
import { hasEndorsedCredential } from 'learn-card-base/helpers/credentialHelpers';
import { getInfoFromCredential } from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import { UserProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';

export const EndorsementFullView: React.FC<{
    credential: VC; // endorsement parent credential
    categoryType?: CredentialCategoryEnum; // endorsement parent credential category

    endorsement: VC | BoostEndorsement; // endorsement credential
    metadata?: any; // additonal endorsement metadata -> index record

    mode?: EndorsementModeEnum;

    // visibility of endorsement
    visibility?: 'public' | 'private';
    setVisibility?: (visibility: 'public' | 'private') => void;

    // claim status of endorsement
    isClaimed?: boolean;

    showDeleteButton?: boolean;
    handleDeleteEndorsement?: (id: string) => void;
}> = ({
    credential,
    categoryType,
    endorsement,
    metadata,
    mode = EndorsementModeEnum.View,
    visibility,
    setVisibility,
    isClaimed,
    showDeleteButton,
    handleDeleteEndorsement,
}) => {
    const { initWallet } = useWallet();

    const { currentLCNUser } = useGetCurrentLCNUser();

    // parent credential info
    const { isCurrentUserSubject } = useGetVCInfo(credential, categoryType);
    // endorsement info
    const {
        isCurrentUserIssuer,
        issuerProfileImageElement,
        evidence,
        issuerName,
        endorsementComment,
    } = useGetVCInfo(endorsement, categoryType);

    const { createdAt } = getInfoFromCredential(endorsement, 'MMM D, YYYY', {
        uppercaseDate: false,
    });

    const hasEndorsed = hasEndorsedCredential([endorsement], currentLCNUser?.did);
    const isEndorser = isCurrentUserIssuer;

    const deleted = false;
    const date = createdAt;
    const status = endorsement?.status || true;
    const endorsementStatus = status;

    const [showEndorsement, setShowEndorsement] = useState(visibility || false);
    const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);

    useEffect(() => {
        // when external viewer is seeing endorsement, show it
        setShowEndorsement(!isCurrentUserSubject);
    }, [isEndorser, isCurrentUserIssuer]);

    useEffect(() => {
        if (visibility) {
            setShowEndorsement(visibility);
        }
    }, []);

    // when owner is seeing endorsement + metadata is available, set visibility
    useEffect(() => {
        // queried endorsement metadata
        if (metadata && metadata?.visibility) {
            setShowEndorsement(metadata?.visibility === 'public' ? true : false);
        }

        // notification metadata
        if (metadata && !metadata?.visibility && isCurrentUserSubject) {
            setShowEndorsement(true);
        }
    }, []);

    const updateIndexRecordVisibility = async (_visibility: boolean) => {
        const wallet = await initWallet();
        const id = metadata?.id; // metadata.id is the index record id
        if (id) {
            const indexRecord = await wallet?.index?.LearnCloud?.get({ id });

            if (indexRecord) {
                await wallet?.index?.LearnCloud?.update(id, {
                    visibility: _visibility ? 'public' : 'private',
                });
            }
        }
    };

    const getAttachments = (
        attachmentType: EndorsementMediaOptionsEnum
    ): EndorsementMediaAttachment[] => {
        let attachments = [];

        if (endorsement?.mediaAttachments?.length > 0) {
            attachments =
                endorsement.mediaAttachments.filter(
                    (attachment: EndorsementMediaAttachment) =>
                        attachment?.type === attachmentType || attachment?.genre === attachmentType
                ) || [];
            return attachments;
        }

        attachments =
            evidence?.filter(
                attachment =>
                    attachment?.type === attachmentType || attachment?.genre === attachmentType
            ) || [];

        return attachments.map(attachment => ({
            url: attachment.id,
            type: attachment.genre,
            title: attachment.name,
            fileName: attachment.fileName,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
        }));
    };

    const photos = getAttachments(EndorsementMediaOptionsEnum.photo);
    const videos = getAttachments(EndorsementMediaOptionsEnum.video);
    const documents = getAttachments(EndorsementMediaOptionsEnum.document);
    const links = getAttachments(EndorsementMediaOptionsEnum.link);

    const attachments = [...photos, ...videos, ...documents, ...links];

    const hiddenStyles = showEndorsement ? 'opacity-100' : 'opacity-50';
    const endorserStyles = isEndorser && hasEndorsed ? 'bg-teal-100' : 'bg-grayscale-100';
    const endorserIconStyles = isEndorser && hasEndorsed ? 'text-white' : 'text-grayscale-700';
    const endorserFill = isEndorser && hasEndorsed ? '#2DD4BF' : '';

    if (deleted) {
        return (
            <EndorsementDeletedCard
                endorsement={endorsement}
                credential={credential}
                categoryType={categoryType}
            />
        );
    }

    return (
        <div className="py-4 gap-4 bg-white flex flex-col items-start rounded-[20px] w-full shadow-bottom-2-4 relative">
            {/* delete overlay */}
            {showDeleteOverlay && (
                <DeleteEndorsementOverlay
                    setShowDeleteOverlay={setShowDeleteOverlay}
                    showDeleteOverlay={showDeleteOverlay}
                    handleDeleteEndorsement={() => handleDeleteEndorsement?.(metadata?.id)}
                />
            )}
            {/* endorsement toggle */}
            {isCurrentUserSubject && !isClaimed && (
                <div className="w-full border-b border-grayscale-200 pb-2">
                    <div className="flex items-center justify-between w-full px-4">
                        <div>
                            <p
                                className={`text-xs font-semibold ${
                                    showEndorsement ? 'text-emerald-500' : 'text-grayscale-600'
                                }`}
                            >
                                {showEndorsement ? 'Active' : 'Hidden'}
                            </p>
                            <h1 className="text-sm font-semibold text-grayscale-900">
                                Show Endorsement?
                            </h1>
                        </div>

                        <IonToggle
                            mode="ios"
                            color="emerald-700"
                            onIonChange={() => {
                                const showEndorsementValue = showEndorsement;
                                setShowEndorsement(!showEndorsementValue);
                                setVisibility?.(!showEndorsementValue);
                                updateIndexRecordVisibility(!showEndorsementValue);
                            }}
                            checked={showEndorsement}
                        />
                    </div>
                </div>
            )}
            {/* endorsement status */}
            {isEndorser && endorsementStatus === BoostEndorsementStatusEnum.Pending && (
                <div className="w-full flex items-center justify-center px-4">
                    <div
                        className={`flex items-center justify-between px-2 py-1 rounded-[5px] bg-grayscale-100`}
                    >
                        <p className="text-xs flex items-center font-semibold text-grayscale-700 uppercase">
                            Not public • Waiting for review
                        </p>
                    </div>
                </div>
            )}
            {/* endorsement date */}
            <div className="w-full flex items-center justify-between px-4">
                <div
                    className={`flex items-center justify-between px-2 py-1 rounded-[5px] ${endorserStyles}`}
                >
                    <p className="text-xs flex items-center font-semibold text-grayscale-700 uppercase">
                        <EndorsmentThumbWithCircle
                            className={`mr-1 ${endorserIconStyles}`}
                            fill={endorserFill}
                        />{' '}
                        Endorsed on {date}
                    </p>
                </div>

                {!isClaimed && showDeleteButton && (
                    <div className="flex items-center justify-end gap-2">
                        {/*
                    
                    // TODO:
                    //  - Add edit endorsement functionality in v2
                    {isCurrentUserSubject && (
                        <button className="text-xs font-semibold">
                            <Pencil className="w-6 h-6 text-grayscale-700" />
                        </button>
                    )} 
                    */}

                        {(isCurrentUserSubject || isEndorser) && (
                            <button
                                onClick={() => setShowDeleteOverlay(true)}
                                className="text-xs font-semibold"
                            >
                                <TrashBin className="w-6 h-6 text-grayscale-700" />
                            </button>
                        )}
                    </div>
                )}
            </div>
            {/* endorser info */}
            <div className={`flex items-start justify-start w-full gap-4 px-4 ${hiddenStyles}`}>
                <div className="w-[40px] h-[40px] min-w-[40px] min-h-[40px] overflow-hidden rounded-full">
                    {endorsement?.user && (
                        <ProfilePicture
                            overrideSrc
                            overrideSrcURL={endorsement?.user?.image}
                            customImageClass="w-full h-full object-cover"
                            customContainerClass="flex items-center justify-center h-full text-white font-medium text-lg"
                        />
                    )}

                    {!endorsement?.user && issuerProfileImageElement}
                </div>
                <div className="flex flex-col items-start justify-center">
                    <p className="flex items-center text-sm font-semibold text-grayscale-900 text-left gap-1">
                        {endorsement?.user?.name || issuerName}
                    </p>
                    <p className="text-sm text-grayscale-700 line-clamp-3 text-left">
                        {endorsement?.relationship?.label || metadata?.relationship?.label}
                    </p>
                </div>
            </div>
            {/* endorsement content */}
            <div
                className={`flex flex-col items-start justify-start w-full gap-1 px-4 ${hiddenStyles}`}
            >
                <p className="text-xs font-medium text-grayscale-600">Endorsement</p>
                <p className="text-sm text-grayscale-900 line-clamp-3 text-left italic">
                    "{endorsement?.description}"
                </p>
            </div>
            {/* qualifications */}
            <div
                className={`flex flex-col items-start justify-start w-full gap-1 px-4 ${hiddenStyles}`}
            >
                <p className="text-xs font-medium text-grayscale-600">Qualifications</p>
                <p className="text-sm text-grayscale-900 line-clamp-3 text-left italic">
                    "{endorsement?.qualification || endorsementComment}"
                </p>
            </div>
            attachments
            {attachments.length > 0 && (
                <div
                    className={`flex flex-col items-start justify-start w-full gap-1 px-4 ${hiddenStyles}`}
                >
                    <p className="text-xs font-medium text-grayscale-600 mb-1">Supporting Media</p>
                    <IonRow className="w-full flex flex-col items-center justify-center gap-2">
                        {attachments?.map((attachment, index) => {
                            return (
                                <EndorsementAttachmentListItem
                                    key={index}
                                    media={attachment}
                                    endorsement={{}}
                                    setEndorsement={() => {}}
                                    className="w-full"
                                    showEditButton={false}
                                    showDeleteButton={false}
                                />
                            );
                        })}
                    </IonRow>
                </div>
            )}
        </div>
    );
};

export default EndorsementFullView;
