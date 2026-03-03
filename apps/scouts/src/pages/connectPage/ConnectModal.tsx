import React, { useState, useEffect } from 'react';

import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import MiniGhost from 'learn-card-base/assets/images/emptystate-ghost.png';

import { useWallet, usePathQuery, useIsLoggedIn } from 'learn-card-base';
import { generatePK } from '../../helpers/privateKeyHelpers';

import { AddressBookContact } from '../addressBook/addressBookHelpers';
import AddContactView, { AddContactViewMode } from '../addressBook/addContactView/AddContactView';

const ConnectModal: React.FC<{
    profileId: string;
    handleCancel: () => void;
    updateCacheOnSuccessCallback: any;
}> = ({ profileId, handleCancel, updateCacheOnSuccessCallback }) => {
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();
    const query = usePathQuery();

    const userDid = query.get('did');

    const [lcNetworkProfile, setLcNetworkProfile] = useState<AddressBookContact | null | undefined>(
        null
    );
    const [loading, setLoading] = useState<boolean>(false);

    const getLCNeworkProfile = async () => {
        setLoading(true);

        let wallet;

        if (isLoggedIn) {
            wallet = await initWallet();
        } else {
            const dummyString = 'demo@learningeconomy.io' + 'password123';
            const pk = await generatePK(dummyString);
            wallet = await initWallet(pk);
        }

        if (!profileId && !userDid) {
            console.log('no handle or userDid detected!');
            setLoading(false);
            return;
        }

        if (profileId) {
            try {
                const profile = await wallet?.invoke?.getProfile(profileId);
                if (profile) {
                    setLcNetworkProfile(profile);
                    setLoading(false);
                }
                return;
            } catch (err) {
                console.log('getLCNeworkProfile::err', err);
                setLoading(false);
                return;
            }
        }

        if (userDid) {
            let profileId = null;

            const hasLCNetworkAcct = userDid.includes(`did:web:scoutnetwork.org`);
            if (hasLCNetworkAcct) {
                const regex = /(users:)(.*)/;
                profileId = userDid?.match(regex)?.[2];
            }

            if (profileId) {
                try {
                    const profile = await wallet?.invoke?.getProfile(profileId);
                    if (profile) {
                        setLcNetworkProfile(profile);
                        setLoading(false);
                    }
                    return;
                } catch (err) {
                    console.log('getLCNeworkProfile::err', err);
                    setLoading(false);
                    return;
                }
            }
        }
    };

    useEffect(() => {
        getLCNeworkProfile();
    }, []);

    return (
        <IonPage className="bg-white">
            <IonContent fullscreen>
                {loading && (
                    <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full ">
                        <IonSpinner color="black" />
                        <p className="mt-2 font-bold text-lg">Loading...</p>
                    </section>
                )}
                {!loading && !lcNetworkProfile && (
                    <section className="flex flex-col pt-[10px] px-[20px] text-center justify-center">
                        <img
                            src={MiniGhost}
                            alt="currencies"
                            className="relative max-w-[250px] m-auto"
                        />
                        <h1 className="text-center text-3xl font-bold text-grayscale-800">Eeek!</h1>
                        <strong className="text-center font-medium text-grayscale-600">
                            Unable to find user
                        </strong>
                    </section>
                )}
                {!loading && lcNetworkProfile && (
                    <AddContactView
                        user={lcNetworkProfile}
                        handleCancel={handleCancel}
                        mode={AddContactViewMode.acceptConnectionRequest}
                        updateCacheOnSuccessCallback={updateCacheOnSuccessCallback}
                    />
                )}
            </IonContent>
        </IonPage>
    );
};

export default ConnectModal;
