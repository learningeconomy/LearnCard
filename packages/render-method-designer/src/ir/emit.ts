import { resolveColor, resolveFont } from './theme';
import { layoutWrappedText, approximateTextWidth } from '../lib/text-wrap';
import type {
    CredentialTemplate,
    DesignerElement,
    DividerElement,
    FieldRowElement,
    FillRef,
    ImageElement,
    PathElement,
    RectElement,
    ShadowEffect,
    StringValue,
    TextElement,
    Theme,
    Visibility,
} from './types';

/**
 * Escape XML special characters in literal (non-Mustache) content. Mustache values are
 * escaped by the renderer (`{{value}}` already HTML-escapes); we only need to escape
 * literal text we inject into the SVG.
 */
const escapeXml = (s: string): string =>
    s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

/**
 * Wrap an element's emitted markup in a Mustache section if its visibility is
 * `whenPresent`. The section hides the entire element when the bound field is missing
 * from the credential data (Mustache treats undefined/null/empty-string as falsy).
 *
 * `always` (or undefined) returns the markup unchanged.
 */
const wrapVisibility = (markup: string, visibility?: Visibility): string => {
    if (!visibility || visibility.kind === 'always') return markup;
    return `{{#${visibility.path}}}${markup}{{/${visibility.path}}}`;
};

/**
 * Emit a fill attribute value. For solids, returns the resolved color string. For
 * gradients, returns `url(#gradientId)` and pushes a `<linearGradient>` definition into
 * the shared `defs` accumulator so the gradient is declared exactly once even when
 * multiple elements share a fill kind.
 *
 * Gradient ids are derived from the gradient's content + direction so two elements with
 * identical gradients reuse the same defs entry. This keeps the emitted SVG smaller and
 * makes the output stable across renders (helpful for snapshot tests).
 */
const emitFill = (fill: FillRef, theme: Theme, defs: Map<string, string>): string => {
    if (fill.kind === 'solid') return resolveColor(fill.color, theme);

    const from = resolveColor(fill.from, theme);
    const to = resolveColor(fill.to, theme);
    const id = `grad_${fill.direction}_${from.replace('#', '')}_${to.replace('#', '')}`;

    if (!defs.has(id)) {
        const coords =
            fill.direction === 'horizontal'
                ? 'x1="0%" y1="0%" x2="100%" y2="0%"'
                : fill.direction === 'vertical'
                    ? 'x1="0%" y1="0%" x2="0%" y2="100%"'
                    : 'x1="0%" y1="0%" x2="100%" y2="100%"';
        defs.set(
            id,
            `<linearGradient id="${id}" ${coords}><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></linearGradient>`
        );
    }
    return `url(#${id})`;
};

/**
 * Emit a clip-path reference for image elements with `rounded` or `circle` clip. Defs
 * are accumulated by id; the id encodes the geometry so identical clips dedupe.
 */
const emitImageClip = (el: ImageElement, defs: Map<string, string>): string | null => {
    if (el.clip === 'none') return null;
    if (el.clip === 'circle') {
        const id = `clip_circle_${el.id}`;
        const cx = el.x + el.w / 2;
        const cy = el.y + el.h / 2;
        const r = Math.min(el.w, el.h) / 2;
        defs.set(id, `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>`);
        return id;
    }
    // rounded
    const radius = el.cornerRadius ?? 12;
    const id = `clip_rounded_${el.id}`;
    defs.set(
        id,
        `<clipPath id="${id}"><rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="${radius}"/></clipPath>`
    );
    return id;
};

/**
 * Build the shared `<text>` attributes for a text element. Used by both static-content
 * and binding-content emitters so the two branches stay in sync.
 */
const textAttrs = (el: TextElement, theme: Theme): string => {
    const family = resolveFont(el.font, theme);
    const color = resolveColor(el.color, theme);
    const ls = el.letterSpacing != null ? ` letter-spacing="${el.letterSpacing}"` : '';
    return `x="${el.x}" y="${el.y}" font-family="${family}" font-size="${el.size}" font-weight="${el.weight}" fill="${color}" text-anchor="${el.align}"${ls}`;
};

const emitWrappedTextContent = (text: string, el: TextElement): string => {
    if (!el.wrap || !el.maxWidth) return escapeXml(text);
    const wrapped = layoutWrappedText(
        text,
        el,
        value => approximateTextWidth(value, el.size, el.letterSpacing ?? 0)
    );
    if (wrapped.lines.length <= 1) return escapeXml(text);
    return wrapped.lines
        .map((line, index) =>
            `<tspan x="${el.x}" dy="${index === 0 ? 0 : wrapped.lineHeightPx}">${escapeXml(line)}</tspan>`
        )
        .join('');
};

/**
 * Emit a string value as a `<text>` element body. For `static`, returns the escaped
 * literal. For `binding`, emits the Mustache reference (`{{path}}`); Mustache will
 * HTML-escape the value at render time.
 *
 * Note: this returns ONLY the text content. The caller wraps it in `<text>` with the
 * appropriate attributes — and, for bindings with a fallback, in a Mustache section
 * pair so the fallback shows when the bound field is missing.
 */
const stringContent = (sv: StringValue): string => {
    if (sv.kind === 'static') return escapeXml(sv.value);
    return `{{${sv.path}}}`;
};

/**
 * Emit a drop-shadow filter chain into the shared defs map and return the filter-id (or
 * the empty string when no shadow). The chain matches Figma's canonical drop-shadow
 * output so re-importing an emitted SVG round-trips cleanly through `parse.ts`. Filter
 * ids are derived from the shadow's content so identical shadows on multiple elements
 * dedupe to one filter definition.
 */
const emitShadow = (
    shadow: ShadowEffect | undefined,
    theme: Theme,
    defs: Map<string, string>
): string => {
    if (!shadow) return '';
    const color = resolveColor(shadow.color, theme);
    const colorMatrix = hexToColorMatrix(color, shadow.opacity);
    const id = `shadow_${shadow.offsetX}_${shadow.offsetY}_${shadow.blur}_${color.replace('#', '')}_${shadow.opacity}`;
    if (!defs.has(id)) {
        defs.set(
            id,
            `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">` +
                `<feFlood flood-opacity="0" result="BackgroundImageFix"/>` +
                `<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>` +
                `<feOffset dx="${shadow.offsetX}" dy="${shadow.offsetY}"/>` +
                `<feGaussianBlur stdDeviation="${shadow.blur / 2}"/>` +
                `<feComposite in2="hardAlpha" operator="out"/>` +
                `<feColorMatrix type="matrix" values="${colorMatrix}"/>` +
                `<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>` +
                `<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>` +
                `</filter>`
        );
    }
    return id;
};

/**
 * Convert a `#RRGGBB` color to the 5×4 SVG colorMatrix row used in the drop-shadow
 * filter (`R 0 0 0 0 / 0 G 0 0 0 / 0 0 B 0 0 / 0 0 0 opacity 0`). The bytes are
 * normalized to 0–1 floats per the SVG spec.
 */
const hexToColorMatrix = (hex: string, opacity: number): string => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return `0 0 0 0 ${r.toFixed(3)} 0 0 0 0 ${g.toFixed(3)} 0 0 0 0 ${b.toFixed(3)} 0 0 0 ${opacity.toFixed(3)} 0`;
};

const wrapWithShadow = (
    inner: string,
    shadow: ShadowEffect | undefined,
    theme: Theme,
    defs: Map<string, string>
): string => {
    const filterId = emitShadow(shadow, theme, defs);
    if (!filterId) return inner;
    return `<g filter="url(#${filterId})">${inner}</g>`;
};

const emitRect = (el: RectElement, theme: Theme, defs: Map<string, string>): string => {
    const fill = emitFill(el.fill, theme, defs);
    const rx = el.rx ? ` rx="${el.rx}"` : '';
    const stroke = el.stroke
        ? ` stroke="${resolveColor(el.stroke.color, theme)}" stroke-width="${el.stroke.width}"`
        : '';
    const inner = `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}"${rx} fill="${fill}"${stroke}/>`;
    return wrapWithShadow(inner, el.shadow, theme, defs);
};

/**
 * Emit a `<text>` element wrapping the resolved binding. Three-tier fallback when a
 * `format` is set on a binding:
 *
 *   1. Prefer `formattedValues.{path}.{format}` if present in the render data.
 *   2. Else fall back to the raw `{{path}}`.
 *   3. Else (only when an explicit `fallback` literal is provided) render the literal.
 *
 * Renderers that don't compute the `formattedValues` mirror (third-party Mustache
 * implementations) will hit tier 2 — raw ISO date instead of "July 1, 2024", but the
 * template still renders correctly. See `format-aliases.ts` in
 * `@learncard/render-method-plugin` for the convention.
 */
const emitText = (el: TextElement, theme: Theme): string => {
    const attrs = textAttrs(el, theme);
    if (el.content.kind === 'static') {
        return `<text ${attrs}>${emitWrappedTextContent(el.content.value, el)}</text>`;
    }
    return emitBoundText(el, attrs);
};

const emitBoundText = (
    el: TextElement,
    attrs: string
): string => {
    const { path, fallback, format } = el.content as { kind: 'binding'; path: string; fallback?: string; format?: string };
    const formattedPath = format ? `formattedValues.${path}.${format}` : null;

    const rawTier = `{{#${path}}}<text ${attrs}>{{${path}}}</text>{{/${path}}}`;
    const fallbackTier = fallback
        ? `{{^${path}}}<text ${attrs}>${emitWrappedTextContent(fallback, el)}</text>{{/${path}}}`
        : '';

    if (!formattedPath) return `${rawTier}${fallbackTier}`;

    const formattedTier = `{{#${formattedPath}}}<text ${attrs}>{{${formattedPath}}}</text>{{/${formattedPath}}}`;
    const formattedAbsentBranch = `{{^${formattedPath}}}${rawTier}${fallbackTier}{{/${formattedPath}}}`;
    return `${formattedTier}${formattedAbsentBranch}`;
};

const emitBoundString = (
    binding: { kind: 'binding'; path: string; fallback?: string; format?: string },
    attrs: string,
    wrapTag: 'text'
): string => {
    const { path, fallback, format } = binding;
    const formattedPath = format ? `formattedValues.${path}.${format}` : null;

    const rawTier = `{{#${path}}}<${wrapTag} ${attrs}>{{${path}}}</${wrapTag}>{{/${path}}}`;
    const fallbackTier = fallback
        ? `{{^${path}}}<${wrapTag} ${attrs}>${escapeXml(fallback)}</${wrapTag}>{{/${path}}}`
        : '';

    if (!formattedPath) {
        return `${rawTier}${fallbackTier}`;
    }

    const formattedTier = `{{#${formattedPath}}}<${wrapTag} ${attrs}>{{${formattedPath}}}</${wrapTag}>{{/${formattedPath}}}`;
    const formattedAbsentBranch = `{{^${formattedPath}}}${rawTier}${fallbackTier}{{/${formattedPath}}}`;
    return `${formattedTier}${formattedAbsentBranch}`;
};

const emitImage = (el: ImageElement, theme: Theme, defs: Map<string, string>): string => {
    const clipId = emitImageClip(el, defs);
    const clipAttr = clipId ? ` clip-path="url(#${clipId})"` : '';
    const preserveAspect =
        el.fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet';
    const baseAttrs = `x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" preserveAspectRatio="${preserveAspect}"${clipAttr}`;

    const inner =
        el.source.kind === 'url'
            ? `<image ${baseAttrs} href="${escapeXml(el.source.value)}"/>`
            : `{{#${el.source.path}}}<image ${baseAttrs} href="{{${el.source.path}}}"/>{{/${el.source.path}}}`;
    return wrapWithShadow(inner, el.shadow, theme, defs);
};

/**
 * Emit a path element. The path's `d` is in its natural coordinate space; we wrap it in
 * a `<g transform="translate(x,y) scale(sx,sy) translate(-nbx,-nby)">` chain so the
 * visible bounding box ends up at (`el.x`, `el.y`) with size (`el.w`, `el.h`).
 *
 * For non-uniform IR scales (w/h ratio ≠ naturalBBox ratio) the path stretches
 * non-proportionally — the designer's resize handles enforce proportional resize but
 * direct IR edits can violate this. Strokes scale with the path; this is a known
 * limitation of SVG transforms.
 */
const emitPath = (el: PathElement, theme: Theme, defs: Map<string, string>): string => {
    const fill = emitFill(el.fill, theme, defs);
    const stroke = el.stroke
        ? ` stroke="${resolveColor(el.stroke.color, theme)}" stroke-width="${el.stroke.width}"`
        : '';
    const sx = el.naturalBBox.w === 0 ? 1 : el.w / el.naturalBBox.w;
    const sy = el.naturalBBox.h === 0 ? 1 : el.h / el.naturalBBox.h;
    const tx = el.x;
    const ty = el.y;
    const nbx = el.naturalBBox.x;
    const nby = el.naturalBBox.y;
    const transform = `translate(${tx} ${ty}) scale(${sx} ${sy}) translate(${-nbx} ${-nby})`;
    const inner = `<g transform="${transform}"><path d="${escapeXml(el.d)}" fill="${fill}"${stroke}/></g>`;
    return wrapWithShadow(inner, el.shadow, theme, defs);
};

const emitFieldRow = (el: FieldRowElement, theme: Theme): string => {
    const labelSize = el.labelSize ?? 10;
    const valueSize = el.valueSize ?? 13;
    const labelColor = resolveColor(el.labelColor, theme);
    const valueColor = resolveColor(el.valueColor, theme);
    const headingFont = resolveFont('body', theme);

    const labelMarkup = `<text x="${el.x}" y="${el.y}" font-family="${headingFont}" font-size="${labelSize}" font-weight="700" letter-spacing="0.8" fill="${labelColor}">${escapeXml(el.label)}</text>`;

    const valueAttrs = `x="${el.x + el.w}" y="${el.y}" font-family="${headingFont}" font-size="${valueSize}" font-weight="700" fill="${valueColor}" text-anchor="end"`;
    const valueMarkup =
        el.value.kind === 'static'
            ? `<text ${valueAttrs}>${escapeXml(el.value.value)}</text>`
            : emitBoundString(el.value, valueAttrs, 'text');
    return `${labelMarkup}${valueMarkup}`;
};

const emitDivider = (el: DividerElement, theme: Theme): string => {
    const color = resolveColor(el.color, theme);
    return `<line x1="${el.x}" y1="${el.y}" x2="${el.x + el.w}" y2="${el.y}" stroke="${color}" stroke-width="${el.thickness}"/>`;
};

const emitElement = (el: DesignerElement, theme: Theme, defs: Map<string, string>): string => {
    let markup: string;
    switch (el.type) {
        case 'rect':
            markup = emitRect(el, theme, defs);
            break;
        case 'text':
            markup = emitText(el, theme);
            break;
        case 'image':
            markup = emitImage(el, theme, defs);
            break;
        case 'field-row':
            markup = emitFieldRow(el, theme);
            break;
        case 'divider':
            markup = emitDivider(el, theme);
            break;
        case 'path':
            markup = emitPath(el, theme, defs);
            break;
    }
    return wrapVisibility(markup, el.visibility);
};

/**
 * Emit a full SVG-Mustache template from the IR. The output is:
 *   <svg ...>
 *     <defs>... gradients, clip-paths ...</defs>
 *     ... elements in z-order (first element = bottom layer) ...
 *   </svg>
 *
 * The result is suitable for passing as `templateValue` to
 * `wallet.invoke.attachRenderMethod(vc, { templateValue })`.
 */
export const emitSvgMustache = (template: CredentialTemplate): string => {
    const defs = new Map<string, string>();
    const body = template.elements.map(el => emitElement(el, template.theme, defs)).join('');
    const defsMarkup = defs.size > 0 ? `<defs>${Array.from(defs.values()).join('')}</defs>` : '';
    const { w, h } = template.size;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defsMarkup}${body}</svg>`;
};

export { escapeXml };
