import { randomUUID } from 'node:crypto';

import { submitCompletion, type SubmitResult } from './brain';
import { loadConfig } from './config';
import { verifyHealthChallenge } from './health';

const COURSES = [
    { id: 'course-101', title: 'Intro to Verifiable Credentials' },
    { id: 'course-201', title: 'Data Stewardship for Educators' },
];

const escape = (value: string): string =>
    value.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);

const page = (result?: SubmitResult): string => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Demo LMS</title>
<style>body{font-family:system-ui;max-width:40rem;margin:3rem auto;padding:0 1rem}
label{display:block;margin:.75rem 0 .25rem}input,select{width:100%;padding:.5rem}
button{margin-top:1rem;padding:.6rem 1.2rem}.ok{color:#14532d}.err{color:#7f1d1d}</style></head>
<body><h1>Demo LMS</h1>
<p>A partner-hosted record source for EducationOS. Marking a course complete pushes one
completion record over the approved <code>record-provisioning</code> Binding. EducationOS
releases it only with the learner's consent.</p>
${
    result
        ? result.ok
            ? `<p class="ok">Record ${escape(result.status)}: ${escape(result.recordId)}</p>`
            : `<p class="err">Denied (${escape(result.code)}): ${escape(result.message)}</p>`
        : ''
}
<form method="post" action="/complete">
<label for="learner">Learner profile ID</label><input id="learner" name="learner" required>
<label for="course">Course</label><select id="course" name="course">
${COURSES.map(c => `<option value="${c.id}">${escape(c.title)}</option>`).join('')}
</select>
<button type="submit">Mark complete</button></form></body></html>`;

const html = { 'content-type': 'text/html; charset=utf-8' };
const config = loadConfig();

Bun.serve({
    port: config.port,
    fetch: async request => {
        const url = new URL(request.url);

        if (url.pathname === '/health') {
            const jti = await verifyHealthChallenge(
                request.headers.get('x-educationos-health-challenge'),
                config
            );
            return jti
                ? new Response(null, {
                      status: 204,
                      headers: { 'x-educationos-health-response': jti },
                  })
                : new Response(null, { status: 401 });
        }

        if (url.pathname === '/complete' && request.method === 'POST') {
            const form = await request.formData();
            const learner = String(form.get('learner') ?? '').trim();
            const course = COURSES.find(candidate => candidate.id === form.get('course'));
            if (!learner || !course) return new Response(page(), { status: 400, headers: html });
            const result = await submitCompletion(config, learner, {
                completionId: `completion_${randomUUID()}`,
                courseId: course.id,
                courseTitle: course.title,
                completedAt: new Date().toISOString().slice(0, 10),
            });
            return new Response(page(result), { headers: html });
        }

        if (url.pathname === '/') return new Response(page(), { headers: html });

        return new Response('Not found', { status: 404 });
    },
});

console.log(`Demo LMS listening on http://localhost:${config.port}`);
