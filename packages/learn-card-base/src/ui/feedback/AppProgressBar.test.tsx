import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AppProgressBar } from './AppProgressBar';

const host = (container: HTMLElement): HTMLElement =>
    container.querySelector('.app-progress-bar') as HTMLElement;

const part = (container: HTMLElement, name: string): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(`.app-progress-bar-${name}`));

afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute('mode');
    document.dir = '';
});

describe('AppProgressBar', () => {
    it('defaults to a determinate md bar at 0 with Ionic aria values', () => {
        const { container } = render(<AppProgressBar />);
        const el = host(container);

        expect(el.tagName).toBe('DIV');
        expect(el.className).toBe(
            'app-progress-bar app-progress-bar-md app-progress-bar-determinate app-progress-bar-solid'
        );
        expect(el.getAttribute('role')).toBe('progressbar');
        expect(el.getAttribute('aria-valuenow')).toBe('0');
        expect(el.getAttribute('aria-valuemin')).toBe('0');
        expect(el.getAttribute('aria-valuemax')).toBe('1');
        expect(part(container, 'progress')[0].style.transform).toBe('scaleX(0)');
        expect(part(container, 'buffer-bar')[0].style.transform).toBe('scaleX(1)');
    });

    it('uses the document mode', () => {
        document.documentElement.setAttribute('mode', 'ios');
        const { container } = render(<AppProgressBar value={0.5} />);

        expect(host(container).classList.contains('app-progress-bar-ios')).toBe(true);
    });

    it('clamps the drawn value and buffer but reports the raw value', () => {
        const { container } = render(<AppProgressBar value={1.4} buffer={-1} />);

        expect(host(container).getAttribute('aria-valuenow')).toBe('1.4');
        expect(part(container, 'progress')[0].style.transform).toBe('scaleX(1)');
        expect(part(container, 'buffer-bar')[0].style.transform).toBe('scaleX(0)');
    });

    it('shows the buffer dots only below a full buffer', () => {
        const full = render(<AppProgressBar value={0.3} />);
        const [outer] = part(full.container, 'buffer-circles-container');
        expect(outer.style.display).toBe('none');
        full.unmount();

        const { container } = render(<AppProgressBar value={0.3} buffer={0.6} />);
        const containers = part(container, 'buffer-circles-container');

        expect(host(container).classList.contains('app-progress-bar-solid')).toBe(false);
        expect(containers[0].style.display).toBe('');
        expect(containers[0].style.transform).toBe('translateX(60%)');
        expect(containers[1].style.transform).toBe('translateX(-60%)');
        expect(part(container, 'buffer-circles')).toHaveLength(1);
        expect(part(container, 'buffer-bar')[0].style.transform).toBe('scaleX(0.6)');
    });

    it('renders the indeterminate parts without aria-valuenow', () => {
        const { container } = render(<AppProgressBar type="indeterminate" />);
        const el = host(container);

        expect(el.classList.contains('app-progress-bar-indeterminate')).toBe(true);
        expect(el.hasAttribute('aria-valuenow')).toBe(false);
        expect(part(container, 'indeterminate-bar-primary')).toHaveLength(1);
        expect(part(container, 'indeterminate-bar-secondary')).toHaveLength(1);
        expect(part(container, 'progress-indeterminate')).toHaveLength(2);
        expect(part(container, 'progress')).toHaveLength(0);
    });

    it('flips reversed in RTL documents', () => {
        const ltr = render(<AppProgressBar reversed />);
        expect(host(ltr.container).classList.contains('app-progress-bar-reversed')).toBe(true);
        ltr.unmount();

        document.dir = 'rtl';
        const rtl = render(<AppProgressBar reversed />);
        expect(host(rtl.container).classList.contains('app-progress-bar-reversed')).toBe(false);
        rtl.unmount();

        const rtlDefault = render(<AppProgressBar />);
        expect(host(rtlDefault.container).classList.contains('app-progress-bar-reversed')).toBe(
            true
        );
    });

    it('adds Ionic color classes and passes attributes, classes and styles through', () => {
        const { container } = render(
            <AppProgressBar
                color="grayscale-800"
                value={0.42}
                className="absolute top-0"
                aria-label="Loading"
                aria-hidden={true}
                style={{ '--progress-background': '#16a34a' }}
            />
        );
        const el = host(container);

        expect(el.className).toBe(
            'absolute top-0 app-progress-bar app-progress-bar-md app-progress-bar-determinate app-progress-bar-solid ion-color ion-color-grayscale-800'
        );
        expect(el.getAttribute('aria-label')).toBe('Loading');
        expect(el.getAttribute('aria-hidden')).toBe('true');
        expect(el.style.getPropertyValue('--progress-background')).toBe('#16a34a');
    });
});
