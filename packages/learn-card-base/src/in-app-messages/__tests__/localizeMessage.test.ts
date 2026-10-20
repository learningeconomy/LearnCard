import { describe, expect, it } from 'vitest';
import { inAppMessageValidator } from '@learncard/types';
import { localizeMessage } from '../localizeMessage';

describe('message localization', () => {
    it('falls back field by field without changing the original or array lengths', () => {
        const message = inAppMessageValidator.parse({
            id: 'test',
            title: 'Base',
            body: 'Base body',
            presentation: 'story',
            steps: [{ title: 'Step', body: 'Step body' }, { title: 'Second' }],
            actions: [{ label: 'Base action', action: { type: 'dismiss' } }],
            iframe: { url: 'https://example.com/base' },
            locales: {
                es: {
                    title: 'Español',
                    body: 'Cuerpo',
                    steps: [{ title: 'Paso', body: 'Cuerpo del paso' }],
                    actionLabels: ['Listo'],
                    iframeUrl: 'https://example.com/es',
                },
                'es-MX': {
                    title: 'México',
                    steps: [{ title: 'Paso México' }],
                    actionLabels: [null],
                },
            },
        });
        const original = structuredClone(message);
        const localized = localizeMessage(message, 'ES_mx');
        expect(localized).toMatchObject({
            title: 'México',
            body: 'Cuerpo',
            actions: [{ label: 'Listo' }],
            steps: [{ title: 'Paso México', body: 'Cuerpo del paso' }, { title: 'Second' }],
            iframe: { url: 'https://example.com/es' },
        });
        expect(localizeMessage(message, 'fr').title).toBe('Base');
        expect(message).toEqual(original);
    });
    it('preserves intentionally empty translated strings', () => {
        const message = inAppMessageValidator.parse({
            id: 'x',
            title: 'Hi',
            body: 'Body',
            locales: { es: { body: '' } },
        });
        expect(localizeMessage(message, 'es').body).toBe('');
    });
    it('localizes final-screen actions independently from inherited actions with positional fallbacks', () => {
        const message = inAppMessageValidator.parse({
            id: 'step-actions',
            title: 'Story',
            presentation: 'story',
            actions: [{ label: 'Message default', action: { type: 'dismiss' } }],
            steps: [
                { title: 'First' },
                {
                    title: 'Final',
                    actions: [
                        { label: 'One', action: { type: 'dismiss' } },
                        { label: 'Two', action: { type: 'dismiss' } },
                        { label: 'Three', action: { type: 'dismiss' } },
                    ],
                },
            ],
            locales: {
                es: {
                    actionLabels: ['Mensaje'],
                    steps: [null, { actionLabels: ['Uno', 'Dos', null] }],
                },
                'es-MX': { steps: [null, { actionLabels: [null, '', null, 'Ignored'] }] },
            },
        });
        const original = structuredClone(message);
        const translated = localizeMessage(message, 'ES_mx');
        expect(translated.steps?.[1]?.actions?.map(action => action.label)).toEqual([
            'Uno',
            '',
            'Three',
        ]);
        expect(translated.actions[0]?.label).toBe('Mensaje');
        expect(translated.steps?.[0]?.actions).toBeUndefined();
        expect(localizeMessage(message, 'fr').steps?.[1]?.actions).toEqual(
            message.steps?.[1]?.actions
        );
        expect(message).toEqual(original);
    });
});
