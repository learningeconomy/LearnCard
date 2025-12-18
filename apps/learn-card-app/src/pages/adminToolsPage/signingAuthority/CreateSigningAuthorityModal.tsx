import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import z from 'zod';

import { IonInput } from '@ionic/react';

import { useModal, useWallet } from 'learn-card-base';

import { useTheme } from '../../../theme/hooks/useTheme';

const BaseSigningAuthoritySchema = z.object({
    name: z
        .string()
        .min(3)
        .max(15)
        .regex(
            /^[a-z0-9-]+$/,
            'Name must be 3–15 characters long and contain only lowercase letters, numbers, and hyphens.'
        ),
    did: z.string().optional(),
    endpoint: z
        .string()
        .regex(/^https?:\/\/[^\s]+$/i, 'Must be a valid URL starting with http:// or https://')
        .refine(
            url => {
                try {
                    new URL(url);
                    return true;
                } catch {
                    return false;
                }
            },
            { message: 'Must be a valid URL' }
        )
        .optional(),
});

// Extended schema that adds conditional validation for DID when endpoint is provided
const CreateSigningAuthorityModalValidator = BaseSigningAuthoritySchema.superRefine((data, ctx) => {
    if (data.endpoint && !data.did) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'DID is required when endpoint is provided',
            path: ['did'],
        });
    }
});

const CreateSigningAuthorityModal: React.FC<{ fetchSigningAuthorities: () => void }> = ({
    fetchSigningAuthorities,
}) => {
    const { initWallet } = useWallet();
    const { closeModal } = useModal();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const sectionPortal = document.getElementById('section-cancel-portal');

    const [name, setName] = useState<string | undefined>(undefined);
    const [did, setDid] = useState<string | undefined>(undefined);
    const [endpoint, setEndpoint] = useState<string | undefined>(undefined);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const [loading, setLoading] = useState<boolean>(false);

    const clearInputs = () => {
        setName(undefined);
        setEndpoint(undefined);
        setDid(undefined);
    };

    const validate = () => {
        const parsedData = CreateSigningAuthorityModalValidator.safeParse({
            name,
            did,
            endpoint,
        });

        if (parsedData.success) {
            setErrors({});
            return true;
        }

        if (parsedData.error) {
            setErrors(parsedData.error.flatten().fieldErrors);
        }

        return false;
    };

    const createSigningAuthority = async () => {
        setLoading(true);
        const wallet = await initWallet();

        if (!validate()) {
            setLoading(false);
            return;
        }

        const hasName = !!name?.trim();
        const hasEndpoint = !!endpoint?.trim();
        const hasDid = !!did?.trim();

        if (hasEndpoint && hasDid) {
            try {
                await wallet?.invoke.resolveDid(did);
            } catch (err) {
                console.error('resolveDid error:', err);
                setErrorMessage('DID is not valid.');
                setLoading(false);
                return;
            }
        }

        if (hasName && hasEndpoint && hasDid) {
            try {
                await wallet?.invoke.registerSigningAuthority(endpoint, name, did);
                clearInputs();
                fetchSigningAuthorities();
                closeModal();
                setLoading(false);
            } catch (err) {
                setLoading(false);
                console.error('Registration error:', err);
                setErrorMessage('Failed to register signing authority.');
            }
        } else if (hasName) {
            try {
                const authority = await wallet?.invoke.createSigningAuthority(name);
                await wallet?.invoke.registerSigningAuthority(
                    authority?.endpoint,
                    authority?.name,
                    authority?.did
                );
                clearInputs();
                fetchSigningAuthorities();
                setLoading(false);
                closeModal();
            } catch (err) {
                setLoading(false);
                console.error('Registration error:', err);
                setErrorMessage('Failed to register signing authority.');
            }
        }
    };

    return (
        <section className="p-[20px]">
            <h1 className="font-semibold mb-[10px] font-notoSans text-[20px] text-grayscale-900">
                Create Signing Authority
            </h1>
            {errorMessage && (
                <div className="w-full rounded-[15px] bg-red-100 px-4 py-2 mb-[10px]">
                    <p className="text-red-500 text-md">{errorMessage}</p>
                </div>
            )}
            <div className="flex flex-col w-full">
                <IonInput
                    className={`ion-padding bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base  ${
                        errors.name ? 'border-red-500 border-[1px] border-solid' : 'mb-[10px]'
                    }`}
                    type="text"
                    onIonInput={e => {
                        setName(e.detail.value);
                        setErrors({ name: undefined });
                        setErrorMessage('');
                    }}
                    value={name}
                    placeholder="Name*"
                />
                {errors.name && (
                    <div className="w-full">
                        <p className="text-red-500 text-sm mb-2 pl-1 mt-1">{errors.name[0]}</p>
                    </div>
                )}
            </div>
            <div className="flex flex-col w-full">
                <IonInput
                    className={`ion-padding bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base ${
                        errors.endpoint ? 'border-red-500 border-[1px] border-solid' : 'mb-[10px]'
                    }`}
                    type="text"
                    onIonInput={e => {
                        setEndpoint(e.detail.value);
                        setErrors({ endpoint: undefined });
                        setErrorMessage('');
                    }}
                    value={endpoint}
                    placeholder="Endpoint"
                />
                {errors.endpoint && (
                    <div className="w-full">
                        <p className="text-red-500 text-sm mb-2 pl-1 mt-1">{errors.endpoint[0]}</p>
                    </div>
                )}
            </div>
            <div className="flex flex-col w-full">
                <IonInput
                    className={`ion-padding bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base ${
                        errors.did ? 'border-red-500 border-[1px] border-solid' : 'mb-[10px]'
                    }`}
                    type="text"
                    onIonInput={e => {
                        setDid(e.detail.value);
                        setErrors({ did: undefined });
                        setErrorMessage('');
                    }}
                    value={did}
                    placeholder="DID (Endpoint required)"
                    disabled={endpoint === ''}
                />
                {errors.did && (
                    <div className="w-full">
                        <p className="text-red-500 text-sm mb-2 pl-1 mt-1">{errors.did[0]}</p>
                    </div>
                )}
            </div>
            {sectionPortal &&
                createPortal(
                    <div className="flex flex-col justify-center items-center relative !border-none max-w-[500px]">
                        <button
                            disabled={name === '' || loading}
                            onClick={() => createSigningAuthority()}
                            className={`bg-${primaryColor} text-white text-lg font-notoSans py-2 rounded-[20px] font-semibold w-full h-full disabled:opacity-50`}
                        >
                            {loading ? 'Creating...' : 'Create'}
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

export default CreateSigningAuthorityModal;
