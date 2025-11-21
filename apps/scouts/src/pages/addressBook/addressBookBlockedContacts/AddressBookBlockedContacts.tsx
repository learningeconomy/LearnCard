import React, { useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { IonSpinner } from '@ionic/react';

import AddressBookContactList from '../addressBook-contact-list/AddressBookContactList';
import MiniGhost from 'learn-card-base/assets/images/emptystate-ghost.png';

import { useGetBlockedProfiles } from 'learn-card-base';
import { AddressBookTabsEnum } from '../addressBookHelpers';
import ReaperGhost from '../../../assets/lotties/reaperghost.json';
import Lottie from 'react-lottie-player';

const AddressBookBlockedContacts: React.FC<{
    activeTab: AddressBookTabsEnum;
    setBlockedCount: React.Dispatch<React.SetStateAction<number>>;
}> = ({ setBlockedCount, activeTab }) => {
    const { url } = useRouteMatch();

    const { data, isLoading, error } = useGetBlockedProfiles();

    return (
        <>
            {isLoading && (
                <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full pt-[100px]">
                    <IonSpinner color="black" />
                    <p className="mt-2 font-bold text-lg">Loading...</p>
                </section>
            )}
            {!isLoading && (
                <AddressBookContactList
                    showBoostButton={false}
                    showUnblockButton
                    setConnectionCount={setBlockedCount}
                    contacts={data}
                />
            )}
            {!isLoading && (data?.length === 0 || error) && (
                <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                    <strong>No blocked users yet.</strong>
                    <div className="w-[280px] h-[280px] mt-[-30px]">
                        <Lottie
                            loop
                            animationData={ReaperGhost}
                            play
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </section>
            )}
        </>
    );
};

export default AddressBookBlockedContacts;
