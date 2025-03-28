import { getClaimableBoostsPlugin } from '../';

describe('Claimable Boosts Plugin', () => {
    it('exposes a function', () => {
        expect(getClaimableBoostsPlugin).toBeDefined();
    });

    it('returns a plugin', () => {
        const plugin = getClaimableBoostsPlugin({
            invoke: {
                generateClaimLink: jest.fn(),
                getRegisteredSigningAuthorities: jest.fn(),
            },
        } as any);
        expect(plugin).toBeDefined();
    });

    it('returns a plugin with the correct name', () => {
        const plugin = getClaimableBoostsPlugin({
            invoke: {
                generateClaimLink: jest.fn(),
                getRegisteredSigningAuthorities: jest.fn(),
            },
        } as any);
        expect(plugin.name).toBe('ClaimableBoosts');
    });

    it('generates a claim link for a boost', async () => {
        const mockGenerateClaimLink = jest.fn().mockResolvedValue({
            boostUri: 'test-uri',
            challenge: 'test-challenge'
        });
        const mockGetRegisteredSigningAuthorities = jest.fn().mockResolvedValue([{
            relationship: { name: 'test-name' },
            signingAuthority: { endpoint: 'test-endpoint' }
        }]);

        const mockLearnCard = {
            invoke: {
                generateClaimLink: mockGenerateClaimLink,
                getRegisteredSigningAuthorities: mockGetRegisteredSigningAuthorities,
            },
        };

        const plugin = getClaimableBoostsPlugin(mockLearnCard as any);

        const result = await plugin.methods.generateBoostClaimLink(mockLearnCard as any, 'test-boost-uri');
        expect(result).toBe('https://learncard.app/claim/boost?claim=true&boostUri=test-uri&challenge=test-challenge');
        
        expect(mockGetRegisteredSigningAuthorities).toHaveBeenCalled();
        expect(mockGenerateClaimLink).toHaveBeenCalledWith('test-boost-uri', {
            name: 'test-name',
            endpoint: 'test-endpoint'
        });
    });
});
