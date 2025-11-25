import React from 'react';

import { IonList } from '@ionic/react';

import BoostAddressBookContactItem from './BoostAddressBookContactItem';
import { BoostUserTypeEnum, useGetCurrentLCNUser } from 'learn-card-base';
import { BoostCMSIssueTo, BoostCMSState } from '../../../boost';
import { BoostAddressBookEditMode } from './BoostAddressBook';

type BoostAddressBookContactListProps = {
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    setIssueMode?: React.Dispatch<React.SetStateAction<BoostUserTypeEnum>>;
    contacts: BoostCMSIssueTo[];
    mode: BoostAddressBookEditMode;
    _issueTo: BoostCMSIssueTo[];
    _setIssueTo: React.Dispatch<React.SetStateAction<BoostCMSIssueTo[]>>;
    // the designated field we will be storing the selected contacts in
    // by default we store them in the issueTo collection
    // IE: issueTo
    // IE: admins
    collectionPropName?: string;
};

export const BoostAddressBookContactList: React.FC<BoostAddressBookContactListProps> = ({
    state,
    setState,
    setIssueMode,
    contacts,
    mode,
    _issueTo,
    _setIssueTo,
    collectionPropName = 'issueTo',
}) => {
    const { currentLCNUser, currentLCNUserLoading } = useGetCurrentLCNUser();

    const contactItems = contacts.map((contact, index) => {
        const isSelf = currentLCNUser?.profileId === contact?.profileId;
        return (
            <BoostAddressBookContactItem
                state={state}
                setState={setState}
                setIssueMode={setIssueMode}
                contact={contact}
                key={index}
                isSelf={isSelf}
                mode={mode}
                _issueTo={_issueTo}
                _setIssueTo={_setIssueTo}
                collectionPropName={collectionPropName}
            />
        );
    });

    return (
        <IonList lines="none" className="flex flex-col items-center justify-center w-[100%]">
            {contactItems}
        </IonList>
    );
};

export default BoostAddressBookContactList;
