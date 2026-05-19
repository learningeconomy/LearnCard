import type { TextElement } from '../ir/types';

export interface WrappedTextLayout {
    lines: string[];
    lineHeightPx: number;
}

export type MeasureTextWidth = (text: string) => number;

/**
 * Fallback width estimator used outside the browser-measurement path (e.g. SVG emitter).
 * This is intentionally approximate: average Latin glyph width is ~0.55em for the fonts
 * we ship (Poppins/Inter). The emitter uses it only for static/fallback text, where a
 * small mismatch is acceptable. Canvas preview injects a real measurer via `canvas`
 * `measureText`.
 */
export const approximateTextWidth = (
    text: string,
    fontSize: number,
    letterSpacing = 0
): number => {
    if (!text) return 0;
    return text.length * fontSize * 0.56 + Math.max(0, text.length - 1) * letterSpacing;
};

const ellipsize = (
    text: string,
    maxWidth: number,
    measure: MeasureTextWidth
): string => {
    if (measure(text) <= maxWidth) return text;
    let out = text;
    while (out.length > 1 && measure(`${out}…`) > maxWidth) {
        out = out.slice(0, -1);
    }
    return `${out}…`;
};

/**
 * Wrap a string into lines that fit `element.maxWidth`. Breaks on whitespace first, then
 * falls back to character-chopping for single long tokens. Overflow policy is applied to
 * the LAST line only.
 */
export const layoutWrappedText = (
    text: string,
    element: Pick<TextElement, 'size' | 'letterSpacing' | 'maxWidth' | 'wrap'>,
    measure: MeasureTextWidth
): WrappedTextLayout => {
    const lineHeightPx = element.size * (element.wrap?.lineHeight ?? 1.2);
    if (!element.maxWidth || !element.wrap || !text.trim()) {
        return { lines: text ? [text] : [], lineHeightPx };
    }

    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    const maxLines = element.wrap.maxLines;
    const maxWidth = element.maxWidth;

    let current = '';
    const pushCurrent = () => {
        if (current) lines.push(current);
        current = '';
    };

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (measure(candidate) <= maxWidth) {
            current = candidate;
            continue;
        }

        if (!current) {
            let chopped = word;
            while (chopped.length > 1 && measure(chopped) > maxWidth) {
                chopped = chopped.slice(0, -1);
            }
            current = chopped;
            pushCurrent();
        } else {
            pushCurrent();
            current = word;
        }

        if (lines.length >= maxLines) break;
    }
    pushCurrent();

    let finalLines = lines.slice(0, maxLines);
    const overflown = lines.length > maxLines || words.join(' ') !== finalLines.join(' ');
    if (overflown && finalLines.length > 0 && element.wrap.overflow === 'ellipsis') {
        const last = finalLines[finalLines.length - 1];
        finalLines = [
            ...finalLines.slice(0, -1),
            ellipsize(last, maxWidth, measure),
        ];
    }

    return { lines: finalLines, lineHeightPx };
};
