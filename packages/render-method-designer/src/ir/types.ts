/**
 * IR (Intermediate Representation) types for the visual credential designer.
 *
 * The IR is the canonical source of truth for a credential template. The visual editor
 * mutates the IR; the emitter (`./emit.ts`) converts the IR to SVG-Mustache when the
 * user saves. SVG-Mustache is never parsed back into IR — the IR is persisted alongside
 * the rendered template by the consumer if round-trip editing is needed.
 *
 * Design constraints baked into the IR:
 * - Element positions are absolute, in canvas coordinates. No CSS layout engine.
 * - Colors and fonts reference theme tokens by name (`$primary`, `$heading`) and the
 *   emitter resolves them. This lets a single template re-skin via the theme panel.
 * - Strings can be `static` (literal) or `binding` (Mustache path with fallback). The
 *   emitter generates the correct `{{#path}}…{{/path}}{{^path}}fallback{{/path}}` shape.
 * - Visibility is element-level. `{ kind: 'whenPresent', path }` wraps the element in
 *   a Mustache section so missing fields hide the whole element rather than rendering
 *   an empty box.
 */

/** A color reference. Either a hex literal (`#18224E`) or a theme token (`$primary`). */
export type ColorRef = string;

/** A font reference. Either a theme token (`heading`, `body`) or a literal CSS family. */
export type FontRef = 'heading' | 'body';

/**
 * A string value: literal, or a binding to a credential field path.
 *
 * Bindings can optionally specify a `format` name (e.g. `'long'` for an ISO date). When
 * set, the emitter and Canvas renderer prefer `formattedValues.{path}.{format}` and fall
 * back to the raw `path` if the formatted mirror isn't present in the render data — see
 * the `formattedValues` convention in `@learncard/render-method-plugin/format-aliases`.
 */
export type StringValue =
    | { kind: 'static'; value: string }
    | { kind: 'binding'; path: string; fallback?: string; format?: string };

/** An image source: either a literal URL or a binding to a credential field path. */
export type ImageValue =
    | { kind: 'url'; value: string }
    | { kind: 'binding'; path: string };

/** Visibility predicate. `whenPresent` wraps the element in a Mustache section. */
export type Visibility = { kind: 'always' } | { kind: 'whenPresent'; path: string };

/** Fill: solid color or two-stop linear gradient. */
export type FillRef =
    | { kind: 'solid'; color: ColorRef }
    | {
          kind: 'linear-gradient';
          from: ColorRef;
          to: ColorRef;
          direction: 'horizontal' | 'vertical' | 'diagonal';
      };

interface BaseElement {
    id: string;
    visibility?: Visibility;
}

export interface RectElement extends BaseElement {
    type: 'rect';
    x: number;
    y: number;
    w: number;
    h: number;
    rx?: number;
    fill: FillRef;
    stroke?: { color: ColorRef; width: number };
}

export interface TextElement extends BaseElement {
    type: 'text';
    x: number;
    y: number;
    maxWidth?: number;
    content: StringValue;
    font: FontRef;
    size: number;
    weight: 400 | 500 | 600 | 700;
    color: ColorRef;
    align: 'start' | 'middle' | 'end';
    letterSpacing?: number;
}

export interface ImageElement extends BaseElement {
    type: 'image';
    x: number;
    y: number;
    w: number;
    h: number;
    source: ImageValue;
    fit: 'contain' | 'cover';
    clip: 'none' | 'rounded' | 'circle';
    cornerRadius?: number;
}

export interface FieldRowElement extends BaseElement {
    type: 'field-row';
    x: number;
    y: number;
    w: number;
    label: string;
    value: StringValue;
    labelColor: ColorRef;
    valueColor: ColorRef;
    labelSize?: number;
    valueSize?: number;
}

export interface DividerElement extends BaseElement {
    type: 'divider';
    x: number;
    y: number;
    w: number;
    color: ColorRef;
    thickness: number;
}

export type DesignerElement =
    | RectElement
    | TextElement
    | ImageElement
    | FieldRowElement
    | DividerElement;

export type ElementType = DesignerElement['type'];

/** Five-color palette + heading/body fonts. Tokens are referenced by `$name` in IR. */
export interface Theme {
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        surface: string;
        text: string;
        muted: string;
        border: string;
        background: string;
    };
    fonts: {
        heading: string;
        body: string;
    };
}

/** The full IR. A credential template is a canvas size, a theme, and a flat list of elements. */
export interface CredentialTemplate {
    version: 1;
    name: string;
    size: { w: number; h: number };
    theme: Theme;
    elements: DesignerElement[];
}
