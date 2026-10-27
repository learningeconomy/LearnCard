import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { RosterEditor, type RosterDetailsProps } from './RosterDetails';
import { IssuanceResults } from './IssuanceResults';
import { makeRun } from './fixtures.test-support';

const noop = () => {};
const makeReview = (): RosterDetailsProps => ({
    recipients: [
        { kind: 'email', rowId: 'ada', email: 'ada@example.test', displayName: 'Ada Rivera' },
        { kind: 'profile', rowId: 'bao', profileId: 'bao-example', displayName: 'Bao Patel' },
        { kind: 'email', rowId: 'cora', email: 'cora@example.test', displayName: 'Cora Chen' },
    ],
    variables: ['description', 'name'],
    longTextVariables: ['description'],
    scopes: { description: 'perRecipient', name: 'perRecipient' },
    shared: {},
    values: {
        ada: {
            name: 'Web Foundations',
            description:
                'Ada completed the Web Foundations course, built an accessible website, and presented her work to the class.\n\nHer final project demonstrates thoughtful design, clear communication, and a strong understanding of web accessibility.',
        },
        bao: {
            name: 'Web Foundations',
            description:
                'Bao designed and built a responsive community website.\n\nHis portfolio includes the final project and a reflection on the design process.',
        },
        cora: {
            name: 'Web Foundations',
            description:
                'Cora completed the course and demonstrated the required skills through a practical project.',
        },
    },
    sharedEvidence: [
        {
            id: 'course',
            type: 'document',
            title: 'Course outline.pdf',
            url: 'https://example.test/course-outline.pdf',
        },
        {
            id: 'rubric',
            type: 'link',
            title: 'Assessment criteria',
            url: 'https://example.test/assessment',
        },
    ],
    attachments: {
        ada: [
            {
                id: 'project',
                type: 'document',
                title: 'Ada final project.pdf',
                url: 'https://example.test/ada-project.pdf',
            },
        ],
    },
    evidence: {},
    problems: {},
    locked: () => false,
    onAttachmentsChange: noop,
    onRecipientsChange: noop,
    onScopeChange: noop,
    onSharedChange: noop,
    onChange: noop,
    onEvidenceChange: noop,
    onDownload: noop,
    onUpload: noop,
});

const ReviewWorkspace = () => {
    const [data, setData] = useState(makeReview);
    return (
        <div className="h-dvh bg-white">
            <RosterEditor
                {...data}
                onClose={noop}
                onChange={(id, name, value) =>
                    setData(previous => ({
                        ...previous,
                        values: {
                            ...previous.values,
                            [id]: { ...previous.values[id], [name]: value },
                        },
                    }))
                }
                onSharedChange={(name, value) =>
                    setData(previous => ({
                        ...previous,
                        shared: { ...previous.shared, [name]: value },
                    }))
                }
                onScopeChange={(name, scope) =>
                    setData(previous => ({
                        ...previous,
                        scopes: { ...previous.scopes, [name]: scope },
                    }))
                }
                onRecipientsChange={recipients =>
                    setData(previous => ({ ...previous, recipients }))
                }
                onAttachmentsChange={(id, attachments) =>
                    setData(previous => ({
                        ...previous,
                        attachments: { ...previous.attachments, [id]: attachments },
                    }))
                }
                onEvidenceChange={(id, evidence) =>
                    setData(previous => ({
                        ...previous,
                        evidence: { ...previous.evidence, [id]: evidence },
                    }))
                }
            />
        </div>
    );
};

const Outcome = ({ state }: { state: 'sent' | 'failed' | 'confirming' }) => {
    const [run] = useState(() => {
        const value = makeRun(3);
        value.outcomes = {
            'row-0': { state: 'sent' },
            'row-1': { state: 'sent' },
            'row-2': { state },
        };
        return value;
    });
    return (
        <main className="min-h-dvh bg-grayscale-100 p-4 sm:p-10 font-poppins">
            <div className="mx-auto max-w-3xl">
                <IssuanceResults
                    run={run}
                    busy={false}
                    onResume={noop}
                    onRetry={noop}
                    onDownload={noop}
                    onNew={noop}
                />
            </div>
        </main>
    );
};

// A visual interaction fixture, not an issuance transport: no credentials are sent.
const CompletionWalkthrough = () => {
    const [run, setRun] = useState(() => makeRun(3));
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        if (!busy) return;
        const timers = [1, 2, 3].map((count, index) =>
            window.setTimeout(
                () => {
                    setRun(previous => ({
                        ...previous,
                        outcomes: Object.fromEntries(
                            previous.draft.recipients.map((row, rowIndex) => [
                                row.rowId!,
                                {
                                    state:
                                        rowIndex < count ? ('sent' as const) : ('queued' as const),
                                },
                            ])
                        ),
                    }));
                    if (count === 3) setBusy(false);
                },
                1600 * (index + 1)
            )
        );
        return () => timers.forEach(window.clearTimeout);
    }, [busy]);
    return (
        <main className="min-h-dvh bg-grayscale-100 p-4 font-poppins sm:p-10">
            <div className="mx-auto max-w-3xl space-y-5">
                <p className="text-sm text-grayscale-600">
                    UI demonstration with sample recipients. No credentials are sent.
                </p>
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                        setRun(makeRun(3));
                        setBusy(true);
                    }}
                    className="rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
                >
                    Send sample credentials
                </button>
                <IssuanceResults
                    run={run}
                    busy={busy}
                    onResume={noop}
                    onRetry={noop}
                    onDownload={noop}
                    onNew={noop}
                />
            </div>
        </main>
    );
};

const meta: Meta = {
    title: 'Issue/Recipient review',
    parameters: { layout: 'fullscreen', chromatic: { viewports: [390, 1440] } },
    tags: ['issuance-review-clarity'],
};
export default meta;
type Story = StoryObj;

export const ActiveCompletion: Story = {
    render: () => <CompletionWalkthrough />,
    play: async ({ canvasElement }) => {
        await userEvent.click(
            within(canvasElement).getByRole('button', { name: 'Send sample credentials' })
        );
        const body = within(document.body);
        await expect(
            await body.findByRole('heading', { name: 'All credentials sent' }, { timeout: 10000 })
        ).toBeVisible();
        await userEvent.click(body.getByRole('button', { name: 'View delivery status' }));
        await expect(await body.findByRole('heading', { name: 'Delivery status' })).toBeVisible();
        await userEvent.click(body.getByRole('button', { name: 'Close', exact: true }));
    },
};

export const People: Story = {
    render: () => <ReviewWorkspace />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const description = canvas.getByRole('textbox', { name: 'Ada Rivera Description' });
        await expect(description.tagName).toBe('TEXTAREA');
        await expect(description).not.toHaveAttribute('maxlength');
        await userEvent.click(
            canvas.getByRole('button', { name: 'Expand Ada Rivera Description' })
        );
        await expect(description).toHaveAttribute('rows', '7');
        await userEvent.click(
            canvas.getByRole('button', { name: 'Collapse Ada Rivera Description' })
        );
        await expect(canvas.getByRole('region', { name: 'Evidence for everyone' })).toBeVisible();
        const original = (description as HTMLTextAreaElement).value;
        const oversized = 'Full paragraph\n'.repeat(400);
        await userEvent.clear(description);
        await userEvent.paste(oversized);
        await expect(description).toHaveValue(oversized);
        await expect(canvas.getByText('6,000 / 5,000 characters')).toBeVisible();
        await userEvent.clear(description);
        await userEvent.paste(original);
    },
};
export const AllSent: Story = {
    render: () => <Outcome state="sent" />,
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole('heading', { name: 'All credentials sent' })
        ).toBeVisible();
    },
};
export const Failed: Story = {
    render: () => <Outcome state="failed" />,
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).queryByRole('heading', { name: 'All credentials sent' })
        ).toBeNull();
        await expect(
            within(canvasElement).getByRole('button', { name: 'Retry Failed' })
        ).toBeEnabled();
    },
};
export const Unconfirmed: Story = {
    render: () => <Outcome state="confirming" />,
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).queryByRole('heading', { name: 'All credentials sent' })
        ).toBeNull();
        await expect(
            within(canvasElement).queryByRole('button', { name: 'Retry Failed' })
        ).toBeNull();
    },
};
