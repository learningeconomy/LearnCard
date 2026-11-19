import { describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import { loadOrgSpec } from './load';
import { loadReferralInputs } from './referral-inputs';
import { referralContract, applyReferralContract, type ReferralCard } from './referral-contract';
import { type ReferralProgram, OrgSpecValidator } from './schema';
import type { OrgChange } from './apply';

const program: ReferralProgram = {
    name: 'Partner referral',
    partner: 'partner',
    referrers: ['recipient'],
    outcomes: { issuer: 'writer', category: 'Work History' },
    asks: { personal: ['email'] },
};
const contract = referralContract(program, {});
const uri = 'lc:network:localhost%3A4000/trpc:contract:example';
const mockOwner = () => {
    const methods = {
        getContracts: vi
            .fn()
            .mockResolvedValue({ records: [{ name: program.name, uri }], hasMore: false }),
        getContract: vi.fn().mockResolvedValue({
            owner: { profileId: 'partner' },
            referralProgram: program.name,
            name: program.name,
            contract,
            version: 2,
        }),
        reconcileReferralAudience: vi
            .fn()
            .mockResolvedValue({ writers: ['writer'], changed: false, frozen: false }),
        updateContract: vi.fn().mockResolvedValue({ kind: 'requires_consent', affectedUsers: 3 }),
        createContract: vi.fn().mockResolvedValue(uri),
    };
    return {
        methods,
        apply: (p = program, dry = false, allow = false, changes: OrgChange[] = []) =>
            applyReferralContract(
                methods as unknown as ReferralCard,
                p,
                referralContract(p, {}),
                dry,
                allow,
                changes
            ),
    };
};
describe('referral setup', () => {
    it('expands the HHUSA example from the actual tenant field catalog before connecting', async () => {
        const spec = await loadOrgSpec(
            path.resolve(__dirname, '../../examples/hhusa-referrals.yaml')
        );
        const source = path.resolve(
            __dirname,
            '../../../../apps/learn-card-app/environments/vetpass/config.staging.json'
        );
        const env = { HHUSA_REFERRAL_WEBHOOK_URL: 'https://example.org/events' };
        const { contracts } = await loadReferralInputs(spec, [`vetpass=${source}`], env);
        const categories = contracts.get(spec.referralPrograms![0]!.name)!.read.credentials
            .categories;
        expect(Object.keys(categories).sort()).toEqual(
            [
                'Work History',
                ...['birthDate', 'branch', 'disabilityStatus', 'gender'].map(
                    field => 'VerifiableData:vetpass:military-profile:' + field
                ),
            ].sort()
        );
        expect(
            OrgSpecValidator.safeParse({
                ...spec,
                referralPrograms: [
                    { ...program, outcomes: { issuer: 'writer', category: 'WorkHistory' } },
                ],
            }).success
        ).toBe(false);
        await expect(loadReferralInputs(spec, [], env)).rejects.toThrow(/tenant-config/);
        await expect(loadReferralInputs(spec, [`vetpass=${source}`], {})).rejects.toThrow(
            /HHUSA_REFERRAL_WEBHOOK_URL/
        );
    });
    it('creates writers and recipients together, and previews creation without writes', async () => {
        const { methods, apply } = mockOwner();
        methods.getContracts.mockResolvedValue({ records: [], hasMore: false });
        await apply(program, true);
        expect(methods.createContract).not.toHaveBeenCalled();
        await apply();
        expect(methods.createContract).toHaveBeenCalledWith(
            expect.objectContaining({ writers: ['writer'], recipients: ['recipient'], contract })
        );
    });
    it('leaves an identical contract at its current version', async () => {
        const { methods, apply } = mockOwner();
        await apply();
        expect(methods.updateContract).not.toHaveBeenCalled();
        expect(methods.reconcileReferralAudience).toHaveBeenCalledExactlyOnceWith({
            contractUri: uri,
            recipients: ['recipient'],
            dryRun: true,
        });
    });
    it('blocks recipient drift after consent even when re-consent is enabled', async () => {
        const { methods, apply } = mockOwner();
        methods.reconcileReferralAudience.mockResolvedValue({
            writers: [],
            changed: true,
            frozen: true,
        });
        await expect(apply(program, false, true)).rejects.toThrow(/new contract/);
        expect(methods.updateContract).not.toHaveBeenCalled();
    });
    it('requires explicit permission for a server-classified expansion and pins publication to the previewed version', async () => {
        const { methods, apply } = mockOwner();
        const expanded = { ...program, outcomes: { ...program.outcomes, required: true } };
        await expect(apply(expanded)).rejects.toThrow(/allow-reconsent/);
        expect(methods.updateContract).toHaveBeenCalledTimes(1);
        expect(methods.updateContract.mock.calls[0]?.[2]).toMatchObject({
            dryRun: true,
            expectedVersion: 2,
        });
        await apply(expanded, false, true);
        expect(methods.updateContract.mock.calls.at(-1)?.[2]).toMatchObject({ expectedVersion: 2 });
        expect(methods.updateContract.mock.calls.at(-1)?.[2].dryRun).toBeUndefined();
    });
});
