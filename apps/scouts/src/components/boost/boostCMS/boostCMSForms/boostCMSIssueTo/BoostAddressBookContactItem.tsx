import React from 'react';

import { IonItem } from '@ionic/react';

import X from 'learn-card-base/svgs/X';
import Plus from 'learn-card-base/svgs/Plus';
import { UserProfilePicture, BoostUserTypeEnum } from 'learn-card-base';
import Checkmark from 'learn-card-base/svgs/Checkmark';

import { BoostCMSIssueTo, BoostCMSState } from '../../../boost';
import { BoostAddressBookEditMode } from './BoostAddressBook';

type BoostAddressBookContactItemProps = {
    mode: BoostAddressBookEditMode;
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    setIssueMode?: React.Dispatch<React.SetStateAction<BoostUserTypeEnum>>;
    contact: BoostCMSIssueTo;
    isSelf?: boolean;
    _issueTo: BoostCMSIssueTo[];
    _setIssueTo: React.Dispatch<React.SetStateAction<BoostCMSIssueTo[]>>;
    collectionPropName?: string;
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
}) => {
    let actionButton;
    let viewModeStyles;

    const issueToList = state?.[collectionPropName];
    const contactAlreadyExists = _issueTo?.find?.(
        _contact => _contact?.profileId === contact?.profileId
    );

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

    if (mode === BoostAddressBookEditMode.delete) {
        actionButton = (
            <button
                onClick={() => handleRemoveContact(contact)}
                className="flex items-center justify-center text-grayscale-800 rounded-full bg-white shadow-3xl w-12 h-12"
            >
                <X className="w-8 h-auto" />
            </button>
        );
        viewModeStyles = 'py-[8px]';
    } else if (mode === BoostAddressBookEditMode.edit) {
        if (contactAlreadyExists) {
            actionButton = (
                <button
                    onClick={() => _handleRemoveContactLocally(contact)}
                    className="flex items-center justify-center text-white rounded-full bg-emerald-700 shadow-3xl w-12 h-12 disabled:bg-grayscale-400"
                    disabled={contactAlreadyExists.unremovable}
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
        viewModeStyles = 'border-gray-200 border-b-2 py-[12px] last:border-b-0';
    }

    const contactItemDetails = (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center justify-start w-[80%]">
                <UserProfilePicture
                    customContainerClass="flex justify-center items-center w-12 h-12 rounded-full overflow-hidden text-white font-medium text-4xl mr-3"
                    customImageClass="flex justify-center items-center w-12 h-12 rounded-full overflow-hidden object-cover"
                    customSize={500}
                    user={contact}
                />
                <div className="flex flex-col justify-center">
                    {contact?.displayName && (
                        <p className="text-grayscale-900 font-medium">{contact?.displayName}</p>
                    )}
                    <p className="text-grayscale-500 font-[14px] font-medium">
                        {contact?.profileId}
                    </p>
                </div>
            </div>
            <div className="flex item-center justify-end w-[20%] pt-1 pr-1 pb-1">
                {actionButton}
            </div>
        </div>
    );
    return (
        <>
            <IonItem
                lines="none"
                className={`w-[95%] max-w-[600px] ion-no-border px-[4px] flex items-center justify-between notificaion-list-item ${viewModeStyles}`}
            >
                {contactItemDetails}
            </IonItem>
        </>
    );
};

export default BoostAddressBookContactItem;
