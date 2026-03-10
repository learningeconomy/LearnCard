import { describe, it, expect } from 'vitest';

import {
    getTenantBrandingEnum,
    getCategoryLabel,
    getCategoryColor,
    getNavBarColorOverride,
    getStatusBarColorOverride,
    getHeaderTextColor,
    getHomeRoute,
    getHeaderText,
} from '../brandingHelpers';
import { BrandingEnum } from '../../components/headerBranding/headerBrandingHelpers';
import type { TenantBrandingConfig } from '../tenantConfig';

const baseBranding: TenantBrandingConfig = {
    name: 'LearnCard',
    shortName: 'LC',
    defaultTheme: 'colorful',
    loginRedirectPath: '/waitingsofa?loginCompleted=true',
    brandingKey: 'learncard',
    headerText: 'LEARNCARD',
    homeRoute: '/wallet',
};

describe('getTenantBrandingEnum', () => {
    it('returns BrandingEnum.learncard for brandingKey "learncard"', () => {
        const result = getTenantBrandingEnum({ ...baseBranding, brandingKey: 'learncard' });

        expect(result).toBe(BrandingEnum.learncard);
    });

    it('returns BrandingEnum.scoutPass for brandingKey "scoutPass"', () => {
        const result = getTenantBrandingEnum({ ...baseBranding, brandingKey: 'scoutPass' });

        expect(result).toBe(BrandingEnum.scoutPass);
    });

    it('returns BrandingEnum.metaversity for brandingKey "metaversity"', () => {
        const result = getTenantBrandingEnum({ ...baseBranding, brandingKey: 'metaversity' });

        expect(result).toBe(BrandingEnum.metaversity);
    });

    it('defaults to BrandingEnum.learncard for unknown brandingKey', () => {
        const result = getTenantBrandingEnum({ ...baseBranding, brandingKey: 'vetpass' });

        expect(result).toBe(BrandingEnum.learncard);
    });

    it('defaults to BrandingEnum.learncard when brandingKey is undefined', () => {
        const result = getTenantBrandingEnum({ ...baseBranding, brandingKey: undefined });

        expect(result).toBe(BrandingEnum.learncard);
    });
});

describe('getCategoryLabel', () => {
    it('returns overridden label when present', () => {
        const branding: TenantBrandingConfig = {
            ...baseBranding,
            categoryLabels: { 'Social Badge': 'Merit Badges' },
        };

        expect(getCategoryLabel(branding, 'Social Badge')).toBe('Merit Badges');
    });

    it('falls back to raw category key when no override', () => {
        expect(getCategoryLabel(baseBranding, 'Achievement')).toBe('Achievement');
    });
});

describe('getCategoryColor', () => {
    it('returns overridden color when present', () => {
        const branding: TenantBrandingConfig = {
            ...baseBranding,
            categoryColors: { Achievement: '#FF0000' },
        };

        expect(getCategoryColor(branding, 'Achievement')).toBe('#FF0000');
    });

    it('returns undefined when no override', () => {
        expect(getCategoryColor(baseBranding, 'Achievement')).toBeUndefined();
    });
});

describe('getNavBarColorOverride', () => {
    it('returns exact match', () => {
        const branding: TenantBrandingConfig = {
            ...baseBranding,
            navBarColors: { '/wallet': 'bg-green-500' },
        };

        expect(getNavBarColorOverride(branding, '/wallet')).toBe('bg-green-500');
    });

    it('returns prefix match', () => {
        const branding: TenantBrandingConfig = {
            ...baseBranding,
            navBarColors: { '/share-boost': 'bg-blue-500' },
        };

        expect(getNavBarColorOverride(branding, '/share-boost/123')).toBe('bg-blue-500');
    });

    it('returns undefined when no navBarColors configured', () => {
        expect(getNavBarColorOverride(baseBranding, '/wallet')).toBeUndefined();
    });

    it('returns undefined when no match', () => {
        const branding: TenantBrandingConfig = {
            ...baseBranding,
            navBarColors: { '/wallet': 'bg-green-500' },
        };

        expect(getNavBarColorOverride(branding, '/passport')).toBeUndefined();
    });
});

describe('getStatusBarColorOverride', () => {
    it('returns exact match', () => {
        const branding: TenantBrandingConfig = {
            ...baseBranding,
            statusBarColors: { '/badges': 'purple' },
        };

        expect(getStatusBarColorOverride(branding, '/badges')).toBe('purple');
    });

    it('returns undefined when no statusBarColors configured', () => {
        expect(getStatusBarColorOverride(baseBranding, '/badges')).toBeUndefined();
    });
});

describe('getHeaderTextColor', () => {
    it('returns route-specific override', () => {
        const branding: TenantBrandingConfig = {
            ...baseBranding,
            headerTextColors: { '/wallet': 'text-white' },
            defaultHeaderTextColor: 'text-grayscale-900',
        };

        expect(getHeaderTextColor(branding, '/wallet')).toBe('text-white');
    });

    it('returns default header text color when no route match', () => {
        const branding: TenantBrandingConfig = {
            ...baseBranding,
            headerTextColors: { '/wallet': 'text-white' },
            defaultHeaderTextColor: 'text-grayscale-900',
        };

        expect(getHeaderTextColor(branding, '/unknown')).toBe('text-grayscale-900');
    });

    it('returns undefined when no config at all', () => {
        expect(getHeaderTextColor(baseBranding, '/wallet')).toBeUndefined();
    });
});

describe('getHomeRoute', () => {
    it('returns configured homeRoute', () => {
        expect(getHomeRoute({ ...baseBranding, homeRoute: '/campfire' })).toBe('/campfire');
    });

    it('defaults to /wallet', () => {
        const { homeRoute, ...noHome } = baseBranding;

        expect(getHomeRoute(noHome as TenantBrandingConfig)).toBe('/wallet');
    });
});

describe('getHeaderText', () => {
    it('returns configured headerText', () => {
        expect(getHeaderText({ ...baseBranding, headerText: 'VETPASS' })).toBe('VETPASS');
    });

    it('falls back to uppercased name', () => {
        const { headerText, ...noHeader } = baseBranding;

        expect(getHeaderText(noHeader as TenantBrandingConfig)).toBe('LEARNCARD');
    });
});
