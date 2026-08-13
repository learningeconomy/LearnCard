import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    useFlags: vi.fn(),
}));

vi.mock('launchdarkly-react-client-sdk', () => ({
    useFlags: () => mocks.useFlags(),
}));

vi.mock('./ImageUpload', () => ({
    ImageUpload: () => null,
    ScreenshotUpload: () => null,
}));

import { AppDetailsStep } from './AppDetailsStep';

const renderStep = () =>
    render(<AppDetailsStep data={{}} onChange={vi.fn()} errors={{}} />).container;

describe('AppDetailsStep plugin visibility', () => {
    beforeEach(() => {
        mocks.useFlags.mockReturnValue({ pluginVisibility: false });
    });

    it('hides the plugin category when plugin visibility is disabled', () => {
        const container = renderStep();

        expect(container.querySelector('option[value="plugin"]')).toBeNull();
    });

    it('shows the plugin category when plugin visibility is enabled', () => {
        mocks.useFlags.mockReturnValue({ pluginVisibility: true });

        const container = renderStep();

        expect(container.querySelector('option[value="plugin"]')).toBeTruthy();
    });
});
