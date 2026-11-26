import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppCard, AppCardContent } from './AppCard';
import { AppRippleEffect } from './AppRippleEffect';
import { AppText } from './AppText';
import { AppAvatar, AppThumbnail } from './AppThumbnail';

afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute('mode');
    vi.useRealTimers();
});

describe('AppRippleEffect', () => {
    it('draws a ripple in itself 100ms into a press on the nearest .ion-activatable', async () => {
        vi.useFakeTimers();
        render(
            <div className="ion-activatable" data-testid="row">
                Row
                <AppRippleEffect />
            </div>
        );
        const row = screen.getByTestId('row');
        const effect = row.querySelector('.app-ripple-effect') as HTMLElement;

        expect(effect.getAttribute('role')).toBe('presentation');
        fireEvent.pointerDown(row, { button: 0, clientX: 3, clientY: 3 });
        expect(effect.querySelectorAll('.app-ripple')).toHaveLength(0);
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(effect.querySelectorAll('.app-ripple')).toHaveLength(1);

        fireEvent.pointerUp(document);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(325 + 200);
        });
        expect(effect.querySelectorAll('.app-ripple')).toHaveLength(0);
    });

    it('ignores right clicks and renders without an activatable ancestor', () => {
        vi.useFakeTimers();
        render(
            <div className="ion-activatable" data-testid="row">
                <AppRippleEffect />
            </div>
        );
        const row = screen.getByTestId('row');
        // jsdom has no PointerEvent, so build one from MouseEvent to carry `button`.
        row.dispatchEvent(new MouseEvent('pointerdown', { button: 2, bubbles: true }));
        act(() => {
            vi.advanceTimersByTime(200);
        });
        expect(row.querySelectorAll('.app-ripple')).toHaveLength(0);

        expect(() => render(<AppRippleEffect />)).not.toThrow();
    });
});

describe('AppText', () => {
    it('is an inline span that sets a palette color', () => {
        render(
            <p>
                <AppText color="danger">Error</AppText> <AppText>Plain</AppText>
            </p>
        );

        expect(screen.getByText('Error').tagName).toBe('SPAN');
        expect(screen.getByText('Error').className).toBe('app-text app-color app-color-danger');
        expect(screen.getByText('Plain').className).toBe('app-text');
    });
});

describe('AppThumbnail and AppAvatar', () => {
    it('wrap an image, the avatar following the document or prop mode', () => {
        document.documentElement.setAttribute('mode', 'ios');
        render(
            <>
                <AppThumbnail data-testid="thumb" className="w-12">
                    <img alt="" src="data:," />
                </AppThumbnail>
                <AppAvatar data-testid="avatar" />
                <AppAvatar data-testid="avatar-md" mode="md" />
            </>
        );

        expect(screen.getByTestId('thumb').className).toBe('app-thumbnail w-12');
        expect(screen.getByTestId('thumb').querySelector('img')).not.toBeNull();
        expect(screen.getByTestId('avatar').className).toBe('app-avatar app-avatar-ios');
        expect(screen.getByTestId('avatar-md').className).toBe('app-avatar app-avatar-md');
    });
});

describe('AppCard and AppCardContent', () => {
    it('carry mode and color classes', () => {
        render(
            <AppCard color="light" data-testid="card">
                <AppCardContent data-testid="content">
                    <p>Body</p>
                </AppCardContent>
            </AppCard>
        );

        expect(screen.getByTestId('card').className).toBe(
            'app-card app-card-md app-color app-color-light'
        );
        expect(screen.getByTestId('content').className).toBe(
            'app-card-content app-card-content-md'
        );
        expect(screen.getByText('Body')).toBeTruthy();
    });
});
