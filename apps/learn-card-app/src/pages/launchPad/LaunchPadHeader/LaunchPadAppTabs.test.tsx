import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    useFlags: vi.fn(),
}));

vi.mock('launchdarkly-react-client-sdk', () => ({
    useFlags: () => mocks.useFlags(),
}));

vi.mock('../../../theme/hooks/useTheme', () => ({
    useTheme: () => ({
        getColorSet: () => ({ primaryColor: 'emerald-700', primaryColorShade: 'emerald-800' }),
        getStyleSet: () => ({ tabs: { borderRadius: 'rounded-full' } }),
    }),
}));

import LaunchPadAppTabs, { LaunchPadTabEnum } from './LaunchPadAppTabs';

describe('LaunchPadAppTabs plugin visibility', () => {
    beforeEach(() => {
        mocks.useFlags.mockReturnValue({ pluginVisibility: false });
    });

    it('hides the Plugins tab when plugin visibility is disabled', () => {
        render(<LaunchPadAppTabs tab={LaunchPadTabEnum.all} setTab={vi.fn()} />);

        expect(screen.queryByRole('button', { name: 'Plugins' })).toBeNull();
    });

    it('shows the Plugins tab when plugin visibility is enabled', () => {
        mocks.useFlags.mockReturnValue({ pluginVisibility: true });

        render(<LaunchPadAppTabs tab={LaunchPadTabEnum.all} setTab={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Plugins' })).toBeTruthy();
    });
});
