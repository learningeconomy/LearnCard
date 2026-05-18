import type { UnsignedVC, TemplateRenderMethod } from '@learncard/types';

import {
    attachRenderMethod,
    buildTemplateRenderMethod,
    DEFAULT_TEMPLATE_ID,
    getRenderMethodPlugin,
} from '../plugin';
import { AttachRenderMethodConfig, RENDER_METHOD_CONTEXT } from '../types';

const minimalVc: UnsignedVC = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    validFrom: '2024-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:subject' },
} as UnsignedVC;

describe('buildTemplateRenderMethod', () => {
    it('builds a TemplateRenderMethod from a templateId', () => {
        const rm = buildTemplateRenderMethod({ templateId: 'https://example.com/t.svg' });

        expect(rm.type).toBe('TemplateRenderMethod');
        expect(rm.renderSuite).toBe('svg-mustache');
        expect(rm.template).toBe('https://example.com/t.svg');
        expect(rm.outputPreference).toEqual({ mediaType: 'image/svg+xml' });
        expect((rm as TemplateRenderMethod).renderProperty).toBeUndefined();
    });

    it('builds a TemplateRenderMethod from a templateValue as a URL-encoded data URI', () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>{{name}}</text></svg>';
        const rm = buildTemplateRenderMethod({ templateValue: svg });

        expect(rm.template.startsWith('data:image/svg+xml,')).toBe(true);
        const payload = rm.template.slice('data:image/svg+xml,'.length);
        expect(decodeURIComponent(payload)).toBe(svg);
    });

    it('round-trips multi-byte and special characters in templateValue', () => {
        const svg = '<svg>{{ name }}<text>åé→#?&</text></svg>';
        const rm = buildTemplateRenderMethod({ templateValue: svg });

        const payload = rm.template.slice('data:image/svg+xml,'.length);
        expect(decodeURIComponent(payload)).toBe(svg);
    });

    it('includes renderProperty only when explicitly provided', () => {
        const withProps = buildTemplateRenderMethod({
            templateId: 'https://example.com/t.svg',
            renderProperty: ['/credentialSubject/name'],
        });
        const withoutProps = buildTemplateRenderMethod({
            templateId: 'https://example.com/t.svg',
        });

        expect(withProps.renderProperty).toEqual(['/credentialSubject/name']);
        expect(withoutProps.renderProperty).toBeUndefined();
    });

    it('accepts http and https schemes for templateId', () => {
        expect(
            buildTemplateRenderMethod({ templateId: 'http://example.com/t.svg' }).template
        ).toBe('http://example.com/t.svg');
        expect(
            buildTemplateRenderMethod({ templateId: 'https://example.com/t.svg' }).template
        ).toBe('https://example.com/t.svg');
    });

    it('rejects non-http(s) templateId schemes', () => {
        expect(() =>
            buildTemplateRenderMethod({
                templateId: 'javascript:alert(1)',
            } as AttachRenderMethodConfig)
        ).toThrow(/must be an http\(s\) URL/i);

        expect(() =>
            buildTemplateRenderMethod({
                templateId: 'file:///etc/passwd',
            } as AttachRenderMethodConfig)
        ).toThrow(/must be an http\(s\) URL/i);

        expect(() =>
            buildTemplateRenderMethod({ templateId: 'data:text/html,evil' } as AttachRenderMethodConfig)
        ).toThrow(/must be an http\(s\) URL/i);
    });

    it('rejects empty or whitespace-only templateId', () => {
        expect(() =>
            buildTemplateRenderMethod({ templateId: '' } as AttachRenderMethodConfig)
        ).toThrow(/must be an http\(s\) URL/i);
        expect(() =>
            buildTemplateRenderMethod({ templateId: '   ' } as AttachRenderMethodConfig)
        ).toThrow(/must be an http\(s\) URL/i);
    });

    it('rejects empty templateValue', () => {
        expect(() =>
            buildTemplateRenderMethod({ templateValue: '' } as AttachRenderMethodConfig)
        ).toThrow(/must be a non-empty SVG/i);
        expect(() =>
            buildTemplateRenderMethod({ templateValue: '   \n  ' } as AttachRenderMethodConfig)
        ).toThrow(/must be a non-empty SVG/i);
    });

    it('rejects a config with neither templateId nor templateValue', () => {
        expect(() =>
            buildTemplateRenderMethod({} as AttachRenderMethodConfig)
        ).toThrow(/must provide either `templateId` or `templateValue`/i);
    });
});

describe('attachRenderMethod (opt-in)', () => {
    it('returns the VC unchanged when no config is provided', () => {
        const result = attachRenderMethod(minimalVc);

        expect(result).toBe(minimalVc);
        expect(result.renderMethod).toBeUndefined();
        expect(result['@context']).not.toContain(RENDER_METHOD_CONTEXT);
    });

    it('attaches a renderMethod and the render-method JSON-LD context when config is provided', () => {
        const result = attachRenderMethod(minimalVc, {
            templateId: 'https://example.com/t.svg',
        });

        expect(result).not.toBe(minimalVc);
        expect(Array.isArray(result.renderMethod)).toBe(false);
        expect((result.renderMethod as TemplateRenderMethod).template).toBe(
            'https://example.com/t.svg'
        );
        expect(result['@context']).toContain(RENDER_METHOD_CONTEXT);
    });

    it('normalizes a string @context into an array before appending', () => {
        const vcWithStringContext = {
            ...minimalVc,
            '@context': 'https://www.w3.org/ns/credentials/v2',
        } as unknown as UnsignedVC;

        const result = attachRenderMethod(vcWithStringContext, {
            templateId: 'https://example.com/t.svg',
        });

        expect(Array.isArray(result['@context'])).toBe(true);
        expect(result['@context']).toContain('https://www.w3.org/ns/credentials/v2');
        expect(result['@context']).toContain(RENDER_METHOD_CONTEXT);
    });

    it('is idempotent on @context: does not duplicate the render-method context', () => {
        const once = attachRenderMethod(minimalVc, {
            templateId: 'https://example.com/t.svg',
        });
        const twice = attachRenderMethod(once, {
            templateId: 'https://example.com/t2.svg',
        });

        const occurrences = (twice['@context'] as string[]).filter(
            c => c === RENDER_METHOD_CONTEXT
        );
        expect(occurrences.length).toBe(1);
    });

    it('wraps a pre-existing single renderMethod object into an array', () => {
        const existing: TemplateRenderMethod = {
            type: 'TemplateRenderMethod',
            renderSuite: 'svg-mustache',
            template: 'https://example.com/existing.svg',
            outputPreference: { mediaType: 'image/svg+xml' },
        };
        const vcWithExisting = { ...minimalVc, renderMethod: existing } as UnsignedVC;

        const result = attachRenderMethod(vcWithExisting, {
            templateId: 'https://example.com/new.svg',
        });

        const renderMethods = result.renderMethod as TemplateRenderMethod[];
        expect(Array.isArray(renderMethods)).toBe(true);
        expect(renderMethods).toHaveLength(2);
        expect(renderMethods[0].template).toBe('https://example.com/existing.svg');
        expect(renderMethods[1].template).toBe('https://example.com/new.svg');
    });

    it('appends to a pre-existing renderMethod array', () => {
        const existing: TemplateRenderMethod[] = [
            {
                type: 'TemplateRenderMethod',
                renderSuite: 'svg-mustache',
                template: 'https://example.com/a.svg',
                outputPreference: { mediaType: 'image/svg+xml' },
            },
            {
                type: 'TemplateRenderMethod',
                renderSuite: 'svg-mustache',
                template: 'https://example.com/b.svg',
                outputPreference: { mediaType: 'image/svg+xml' },
            },
        ];
        const vcWithArray = { ...minimalVc, renderMethod: existing } as UnsignedVC;

        const result = attachRenderMethod(vcWithArray, {
            templateId: 'https://example.com/c.svg',
        });

        const renderMethods = result.renderMethod as TemplateRenderMethod[];
        expect(renderMethods).toHaveLength(3);
        expect(renderMethods[2].template).toBe('https://example.com/c.svg');
    });

    it('propagates buildTemplateRenderMethod throws on invalid templateId', () => {
        expect(() =>
            attachRenderMethod(minimalVc, {
                templateId: 'javascript:bad',
            } as AttachRenderMethodConfig)
        ).toThrow(/must be an http\(s\) URL/i);
    });

    it('does not mutate the input VC when attaching', () => {
        const originalContext = [...(minimalVc['@context'] as string[])];
        const originalRenderMethod = minimalVc.renderMethod;

        attachRenderMethod(minimalVc, { templateId: 'https://example.com/t.svg' });

        expect(minimalVc['@context']).toEqual(originalContext);
        expect(minimalVc.renderMethod).toBe(originalRenderMethod);
    });
});

describe('getRenderMethodPlugin', () => {
    it('returns a plugin descriptor with the expected shape', () => {
        const plugin = getRenderMethodPlugin({} as never);

        expect(plugin.name).toBe('Render Method');
        expect(plugin.displayName).toBe('Render Method Plugin');
        expect(typeof plugin.methods.attachRenderMethod).toBe('function');
        expect(typeof plugin.methods.buildTemplateRenderMethod).toBe('function');
    });

    it('exposes attachRenderMethod with opt-in semantics via the plugin', () => {
        const plugin = getRenderMethodPlugin({} as never);

        const unchanged = plugin.methods.attachRenderMethod({} as never, minimalVc);
        expect(unchanged).toBe(minimalVc);

        const attached = plugin.methods.attachRenderMethod({} as never, minimalVc, {
            templateId: DEFAULT_TEMPLATE_ID,
        });
        expect(attached).not.toBe(minimalVc);
        expect(attached.renderMethod).toBeDefined();
    });

    it('exposes buildTemplateRenderMethod via the plugin', () => {
        const plugin = getRenderMethodPlugin({} as never);

        const rm = plugin.methods.buildTemplateRenderMethod({} as never, {
            templateId: 'https://example.com/t.svg',
        });
        expect(rm.type).toBe('TemplateRenderMethod');
        expect(rm.template).toBe('https://example.com/t.svg');
    });
});

describe('DEFAULT_TEMPLATE_ID', () => {
    it('points to the LearnCard template host over https', () => {
        expect(DEFAULT_TEMPLATE_ID.startsWith('https://templates.learncard.com/')).toBe(true);
    });

    it('is accepted as a valid templateId', () => {
        const rm = buildTemplateRenderMethod({ templateId: DEFAULT_TEMPLATE_ID });
        expect(rm.template).toBe(DEFAULT_TEMPLATE_ID);
    });
});
