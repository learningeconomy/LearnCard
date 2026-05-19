import { generateId } from '../store/designerStore';
import { DEFAULT_THEME } from './theme';
import type {
    CredentialTemplate,
    DesignerElement,
    DividerElement,
    FillRef,
    ImageElement,
    RectElement,
    StringValue,
    TextElement,
} from './types';

/**
 * SVG-to-IR import.
 *
 * Scope: this parser handles the SVG primitives our IR can express — `<rect>`, `<text>`,
 * `<image>`, `<line>`, plus `<linearGradient>` and `<clipPath>` references. Everything else
 * (`<path>`, `<polygon>`, `<circle>`, `<ellipse>`, transforms on `<g>`, filters, masks,
 * patterns, foreignObject, animations, scripts) produces a warning and is dropped.
 *
 * For credentials authored in our own designer this is round-trip-lossless. For arbitrary
 * SVG (Figma/Illustrator exports) it usually isn't — most of those files use `<path>` for
 * any shape that isn't a perfect rectangle. The dialog offers an "embed as background"
 * fallback for those cases: drop the unsupported SVG into a single `<image>` element using
 * a `data:image/svg+xml` URI.
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
    'linearGradient',
    'clipPath',
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

interface Defs {
    gradients: Map<string, GradientDef>;
    clips: Map<string, ClipDef>;
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

const collectDefs = (root: Element): Defs => {
    const defs: Defs = { gradients: new Map(), clips: new Map() };
    const defsEls = root.querySelectorAll('defs');
    defsEls.forEach(d => {
        Array.from(d.children).forEach(child => {
            const id = child.getAttribute('id');
            if (!id) return;
            if (child.tagName === 'linearGradient') {
                const g = parseLinearGradient(child);
                if (g) defs.gradients.set(id, g);
            } else if (child.tagName === 'clipPath') {
                const c = parseClipPath(child);
                if (c) defs.clips.set(id, c);
            }
        });
    });
    // Also accept top-level gradients/clipPaths outside <defs>
    root.querySelectorAll('linearGradient, clipPath').forEach(child => {
        const id = child.getAttribute('id');
        if (!id) return;
        if (child.tagName === 'linearGradient' && !defs.gradients.has(id)) {
            const g = parseLinearGradient(child);
            if (g) defs.gradients.set(id, g);
        } else if (child.tagName === 'clipPath' && !defs.clips.has(id)) {
            const c = parseClipPath(child);
            if (c) defs.clips.set(id, c);
        }
    });
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

const parseRect = (el: Element, defs: Defs): RectElement => {
    const stroke = strAttr(el, 'stroke');
    const strokeWidth = numAttr(el, 'stroke-width', 1);
    return {
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

const walk = (
    node: Element,
    defs: Defs,
    out: DesignerElement[],
    warnings: ImportWarning[]
): number => {
    let dropped = 0;
    Array.from(node.children).forEach(child => {
        const tag = child.tagName;
        if (tag === 'defs' || tag === 'linearGradient' || tag === 'clipPath' || tag === 'stop') {
            return;
        }
        if (tag === 'g') {
            const transform = strAttr(child, 'transform');
            if (transform && transform.trim() !== '') {
                warnings.push({
                    severity: 'warning',
                    message: `Dropped <g transform="${transform}"> — transform baking is not yet supported.`,
                });
                dropped++;
                return;
            }
            dropped += walk(child, defs, out, warnings);
            return;
        }
        if (tag === 'rect') {
            out.push(parseRect(child, defs));
            return;
        }
        if (tag === 'text') {
            out.push(parseText(child));
            return;
        }
        if (tag === 'image') {
            out.push(parseImage(child, defs));
            return;
        }
        if (tag === 'line') {
            const div = parseLine(child);
            if (div) {
                out.push(div);
            } else {
                warnings.push({
                    severity: 'warning',
                    message: 'Dropped non-horizontal <line> — only horizontal dividers are supported.',
                });
                dropped++;
            }
            return;
        }
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
