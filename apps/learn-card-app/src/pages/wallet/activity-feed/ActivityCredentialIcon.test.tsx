vi.mock('learn-card-base', async () =>
    (await import('../../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()
);

const getThemedCategory = vi.fn();
vi.mock('../../../theme/hooks/useTheme', () => ({
    useTheme: () => ({ getThemedCategory }),
}));

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { CredentialCategoryEnum } from 'learn-card-base';
import { ActivityCredentialIcon } from './ActivityCredentialIcon';

const stub = (testId: string): React.FC<{ className?: string }> =>
    function Stub() {
        return <span data-testid={testId} />;
    };

const Solid = stub('solid');
const Shaped = stub('shaped');
const Base = stub('base');

beforeEach(() => getThemedCategory.mockReset());

describe('ActivityCredentialIcon (LC-1969)', () => {
    it('prefers the solid glyph over the illustrated shaped art', () => {
        getThemedCategory.mockReturnValue({
            icons: { Icon: Base, IconWithShape: Shaped, IconSolid: Solid },
        });

        const { queryByTestId } = render(
            <ActivityCredentialIcon category={CredentialCategoryEnum.achievement} />
        );

        expect(queryByTestId('solid')).not.toBeNull();
        expect(queryByTestId('shaped')).toBeNull();
    });

    // `formal` (and `vetpass`, which inherits it) don't declare IconSolid
    // because their `Icon` already is the flat glyph.
    it('falls back to Icon — never IconWithShape — when IconSolid is absent', () => {
        getThemedCategory.mockReturnValue({ icons: { Icon: Base, IconWithShape: Shaped } });

        const { queryByTestId } = render(
            <ActivityCredentialIcon category={CredentialCategoryEnum.socialBadge} />
        );

        expect(queryByTestId('base')).not.toBeNull();
        expect(queryByTestId('shaped')).toBeNull();
    });

    it('renders the generic glyph for generic credentials without consulting the theme', () => {
        getThemedCategory.mockReturnValue({ icons: { IconSolid: Solid } });

        const { container, queryByTestId } = render(
            <ActivityCredentialIcon category={CredentialCategoryEnum.socialBadge} isGeneric />
        );

        expect(queryByTestId('solid')).toBeNull();
        expect(container.querySelector('svg')).not.toBeNull();
    });

    it('renders the generic glyph when the category has no icons at all', () => {
        getThemedCategory.mockReturnValue({ icons: {} });

        const { container } = render(
            <ActivityCredentialIcon category={CredentialCategoryEnum.family} />
        );

        expect(container.querySelector('svg')).not.toBeNull();
    });

    it('passes the sizing className through to the resolved icon', () => {
        getThemedCategory.mockReturnValue({
            icons: {
                IconSolid: ({ className }: { className?: string }) => (
                    <span data-testid="solid" className={className} />
                ),
            },
        });

        const { getByTestId } = render(
            <ActivityCredentialIcon
                category={CredentialCategoryEnum.skill}
                className="w-[38px] h-[38px]"
            />
        );

        expect(getByTestId('solid').className).toBe('w-[38px] h-[38px]');
    });
});
