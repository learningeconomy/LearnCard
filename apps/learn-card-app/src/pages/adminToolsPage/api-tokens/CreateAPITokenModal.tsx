import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import moment from 'moment';
import { getLogger } from 'learn-card-base';
const log = getLogger('create-api-token-modal');

import { AppItem, AppLabel, AppList } from '../../../components/list';
import { AppInput } from '../../../components/controls/AppInput';
import { AppTextarea } from '../../../components/controls/AppTextarea';
import { AppButton } from '../../../components/controls/AppButton';
import { AppButtons } from '../../../components/controls/AppButtons';
import AppDatetime, { type AppDatetimeHandle } from '../../../components/datetime/AppDatetime';
import Calendar from '../../../components/svgs/Calendar';

import {
    ModalTypes,
    useModal,
    useSigningAuthority,
    useWallet,
    useConfirmation,
} from 'learn-card-base';

import { AuthGrant } from './AdminToolsApiTokensOption';
import { SigningAuthority } from '../signingAuthority/AdminToolsSigningAuthorityOption';

import { useTheme } from '../../../theme/hooks/useTheme';

const CreateAPITokenModal: React.FC<{
    onUpdate: () => void;
    authGrants?: Partial<AuthGrant>[];
    signingAuthorities?: SigningAuthority[];
}> = ({ onUpdate, authGrants, signingAuthorities }) => {
    const confirmModal = useConfirmation();
    const { getRegisteredSigningAuthority } = useSigningAuthority();

    const [name, setName] = useState<string>('');
    const [expirationDate, setExpirationDate] = useState<Date | null>(null);
    const [description, setDescription] = useState<string>('');
    const [scopeDisplayValue, setScopeDisplayValue] = useState<string>('');
    const [scopeTechnicalValue, setScopeTechnicalValue] = useState<string>('');
    const [customScopeValue, setCustomScopeValue] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { newModal, closeModal } = useModal({ desktop: ModalTypes.Cancel });
    const sectionPortal = document.getElementById('section-cancel-portal');
    const { initWallet } = useWallet();
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const scopeOptions = [
        { displayName: 'Full Access', technicalName: '*:*' },
        { displayName: 'Read Only', technicalName: '*:read' },
        { displayName: 'No Access', technicalName: '' },
        { displayName: 'Profile Management', technicalName: 'profile:* profileManager:*' },
        {
            displayName: 'Credential Management',
            technicalName: 'credential:* presentation:* boosts:*',
        },
        { displayName: 'Contracts', technicalName: 'contracts:*' },
        { displayName: 'DID Metadata', technicalName: 'didMetadata:*' },
        { displayName: 'AuthGrants', technicalName: 'authGrants:*' },
        { displayName: 'Custom', technicalName: '' },
    ];

    const datetime = useRef<AppDatetimeHandle>(null);
    const reset = () => {
        datetime.current?.reset();
    };
    const confirm = () => {
        datetime.current?.confirm();
    };
    const handleShowDatePicker = () => {
        newModal(
            <AppDatetime
                mode="ios"
                ref={datetime}
                onIonChange={e => {
                    if (e.detail.value === undefined) {
                        setExpirationDate(null);
                    } else {
                        setExpirationDate(moment(e.detail.value).toISOString());
                    }
                }}
                value={expirationDate ? moment(expirationDate).format('YYYY-MM-DD') : null}
                id="datetime"
                presentation="date"
                className="bg-white text-black rounded-[20px] shadow-3xl z-50"
                color={primaryColor}
                max="2050-12-31"
                min={moment().format('YYYY-MM-DD')}
                buttons={
                    <AppButtons slot="buttons" mode="ios">
                        <AppButton color="primary" mode="ios" onClick={reset}>
                            Clear
                        </AppButton>
                        <AppButton
                            color="primary"
                            mode="ios"
                            onClick={() => {
                                confirm();
                                closeModal();
                            }}
                        >
                            Done
                        </AppButton>
                    </AppButtons>
                }
            />,
            {
                sectionClassName: 'max-w-[300px]!',
                hideButton: true,
            }
        );
    };

    const isCustomScopeValid = (scope: string) => {
        const allowedResources = [
            'boosts',
            'claimHook',
            'profile',
            'profileManager',
            'credential',
            'presentation',
            'storage',
            'utilities',
            'contracts',
            'didMetadata',
            'authGrants',
            'inbox',
            '*',
        ];
        const allowedActions = ['read', 'write', 'delete', '*'];
        const [resource, action] = scope.split(':');
        return allowedResources.includes(resource) && allowedActions.includes(action);
    };

    const createAuthGrant = async () => {
        const wallet = await initWallet();

        try {
            if (scopeDisplayValue === 'Custom' && !isCustomScopeValid(customScopeValue)) {
                setErrorMessage(
                    'Invalid custom scope format. Use format: resource:action (e.g., profile:read)'
                );
                return;
            }
            setIsLoading(true);

            const payload: {
                name: string;
                description: string;
                scope: string;
                expiresAt?: string;
            } = {
                name,
                description,
                scope: scopeDisplayValue === 'Custom' ? customScopeValue : scopeTechnicalValue,
            };
            if (expirationDate && !isNaN(Date.parse(expirationDate))) {
                payload.expiresAt = expirationDate;
            }
            await wallet?.invoke.addAuthGrant(payload);

            if (signingAuthorities?.length === 0 && authGrants?.length === 0) {
                const shouldCreateSigningAuthority = await confirmModal({
                    title: '',
                    text: 'No signing authority found. Do you want to create one?',
                    confirmText: 'Create',
                    cancelText: 'No',
                });

                if (shouldCreateSigningAuthority) {
                    try {
                        await getRegisteredSigningAuthority(wallet);
                    } catch (err) {
                        log.error('Failed to add signing authority:', err);
                    }
                }
            }

            onUpdate();

            setTimeout(() => {
                closeModal();
            }, 500);
        } catch (err) {
            log.error('Failed to create API Token:', err);
            setErrorMessage('Something went wrong creating the API Token.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="p-[20px]">
            <h1 className="font-semibold mb-[10px] font-notoSans text-[20px] text-grayscale-900">
                Create API Token
            </h1>
            <AppInput
                className="ion-padding bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base mb-[10px]"
                type="text"
                onValueInput={value => setName(value)}
                value={name}
                placeholder="Name*"
            />
            <AppTextarea
                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base pl-4 pt-2"
                style={{ '--min-width': '385px', '--max-width': '385px' }}
                rows={3}
                onValueInput={value => setDescription(value)}
                value={description}
                placeholder="Description"
            />
            <div
                className="flex items-start justify-start flex-col bg-white text-grayscale-800 border border-grayscale-100 rounded-[15px] ion-padding font-medium tracking-widest text-base mt-[10px] cursor-pointer mb-[10px]"
                onClick={() =>
                    newModal(
                        <AppList>
                            {scopeOptions.map(option => (
                                <AppItem
                                    button
                                    style={{ '--border-color': 'transparent' }}
                                    className="border-b-grayscale-100! !border-b-solid border-b! last:border-0! p-1"
                                    key={option.displayName}
                                    onClick={() => {
                                        setScopeDisplayValue(option.displayName);
                                        setScopeTechnicalValue(option.technicalName);
                                        closeModal();
                                    }}
                                >
                                    {option.displayName}
                                </AppItem>
                            ))}
                        </AppList>,
                        { sectionClassName: 'max-w-[400px]!' }
                    )
                }
            >
                <AppLabel className="w-full">
                    Scope*: {scopeDisplayValue || 'None selected'}
                </AppLabel>
                {scopeDisplayValue !== '' && scopeDisplayValue !== 'Custom' && (
                    <AppLabel className="w-full">{scopeTechnicalValue}</AppLabel>
                )}
            </div>
            {scopeDisplayValue !== '' && scopeDisplayValue === 'Custom' && (
                <AppInput
                    className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base mb-[10px]"
                    type="text"
                    value={customScopeValue}
                    onValueInput={value => {
                        setCustomScopeValue(value);
                    }}
                    placeholder="Custom Scope"
                />
            )}
            <button
                className="w-full flex items-center justify-between bg-grayscale-100 text-grayscale-500 rounded-[15px] p-4 font-medium tracking-widest text-base mt-[10px]"
                onClick={handleShowDatePicker}
            >
                {expirationDate
                    ? moment(expirationDate).format('MMMM Do, YYYY')
                    : 'Expiration Date'}
                <Calendar className="w-[30px] text-grayscale-700" />
            </button>
            {errorMessage && <p className="text-red-500 text-md mt-2">{errorMessage}</p>}
            {sectionPortal &&
                createPortal(
                    <div className="flex flex-col justify-center items-center relative border-none! max-w-[500px]">
                        <button
                            disabled={
                                name === '' ||
                                scopeDisplayValue === '' ||
                                (scopeDisplayValue === 'Custom' && customScopeValue === '')
                            }
                            onClick={createAuthGrant}
                            className={`bg-${primaryColor} text-white text-lg font-notoSans py-2 rounded-[20px] font-semibold w-full h-full disabled:opacity-50`}
                        >
                            {isLoading ? 'Creating...' : 'Create'}
                        </button>
                        <button
                            onClick={closeModal}
                            className="bg-white text-grayscale-900 text-lg font-notoSans py-2 rounded-[20px] w-full h-full shadow-bottom mt-[10px]"
                        >
                            Back
                        </button>
                    </div>,
                    sectionPortal
                )}
        </section>
    );
};
export default CreateAPITokenModal;
