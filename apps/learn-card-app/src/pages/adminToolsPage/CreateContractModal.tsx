import React, { useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { useImmer } from 'use-immer';
import { cloneDeep } from 'lodash-es';
import { curriedStateSlice } from '@learncard/helpers';
import { createPortal } from 'react-dom';

import useAutosave from '../../hooks/useAutosave';
import RecoveryPrompt from '../../components/common/RecoveryPrompt';

import { IonDatetime, IonInput, IonLabel, IonSpinner, IonTextarea, IonToggle } from '@ionic/react';
import ContractTypeTabs from './ContractTypeTabs';
import FullScreenGameFlow from '../consentFlow/GameFlow/FullScreenGameFlow';
import AdminManagedBoostRow from './AdminManagedBoostRow';
import FullScreenConsentFlow from '../consentFlow/FullScreenConsentFlow';
import BulkBoostParentSelector from './bulk-import/BulkBoostParentSelector';
import ConsentFlowCredFrontDoor from '../consentFlow/ConsentFlowCredFrontDoor';
import ContractCredentialSelectorModal from './ContractCredentialSelectorModal';
import SelectIssuerModal from './SelectIssuerModal';
import ContractCategoryMultiSelect from '../hidden/ContractCategoryMultiSelect';
import MultiTextInput from '../hidden/MultiTextInput';
import EmptyImage from 'learn-card-base/assets/images/empty-image.png';
import Calendar from '../../components/svgs/Calendar';
import Pencil from '../../components/svgs/Pencil';
import Plus from 'learn-card-base/svgs/Plus';

import {
    ModalTypes,
    UploadRes,
    useModal,
    useToast,
    useWallet,
    useFilestack,
    useSigningAuthority,
    useGetCurrentLCNUser,
    isValidISOString,
    currentUserStore,
    ToastTypeEnum,
} from 'learn-card-base';

import { ConsentFlowContract, LCNProfile } from '@learncard/types';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';

import useTheme from '../../theme/hooks/useTheme';

export enum ContractType {
    classic = 'Classic', // regular ConsentFlow modal
    gameFlow = 'GameFlow', // GameFlow (needsGuardianConsent)
    frontDoorCred = 'Front Door Cred', // display a Boost instead of the regular ConsentFlow modal
}

type CreateContractModalProps = {
    onSuccess?: (contractUri?: string) => void;
};

// based on CustomWalletCreateContract.tsx
const CreateContractModal: React.FC<CreateContractModalProps> = ({ onSuccess }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });
    const sectionPortal = document.getElementById('section-cancel-portal');

    const { currentLCNUser } = useGetCurrentLCNUser();
    const { getRegisteredSigningAuthority } = useSigningAuthority();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const [contractType, setContractType] = useState(ContractType.classic);
    const [autoBoostUris, setAutoBoostUris] = useState<string[]>([]);
    const [expiresAtError, setExpiresAtError] = useState('');

    // Autosave hook
    type ContractStateType = typeof contract;
    const {
        hasRecoveredState,
        recoveredState,
        recoveredExtra: recoveredAutoBoostUris,
        clearRecoveredState,
        saveToLocal,
        clearLocalSave,
        hasUnsavedChanges,
    } = useAutosave<ContractStateType, string[]>({
        storageKey: 'lc_contract_autosave',
        hasContent: state => !!(state?.name || state?.description),
    });

    const hasShownRecoveryRef = useRef(false);

    const [autoBoostIssuers, setAutoBoostIssuers] = useState<Record<string, LCNProfile>>({});

    useEffect(() => {
        // rebuild issuers when selected autoboosts change
        const _autoBoostIssuers: Record<string, LCNProfile> = {};

        autoBoostUris.forEach(uri => {
            // Keep existing issuer if available, otherwise default to current user
            _autoBoostIssuers[uri] = autoBoostIssuers[uri] ?? currentLCNUser;
        });

        setAutoBoostIssuers(_autoBoostIssuers);
    }, [autoBoostUris]);

    const emptyContract = {
        contract: {
            read: { anonymize: true, credentials: { categories: {} }, personal: {} },
            write: { credentials: { categories: {} }, personal: {} },
        },
        name: '',
        subtitle: '',
        description: '',
        image: '',
        expiresAt: '',
        reasonForAccessing: '',
        needsGuardianConsent: false,
        redirectUrl: '',
        frontDoorBoostUri: '',
    };

    const [contract, setContract] = useImmer<{
        contract: ConsentFlowContract;
        name: string;
        subtitle?: string;
        description?: string;
        image?: string;
        expiresAt?: string;
        reasonForAccessing?: string;
        needsGuardianConsent?: boolean;
        redirectUrl?: string;
        frontDoorBoostUri?: string;
    }>(emptyContract);

    const updateSlice = curriedStateSlice(setContract);
    const updateContract = curriedStateSlice(updateSlice('contract'));
    const updateRead = curriedStateSlice(updateContract('read'));
    const updateReadCredentials = curriedStateSlice(updateRead('credentials'));
    const updateWrite = curriedStateSlice(updateContract('write'));
    const updateWriteCredentials = curriedStateSlice(updateWrite('credentials'));

    const handleSubmit = async (e: React.FormEvent<HTMLElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!contract.name) {
            setLoading(false);
            setError('Please enter a contract name');
            return;
        }

        if (contractType === ContractType.gameFlow && !contract.redirectUrl) {
            setLoading(false);
            setError('Must specify a redirect URL for this contract type');
            return;
        }

        if (contractType === ContractType.frontDoorCred && !contract.frontDoorBoostUri) {
            setLoading(false);
            setError('Must specify a front door credential for this contract type');
            return;
        }

        try {
            const { signingAuthority: currentUserSa } = await getRegisteredSigningAuthority();
            const autoboostUrisFromCurrentUser: string[] = [];
            const autoboostUrisFromOtherUsers: string[] = [];
            autoBoostUris.forEach(uri => {
                const issuer = autoBoostIssuers[uri];
                if (issuer.did === currentLCNUser?.did) {
                    autoboostUrisFromCurrentUser.push(uri);
                } else {
                    autoboostUrisFromOtherUsers.push(uri);
                }
            });

            const autoboostsFromCurrentUser = autoboostUrisFromCurrentUser.map(uri => ({
                boostUri: uri,
                signingAuthority: { name: currentUserSa?.name, endpoint: currentUserSa?.endpoint },
            }));

            const writers = Array.from(
                new Set(Object.values(autoBoostIssuers).map(issuer => issuer.profileId))
            );

            const wallet = await initWallet();
            const contractUri = await wallet.invoke.createContract({
                ...contract,
                autoboosts: autoboostsFromCurrentUser,
                writers,
            });

            // Add autoboosts from other issuers
            const pk =
                currentUserStore.get.currentUserPK() ||
                currentUserStore?.get?.currentUser()?.privateKey;

            // Group auto-boost URIs by issuer DID for more efficient processing
            const urisByIssuerDid = autoboostUrisFromOtherUsers.reduce<Record<string, string[]>>(
                (acc, uri) => {
                    const issuer = autoBoostIssuers[uri];
                    if (!acc[issuer.did]) {
                        acc[issuer.did] = [];
                    }
                    acc[issuer.did].push(uri);
                    return acc;
                },
                {}
            );

            // Process each issuer's URIs in a single batch
            await Promise.all(
                Object.entries(urisByIssuerDid).map(async ([did, uris]) => {
                    const otherUserWallet = await getBespokeLearnCard(pk!, did);
                    const { signingAuthority: sa } = await getRegisteredSigningAuthority(
                        otherUserWallet
                    );

                    await otherUserWallet.invoke.addAutoBoostsToContract(
                        contractUri,
                        uris.map(uri => ({
                            boostUri: uri,
                            signingAuthority: { name: sa?.name, endpoint: sa?.endpoint },
                        }))
                    );
                })
            );

            onSuccess?.(contractUri);

            // Clear autosave on success
            clearLocalSave();

            presentToast(`Contract "${contract.name}" created successfully!`);
            closeModal();
        } catch (e) {
            presentToast(`Failed to create "${contract.name}": ${e.message}`, {
                type: ToastTypeEnum.Error,
            });
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const { handleFileSelect: handleImageSelect, isLoading: imageUploading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data: UploadRes) => {
            updateSlice('image', data?.url);
            // setUploadProgress(false);
        },
        // options: { onProgress: event => setUploadProgress(event.totalPercent) },
    });

    const isGameFlow = contractType === ContractType.gameFlow;
    const isFrontDoorCred = contractType === ContractType.frontDoorCred;

    useEffect(() => {
        if (contract.needsGuardianConsent && contractType !== ContractType.gameFlow) {
            updateSlice('needsGuardianConsent', false);
        } else if (!contract.needsGuardianConsent && contractType === ContractType.gameFlow) {
            updateSlice('needsGuardianConsent', true);
        }

        if (contract.frontDoorBoostUri && contractType !== ContractType.frontDoorCred) {
            updateSlice('frontDoorBoostUri', '');
        }
    }, [contractType]);

    useEffect(() => {
        if (contract.needsGuardianConsent && contractType !== ContractType.gameFlow) {
            setContractType(ContractType.gameFlow);
        } else if (!contract.needsGuardianConsent && contractType === ContractType.gameFlow) {
            setContractType(ContractType.classic);
        }
    }, [contract.needsGuardianConsent]);

    useEffect(() => {
        if (error) {
            setError('');
        }
    }, [contract]);

    // Save to localStorage whenever contract or autoBoostUris change
    useEffect(() => {
        if (contract.name || contract.description) {
            saveToLocal(contract, autoBoostUris);
        }
    }, [contract, autoBoostUris, saveToLocal]);

    // Show recovery prompt if we have recovered state
    useEffect(() => {
        if (hasRecoveredState && recoveredState && !hasShownRecoveryRef.current) {
            hasShownRecoveryRef.current = true;

            setTimeout(() => {
                const handleRecover = () => {
                    setContract(recoveredState as any);
                    setAutoBoostUris(recoveredAutoBoostUris ?? []);
                    clearRecoveredState();
                    closeModal();
                };

                const handleDiscard = () => {
                    clearRecoveredState(true); // Clear localStorage on discard
                    closeModal();
                };

                newModal(
                    <RecoveryPrompt
                        itemName={recoveredState?.name || ''}
                        itemType="contract"
                        onRecover={handleRecover}
                        onDiscard={handleDiscard}
                        discardButtonText="Create New Contract"
                    />,
                    { sectionClassName: '!max-w-[400px]' },
                    { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
                );
            }, 300);
        }
    }, [
        hasRecoveredState,
        recoveredState,
        recoveredAutoBoostUris,
        clearRecoveredState,
        newModal,
        closeModal,
        setContract,
        setAutoBoostUris,
    ]);

    const handlePreview = () => {
        if (contract.frontDoorBoostUri) {
            newModal(
                <ConsentFlowCredFrontDoor contractDetails={contract} isPreview />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        } else if (contract.needsGuardianConsent) {
            newModal(
                <FullScreenGameFlow contractDetails={contract} isPreview />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        } else {
            newModal(
                <FullScreenConsentFlow contractDetails={contract} isPreview />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        }
    };

    const isExpiresAtInThePast = moment(contract.expiresAt).isBefore(moment());
    const isInvalidExpiresAt = !!(contract.expiresAt && !isValidISOString(contract.expiresAt));

    useEffect(() => {
        const isInThePast = moment(contract.expiresAt).isBefore(moment());
        const isInvalidISO = !!(contract.expiresAt && !isValidISOString(contract.expiresAt));
        if (isInThePast) {
            setExpiresAtError('Invalid: This date is in the past');
        } else if (isInvalidISO) {
            setExpiresAtError('Invalid ISO String');
        } else {
            // reset error message
            setExpiresAtError('');
        }
    }, [contract.expiresAt]);

    const presentExpiresAtDatePicker = () => {
        newModal(
            <div className="w-full h-full transparent flex items-center justify-center">
                <IonDatetime
                    onIonChange={e => {
                        updateSlice('expiresAt', moment(e.detail.value).toISOString());
                        closeModal();
                    }}
                    value={
                        !contract.expiresAt || isInvalidExpiresAt
                            ? null
                            : moment(contract.expiresAt).format('YYYY-MM-DD')
                    }
                    onIonCancel={closeModal}
                    id="datetime"
                    presentation="date"
                    className="bg-white text-black rounded-[20px] shadow-3xl z-50"
                    showDefaultButtons
                    color={primaryColor}
                    max="2077-12-31"
                    min={moment().format('YYYY-MM-DD')}
                />
            </div>,
            { sectionClassName: '!w-fit' }
        );
    };

    const handleSelectIssuerModal = (credentialUri: string) => {
        newModal(
            <SelectIssuerModal
                currentIssuer={autoBoostIssuers[credentialUri]}
                setNewIssuer={(newIssuer: LCNProfile) => {
                    const updatedIssuers = cloneDeep(autoBoostIssuers);
                    updatedIssuers[credentialUri] = newIssuer;
                    setAutoBoostIssuers(updatedIssuers);
                }}
            />
        );
    };

    return (
        <>
            <div className="flex flex-col gap-[20px] text-grayscale-800 py-[30px] px-[20px]">
                <h1 className="text-[24px] font-notoSans w-full text-center">
                    Create ConsentFlow Contract
                </h1>

                <div className="flex flex-col gap-8 items-center justify-center">
                    <div className="flex flex-col gap-[10px] w-full">
                        <div className="bg-grayscale-100/40 relative flex items-center justify-between rounded-[40px] pb-[3px] pr-[10px] pt-[3px] max-w-[140px] mx-auto">
                            <div className="h-[70px] w-[70px] flex items-center">
                                <img
                                    src={contract.image || EmptyImage}
                                    className={`h-full w-full ${
                                        contract.image
                                            ? 'rounded-full object-cover'
                                            : 'p-[10px] object-contain'
                                    }`}
                                />
                                {imageUploading && (
                                    <div className="user-image-upload-inprogress absolute flex h-[70px] min-h-[70px] w-[70px] min-w-[70px] items-center justify-center overflow-hidden rounded-full border-2 border-solid border-white text-xl font-medium text-whiteborder-white">
                                        <IonSpinner
                                            name="crescent"
                                            color="dark"
                                            className="scale-[1.75]"
                                        />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleImageSelect}
                                type="button"
                                className="text-grayscale-900 ml-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg"
                            >
                                <Pencil className="h-[60%]" />
                            </button>
                        </div>

                        <IonInput
                            className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base ion-padding"
                            onIonInput={e => updateSlice('name', e.detail.value)}
                            value={contract.name}
                            type="text"
                            placeholder="*Contract Name"
                        />

                        <IonInput
                            className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base ion-padding"
                            onIonInput={e => updateSlice('subtitle', e.detail.value)}
                            value={contract.subtitle}
                            type="text"
                            placeholder="Subtitle"
                        />

                        <IonTextarea
                            value={contract.description}
                            onIonInput={e => updateSlice('description', e.detail.value!)}
                            placeholder="Describe your contract"
                            rows={6}
                            className="pl-3 pr-2 font-medium tracking-widest bg-grayscale-100 text-grayscale-800 rounded-[15px]"
                        />

                        <IonInput
                            className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base ion-padding"
                            onIonInput={e => updateSlice('reasonForAccessing', e.detail.value)}
                            value={contract.reasonForAccessing}
                            type="text"
                            placeholder="Reason for accessing"
                        />

                        <IonInput
                            className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base ion-padding"
                            onIonInput={e => updateSlice('redirectUrl', e.detail.value)}
                            value={contract.redirectUrl}
                            type="text"
                            placeholder={`Redirect URL${isGameFlow ? '*' : ''}`}
                            title="URL to redirect users to after they consent to the contract."
                        />

                        <IonInput
                            className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base ion-padding ${
                                expiresAtError
                                    ? 'border-red-mastercard border-[1px] border-solid'
                                    : ''
                            }`}
                            onIonInput={e => updateSlice('expiresAt', e.detail.value)}
                            value={contract.expiresAt}
                            type="text"
                            placeholder="Expires At (ISO String)"
                            title="Expiration date for the contract. After this date you will no longer be able to read data from users who have consented to this contract or write data to their wallet."
                        >
                            <button onClick={presentExpiresAtDatePicker} type="button" slot="end">
                                <Calendar className="w-[30px] text-grayscale-700" />
                            </button>
                        </IonInput>
                        {expiresAtError && (
                            <p className="text-red-mastercard text-sm">{expiresAtError}</p>
                        )}
                    </div>

                    <div className="flex flex-col gap-[20px] w-full">
                        <div className="w-full flex items-center justify-start">
                            <h1 className="text-grayscale-800">Contract Type</h1>
                        </div>

                        <ContractTypeTabs
                            contractType={contractType}
                            setContractType={setContractType}
                        />

                        {!isFrontDoorCred && (
                            <div className="flex gap-[10px] items-center">
                                <IonLabel
                                    className="font-medium text-base text-grayscale-800 font-notoSans tracking-wide"
                                    title="If this contract is (potentially) intended for minors. Triggers a flow where users are asked to get a guardian/adult when viewing the contract."
                                >
                                    Needs Guardian Consent (GameFlow)
                                </IonLabel>
                                <IonToggle
                                    mode="ios"
                                    color="emerald-700"
                                    onClick={() =>
                                        updateSlice(
                                            'needsGuardianConsent',
                                            !contract.needsGuardianConsent
                                        )
                                    }
                                    checked={contract.needsGuardianConsent}
                                    title="If this contract is (potentially) intended for minors. Triggers a flow where users are asked to get a guardian/adult when viewing the contract."
                                />
                            </div>
                        )}

                        {isFrontDoorCred && (
                            <div className="flex flex-col gap-[10px] w-full">
                                <BulkBoostParentSelector
                                    labelOverride="Front Door Credential*"
                                    parentUri={contract.frontDoorBoostUri}
                                    setParentUri={(uri: string) => {
                                        if (uri && !autoBoostUris.includes(uri)) {
                                            // add front door cred to auto-claim list
                                            //   they can remove it if they want, but most of the time will probably want the
                                            //   front door cred to be claimed upon accepting
                                            setAutoBoostUris([uri, ...autoBoostUris]);
                                        }
                                        updateSlice('frontDoorBoostUri', uri);
                                    }}
                                />
                                <span className="text-grayscale-800">
                                    (The credential that will be shown to users viewing this
                                    contract instead of the normal contract screen)
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-center w-full">
                            <button
                                type="button"
                                className="w-full text-center py-[8px] px-[10px] font-semibold bg-emerald-700 text-white rounded-[20px] text-[18px] disabled:opacity-60 disabled:bg-grayscale-100 disabled:text-gray-800 border-solid border-[1px] border-grayscale-200 transition-colors"
                                onClick={handlePreview}
                                disabled={
                                    contractType === ContractType.frontDoorCred &&
                                    !contract.frontDoorBoostUri
                                }
                            >
                                Preview Contract
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-[20px] w-full">
                        <div className="w-full flex items-center justify-start">
                            <h1 className="text-grayscale-800">Contract Settings</h1>
                        </div>

                        <div className="flex flex-col gap-[10px] w-full">
                            <div className="flex justify-between items-center">
                                <h3 className="text-[20px]">
                                    Read{' '}
                                    <span className="font-normal text-[17px] text-grayscale-800 font-notoSans">
                                        - Anonymize
                                    </span>
                                </h3>
                                <IonToggle
                                    mode="ios"
                                    color="emerald-700"
                                    onClick={() =>
                                        updateRead('anonymize', !contract.contract.read.anonymize)
                                    }
                                    checked={contract.contract.read.anonymize}
                                />
                            </div>

                            <div className="flex flex-col">
                                <h4>Credentials</h4>
                                <ContractCategoryMultiSelect
                                    values={contract.contract.read.credentials.categories}
                                    onChange={updateReadCredentials('categories') as any}
                                    setContract={setContract}
                                    mode="read"
                                />
                            </div>

                            <div className="flex flex-col mt-[10px]">
                                <h4 className="text-[17px] w-full text-left flex items-center">
                                    Custom Field&nbsp;
                                    <span className="text-grayscale-500 text-xs">
                                        (Supported: name, image, email)
                                    </span>
                                </h4>

                                <MultiTextInput
                                    values={contract.contract.read.personal}
                                    onChange={updateRead('personal') as any}
                                    buttonText="New Personal Info"
                                    style="admin-dashboard"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-[10px] w-full">
                            <h3 className="text-[20px]">Write</h3>

                            <div className="flex flex-col">
                                <h4>Credentials</h4>
                                <ContractCategoryMultiSelect
                                    values={contract.contract.write.credentials.categories}
                                    setContract={setContract}
                                    onChange={updateWriteCredentials('categories') as any}
                                    mode="write"
                                />
                            </div>

                            {/* <div className="flex flex-col mt-[10px]">
                            <h4>Custom Fields</h4>
                            <MultiTextInput
                                values={contract.contract.write.personal}
                                onChange={updateWrite('personal') as any}
                                buttonText="New Personal Info"
                                style="admin-dashboard"
                            />
                        </div> */}
                        </div>
                    </div>

                    <div className="flex flex-col gap-[20px] w-full">
                        <h2 className="text-[20px] self-start underline">Credentials</h2>
                        <span className="text-grayscale-800">
                            These credentials will be automatically added to the user's wallet upon
                            consenting to the contract. They will be deleted if the user revokes
                            consent to the contract.
                        </span>
                        <button
                            type="button"
                            className="py-[5px] px-[10px] bg-white rounded-[20px] w-fit text-[16px] shadow-box-bottom disabled:opacity-60 flex gap-[5px] items-center border-solid border-[1px] border-grayscale-200 hover:bg-grayscale-100 transition-colors"
                            onClick={() => {
                                newModal(
                                    <ContractCredentialSelectorModal
                                        selectedCredentialUris={autoBoostUris}
                                        setSelectedCredentialUris={setAutoBoostUris}
                                    />
                                );
                            }}
                        >
                            <Plus className="h-[16px] w-[16px]" /> Select Credentials
                        </button>

                        {autoBoostUris.length > 0 && (
                            <div className="flex flex-col gap-[5px]">
                                {autoBoostUris.map(credUri => (
                                    <AdminManagedBoostRow
                                        key={credUri}
                                        boostUri={credUri}
                                        className="!w-full"
                                        hideButtons
                                        issuerProfileOverride={autoBoostIssuers[credUri]}
                                    >
                                        <div className="mb-[5px] pl-[20px] flex gap-[5px] items-center">
                                            Issued by:{' '}
                                            {autoBoostIssuers[credUri]?.displayName ?? '...'}
                                            <button
                                                type="button"
                                                onClick={() => handleSelectIssuerModal(credUri)}
                                            >
                                                <Pencil />
                                            </button>
                                        </div>
                                    </AdminManagedBoostRow>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && <span className="text-red-500">{error}</span>}

                    {/* Render buttons via portal if available, otherwise render inline */}
                    {sectionPortal ? (
                        createPortal(
                            <div className="flex flex-col justify-center items-center relative !border-none max-w-[500px]">
                                <button
                                    onClick={handleSubmit}
                                    type="button"
                                    disabled={
                                        loading ||
                                        isInvalidExpiresAt ||
                                        isExpiresAtInThePast ||
                                        !contract.name
                                    }
                                    className="bg-emerald-700 text-white text-lg font-notoSans py-2 rounded-[20px] font-semibold w-full h-full disabled:opacity-70"
                                >
                                    {loading ? 'Creating...' : 'Create Contract'}
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="bg-white text-grayscale-900 text-lg font-notoSans py-2 rounded-[20px] w-full h-full shadow-bottom mt-[10px]"
                                >
                                    Back
                                </button>
                            </div>,
                            sectionPortal
                        )
                    ) : (
                        <div className="flex flex-col justify-center items-center relative !border-none w-full mt-6 px-4">
                            <button
                                onClick={handleSubmit}
                                type="button"
                                disabled={
                                    loading ||
                                    isInvalidExpiresAt ||
                                    isExpiresAtInThePast ||
                                    !contract.name
                                }
                                className="bg-emerald-700 text-white text-lg font-notoSans py-3 px-6 rounded-[20px] font-semibold w-full disabled:opacity-70"
                            >
                                {loading ? 'Creating...' : 'Create Contract'}
                            </button>
                            <button
                                onClick={closeModal}
                                className="bg-white text-grayscale-900 text-lg font-notoSans py-3 px-6 rounded-[20px] w-full shadow-bottom mt-[10px]"
                            >
                                Back
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CreateContractModal;
