import { z } from 'zod';

import type { CredentialTemplate, DesignerElement } from './types';

const colorRef = z.string().min(1);
const fontRef = z.enum(['heading', 'body']);

const stringValue = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('static'), value: z.string() }),
    z.object({
        kind: z.literal('binding'),
        path: z.string().min(1),
        fallback: z.string().optional(),
        format: z.string().min(1).optional(),
    }),
]);

const imageValue = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('url'), value: z.string().url() }),
    z.object({ kind: z.literal('binding'), path: z.string().min(1) }),
]);

const visibility = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('always') }),
    z.object({ kind: z.literal('whenPresent'), path: z.string().min(1) }),
]);

const fillRef = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('solid'), color: colorRef }),
    z.object({
        kind: z.literal('linear-gradient'),
        from: colorRef,
        to: colorRef,
        direction: z.enum(['horizontal', 'vertical', 'diagonal']),
    }),
]);

const shadowEffect = z.object({
    offsetX: z.number(),
    offsetY: z.number(),
    blur: z.number().nonnegative(),
    color: colorRef,
    opacity: z.number().min(0).max(1),
});

const baseElement = z.object({
    id: z.string().min(1),
    visibility: visibility.optional(),
});

const rectElement = baseElement.extend({
    type: z.literal('rect'),
    x: z.number(),
    y: z.number(),
    w: z.number().nonnegative(),
    h: z.number().nonnegative(),
    rx: z.number().nonnegative().optional(),
    fill: fillRef,
    stroke: z.object({ color: colorRef, width: z.number().nonnegative() }).optional(),
    shadow: shadowEffect.optional(),
});

const textElement = baseElement.extend({
    type: z.literal('text'),
    x: z.number(),
    y: z.number(),
    maxWidth: z.number().positive().optional(),
    wrap: z
        .object({
            lineHeight: z.number().positive(),
            maxLines: z.number().int().positive(),
            overflow: z.enum(['clip', 'ellipsis']),
        })
        .optional(),
    content: stringValue,
    font: fontRef,
    size: z.number().positive(),
    weight: z.union([z.literal(400), z.literal(500), z.literal(600), z.literal(700)]),
    color: colorRef,
    align: z.enum(['start', 'middle', 'end']),
    letterSpacing: z.number().optional(),
});

const imageElement = baseElement.extend({
    type: z.literal('image'),
    x: z.number(),
    y: z.number(),
    w: z.number().positive(),
    h: z.number().positive(),
    source: imageValue,
    fit: z.enum(['contain', 'cover']),
    clip: z.enum(['none', 'rounded', 'circle']),
    cornerRadius: z.number().nonnegative().optional(),
    shadow: shadowEffect.optional(),
});

const pathElement = baseElement.extend({
    type: z.literal('path'),
    x: z.number(),
    y: z.number(),
    w: z.number().positive(),
    h: z.number().positive(),
    d: z.string().min(1),
    naturalBBox: z.object({
        x: z.number(),
        y: z.number(),
        w: z.number().positive(),
        h: z.number().positive(),
    }),
    fill: fillRef,
    stroke: z.object({ color: colorRef, width: z.number().nonnegative() }).optional(),
    shadow: shadowEffect.optional(),
});

const fieldRowElement = baseElement.extend({
    type: z.literal('field-row'),
    x: z.number(),
    y: z.number(),
    w: z.number().positive(),
    label: z.string(),
    value: stringValue,
    labelColor: colorRef,
    valueColor: colorRef,
    labelSize: z.number().positive().optional(),
    valueSize: z.number().positive().optional(),
});

const dividerElement = baseElement.extend({
    type: z.literal('divider'),
    x: z.number(),
    y: z.number(),
    w: z.number().positive(),
    color: colorRef,
    thickness: z.number().positive(),
});

const designerElement = z.discriminatedUnion('type', [
    rectElement,
    textElement,
    imageElement,
    fieldRowElement,
    dividerElement,
    pathElement,
]);

const theme = z.object({
    colors: z.object({
        primary: z.string(),
        secondary: z.string(),
        accent: z.string(),
        surface: z.string(),
        text: z.string(),
        muted: z.string(),
        border: z.string(),
        background: z.string(),
    }),
    fonts: z.object({
        heading: z.string(),
        body: z.string(),
    }),
});

export const CredentialTemplateSchema = z.object({
    version: z.literal(1),
    name: z.string(),
    size: z.object({ w: z.number().positive(), h: z.number().positive() }),
    theme,
    elements: z.array(designerElement),
});

export const DesignerElementSchema = designerElement;

export const parseTemplate = (input: unknown): CredentialTemplate =>
    CredentialTemplateSchema.parse(input);

export const safeParseTemplate = (input: unknown) => CredentialTemplateSchema.safeParse(input);

export const parseElement = (input: unknown): DesignerElement =>
    DesignerElementSchema.parse(input);
