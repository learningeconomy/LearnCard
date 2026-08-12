import React from 'react';

import { IonItem } from '@ionic/react';

import X from 'learn-card-base/svgs/X';
import Plus from 'learn-card-base/svgs/Plus';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import { ModalTypes, UserProfilePicture, BoostUserTypeEnum, useModal } from 'learn-card-base';
import PaperClip from 'apps/learn-card-app/src/components/svgs/PaperClip';

import { BoostCMSIssueTo, BoostCMSState } from '../../../boost';
import { BoostAddressBookEditMode } from './BoostAddressBook';
import RecipientMediaAttachmentsModal from './RecipientMediaAttachmentsModal';

type BoostAddressBookContactItemProps = {
    mode: BoostAddressBookEditMode;
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    setIssueMode?: React.Dispatch<React.SetStateAction<BoostUserTypeEnum>>;
    contact: BoostCMSIssueTo;
    isSelf?: boolean;
    _issueTo: BoostCMSIssueTo[];
    _setIssueTo: React.Dispatch<React.SetStateAction<BoostCMSIssueTo[]>>;

    // the designated field we will be storing the selected contacts in
    // by default we store them in the issueTo collection
    // IE: issueTo
    // IE: admins
    collectionPropName?: string;
    customListItemStyles?: string;

    version?: 'original' | 'sleek';
    showRecipientAttachments?: boolean;
};

export const BoostAddressBookContactItem: React.FC<BoostAddressBookContactItemProps> = ({
    state,
    setState,
    setIssueMode,
    contact,
    isSelf,
    mode,
    _issueTo,
    _setIssueTo,
    collectionPropName = 'issueTo',
    customListItemStyles,
    version = 'original',
    showRecipientAttachments = false,
}) => {
    const { newModal } = useModal({ mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel });
    let actionButton;
    let viewModeStyles;
    const issueToList = state?.[collectionPropName];
    const contactAlreadyExists = _issueTo?.find?.(
        _contact => _contact?.profileId === contact?.profileId
    );
    const attachmentsCount = contact.mediaAttachments?.length ?? 0;
    const hasAttachments = attachmentsCount > 0;

    const handleAddContact = (contact: BoostCMSIssueTo) => {
        if (!contactAlreadyExists) {
            _setIssueTo([..._issueTo, contact]);
        }
    };

    const handleRemoveContact = (contact: BoostCMSIssueTo) => {
        // removes contact from CMS state
        const filteredList = issueToList.filter(
            _contact => _contact.profileId !== contact.profileId
        );

        setState(prevState => {
            return {
                ...prevState,
                [collectionPropName]: [...filteredList],
            };
        });

        if (isSelf && setIssueMode) {
            setIssueMode?.(BoostUserTypeEnum.someone);
        }
    };

    const _handleRemoveContactLocally = (contact: BoostCMSIssueTo) => {
        // removes contact from local addressBook component state
        const filteredList = _issueTo.filter(_contact => _contact.profileId !== contact.profileId);
        _setIssueTo([...filteredList]);
    };

    const handleOpenMediaAttachments = () => {
        newModal(
            <RecipientMediaAttachmentsModal recipient={contact} setIssueTo={_setIssueTo} />,
            {
                sectionClassName: '!max-w-[500px]',
                hideButton: true,
                usePortal: true,
                portalClassName: '!max-w-[500px]',
            },
            {
                desktop: ModalTypes.Cancel,
                mobile: ModalTypes.Cancel,
            }
        );
    };

    if (mode === BoostAddressBookEditMode.delete) {
        if (version === 'sleek') {
            actionButton = (
                <button
                    className="w-[25px] h-[25px] ml-auto"
                    onClick={() => handleRemoveContact(contact)}
                >
                    <TrashBin version="thin" className="text-grayscale-800" />
                </button>
            );
        } else {
            actionButton = (
                <button
                    onClick={() => handleRemoveContact(contact)}
                    className="flex items-center justify-center text-grayscale-800 rounded-full bg-white shadow-3xl w-12 h-12"
                >
                    <X className="w-8 h-auto" />
                </button>
            );
            viewModeStyles = 'py-[8px]';
        }
    } else if (mode === BoostAddressBookEditMode.edit) {
        if (contactAlreadyExists) {
            actionButton = (
                <button
                    onClick={() => _handleRemoveContactLocally(contact)}
                    className="flex items-center justify-center text-white rounded-full bg-emerald-700 shadow-3xl w-12 h-12"
                >
                    <Checkmark className="w-8 h-auto" />
                </button>
            );
        } else {
            actionButton = (
                <button
                    onClick={() => handleAddContact(contact)}
                    className="flex items-center justify-center text-grayscale-800 rounded-full bg-grayscale-100 shadow-3xl w-12 h-12"
                >
                    <Plus className="w-8 h-auto" />
                </button>
            );
        }

        viewModeStyles = 'border-gray-200 border-b-2 last:border-b-0 py-[12px]';
    }

    if (version === 'sleek') {
        return (
            <div className="flex gap-[10px] items-center py-[10px] border-b-[1px] border-grayscale-line border-solid last:border-b-0">
                <UserProfilePicture
                    customContainerClass="flex justify-center items-center w-[35px] h-[35px] rounded-full overflow-hidden text-white font-medium text-2xl"
                    customImageClass="flex justify-center items-center w-[35px] h-[35px] min-w-[35px] min-h-[35px] rounded-full overflow-hidden object-cover"
                    customSize={164}
                    user={contact}
                />
                <p className="text-grayscale-800 font-notoSans text-[18px]">
                    {contact?.displayName ?? contact?.profileId}
                </p>
                <div className="ml-auto flex items-center gap-[10px]">
                    {showRecipientAttachments && (
                        <button
                            type="button"
                            aria-label={`Media Attachments for ${
                                contact?.displayName ?? contact?.profileId
                            }`}
                            onClick={handleOpenMediaAttachments}
                            className="relative flex items-center justify-center rounded-full shadow-3xl w-[35px] h-[35px] bg-white text-grayscale-800"
                        >
                            <PaperClip className="h-[18px] w-[18px]" />
                            {hasAttachments && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-medium">
                                    {attachmentsCount}
                                </span>
                            )}
                        </button>
                    )}
                    {actionButton}
                </div>
            </div>
        );
    }

    return (
        <IonItem
            lines="none"
            className={`w-[95%] max-w-[600px] ion-no-border px-[4px] flex items-center justify-between notificaion-list-item ${viewModeStyles} ${customListItemStyles}`}
        >
            <div className="flex items-center justify-between w-full">
                <div
                    className={`flex items-center justify-start ${
                        showRecipientAttachments ? 'w-[68%]' : 'w-[80%]'
                    }`}
                >
                    <UserProfilePicture
                        customContainerClass="flex justify-center items-center w-12 h-12 min-w-12 min-h-12 rounded-full overflow-hidden text-white font-medium text-4xl mr-3"
                        customImageClass="flex justify-center items-center w-12 h-12 h-12 min-w-12 min-h-12 rounded-full overflow-hidden object-cover"
                        customSize={164}
                        user={contact}
                    />
                    <div className="flex flex-col justify-center">
                        {contact?.displayName && (
                            <p className="text-grayscale-900 font-medium">{contact?.displayName}</p>
                        )}
                        <p className="text-grayscale-500 text-[14px] font-medium">
                            {contact?.profileId}
                        </p>
                    </div>
                </div>
                <div
                    className={`flex item-center justify-end pt-1 pr-1 pb-1 gap-2 ${
                        showRecipientAttachments ? 'w-[32%]' : 'w-[20%]'
                    }`}
                >
                    {showRecipientAttachments && (
                        <button
                            type="button"
                            aria-label={`Media Attachments for ${
                                contact?.displayName ?? contact?.profileId
                            }`}
                            onClick={handleOpenMediaAttachments}
                            className="relative flex items-center justify-center rounded-full shadow-3xl w-12 h-12 bg-white text-grayscale-800"
                        >
                            <PaperClip className="h-[24px] w-[24px]" />
                            {hasAttachments && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-emerald-600 text-white text-xs font-medium">
                                    {attachmentsCount}
                                </span>
                            )}
                        </button>
                    )}
                    {actionButton}
                </div>
            </div>
        </IonItem>
    );
};

export default BoostAddressBookContactItem;
