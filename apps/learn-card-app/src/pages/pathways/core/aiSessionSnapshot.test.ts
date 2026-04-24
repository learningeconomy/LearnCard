import { describe, expect, it } from 'vitest';

import {
    buildAiSessionSnapshot,
    type TopicSnapshotInput,
} from './aiSessionSnapshot';

const NOW = '2026-04-23T12:00:00.000Z';

const fullTopic: TopicSnapshotInput = {
    title: 'AWS IAM Deep Dive',
    description: 'Identity, access, and policies for AWS practitioners.',
    skills: ['IAM', 'least-privilege', 'cross-account'],
    iconUrl: 'https://cdn.example/topic.png',
};

describe('buildAiSessionSnapshot', () => {
    it('projects a full topic into a complete snapshot', () => {
        const snap = buildAiSessionSnapshot(fullTopic, { now: NOW });

        expect(snap).toEqual({
            topicTitle: 'AWS IAM Deep Dive',
            topicDescription: 'Identity, access, and policies for AWS practitioners.',
            skills: ['IAM', 'least-privilege', 'cross-account'],
            iconUrl: 'https://cdn.example/topic.png',
            snapshottedAt: NOW,
        });
    });

    it('returns null when the topic has no title', () => {
        // `title` is the one field the UI always renders — refusing to
        // snapshot without it is honest: a title-less snapshot would
        // produce a phantom "Loading…" state forever.
        expect(buildAiSessionSnapshot({ title: '' }, { now: NOW })).toBeNull();
        expect(buildAiSessionSnapshot({ title: '   ' }, { now: NOW })).toBeNull();
    });

    it('trims whitespace from all string fields', () => {
        const snap = buildAiSessionSnapshot(
            {
                title: '  AWS IAM  ',
                description: '  Deep dive  ',
                iconUrl: '  https://cdn.example/icon.png  ',
            },
            { now: NOW },
        );

        expect(snap).toEqual({
            topicTitle: 'AWS IAM',
            topicDescription: 'Deep dive',
            iconUrl: 'https://cdn.example/icon.png',
            snapshottedAt: NOW,
        });
    });

    it('omits optional fields when they are empty rather than carrying empty strings', () => {
        const snap = buildAiSessionSnapshot(
            {
                title: 'AWS IAM',
                description: '',
                iconUrl: '',
            },
            { now: NOW },
        );

        expect(snap).toEqual({
            topicTitle: 'AWS IAM',
            snapshottedAt: NOW,
        });
        expect(snap && 'topicDescription' in snap).toBe(false);
        expect(snap && 'iconUrl' in snap).toBe(false);
    });

    it('copies skills into a fresh array (not aliased to the input)', () => {
        // Defensive clone — a consumer mutating the returned snapshot
        // must not ripple back into the topic record.
        const skills = ['IAM', 'VPC'];
        const snap = buildAiSessionSnapshot(
            {
                title: 'AWS IAM',
                skills,
            },
            { now: NOW },
        );

        expect(snap?.skills).toEqual(skills);
        expect(snap?.skills).not.toBe(skills);
    });

    it('omits skills when the input provides an empty array', () => {
        const snap = buildAiSessionSnapshot(
            {
                title: 'AWS IAM',
                skills: [],
            },
            { now: NOW },
        );

        expect(snap && 'skills' in snap).toBe(false);
    });

    it('uses the provided `now` timestamp verbatim', () => {
        const snap = buildAiSessionSnapshot({ title: 'AWS IAM' }, { now: NOW });

        expect(snap?.snapshottedAt).toBe(NOW);
    });

    it('stamps the current wall-clock time when `now` is omitted', () => {
        const before = Date.now();
        const snap = buildAiSessionSnapshot({ title: 'AWS IAM' });
        const after = Date.now();

        const stamped = Date.parse(snap!.snapshottedAt);

        expect(stamped).toBeGreaterThanOrEqual(before);
        expect(stamped).toBeLessThanOrEqual(after);
    });
});
