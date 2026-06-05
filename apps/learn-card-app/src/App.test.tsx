import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('learn-card-base', () => ({
    lazyWithRetry: () => () => <div data-testid="lazy-full-app" />,
    useIsLoggedIn: () => false,
}));

vi.mock('learn-card-base/stores/firstStartupStore', () => ({
    __esModule: true,
    default: {
        get: {
            introSlidesCompleted: () => true,
        },
    },
    useIntroSlidesCompleted: () => undefined,
}));

vi.mock('learn-card-base/stores/currentUserStore', () => ({
    __esModule: true,
    default: {
        get: {
            currentUserIsLoggedIn: () => false,
        },
        use: {
            currentUserIsLoggedIn: () => false,
        },
        set: {},
    },
}));

vi.mock('./components/intro-slides/IntroSlides', () => ({
    __esModule: true,
    default: () => <div data-testid="intro-slides" />,
}));

import App from './App';

describe('App', () => {
    it('renders without crashing', () => {
        const { baseElement } = render(<App />);
        expect(baseElement).toBeDefined();
    });
});
