import React, { useState, useCallback, useEffect } from 'react';
import { IonInput, IonSpinner, IonGrid, IonCol, IonRow } from '@ionic/react';
import AdminPageStructure from './AdminPageStructure';
import { useWallet, useModal, ModalTypes, useToast, ToastTypeEnum } from 'learn-card-base';
import CopyStack from '../../components/svgs/CopyStack';
import { Clipboard } from '@capacitor/clipboard';

import useTheme from '../../theme/hooks/useTheme';

const SigningAuthoritiesPage: React.FC = () => {
    const [name, setName] = useState<string>('');
    const [endpoint, setEndpoint] = useState<string>('');
    const [did, setDid] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [signingAuthorities, setSigningAuthorities] = useState();

    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { presentToast } = useToast();
    const { initWallet } = useWallet();

    const fetchSigningAuthorities = useCallback(async () => {
        const wallet = await initWallet();
        setLoading(true);
        const fetchedSigningAuthorities = await wallet.invoke.getRegisteredSigningAuthorities();
        setSigningAuthorities(fetchedSigningAuthorities);
        setLoading(false);
    }, [initWallet]);

    useEffect(() => {
        const runFetch = async () => {
            await fetchSigningAuthorities();
        };
        runFetch();
    }, []);

    const clearInputs = () => {
        setName('');
        setEndpoint('');
        setDid('');
    };

    const createSigningAuthority = async () => {
        const wallet = await initWallet();
        const urlRegex = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i;

        const hasName = !!name.trim();
        const hasEndpoint = !!endpoint.trim();
        const hasDid = !!did.trim();

        if ((hasName && !/^[a-z0-9-]+$/.test(name)) || name.length < 3 || name.length > 15) {
            setErrorMessage(
                'Name must be 3–15 characters long and contain only lowercase letters, numbers, and hyphens.'
            );
            return;
        }

        if (hasEndpoint && !hasDid) {
            setErrorMessage('DID is required when endpoint is provided.');
            return;
        }

        if (hasEndpoint && !urlRegex.test(endpoint)) {
            setErrorMessage('Endpoint is not a valid URL.');
            return;
        }

        if (hasDid) {
            try {
                await wallet?.invoke.resolveDid(did);
            } catch (err) {
                console.error('resolveDid error:', err);
                setErrorMessage('DID is not valid.');
                return;
            }
        }

        if (hasName && !hasEndpoint) {
            try {
                const authority = await wallet?.invoke.createSigningAuthority(name);
                await wallet?.invoke.registerSigningAuthority(
                    authority?.endpoint,
                    authority?.name,
                    authority?.did
                );
                clearInputs();
                fetchSigningAuthorities();
            } catch (err) {
                console.error('Registration error:', err);
                setErrorMessage('Failed to register signing authority.');
            }
        } else if (hasName && hasEndpoint && hasDid) {
            try {
                await wallet?.invoke.registerSigningAuthority(endpoint, name, did);
                clearInputs();
                fetchSigningAuthorities();
            } catch (err) {
                console.error('Registration error:', err);
                setErrorMessage('Failed to register signing authority.');
            }
        }
    };

    const copyItem = async (item: string, itemValue: string) => {
        await Clipboard.write({ string: itemValue });
        closeModal();
        presentToast(`${item} copied to clipboard`, {
            className: ToastTypeEnum.CopySuccess,
            hasDismissButton: true,
        });
    };

    return (
        <AdminPageStructure title="Signing Authorities">
            <section className="bg-white max-w-[600px] w-full ion-padding rounded-[10px] border-[1px] border-solid border-grayscale-200">
                <h1 className="font-semibold mb-[10px] font-notoSans text-[20px] text-grayscale-900">
                    Signing Authorities
                </h1>
                <div className="flex items-center justify-center m-auto">
                    <div className="h-[40px] flex items-center border border-grayscale-200 rounded-[5px] px-2 py-[22px] w-full max-w-[500px]">
                        <IonInput
                            className="text-grayscale-800 font-medium tracking-widest text-base"
                            type="text"
                            onIonInput={e => {
                                setName(e.detail.value);
                                setErrorMessage('');
                            }}
                            value={name}
                            placeholder="Name"
                            label="Name*"
                        />
                    </div>
                    <button
                        disabled={name === ''}
                        onClick={createSigningAuthority}
                        className={`bg-${primaryColor} text-white text-lg font-notoSans py-2 px-4 rounded-[5px] font-semibold w-full max-w-[100px] ml-[10px] disabled:opacity-50`}
                    >
                        Create
                    </button>
                </div>
                <IonInput
                    className="border-solid border-[1px] border-grayscale-200 text-grayscale-800 rounded-[5px] !px-2 font-medium tracking-widest text-base mt-[10px]"
                    type="text"
                    onIonInput={e => {
                        setEndpoint(e.detail.value);
                        setErrorMessage('');
                    }}
                    value={endpoint}
                    placeholder="Endpoint"
                    label="Endpoint"
                />
                {endpoint?.trim() && (
                    <IonInput
                        className="border-solid border-[1px] border-grayscale-200 text-grayscale-800 rounded-[5px] !px-2 font-medium tracking-widest text-base mt-[10px]"
                        type="text"
                        onIonInput={e => {
                            setDid(e.detail.value);
                            setErrorMessage('');
                        }}
                        value={did}
                        placeholder="DID"
                        label="DID"
                    />
                )}
                {errorMessage && <p className="text-red-500 text-md mt-2">{errorMessage}</p>}
                {signingAuthorities?.length >= 1 && (
                    <div className="mt-[10px] border-b-[1px] border-solid border-grayscale-200" />
                )}
                {loading && (
                    <div className="max-w-[500px] w-full h-[200px] flex flex-col gap-[5px] items-center justify-center">
                        <IonSpinner color="dark" />
                        <span>Loading...</span>
                    </div>
                )}
                {!loading && signingAuthorities?.length >= 1 && (
                    <IonGrid className="flex flex-col w-full overflow-x-auto">
                        <IonRow>
                            <IonCol className="px-4">Name</IonCol>
                            <IonCol className="px-4">Endpoint</IonCol>
                            <IonCol className="px-4">DID</IonCol>
                        </IonRow>
                        {signingAuthorities?.map((authority, id) => (
                            <IonRow className="border-b" key={id}>
                                <IonCol className="px-4 w-[280px] truncate">
                                    {authority.relationship.name}
                                </IonCol>
                                <IonCol className="px-4 w-[280px] truncate">
                                    {authority.signingAuthority.endpoint}
                                </IonCol>
                                <IonCol className="px-4  w-[280px] truncate">
                                    {authority.relationship.did}
                                </IonCol>
                                <div className="flex items-center justify-center">
                                    <CopyStack
                                        onClick={() => {
                                            newModal(
                                                <ul className="w-full flex flex-col items-center justify-center ion-padding text-grayscale-900">
                                                    <li className="w-full border-b-grayscale-100 border-b-solid border-b-[2px] last:border-0">
                                                        <button
                                                            onClick={() =>
                                                                copyItem(
                                                                    'Name',
                                                                    authority.relationship.name
                                                                )
                                                            }
                                                            className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2"
                                                        >
                                                            Copy Name
                                                        </button>
                                                    </li>
                                                    <li className="w-full border-b-grayscale-100 border-b-solid border-b-[2px] last:border-0">
                                                        <button
                                                            onClick={() =>
                                                                copyItem(
                                                                    'Endpoint',
                                                                    authority.signingAuthority
                                                                        .endpoint
                                                                )
                                                            }
                                                            className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2"
                                                        >
                                                            Copy Endpoint
                                                        </button>
                                                    </li>
                                                    <li className="w-full border-b-grayscale-100 border-b-solid border-b-[2px] last:border-0">
                                                        <button
                                                            onClick={() =>
                                                                copyItem(
                                                                    'DID',
                                                                    authority.relationship.did
                                                                )
                                                            }
                                                            className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2"
                                                        >
                                                            Copy DID
                                                        </button>
                                                    </li>
                                                </ul>,
                                                { sectionClassName: '!max-w-[400px]' }
                                            );
                                        }}
                                        className="w-[20px] h-[20px] text-grayscale-900 cursor-pointer"
                                    />
                                </div>
                            </IonRow>
                        ))}
                    </IonGrid>
                )}
            </section>
        </AdminPageStructure>
    );
};

export default SigningAuthoritiesPage;
