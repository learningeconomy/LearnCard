import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import z from 'zod';

import { IonInput } from '@ionic/react';

import { useModal, useWallet } from 'learn-card-base';

import { useTheme } from '../../../theme/hooks/useTheme';

const CreateSigningAuthorityModalValidator = z.object({
    name: z
        .string()
        .min(3)
        .max(15)
        .regex(
            /^[a-z0-9-]+$/,
            'Name must be 3–15 characters long and contain only lowercase letters, numbers, and hyphens.'
        ),
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
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState<boolean>(false);

    const validate = () => {
        const parsedData = CreateSigningAuthorityModalValidator.safeParse({ name });

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

        try {
            const authority = await wallet?.invoke.createSigningAuthority(name!);
            await wallet?.invoke.registerSigningAuthority(
                authority?.endpoint,
                authority?.name,
                authority?.did
            );
            fetchSigningAuthorities();
            closeModal();
        } catch (err) {
            console.error('Registration error:', err);
            setErrorMessage('Failed to create signing authority.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="p-[20px]">
            <h1 className="font-semibold mb-[4px] font-notoSans text-[20px] text-grayscale-900">
                Create Signing Authority
            </h1>
            <p className="text-sm text-grayscale-500 mb-[16px]">
                A signing authority cryptographically signs your credentials so recipients can verify they came from you.
            </p>
            {errorMessage && (
                <div className="w-full rounded-[15px] bg-red-100 px-4 py-2 mb-[10px]">
                    <p className="text-red-500 text-md">{errorMessage}</p>
                </div>
            )}
            <div className="flex flex-col w-full">
                <IonInput
                    className={`ion-padding bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base ${
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
            {sectionPortal &&
                createPortal(
                    <div className="flex flex-col justify-center items-center relative !border-none max-w-[500px]">
                        <button
                            disabled={!name || loading}
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
