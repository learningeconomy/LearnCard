import { resolveColor, resolveFont } from './theme';
import type {
    CredentialTemplate,
    DesignerElement,
    DividerElement,
    FieldRowElement,
    FillRef,
    ImageElement,
    RectElement,
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

const emitRect = (el: RectElement, theme: Theme, defs: Map<string, string>): string => {
    const fill = emitFill(el.fill, theme, defs);
    const rx = el.rx ? ` rx="${el.rx}"` : '';
    const stroke = el.stroke
        ? ` stroke="${resolveColor(el.stroke.color, theme)}" stroke-width="${el.stroke.width}"`
        : '';
    return `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}"${rx} fill="${fill}"${stroke}/>`;
};

const emitText = (el: TextElement, theme: Theme): string => {
    const attrs = textAttrs(el, theme);
    if (el.content.kind === 'static') {
        return `<text ${attrs}>${stringContent(el.content)}</text>`;
    }
    const { path, fallback } = el.content;
    const primary = `{{#${path}}}<text ${attrs}>{{${path}}}</text>{{/${path}}}`;
    if (!fallback) return primary;
    const fallbackMarkup = `{{^${path}}}<text ${attrs}>${escapeXml(fallback)}</text>{{/${path}}}`;
    return `${primary}${fallbackMarkup}`;
};

const emitImage = (el: ImageElement, defs: Map<string, string>): string => {
    const clipId = emitImageClip(el, defs);
    const clipAttr = clipId ? ` clip-path="url(#${clipId})"` : '';
    const preserveAspect =
        el.fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet';
    const baseAttrs = `x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" preserveAspectRatio="${preserveAspect}"${clipAttr}`;

    if (el.source.kind === 'url') {
        return `<image ${baseAttrs} href="${escapeXml(el.source.value)}"/>`;
    }
    const { path } = el.source;
    return `{{#${path}}}<image ${baseAttrs} href="{{${path}}}"/>{{/${path}}}`;
};

const emitFieldRow = (el: FieldRowElement, theme: Theme): string => {
    const labelSize = el.labelSize ?? 10;
    const valueSize = el.valueSize ?? 13;
    const labelColor = resolveColor(el.labelColor, theme);
    const valueColor = resolveColor(el.valueColor, theme);
    const headingFont = resolveFont('body', theme);

    const labelMarkup = `<text x="${el.x}" y="${el.y}" font-family="${headingFont}" font-size="${labelSize}" font-weight="700" letter-spacing="0.8" fill="${labelColor}">${escapeXml(el.label)}</text>`;

    const valueAttrs = `x="${el.x + el.w}" y="${el.y}" font-family="${headingFont}" font-size="${valueSize}" font-weight="700" fill="${valueColor}" text-anchor="end"`;
    let valueMarkup: string;
    if (el.value.kind === 'static') {
        valueMarkup = `<text ${valueAttrs}>${escapeXml(el.value.value)}</text>`;
    } else {
        const { path, fallback } = el.value;
        valueMarkup = `{{#${path}}}<text ${valueAttrs}>{{${path}}}</text>{{/${path}}}`;
        if (fallback) {
            valueMarkup += `{{^${path}}}<text ${valueAttrs}>${escapeXml(fallback)}</text>{{/${path}}}`;
        }
    }
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
            markup = emitImage(el, defs);
            break;
        case 'field-row':
            markup = emitFieldRow(el, theme);
            break;
        case 'divider':
            markup = emitDivider(el, theme);
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
