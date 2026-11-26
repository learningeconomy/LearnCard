import React from 'react';

import { environment } from '../../config/environment';

/**
 * Turns an `ionicons/icons` export (`data:image/svg+xml;utf8,<svg ...>`) into React SVG elements.
 *
 * ionicons parses these strings with DOMParser and injects the markup with `innerHTML`. Here the
 * parsed tree is rebuilt through an allowlist instead: only the shape elements and presentation
 * attributes the icon set uses survive, so a malformed or hostile string cannot add scripts, event
 * handlers, links or styles. Other URL kinds (ionicons would `fetch` them) are refused, so an icon
 * never touches the network.
 */

const DATA_URL_PREFIX = 'data:image/svg+xml;utf8,';

const ALLOWED_TAGS = new Set([
    'svg',
    'g',
    'path',
    'circle',
    'rect',
    'ellipse',
    'line',
    'polyline',
    'polygon',
]);

/** SVG attribute name to React prop name. Anything not listed (on*, href, style, ...) is dropped. */
const ALLOWED_ATTRIBUTES: Record<string, string> = {
    xmlns: 'xmlns',
    viewBox: 'viewBox',
    class: 'className',
    d: 'd',
    cx: 'cx',
    cy: 'cy',
    r: 'r',
    rx: 'rx',
    ry: 'ry',
    x: 'x',
    y: 'y',
    x1: 'x1',
    y1: 'y1',
    x2: 'x2',
    y2: 'y2',
    points: 'points',
    width: 'width',
    height: 'height',
    transform: 'transform',
    fill: 'fill',
    stroke: 'stroke',
    opacity: 'opacity',
    'fill-opacity': 'fillOpacity',
    'fill-rule': 'fillRule',
    'clip-rule': 'clipRule',
    'stroke-width': 'strokeWidth',
    'stroke-linecap': 'strokeLinecap',
    'stroke-linejoin': 'strokeLinejoin',
    'stroke-miterlimit': 'strokeMiterlimit',
    'stroke-opacity': 'strokeOpacity',
    'stroke-dasharray': 'strokeDasharray',
    'stroke-dashoffset': 'strokeDashoffset',
};

/** `javascript:` and similar cannot appear in the allowed attributes, but refuse `url(` too. */
const UNSAFE_VALUE = /url\s*\(|javascript:|expression\s*\(/i;

const toReact = (el: Element, key?: number): React.ReactElement | null => {
    const tag = el.localName;
    if (!ALLOWED_TAGS.has(tag)) return null;

    const props: Record<string, string | number> = {};
    if (key !== undefined) props.key = key;
    for (const attr of Array.from(el.attributes)) {
        const prop = ALLOWED_ATTRIBUTES[attr.name];
        if (prop && !UNSAFE_VALUE.test(attr.value)) props[prop] = attr.value;
    }

    const children = Array.from(el.children)
        .map((child, index) => toReact(child, index))
        .filter((child): child is React.ReactElement => child !== null);

    return React.createElement(tag, props, ...children);
};

const cache = new Map<string, React.ReactElement | null>();

/** The icon's `<svg>` as React elements, or `null` for anything that is not an inline SVG data URL. */
export const getIconSvg = (icon: string | undefined): React.ReactElement | null => {
    if (!icon) return null;
    const cached = cache.get(icon);
    if (cached !== undefined) return cached;

    let svg: React.ReactElement | null = null;
    if (icon.startsWith(DATA_URL_PREFIX) && typeof DOMParser !== 'undefined') {
        // Same parse as ionicons: the whole string as an HTML document, then its first <svg>.
        const doc = new DOMParser().parseFromString(icon, 'text/html');
        const root = doc.querySelector('svg');
        svg = root ? toReact(root) : null;
    }

    if (!svg && environment.DEV) {
        console.warn(
            `AppIcon: unsupported icon "${icon.slice(0, 60)}"; pass an ionicons/icons export.`
        );
    }

    cache.set(icon, svg);
    return svg;
};
