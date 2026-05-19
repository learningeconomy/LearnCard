import { generateId } from '../store/designerStore';
import { DEFAULT_THEME } from './theme';
import type {
    CredentialTemplate,
    DesignerElement,
    DividerElement,
    FillRef,
    ImageElement,
    PathElement,
    RectElement,
    ShadowEffect,
    StringValue,
    TextElement,
} from './types';

/**
 * SVG-to-IR import.
 *
 * Scope: this parser handles the SVG primitives our IR can express — `<rect>`, `<text>`,
 * `<image>`, `<line>`, `<path>`, plus `<linearGradient>`, `<clipPath>`, `<pattern>`-via-
 * `<use>`-via-`<image>` image-fill chains (Figma's canonical pattern), and `<filter>`
 * drop-shadow chains. Translate + scale transforms on `<g>` and `<clipPath>` children are
 * baked into child coordinates. Everything else (`<polygon>`, `<circle>`, `<ellipse>`,
 * `<mask>`, rotate/skew/matrix transforms, animations, scripts) produces a warning and
 * is dropped.
 *
 * For credentials authored in our own designer this is round-trip-lossless. For arbitrary
 * SVG (Figma/Illustrator exports) most features survive: rects, paths, image fills,
 * drop-shadows, simple transforms. The fundamental limitation is text-as-path (Figma's
 * "Outline text" export setting) — those paths come through as graphics, not bindable
 * text. The README documents the Figma export checklist to avoid this.
 *
 * The dialog offers an "embed as background" fallback for SVGs that can't be parsed at
 * all: drop the unsupported SVG into a single `<image>` element using a
 * `data:image/svg+xml` URI.
 *
 * Mustache placeholders inside `<text>` content are auto-detected: if the text content is
 * the single pattern `{{path}}`, the resulting `TextElement` gets a `binding` content with
 * that path. Mixed literal+placeholder text is kept as static (the variable picker can be
 * used to re-do bindings post-import).
 */

export interface ImportWarning {
    severity: 'info' | 'warning';
    message: string;
}

export interface ImportResult {
    template: CredentialTemplate | null;
    warnings: ImportWarning[];
    droppedCount: number;
    usedFallback: boolean;
}

export interface ImportOptions {
    name?: string;
    /** When true and at least one element can't be parsed, return a single-image fallback
     *  template instead of the partially-imported IR. Default false. */
    useFallbackIfLossy?: boolean;
}

const SUPPORTED_ROOT_TAGS = new Set([
    'svg',
    'g',
    'defs',
    'rect',
    'text',
    'image',
    'line',
    'path',
    'linearGradient',
    'clipPath',
    'pattern',
    'use',
    'filter',
    'stop',
    'circle',
    'tspan',
]);

const MUSTACHE_VAR_RE = /^\{\{\s*([a-zA-Z_][a-zA-Z0-9_.-]*)\s*\}\}$/;

const numAttr = (el: Element, name: string, fallback = 0): number => {
    const v = el.getAttribute(name);
    if (v === null) return fallback;
    const parsed = parseFloat(v);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const strAttr = (el: Element, name: string): string | null => el.getAttribute(name);

const normalizeColor = (raw: string | null | undefined): string | null => {
    if (!raw || raw === 'none') return null;
    const trimmed = raw.trim();
    if (trimmed.startsWith('rgb')) {
        const match = trimmed.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
        if (!match) return trimmed;
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        return `#${[r, g, b].map(n => n.toString(16).padStart(2, '0').toUpperCase()).join('')}`;
    }
    if (trimmed.startsWith('#') && trimmed.length === 4) {
        const r = trimmed[1];
        const g = trimmed[2];
        const b = trimmed[3];
        return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
    }
    return trimmed;
};

interface GradientDef {
    from: string;
    to: string;
    direction: 'horizontal' | 'vertical' | 'diagonal';
}

interface ClipDef {
    kind: 'circle' | 'rounded';
    cornerRadius?: number;
}

/**
 * Pattern definition resolved to a hosted image. Figma exports images as
 * `<pattern><use xlink:href="#imageId"/></pattern>` and then references the pattern via
 * `<rect fill="url(#patternId)">`. We pre-resolve the pattern → use → image chain so
 * fill-resolution can directly know "this rect is actually an image."
 */
interface PatternImageDef {
    href: string;
    /** Optional scale baked into the `<use transform="scale(s)">` — needed for fit calc. */
    scale: number;
}

/** Drop-shadow filter definition extracted from a Figma drop-shadow filter chain. */
interface ShadowFilterDef {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
    opacity: number;
}

interface Defs {
    gradients: Map<string, GradientDef>;
    clips: Map<string, ClipDef>;
    patternImages: Map<string, PatternImageDef>;
    shadows: Map<string, ShadowFilterDef>;
}

const parseUrlRef = (raw: string | null): string | null => {
    if (!raw) return null;
    const match = raw.match(/^url\(#([^)]+)\)$/);
    return match ? match[1] : null;
};

const parseLinearGradient = (el: Element): GradientDef | null => {
    const stops = Array.from(el.children).filter(c => c.tagName === 'stop');
    if (stops.length < 2) return null;
    const from = normalizeColor(strAttr(stops[0], 'stop-color') ?? '#000000') ?? '#000000';
    const to =
        normalizeColor(strAttr(stops[stops.length - 1], 'stop-color') ?? '#FFFFFF') ?? '#FFFFFF';
    const x1 = numAttr(el, 'x1', 0);
    const y1 = numAttr(el, 'y1', 0);
    const x2 = numAttr(el, 'x2', 1);
    const y2 = numAttr(el, 'y2', 0);
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const direction: GradientDef['direction'] =
        dx > 0 && dy > 0 ? 'diagonal' : dy > dx ? 'vertical' : 'horizontal';
    return { from, to, direction };
};

const parseClipPath = (el: Element): ClipDef | null => {
    const child = Array.from(el.children).find(c => c.tagName === 'rect' || c.tagName === 'circle');
    if (!child) return null;
    if (child.tagName === 'circle') return { kind: 'circle' };
    const rx = numAttr(child, 'rx', 0);
    return { kind: 'rounded', cornerRadius: rx > 0 ? rx : 12 };
};

const parseTransformScale = (transform: string | null): number => {
    if (!transform) return 1;
    const m = transform.match(/scale\(\s*(-?\d+(?:\.\d+)?)/);
    if (!m) return 1;
    const scale = parseFloat(m[1]);
    return Number.isFinite(scale) ? scale : 1;
};

/**
 * Resolve a `<pattern>` → `<use xlink:href="#imageId">` → `<image href="data:...">` chain
 * into a {href, scale} pair. Figma uses this exclusively for any rect that should display
 * an image — the rect's `fill="url(#patternId)"` references this resolved entry.
 *
 * Returns null when the pattern doesn't fit this exact shape (it might be a checkered
 * pattern fill or other non-image use case — those are dropped at the fill-resolution
 * step with a warning).
 */
const resolvePatternImage = (
    patternEl: Element,
    imageMap: Map<string, string>
): PatternImageDef | null => {
    const useEl = Array.from(patternEl.children).find(c => c.tagName === 'use');
    if (!useEl) return null;
    const href = useEl.getAttribute('xlink:href') ?? useEl.getAttribute('href');
    if (!href || !href.startsWith('#')) return null;
    const imageHref = imageMap.get(href.slice(1));
    if (!imageHref) return null;
    return { href: imageHref, scale: parseTransformScale(useEl.getAttribute('transform')) };
};

/**
 * Detect Figma's canonical drop-shadow filter and reduce to a `ShadowFilterDef`. The
 * heuristic: a `<filter>` element containing `<feOffset>` + `<feGaussianBlur>` +
 * `<feColorMatrix>`. If those three are present, extract the offset (dx/dy), blur
 * (stdDeviation × 2 to convert from std-dev to perceived blur radius — Figma's pixel
 * value is the radius, SVG's `stdDeviation` is half), and color/opacity from the second
 * `<feColorMatrix>`'s diagonal.
 */
const parseDropShadowFilter = (filterEl: Element): ShadowFilterDef | null => {
    const offsetEl = filterEl.querySelector('feOffset');
    const blurEl = filterEl.querySelector('feGaussianBlur');
    const colorMatrixEls = filterEl.querySelectorAll('feColorMatrix');
    if (!offsetEl || !blurEl || colorMatrixEls.length < 1) return null;
    const offsetX = numAttr(offsetEl, 'dx', 0);
    const offsetY = numAttr(offsetEl, 'dy', 0);
    const blur = numAttr(blurEl, 'stdDeviation', 0) * 2;
    let color = '#000000';
    let opacity = 0.25;
    for (let i = colorMatrixEls.length - 1; i >= 0; i--) {
        const values = (colorMatrixEls[i].getAttribute('values') ?? '').trim();
        if (!values) continue;
        const nums = values.split(/\s+/).map(parseFloat);
        if (nums.length < 20) continue;
        const r = nums[4];
        const g = nums[9];
        const b = nums[14];
        const a = nums[18];
        if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b) && r >= 0 && r <= 1) {
            color = `#${[r, g, b].map(n => Math.round(n * 255).toString(16).padStart(2, '0').toUpperCase()).join('')}`;
            if (Number.isFinite(a)) opacity = a;
            break;
        }
    }
    return { offsetX, offsetY, blur, color, opacity };
};

const collectDefs = (root: Element): Defs => {
    const defs: Defs = {
        gradients: new Map(),
        clips: new Map(),
        patternImages: new Map(),
        shadows: new Map(),
    };

    const imageMap = new Map<string, string>();
    root.querySelectorAll('image[id]').forEach(img => {
        const id = img.getAttribute('id');
        const href = img.getAttribute('xlink:href') ?? img.getAttribute('href');
        if (id && href) imageMap.set(id, href);
    });

    const collectFromContainer = (container: Element) => {
        Array.from(container.children).forEach(child => {
            const id = child.getAttribute('id');
            if (!id) return;
            if (child.tagName === 'linearGradient' && !defs.gradients.has(id)) {
                const g = parseLinearGradient(child);
                if (g) defs.gradients.set(id, g);
            } else if (child.tagName === 'clipPath' && !defs.clips.has(id)) {
                const c = parseClipPath(child);
                if (c) defs.clips.set(id, c);
            } else if (child.tagName === 'pattern' && !defs.patternImages.has(id)) {
                const p = resolvePatternImage(child, imageMap);
                if (p) defs.patternImages.set(id, p);
            } else if (child.tagName === 'filter' && !defs.shadows.has(id)) {
                const s = parseDropShadowFilter(child);
                if (s) defs.shadows.set(id, s);
            }
        });
    };

    root.querySelectorAll('defs').forEach(collectFromContainer);
    collectFromContainer(root);
    return defs;
};

const parseFill = (el: Element, defs: Defs): FillRef => {
    const raw = strAttr(el, 'fill');
    if (raw === null || raw === '') return { kind: 'solid', color: '#000000' };
    if (raw === 'none') return { kind: 'solid', color: 'transparent' };
    const gradientId = parseUrlRef(raw);
    if (gradientId) {
        const g = defs.gradients.get(gradientId);
        if (g) {
            return { kind: 'linear-gradient', from: g.from, to: g.to, direction: g.direction };
        }
    }
    const normalized = normalizeColor(raw);
    return { kind: 'solid', color: normalized ?? '#000000' };
};

/**
 * Detect a rect whose `fill="url(#patternId)"` references a resolved pattern-image. If
 * so, return the image href — the caller synthesizes an `ImageElement` from the rect's
 * geometry. Otherwise return null and the caller produces a normal `RectElement`.
 */
const detectPatternImageFill = (el: Element, defs: Defs): string | null => {
    const fillRef = parseUrlRef(strAttr(el, 'fill'));
    if (!fillRef) return null;
    const patternImage = defs.patternImages.get(fillRef);
    return patternImage ? patternImage.href : null;
};

const parseRect = (
    el: Element,
    defs: Defs,
    inheritedShadow?: ShadowEffect
): RectElement | ImageElement => {
    const imageHref = detectPatternImageFill(el, defs);
    if (imageHref) {
        const clipRef = parseUrlRef(strAttr(el, 'clip-path'));
        const clipDef = clipRef ? defs.clips.get(clipRef) : null;
        const image: ImageElement = {
            id: generateId('image'),
            type: 'image',
            x: numAttr(el, 'x'),
            y: numAttr(el, 'y'),
            w: numAttr(el, 'width', 100),
            h: numAttr(el, 'height', 100),
            source: { kind: 'url', value: imageHref },
            fit: 'cover',
            clip: clipDef ? clipDef.kind : 'none',
            cornerRadius: clipDef && clipDef.kind === 'rounded' ? clipDef.cornerRadius : undefined,
        };
        if (inheritedShadow) image.shadow = inheritedShadow;
        return image;
    }

    const stroke = strAttr(el, 'stroke');
    const strokeWidth = numAttr(el, 'stroke-width', 1);
    const rect: RectElement = {
        id: generateId('rect'),
        type: 'rect',
        x: numAttr(el, 'x'),
        y: numAttr(el, 'y'),
        w: numAttr(el, 'width'),
        h: numAttr(el, 'height'),
        rx: numAttr(el, 'rx') || undefined,
        fill: parseFill(el, defs),
        stroke:
            stroke && stroke !== 'none'
                ? { color: normalizeColor(stroke) ?? stroke, width: strokeWidth }
                : undefined,
    };
    if (inheritedShadow) rect.shadow = inheritedShadow;
    return rect;
};

/**
 * Compute an approximate bounding box for a path's `d` string by extracting all numeric
 * pairs. Treats them as absolute coordinates — for paths emitted by Figma (which always
 * uses absolute commands) this is exact. For paths with relative commands (lowercase m/
 * l/c) this over-estimates because it doesn't apply the running cursor. The over-estimate
 * is conservative (never crops the visible path), so selection bounds may be slightly
 * loose but never wrong-in-a-clipping-way.
 *
 * For Phase 4 this is good enough. A proper SVGPathData parser (~200 LOC) would replace
 * this in a future phase when non-uniform path resize becomes a requirement.
 */
const approximatePathBBox = (
    d: string
): { x: number; y: number; w: number; h: number } => {
    const nums = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    if (nums.length < 2) return { x: 0, y: 0, w: 0, h: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i + 1 < nums.length; i += 2) {
        const x = nums[i];
        const y = nums[i + 1];
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    }
    if (!Number.isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 };
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
};

const parsePath = (
    el: Element,
    defs: Defs,
    inheritedShadow?: ShadowEffect
): PathElement | null => {
    const d = strAttr(el, 'd');
    if (!d || !d.trim()) return null;
    const stroke = strAttr(el, 'stroke');
    const strokeWidth = numAttr(el, 'stroke-width', 1);
    const bbox = approximatePathBBox(d);
    const path: PathElement = {
        id: generateId('path'),
        type: 'path',
        x: bbox.x,
        y: bbox.y,
        w: Math.max(bbox.w, 1),
        h: Math.max(bbox.h, 1),
        d,
        naturalBBox: { x: bbox.x, y: bbox.y, w: Math.max(bbox.w, 1), h: Math.max(bbox.h, 1) },
        fill: parseFill(el, defs),
        stroke:
            stroke && stroke !== 'none'
                ? { color: normalizeColor(stroke) ?? stroke, width: strokeWidth }
                : undefined,
    };
    if (inheritedShadow) path.shadow = inheritedShadow;
    return path;
};

interface ParsedTransform {
    translateX: number;
    translateY: number;
    scaleX: number;
    scaleY: number;
    /** Rotate/skew/matrix transforms can't be cleanly baked into our IR — when present
     *  we set this flag so the caller can drop the element with a warning. */
    isUnsupported: boolean;
}

const IDENTITY_TRANSFORM: ParsedTransform = {
    translateX: 0,
    translateY: 0,
    scaleX: 1,
    scaleY: 1,
    isUnsupported: false,
};

/**
 * Parse a `transform="translate(x,y) scale(s)"` attribute into translate + scale
 * components. Returns identity for an absent or empty attribute. Sets `isUnsupported`
 * when the transform contains rotate/skew/matrix functions — the caller drops the
 * element with a warning rather than baking a wrong transform.
 */
const parseTransform = (raw: string | null): ParsedTransform => {
    if (!raw || !raw.trim()) return IDENTITY_TRANSFORM;
    if (/rotate|skew|matrix/.test(raw)) return { ...IDENTITY_TRANSFORM, isUnsupported: true };

    let translateX = 0;
    let translateY = 0;
    let scaleX = 1;
    let scaleY = 1;

    const translateMatch = raw.match(/translate\(\s*(-?\d+(?:\.\d+)?)(?:\s*,?\s*(-?\d+(?:\.\d+)?))?\s*\)/);
    if (translateMatch) {
        translateX = parseFloat(translateMatch[1]);
        translateY = translateMatch[2] ? parseFloat(translateMatch[2]) : 0;
    }
    const scaleMatch = raw.match(/scale\(\s*(-?\d+(?:\.\d+)?)(?:\s*,?\s*(-?\d+(?:\.\d+)?))?\s*\)/);
    if (scaleMatch) {
        scaleX = parseFloat(scaleMatch[1]);
        scaleY = scaleMatch[2] ? parseFloat(scaleMatch[2]) : scaleX;
    }
    return { translateX, translateY, scaleX, scaleY, isUnsupported: false };
};

/**
 * Apply a parsed transform to an element that has x/y/(w/h) coordinates. Mutates in
 * place. For paths, we shift the naturalBBox and recompute IR x/y/w/h; for other
 * elements, we apply translate+scale directly to x/y/w/h. Drop-shadow offsets are NOT
 * scaled — they're cosmetic pixel values.
 */
const applyTransformToElement = (element: DesignerElement, t: ParsedTransform): void => {
    if (t.translateX === 0 && t.translateY === 0 && t.scaleX === 1 && t.scaleY === 1) return;
    if ('x' in element) {
        (element as { x: number }).x = (element as { x: number }).x * t.scaleX + t.translateX;
    }
    if ('y' in element) {
        (element as { y: number }).y = (element as { y: number }).y * t.scaleY + t.translateY;
    }
    if ('w' in element && typeof (element as { w?: number }).w === 'number') {
        (element as { w: number }).w *= t.scaleX;
    }
    if ('h' in element && typeof (element as { h?: number }).h === 'number') {
        (element as { h: number }).h *= t.scaleY;
    }
};

const extractTextContent = (el: Element): string => {
    const tspans = Array.from(el.children).filter(c => c.tagName === 'tspan');
    if (tspans.length > 0) {
        return tspans.map(t => t.textContent ?? '').join(' ');
    }
    return el.textContent ?? '';
};

const parseTextContent = (raw: string): StringValue => {
    const trimmed = raw.trim();
    const match = trimmed.match(MUSTACHE_VAR_RE);
    if (match) return { kind: 'binding', path: match[1] };
    return { kind: 'static', value: trimmed };
};

const parseText = (el: Element): TextElement => {
    const family = strAttr(el, 'font-family') ?? '';
    const isHeading = /poppins|inter|heading|sans/i.test(family);
    const weightAttr = numAttr(el, 'font-weight', 400);
    const weight: 400 | 500 | 600 | 700 =
        weightAttr >= 700 ? 700 : weightAttr >= 600 ? 600 : weightAttr >= 500 ? 500 : 400;
    const align = (strAttr(el, 'text-anchor') ?? 'start') as 'start' | 'middle' | 'end';
    return {
        id: generateId('text'),
        type: 'text',
        x: numAttr(el, 'x'),
        y: numAttr(el, 'y'),
        content: parseTextContent(extractTextContent(el)),
        font: isHeading ? 'heading' : 'body',
        size: numAttr(el, 'font-size', 14),
        weight,
        color: normalizeColor(strAttr(el, 'fill') ?? '#000000') ?? '#000000',
        align,
        letterSpacing: numAttr(el, 'letter-spacing') || undefined,
    };
};

const parseImage = (el: Element, defs: Defs): ImageElement => {
    const href = strAttr(el, 'href') ?? strAttr(el, 'xlink:href') ?? '';
    const clipRef = parseUrlRef(strAttr(el, 'clip-path'));
    const clipDef = clipRef ? defs.clips.get(clipRef) : null;
    const preserve = strAttr(el, 'preserveAspectRatio') ?? '';
    const fit: 'cover' | 'contain' = preserve.includes('slice') ? 'cover' : 'contain';
    return {
        id: generateId('image'),
        type: 'image',
        x: numAttr(el, 'x'),
        y: numAttr(el, 'y'),
        w: numAttr(el, 'width', 100),
        h: numAttr(el, 'height', 100),
        source: { kind: 'url', value: href },
        fit,
        clip: clipDef ? clipDef.kind : 'none',
        cornerRadius: clipDef && clipDef.kind === 'rounded' ? clipDef.cornerRadius : undefined,
    };
};

const parseLine = (el: Element): DividerElement | null => {
    const x1 = numAttr(el, 'x1');
    const y1 = numAttr(el, 'y1');
    const x2 = numAttr(el, 'x2');
    const y2 = numAttr(el, 'y2');
    if (Math.abs(y2 - y1) > 1) return null;
    return {
        id: generateId('div'),
        type: 'divider',
        x: Math.min(x1, x2),
        y: (y1 + y2) / 2,
        w: Math.abs(x2 - x1),
        color: normalizeColor(strAttr(el, 'stroke') ?? '#C5C8D3') ?? '#C5C8D3',
        thickness: numAttr(el, 'stroke-width', 1),
    };
};

/**
 * Recursive SVG → IR walker. Threads an inherited shadow and a parent transform through
 * recursion so wrapping `<g filter="url(#shadow)">` propagates the shadow to children,
 * and `<g transform="translate/scale">` bakes the offset into child coordinates. Both
 * effects apply at the LEAF (rect/path/image) — intermediate `<g>` wrappers are not
 * preserved in the IR.
 */
const walk = (
    node: Element,
    defs: Defs,
    out: DesignerElement[],
    warnings: ImportWarning[],
    inheritedShadow?: ShadowEffect,
    parentTransform: ParsedTransform = IDENTITY_TRANSFORM
): number => {
    let dropped = 0;
    Array.from(node.children).forEach(child => {
        const tag = child.tagName;
        if (
            tag === 'defs' ||
            tag === 'linearGradient' ||
            tag === 'clipPath' ||
            tag === 'pattern' ||
            tag === 'filter' ||
            tag === 'use' ||
            tag === 'stop'
        ) {
            return;
        }
        if (tag === 'g') {
            const transform = parseTransform(strAttr(child, 'transform'));
            if (transform.isUnsupported) {
                warnings.push({
                    severity: 'warning',
                    message: `Dropped <g transform="${strAttr(child, 'transform')}"> — rotate / skew / matrix transforms aren't supported.`,
                });
                dropped++;
                return;
            }
            const combined: ParsedTransform = {
                translateX: parentTransform.translateX + parentTransform.scaleX * transform.translateX,
                translateY: parentTransform.translateY + parentTransform.scaleY * transform.translateY,
                scaleX: parentTransform.scaleX * transform.scaleX,
                scaleY: parentTransform.scaleY * transform.scaleY,
                isUnsupported: false,
            };
            // Detect `<g filter="url(#X)">` and propagate the shadow def to leaf elements.
            const filterRef = parseUrlRef(strAttr(child, 'filter'));
            const filterShadow = filterRef ? defs.shadows.get(filterRef) : null;
            const propagatedShadow: ShadowEffect | undefined = filterShadow
                ? {
                      offsetX: filterShadow.offsetX,
                      offsetY: filterShadow.offsetY,
                      blur: filterShadow.blur,
                      color: filterShadow.color,
                      opacity: filterShadow.opacity,
                  }
                : inheritedShadow;
            if (!filterShadow && filterRef) {
                warnings.push({
                    severity: 'warning',
                    message: `Filter <#${filterRef}> wasn't a recognized drop-shadow — non-drop-shadow filters are dropped.`,
                });
            }
            dropped += walk(child, defs, out, warnings, propagatedShadow, combined);
            return;
        }
        const isLeaf = ['rect', 'text', 'image', 'line', 'path'].includes(tag);
        if (!isLeaf) {
            if (!SUPPORTED_ROOT_TAGS.has(tag)) {
                warnings.push({
                    severity: 'warning',
                    message: `Dropped <${tag}> — not supported by the IR.`,
                });
                dropped++;
            } else {
                warnings.push({
                    severity: 'info',
                    message: `Ignored <${tag}> at this position.`,
                });
            }
            return;
        }

        let element: DesignerElement | null = null;
        if (tag === 'rect') {
            element = parseRect(child, defs, inheritedShadow);
        } else if (tag === 'text') {
            element = parseText(child);
        } else if (tag === 'image') {
            element = parseImage(child, defs);
            if (inheritedShadow && element.type === 'image') element.shadow = inheritedShadow;
        } else if (tag === 'line') {
            element = parseLine(child);
            if (!element) {
                warnings.push({
                    severity: 'warning',
                    message: 'Dropped non-horizontal <line> — only horizontal dividers are supported.',
                });
                dropped++;
                return;
            }
        } else if (tag === 'path') {
            element = parsePath(child, defs, inheritedShadow);
            if (!element) {
                warnings.push({
                    severity: 'warning',
                    message: 'Dropped <path> with empty `d` attribute.',
                });
                dropped++;
                return;
            }
        }

        if (element) {
            applyTransformToElement(element, parentTransform);
            out.push(element);
        }
    });
    return dropped;
};

const buildFallbackTemplate = (svgString: string, name: string): CredentialTemplate => {
    const encoded = `data:image/svg+xml;base64,${typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(svgString))) : ''}`;
    return {
        version: 1,
        name,
        size: { w: 360, h: 560 },
        theme: DEFAULT_THEME,
        elements: [
            {
                id: generateId('image'),
                type: 'image',
                x: 0,
                y: 0,
                w: 360,
                h: 560,
                source: { kind: 'url', value: encoded },
                fit: 'cover',
                clip: 'none',
            },
        ],
    };
};

export const parseSvgToTemplate = (svgString: string, options: ImportOptions = {}): ImportResult => {
    const warnings: ImportWarning[] = [];
    const name = options.name ?? 'Imported Template';

    let doc: Document;
    try {
        doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
    } catch (err) {
        return {
            template: null,
            warnings: [
                {
                    severity: 'warning',
                    message: `Failed to parse SVG: ${err instanceof Error ? err.message : String(err)}`,
                },
            ],
            droppedCount: 0,
            usedFallback: false,
        };
    }

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
        return {
            template: null,
            warnings: [
                {
                    severity: 'warning',
                    message: 'Input is not valid SVG — parser reported an error.',
                },
            ],
            droppedCount: 0,
            usedFallback: false,
        };
    }

    const root = doc.documentElement;
    if (root.tagName !== 'svg') {
        return {
            template: null,
            warnings: [{ severity: 'warning', message: `Expected <svg> root, got <${root.tagName}>.` }],
            droppedCount: 0,
            usedFallback: false,
        };
    }

    let w = numAttr(root, 'width', 0);
    let h = numAttr(root, 'height', 0);
    const viewBox = strAttr(root, 'viewBox');
    if (viewBox) {
        const parts = viewBox.split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts.every(n => Number.isFinite(n))) {
            if (!w) w = parts[2];
            if (!h) h = parts[3];
        }
    }
    if (!w || !h) {
        w = 360;
        h = 560;
        warnings.push({
            severity: 'info',
            message: 'No width/height/viewBox on root <svg>; defaulting to 360×560.',
        });
    }

    const defs = collectDefs(root);
    const elements: DesignerElement[] = [];
    const dropped = walk(root, defs, elements, warnings);

    if (options.useFallbackIfLossy && dropped > 0) {
        return {
            template: buildFallbackTemplate(svgString, name),
            warnings: [
                ...warnings,
                {
                    severity: 'info',
                    message:
                        'Used fallback: embedded the SVG as a single image because parts could not be parsed.',
                },
            ],
            droppedCount: dropped,
            usedFallback: true,
        };
    }

    return {
        template: {
            version: 1,
            name,
            size: { w, h },
            theme: DEFAULT_THEME,
            elements,
        },
        warnings,
        droppedCount: dropped,
        usedFallback: false,
    };
};

export { buildFallbackTemplate };
