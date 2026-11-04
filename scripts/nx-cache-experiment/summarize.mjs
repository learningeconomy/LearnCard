import assert from 'node:assert/strict';
import { readFile, appendFile } from 'node:fs/promises';
import path from 'node:path';

const matrix = JSON.parse(process.env.MATRIX).include;
const rows = [];
for (const sample of matrix) {
    const name = `nx-result-${sample.sample}-${sample.mode}-${sample.repeat}`;
    const result = JSON.parse(
        await readFile(path.join(process.argv[2], name, 'result.json'), 'utf8')
    );
    assert.equal(result.mode, sample.mode);
    assert.equal(result.sourceSha, sample.source);
    rows.push({ ...sample, ...result });
}
assert.equal(process.env.SAMPLE_RESULT, 'success');
const paired = rows.filter(row => row.sample === 'paired');
const baseline = paired[0];
for (const row of paired) {
    assert.deepEqual(row.coverage, baseline.coverage, 'Timing arms must execute equal tests');
    assert.deepEqual(row.graph, baseline.graph, 'Timing arms must use the same dependency graph');
    if (row.mode === 'warm')
        assert.equal(
            row.tasks.filter(task => task.status === 'remote-cache').length,
            5,
            'Warm paired arm must reuse all five main build tasks'
        );
}
const invalidation = rows.find(row => row.mode === 'invalidate');
assert.equal(invalidation.tasks.find(task => task.id === 'types:build').status, 'success');
assert.notEqual(
    invalidation.tasks.find(task => task.id === 'types:build').hash,
    baseline.tasks.find(task => task.id === 'types:build').hash
);
let markdown =
    '## Native Nx task-cache pilot\n\n| Source case | Mode | Repeat | Nx command | Remote build hits |\n| --- | --- | --- | ---: | ---: |\n';
for (const row of rows)
    markdown += `| ${row.sample} | ${row.mode} | ${row.repeat} | ${(row.timings.commandMs / 1000).toFixed(1)}s | ${row.tasks.filter(task => task.status === 'remote-cache').length}/5 |\n`;
markdown +=
    '\nFour test targets executed freshly in every sample. These command times exclude checkout/install/artifact transfer; use full job timestamps for end-to-end comparisons. Main-source production cost is separate. A queue-source replay is not a live merge_group workflow proof. This manual pilot does not enable a production remote cache.\n';
console.log(markdown);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown);
