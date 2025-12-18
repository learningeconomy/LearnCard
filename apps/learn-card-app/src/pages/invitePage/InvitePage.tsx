import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router';

import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import MainHeader from '../../components/main-header/MainHeader';

import { useWallet, usePathQuery, useIsLoggedIn } from 'learn-card-base';
import { generatePK } from '../../helpers/privateKeyHelpers';

import { AddressBookContact } from '../addressBook/addressBookHelpers';
import AddContactView, { AddContactViewMode } from '../addressBook/addContactView/AddContactView';

const InvitePage: React.FC = () => {
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();
    const history = useHistory();
    const query = usePathQuery();

    const profileId = query.get('profileId');
    const challenge = query.get('challenge');

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

        if (!profileId || !challenge) {
            console.log('no handle or challenge detected');
            setLoading(false);
            return;
        }

        if (profileId) {
            try {
                const profile = await wallet?.invoke?.getProfile(profileId);
                if (profile) {
                    setLcNetworkProfile(profile);
                    console.log('handle::profile', profile);
                    setLoading(false);
                }
                return;
            } catch (err) {
                console.log('getLCNeworkProfile::err', err);
                setLoading(false);
                return;
            }
        }
    };

    useEffect(() => {
        getLCNeworkProfile();
    }, []);

    return (
        <IonPage className="bg-white">
            <MainHeader customClassName="bg-white" />
            <IonContent fullscreen>
                {loading && (
                    <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full ">
                        <IonSpinner color="black" />
                        <p className="mt-2 font-bold text-lg">Loading...</p>
                    </section>
                )}
                {!loading && !lcNetworkProfile && (
                    <section className="flex flex-col pt-[10px] px-[20px] text-center justify-center">
                        <h1 className="text-center text-xl font-bold text-grayscale-800">Eeek!</h1>
                        <strong className="text-center font-medium text-grayscale-600">
                            Unable to find user
                        </strong>
                    </section>
                )}
                {!loading && lcNetworkProfile && (
                    <AddContactView
                        user={lcNetworkProfile}
                        handleCancel={() => history.push('/')}
                        customContainerClass="mb-20"
                        mode={AddContactViewMode.acceptInvite}
                        profileId={profileId}
                        challenge={challenge}
                    />
                )}
            </IonContent>
        </IonPage>
    );
};

export default InvitePage;
