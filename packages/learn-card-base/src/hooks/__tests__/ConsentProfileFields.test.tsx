// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';
import { requestProfileFields } from '@learncard/types';
import { TenantConfigProvider } from '../../config/TenantConfigProvider';
import type { TenantConfig } from '../../config/tenantConfig';
import { ConsentProfileFields } from '../ConsentProfileFields';

const storage = vi.hoisted(() => ({ getVerifiableData: vi.fn(), saveVerifiableData: vi.fn() }));
vi.mock('../useVerifiableData', () => storage);
afterEach(() => {
    cleanup();
    vi.resetAllMocks();
});
const schemas = {
    profile: {
        label: 'Test',
        fields: {
            branch: { label: 'Branch', type: 'select', values: ['North', 'South'], maxAgeDays: 1 },
            birthDate: { label: 'Birthday', type: 'date' },
            gender: {
                label: 'Gender',
                type: 'select',
                values: ['Male', 'Female'],
                allowCustomValue: true,
            },
        },
    },
} as const;
const branch = 'VerifiableData:demo:profile:branch';
const gender = 'VerifiableData:demo:profile:gender';
const renderFields = (
    categories = requestProfileFields('demo', 'profile', schemas, ['branch'], true),
    tenantId = 'demo'
) => {
    const onConfirm = vi.fn();
    render(
        <TenantConfigProvider
            config={{ tenantId, verifiableDataSchemas: schemas } as unknown as TenantConfig}
        >
            <ConsentProfileFields
                contract={
                    {
                        contract: { read: { credentials: { categories } } },
                    } as ConsentFlowContractDetails
                }
                review={{
                    wallet: {} as never,
                    terms: { read: { credentials: { categories: {} } } } as ConsentFlowTerms,
                }}
                onConfirm={onConfirm}
                onCancel={vi.fn()}
            />
        </TenantConfigProvider>
    );
    return onConfirm;
};
it('saves only the requested field and submits only its selected URI', async () => {
    storage.getVerifiableData.mockResolvedValue({});
    storage.saveVerifiableData.mockResolvedValue('urn:local:branch');
    const confirm = renderFields();
    const input = await screen.findByLabelText('Branch', { exact: true });
    expect(screen.queryByLabelText('Birthday')).toBeNull();
    fireEvent.change(input, { target: { value: 'North' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Sharing' }));
    await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
    expect(storage.saveVerifiableData).toHaveBeenCalledWith(
        {},
        branch,
        { branch: 'North' },
        { category: branch, name: 'Branch' }
    );
    expect(confirm.mock.calls[0][0].read.credentials.categories).toEqual({
        [branch]: { sharing: true, shareAll: false, shared: ['urn:local:branch'] },
    });
});
it('requires a new answer once its configured age has elapsed', async () => {
    storage.getVerifiableData.mockResolvedValue({
        uri: 'urn:old',
        data: { branch: 'North' },
        issuanceDate: '2020-01-01T00:00:00Z',
    });
    renderFields();
    expect(
        ((await screen.findByLabelText('Branch', { exact: true })) as HTMLSelectElement).value
    ).toBe('');
});
it('offers preset genders and stores the text entered through Self-describe', async () => {
    storage.getVerifiableData.mockResolvedValue({});
    storage.saveVerifiableData.mockResolvedValue('urn:local:gender');
    const confirm = renderFields(
        requestProfileFields('demo', 'profile', schemas, ['gender'], true)
    );
    const select = await screen.findByRole('combobox', { name: 'Gender', exact: true });
    expect(screen.getByRole('option', { name: 'Male' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Female' })).toBeTruthy();

    fireEvent.change(select, { target: { value: 'custom' } });
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Gender — Self-describe' });
    expect(input.required).toBe(true);
    fireEvent.change(input, { target: { value: 'Nonbinary' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Sharing' }));

    await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
    expect(storage.saveVerifiableData).toHaveBeenCalledWith(
        {},
        gender,
        { gender: 'Nonbinary' },
        { category: gender, name: 'Gender' }
    );
});

it('prefills an earlier free-text gender answer and reuses its credential', async () => {
    storage.getVerifiableData.mockResolvedValue({
        data: { gender: 'Nonbinary' },
        uri: 'urn:old',
    });
    const confirm = renderFields(
        requestProfileFields('demo', 'profile', schemas, ['gender'], true)
    );
    const input = await screen.findByRole<HTMLInputElement>('textbox', {
        name: 'Gender — Self-describe',
    });
    expect(input.value).toBe('Nonbinary');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Sharing' }));
    await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
    expect(storage.saveVerifiableData).not.toHaveBeenCalled();
    expect(confirm.mock.calls[0][0].read.credentials.categories[gender].shared).toEqual([
        'urn:old',
    ]);
});
it('declining an optional field publishes no credential', async () => {
    storage.getVerifiableData.mockResolvedValue({
        data: { branch: 'South' },
        uri: 'urn:old',
        issuanceDate: new Date().toISOString(),
    });
    const confirm = renderFields(requestProfileFields('demo', 'profile', schemas, ['branch']));
    await screen.findByLabelText('Branch — Permission');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Sharing' }));
    await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
    expect(storage.saveVerifiableData).not.toHaveBeenCalled();
    expect(confirm.mock.calls[0][0].read.credentials.categories[branch]).toEqual({
        sharing: false,
        shareAll: false,
        shared: [],
    });
});
it('blocks a required field owned by another tenant before reading storage', async () => {
    renderFields(undefined, 'other');
    await screen.findByText('Field unavailable');
    expect(
        (screen.getByRole('button', { name: 'Confirm Sharing' }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect(storage.getVerifiableData).not.toHaveBeenCalled();
});

it('projects a saved multi-field answer into a new single-field credential', async () => {
    storage.getVerifiableData.mockResolvedValue({
        data: { branch: 'North', birthDate: '2000-01-01' },
        uri: 'urn:combined',
        issuanceDate: new Date().toISOString(),
    });
    storage.saveVerifiableData.mockResolvedValue('urn:branch');
    const confirm = renderFields();
    await screen.findByLabelText('Branch', { exact: true });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Sharing' }));
    await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
    expect(storage.saveVerifiableData.mock.calls[0][2]).toEqual({ branch: 'North' });
    expect(confirm.mock.calls[0][0].read.credentials.categories[branch].shared).toEqual([
        'urn:branch',
    ]);
});

it('keeps answers out of both new and updated index records', async () => {
    const { saveVerifiableData } =
        await vi.importActual<typeof import('../useVerifiableData')>('../useVerifiableData');
    const add = vi.fn();
    const update = vi.fn();
    const wallet = {
        id: { did: () => 'did:example:learner' },
        invoke: { issueCredential: vi.fn(async value => value) },
        store: { LearnCloud: { uploadEncrypted: vi.fn(async () => 'urn:encrypted') } },
        index: {
            LearnCloud: {
                add,
                update,
                get: vi
                    .fn()
                    .mockResolvedValueOnce([])
                    .mockResolvedValueOnce([{ uri: 'urn:encrypted' }]),
            },
        },
    };
    await saveVerifiableData(wallet as never, branch, { branch: 'North' }, { category: branch });
    await saveVerifiableData(wallet as never, branch, { branch: 'South' }, { category: branch });
    expect(add.mock.calls[0][0]).not.toHaveProperty('verifiableData');
    expect(update.mock.calls[0][1]).not.toHaveProperty('verifiableData');
});
