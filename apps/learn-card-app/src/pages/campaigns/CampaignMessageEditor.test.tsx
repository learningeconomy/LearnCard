import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { inAppMessageValidator } from '@learncard/types';
import { CampaignMessageEditor } from './CampaignMessageEditor';
import { removeMessageItem } from './message-editor/schemaFields';

const base = {
    title: 'Welcome',
    body: 'Hello',
    presentation: 'modal',
    frequency: 'once',
    actions: [],
};
afterEach(cleanup);
const mount = (message: unknown = base) => {
    const changed = vi.fn();
    const Harness = () => {
        const [value, setValue] = useState(JSON.stringify(message, null, 2));
        return (
            <CampaignMessageEditor
                value={value}
                campaignId="test-campaign"
                onChange={next => {
                    changed(next);
                    setValue(next);
                }}
            />
        );
    };
    render(<Harness />);
    return changed;
};
const jsonTab = () => fireEvent.click(screen.getByRole('tab', { name: 'JSON' }));
const fieldsTab = () => fireEvent.click(screen.getByRole('tab', { name: 'Fields' }));
const currentJson = () =>
    JSON.parse((screen.getByLabelText('Message JSON') as HTMLTextAreaElement).value);
const change = (label: string, value: string) =>
    fireEvent.change(screen.getAllByLabelText(label, { exact: true })[0], { target: { value } });

describe('CampaignMessageEditor', () => {
    it('defaults to Fields and does not dirty or normalize the message on mode changes', () => {
        const changed = mount({ ...base, futureSetting: { keep: true } });
        expect(screen.getByLabelText('Title', { exact: true })).toHaveValue('Welcome');
        jsonTab();
        expect(currentJson()).toEqual({ ...base, futureSetting: { keep: true } });
        fieldsTab();
        expect(changed).not.toHaveBeenCalled();
    });

    it('synchronizes both directions and preserves unexposed root and nested properties', () => {
        const original = {
            ...base,
            enabled: false,
            media: {
                type: 'image',
                url: 'https://example.com/a.png',
                aspect: '1:1',
                alt: 'Art',
                future: { focalPoint: 4 },
            },
            futureSetting: { keep: true },
            actions: [
                {
                    label: 'Go',
                    action: { type: 'externalLink', url: 'https://example.com', future: 'keep' },
                    custom: true,
                },
            ],
            locales: { es: { title: 'Hola', custom: 'keep' } },
        };
        mount(original);
        change('Title', 'Updated');
        change('Alternative text', 'Updated art');
        jsonTab();
        expect(currentJson()).toEqual({
            ...original,
            title: 'Updated',
            media: { ...original.media, alt: 'Updated art' },
        });
        change('Message JSON', JSON.stringify({ ...original, title: 'From JSON', priority: 17 }));
        fieldsTab();
        expect(screen.getAllByLabelText('Title', { exact: true })[0]).toHaveValue('From JSON');
        expect(screen.getByLabelText('Priority')).toHaveValue(17);
        expect(screen.getByLabelText('Message enabled')).not.toBeChecked();
    });

    it.each(['{', 'null', '[]', '"text"'])(
        'retains invalid raw input %s when switching to Fields',
        raw => {
            mount();
            jsonTab();
            change('Message JSON', raw);
            fieldsTab();
            expect(screen.getByText(/Your JSON has been kept exactly/)).toBeInTheDocument();
            fireEvent.click(screen.getByRole('button', { name: 'Edit JSON' }));
            expect(screen.getByLabelText('Message JSON')).toHaveValue(raw);
        }
    );

    it('offers every format and frequency, validates numeric fields, and can repair invalid objects', () => {
        mount({ ...base, title: 12 });
        expect(within(screen.getByLabelText('Format')).getAllByRole('option')).toHaveLength(5);
        expect(within(screen.getByLabelText('Frequency')).getAllByRole('option')).toHaveLength(4);
        change('Title', 'Fixed title');
        change('Frequency', '3');
        change('Days between messages', '0');
        expect(screen.getByText(/everyDays:/)).toBeInTheDocument();
        change('Days between messages', '3');
        expect(screen.getByText('Valid message')).toBeInTheDocument();
        jsonTab();
        expect(currentJson().frequency).toEqual({ everyDays: 3 });
    });

    it('constructs supported button targets, media and default flags using native controls', () => {
        mount();
        fireEvent.click(screen.getByLabelText('Media', { exact: true }));
        change('Type', 'image');
        change('URL', 'https://example.com/image.png');
        fireEvent.click(screen.getByRole('button', { name: 'Add button' }));
        expect(within(screen.getByLabelText('Button action')).getAllByRole('option')).toHaveLength(
            7
        );
        change('Button label', 'Open app');
        change('Button action', '5');
        change('App listing ID', 'example-listing');
        fireEvent.click(screen.getByLabelText('Message enabled'));
        jsonTab();
        const message = currentJson();
        expect(message.media).toEqual({
            type: 'image',
            url: 'https://example.com/image.png',
            aspect: '16:9',
        });
        expect(message.actions[0]).toEqual({
            label: 'Open app',
            style: 'secondary',
            closeOnComplete: true,
            action: { type: 'openApp', listingId: 'example-listing' },
        });
        expect(message.enabled).toBe(false);
        expect(inAppMessageValidator.safeParse({ ...message, id: 'test-campaign' }).success).toBe(
            true
        );
    });

    it('creates story and iframe configuration and confirms destructive format changes', () => {
        mount();
        change('Format', 'story');
        expect(screen.getByRole('button', { name: 'Add screen' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Add screen' }));
        change('Format', 'iframe');
        fireEvent.click(screen.getByRole('button', { name: 'Keep current format' }));
        expect(screen.getByLabelText('Format')).toHaveValue('story');
        change('Format', 'iframe');
        fireEvent.click(screen.getByRole('button', { name: 'Change format' }));
        change('URL', 'https://example.com/embed');
        expect(screen.getByText('Valid message')).toBeInTheDocument();
        jsonTab();
        expect(currentJson().steps).toBeUndefined();
        expect(currentJson().iframe).toEqual({ url: 'https://example.com/embed' });
    });

    it('edits nested targeting without flattening it and supports triggers and translations', () => {
        const targeting = { all: [{ platform: ['web'] }, { not: { role: ['admin'] } }] };
        mount({ ...base, targeting });
        change('Roles 1', 'learner');
        fireEvent.click(screen.getByLabelText('Event trigger', { exact: true }));
        change('Event', 'app.opened');
        fireEvent.click(screen.getByLabelText('Translations', { exact: true }));
        change('Language tag', 'es');
        fireEvent.click(screen.getByRole('button', { name: 'Add language' }));
        const titles = screen.getAllByLabelText('Title', { exact: true });
        fireEvent.change(titles[titles.length - 1], { target: { value: 'Hola' } });
        jsonTab();
        expect(currentJson().targeting).toEqual({
            all: [{ platform: ['web'] }, { not: { role: ['learner'] } }],
        });
        expect(currentJson().trigger).toEqual({ event: 'app.opened', windowMinutes: 10 });
        expect(currentJson().locales).toEqual({ es: { title: 'Hola' } });
    });

    it('keeps screen and button translations aligned on removal', () => {
        const message = {
            ...base,
            steps: [{ title: 'One' }, { title: 'Two', actions: [{ label: 'A' }, { label: 'B' }] }],
            actions: [{ label: 'A' }, { label: 'B' }],
            locales: {
                es: {
                    steps: [{ title: 'Uno' }, { title: 'Dos', actionLabels: ['AA', 'BB'] }],
                    actionLabels: [null, 'BB'],
                    custom: true,
                },
            },
        };
        const withoutScreen = removeMessageItem(message, ['steps'], 0);
        expect(withoutScreen.locales).toEqual({
            es: { ...message.locales.es, steps: [message.locales.es.steps[1]] },
        });
        const withoutAction = removeMessageItem(message, ['actions'], 0);
        expect(withoutAction.locales).toEqual({
            es: { ...message.locales.es, actionLabels: ['BB'] },
        });
        const withoutStepAction = removeMessageItem(message, ['steps', 1, 'actions'], 0);
        expect(withoutStepAction.locales).toEqual({
            es: {
                ...message.locales.es,
                steps: [{ title: 'Uno' }, { title: 'Dos', actionLabels: ['BB'] }],
            },
        });
        expect(message.locales.es.actionLabels).toEqual([null, 'BB']);
    });
});
