import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    init: vi.fn(),
    getResolvedTenantConfig: vi.fn(),
}));

vi.mock('userflow.js', () => ({ default: { init: mocks.init, identify: vi.fn() } }));
vi.mock('../config/tenantConfigState', () => ({
    getResolvedTenantConfig: mocks.getResolvedTenantConfig,
}));
vi.mock('../components/share-links/sharePrivacy', () => ({ isSharePrivateSession: () => false }));
vi.mock('learn-card-base', () => ({
    getLogger: () => ({ debug: vi.fn(), error: vi.fn() }),
    useWallet: vi.fn(),
}));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({ default: vi.fn() }));

import { initUserflowFromTenant } from './userflow';

describe('initUserflowFromTenant', () => {
    beforeEach(() => {
        mocks.init.mockReset();
        mocks.getResolvedTenantConfig.mockReset();
    });

    it("uses the tenant's own Userflow token", () => {
        mocks.getResolvedTenantConfig.mockReturnValue({
            observability: { userflowToken: 'ct_tenant' },
        });

        initUserflowFromTenant();

        expect(mocks.init).toHaveBeenCalledWith('ct_tenant');
    });

    it('loads no Userflow project when the tenant config is unresolved', () => {
        mocks.getResolvedTenantConfig.mockImplementation(() => {
            throw new Error('not bootstrapped');
        });

        initUserflowFromTenant();

        expect(mocks.init).not.toHaveBeenCalled();
    });
});
