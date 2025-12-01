import React, { useState } from 'react';
import { useImmer } from 'use-immer';
import { ConsentFlowContract } from '@learncard/types';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { curriedStateSlice } from '@learncard/helpers';
import MultiTextInput from './MultiTextInput';
import ContractCategoryMultiSelect from './ContractCategoryMultiSelect';

type CustomWalletCreateContractProps = {
    wallet: BespokeLearnCard;
};

const CustomWalletCreateContract: React.FC<CustomWalletCreateContractProps> = ({ wallet }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
    };

    const [contract, setContract] = useImmer<{
        contract: ConsentFlowContract;
        name: string;
        subtitle?: string;
        description?: string;
        image?: string;
        expiresAt?: string;
    }>(emptyContract);

    const updateSlice = curriedStateSlice(setContract);
    const updateContract = curriedStateSlice(updateSlice('contract'));
    const updateRead = curriedStateSlice(updateContract('read'));
    const updateReadCredentials = curriedStateSlice(updateRead('credentials'));
    const updateWrite = curriedStateSlice(updateContract('write'));
    const updateWriteCredentials = curriedStateSlice(updateWrite('credentials'));

    return (
        <form
            className="p-16 flex border flex-col gap-8 items-center justify-center"
            onSubmit={async e => {
                e.preventDefault();
                setLoading(true);
                setError('');

                try {
                    await wallet.invoke.createContract(contract);
                    setContract(emptyContract);
                } catch (e) {
                    setError(e.message);
                } finally {
                    setLoading(false);
                }
            }}
        >
            <fieldset className="border p-4 w-full flex flex-col gap-4">
                <legend>Info</legend>
                <label className="flex gap-2 w-full">
                    Name
                    <input
                        value={contract.name}
                        onChange={e => updateSlice('name', e.target.value)}
                        required
                        className="bg-white border flex-grow"
                        type="text"
                    />
                </label>

                <label className="flex gap-2 w-full">
                    Subtitle
                    <input
                        value={contract.subtitle}
                        onChange={e => updateSlice('subtitle', e.target.value)}
                        className="bg-white border flex-grow"
                        type="text"
                    />
                </label>

                <label className="flex gap-2 w-full">
                    Description
                    <textarea
                        value={contract.description}
                        onChange={e => updateSlice('description', e.target.value)}
                        className="bg-white border flex-grow"
                    />
                </label>

                <label className="flex gap-2 w-full">
                    Image
                    <input
                        value={contract.image}
                        onChange={e => updateSlice('image', e.target.value)}
                        className="bg-white border flex-grow"
                        type="text"
                    />
                </label>

                <label className="flex gap-2 w-full">
                    expiresAt (Please be careful to format as ISO String)
                    <input
                        value={contract.expiresAt}
                        onChange={e => updateSlice('expiresAt', e.target.value)}
                        className="bg-white border flex-grow"
                        type="text"
                    />
                </label>
            </fieldset>

            <fieldset className="border p-4 w-full flex gap-4">
                <legend>Contract</legend>

                <fieldset className="border p-4 w-full flex flex-col gap-4">
                    <legend>Read</legend>

                    <label className="flex gap-2 w-full">
                        Anonymize
                        <input
                            checked={contract.contract.read.anonymize}
                            onChange={e => updateRead('anonymize', e.target.checked)}
                            className="bg-white border"
                            type="checkbox"
                        />
                    </label>

                    <fieldset className="border p-4 w-full flex flex-col gap-4">
                        <legend>Credentials</legend>

                        <ContractCategoryMultiSelect
                            values={contract.contract.read.credentials.categories}
                            onChange={updateReadCredentials('categories') as any}
                        />
                    </fieldset>

                    <fieldset className="border p-4 w-full flex flex-col gap-4">
                        <legend>Personal</legend>

                        <MultiTextInput
                            values={contract.contract.read.personal}
                            onChange={updateRead('personal') as any}
                            buttonText="New Personal Info"
                        />
                    </fieldset>
                </fieldset>

                <fieldset className="border p-4 w-full flex flex-col gap-4">
                    <legend>Write</legend>

                    <fieldset className="border p-4 w-full flex flex-col gap-4">
                        <legend>Credentials</legend>

                        <ContractCategoryMultiSelect
                            values={contract.contract.write.credentials.categories}
                            onChange={updateWriteCredentials('categories') as any}
                        />
                    </fieldset>

                    <fieldset className="border p-4 w-full flex flex-col gap-4">
                        <legend>Personal</legend>

                        <MultiTextInput
                            values={contract.contract.write.personal}
                            onChange={updateWrite('personal') as any}
                            buttonText="New Personal Info"
                        />
                    </fieldset>
                </fieldset>
            </fieldset>

            <button
                type="submit"
                className="transition-colors h-full w-full rounded border border-solid py-2 border-emerald-600 hover:text-white hover:bg-emerald-600 disabled:opacity-60"
                disabled={loading}
            >
                {loading ? 'Creating...' : 'Create'}
            </button>
            {error && <span className="text-red-500">{error}</span>}
        </form>
    );
};

export default CustomWalletCreateContract;
