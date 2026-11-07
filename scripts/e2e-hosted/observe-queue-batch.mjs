import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { classifyQueueBatch } from './queue-batch-shadow.mjs';
import { observeGitComparison } from './queue-proof-shadow.mjs';

const query = `query QueueBatchShadow($owner: String!, $name: String!, $branch: String!) {
    repository(owner: $owner, name: $name) {
        mergeQueue(branch: $branch) {
            configuration {
                maximumEntriesToBuild maximumEntriesToMerge minimumEntriesToMerge
                minimumEntriesToMergeWaitTime mergingStrategy
            }
            entries(first: 100) {
                pageInfo { hasNextPage }
                nodes { position state solo headCommit { oid } baseCommit { oid } pullRequest { number } }
            }
        }
    }
}`;

const unknown = reason => ({ classification: 'unknown', reason, advisoryOnly: true });

/** Read-only, best-effort observation. No result from this script can gate E2E. */
const observe = () => {
    if (process.env.GITHUB_EVENT_NAME !== 'merge_group') return unknown('not_merge_group');
    if (!process.env.GITHUB_EVENT_PATH || !process.env.GITHUB_REPOSITORY)
        return unknown('missing_event_context');

    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const group = event.merge_group;
    const [owner, name, ...extra] = process.env.GITHUB_REPOSITORY.split('/');
    if (!owner || !name || extra.length || !group?.base_ref?.startsWith('refs/heads/'))
        return unknown('invalid_repository_or_base');
    const branch = group.base_ref.slice('refs/heads/'.length);
    if (!branch || group.head_sha !== process.env.GITHUB_SHA) return unknown('event_sha_mismatch');

    const raw = execFileSync(
        'gh',
        [
            'api',
            'graphql',
            '-f',
            `query=${query}`,
            '-f',
            `owner=${owner}`,
            '-f',
            `name=${name}`,
            '-f',
            `branch=${branch}`,
        ],
        { encoding: 'utf8', timeout: 8000, stdio: ['ignore', 'pipe', 'pipe'] }
    );
    const result = JSON.parse(raw);
    if (result.errors?.length || !result.data?.repository?.mergeQueue)
        return unknown('queue_unavailable');
    const queue = classifyQueueBatch(result.data.repository.mergeQueue, group.head_sha);
    const proofInputs = queue.previousCandidateSha
        ? observeGitComparison({
              cwd: process.env.GITHUB_WORKSPACE || process.cwd(),
              headSha: group.head_sha,
              previousSha: queue.previousCandidateSha,
          })
        : {
              classification: 'unknown',
              reason: 'no_previous_candidate',
              advisoryOnly: true,
              notProof: true,
          };
    return { ...queue, proofInputs };
};

let observation;
try {
    observation = observe();
} catch {
    // Fail closed for measurement: do not leak command output or interfere with E2E.
    observation = unknown('observation_failed');
}

const serialized = JSON.stringify(observation);
console.log(`Queue batch shadow (advisory only): ${serialized}`);
if (process.env.GITHUB_STEP_SUMMARY) {
    try {
        appendFileSync(
            process.env.GITHUB_STEP_SUMMARY,
            `\n### Queue batch observation\n\nAdvisory snapshot and source-tree comparison only; neither is E2E proof or authorizes skipping tests.\n\n\`\`\`json\n${serialized}\n\`\`\`\n`
        );
    } catch {
        console.warn('Queue observation could not be added to the job summary.');
    }
}
