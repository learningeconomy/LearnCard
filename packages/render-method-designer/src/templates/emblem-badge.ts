import type { CredentialTemplate, Theme } from '../ir/types';

/**
 * Emblem-style badge template, re-authored natively in IR from a Figma reference (see
 * `examples/render-method-designer/sample-svgs/sample-emblem-figma.svg`).
 *
 * The badge outline is the original Figma `<path d="...">` for the 12-pointed star
 * silhouette — preserved verbatim so the visual fidelity matches the reference. The
 * fill, inner image, drop-shadow, and text labels are all theme-token-aware and
 * credential-binding-aware, which is what makes this an editable template rather than
 * a static asset.
 */

const emblemTheme: Theme = {
    colors: {
        primary: '#15803D',
        secondary: '#166534',
        accent: '#86EFAC',
        surface: '#FFFFFF',
        text: '#14532D',
        muted: '#65A30D',
        border: '#D1FAE5',
        background: '#F0FDF4',
    },
    fonts: {
        heading: 'Poppins, system-ui, sans-serif',
        body: 'Poppins, system-ui, sans-serif',
    },
};

const BADGE_PATH_D =
    'M70.127 6.48633C75.3205 1.08503 84.0375 1.17241 89.1172 6.74805L94.6455 12.8164C95.5489 13.8079 96.9477 14.1823 98.2256 13.7754L106.047 11.2842C113.348 8.95924 121.068 13.416 122.705 20.9014L124.459 28.9209C124.745 30.231 125.769 31.2552 127.079 31.542L135.099 33.2949C142.584 34.9321 147.04 42.6514 144.716 49.9521V49.9531L142.225 57.7744C141.818 59.0527 142.192 60.4511 143.184 61.3545L149.252 66.8828C154.916 72.0434 154.916 80.9569 149.252 86.1172L143.184 91.6455C142.192 92.5489 141.818 93.9477 142.225 95.2256L144.716 103.047L144.819 103.39C146.9 110.588 142.467 118.093 135.099 119.705L127.079 121.459C125.769 121.746 124.746 122.769 124.459 124.079L122.705 132.099C121.068 139.584 113.348 144.041 106.047 141.716L98.2256 139.225C96.9477 138.818 95.5489 139.192 94.6455 140.184L89.1172 146.252C83.9569 151.916 75.0434 151.916 69.8828 146.252L64.3545 140.184C63.4512 139.192 62.0532 138.818 60.7754 139.225L52.9531 141.716C45.6519 144.041 37.9321 139.584 36.2949 132.099L34.542 124.079C34.2555 122.769 33.2312 121.746 31.9209 121.459L23.9014 119.705C16.416 118.068 11.9592 110.348 14.2842 103.047L16.7754 95.2256C17.1824 93.9477 16.8079 92.5489 15.8164 91.6455L9.74805 86.1172C4.08393 80.9569 4.08403 72.0434 9.74805 66.8828L15.8164 61.3545C16.8079 60.4512 17.1824 59.0527 16.7754 57.7744L14.2842 49.9531C11.9592 42.6522 16.416 34.9321 23.9014 33.2949L31.9209 31.542C33.2315 31.2551 34.2555 30.231 34.542 28.9209L36.2949 20.9014C37.9321 13.416 45.6519 8.95924 52.9531 11.2842L60.7754 13.7754C62.0532 14.1821 63.4512 13.8078 64.3545 12.8164L69.8828 6.74805L70.127 6.48633Z';

const BADGE_NATURAL_BBOX = { x: 4.08, y: 1.17, w: 150.84, h: 150.75 };

export const emblemBadgeTemplate: CredentialTemplate = {
    version: 1,
    name: 'Emblem Badge',
    size: { w: 360, h: 360 },
    theme: emblemTheme,
    elements: [
        {
            id: 'badge-outline',
            type: 'path',
            x: 30,
            y: 30,
            w: 300,
            h: 300,
            d: BADGE_PATH_D,
            naturalBBox: BADGE_NATURAL_BBOX,
            fill: { kind: 'solid', color: '$primary' },
            stroke: { color: '$surface', width: 3 },
            shadow: { offsetX: 0, offsetY: 3, blur: 4, color: '#000000', opacity: 0.25 },
        },
        {
            id: 'inner-circle',
            type: 'rect',
            x: 75,
            y: 75,
            w: 210,
            h: 210,
            rx: 105,
            fill: { kind: 'solid', color: '$border' },
        },
        {
            id: 'achievement-image',
            type: 'image',
            x: 110,
            y: 110,
            w: 140,
            h: 140,
            source: { kind: 'binding', path: 'credentialSubject.achievement.image' },
            fit: 'cover',
            clip: 'circle',
        },
        {
            id: 'badge-label',
            type: 'text',
            x: 180,
            y: 308,
            content: { kind: 'static', value: 'ACHIEVEMENT' },
            font: 'heading',
            size: 11,
            weight: 700,
            color: '$primary',
            align: 'middle',
            letterSpacing: 2.4,
        },
        {
            id: 'badge-name',
            type: 'text',
            x: 180,
            y: 336,
            maxWidth: 320,
            content: {
                kind: 'binding',
                path: 'credentialSubject.achievement.name',
                fallback: 'Untitled',
            },
            font: 'heading',
            size: 14,
            weight: 600,
            color: '$text',
            align: 'middle',
        },
    ],
};
