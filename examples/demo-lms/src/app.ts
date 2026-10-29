import { randomUUID } from 'node:crypto';

import { claimLinkFor, submitCompletion, type CompletionFields, type SubmitResult } from './brain';
import type { DemoLmsConfig } from './config';
import { verifyHealthChallenge } from './health';

export const COURSES = [
    { id: 'course-101', title: 'Intro to Verifiable Credentials' },
    { id: 'course-201', title: 'Data Stewardship for Educators' },
];

const escape = (value: string): string =>
    value.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);

/** A claim offer is the learner's only way to their credential, so it is shown as a link. */
const offerLink = (config: DemoLmsConfig, result?: SubmitResult): string =>
    result?.ok && result.issuance?.status === 'OFFERED'
        ? `<p class="offer">Claim your credential: <a id="claim-offer" href="${escape(
              claimLinkFor(result.issuance.offerUri, config.learnCardAppUrl)
          )}" data-offer-uri="${escape(result.issuance.offerUri)}">open in your wallet</a></p>`
        : '';

const page = (config: DemoLmsConfig, result?: SubmitResult): string => `<!doctype html>
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
}${offerLink(config, result)}
<form method="post" action="/complete">
<label for="learner">Learner profile ID</label><input id="learner" name="learner" required>
<label for="course">Course</label><select id="course" name="course">
${COURSES.map(c => `<option value="${c.id}">${escape(c.title)}</option>`).join('')}
</select>
<button type="submit">Mark complete</button></form></body></html>`;

const html = { 'content-type': 'text/html; charset=utf-8' };

/**
 * The JSON shape of `POST /complete` for scripted callers (the scenario runner). Brain's
 * `{code, message}` is passed through unchanged on refusal; `offerUrl` is the link the
 * page would show.
 */
export type CompleteJson =
    | {
          ok: true;
          recordId: string;
          status: 'ACCEPTED' | 'DUPLICATE';
          issuance?: Extract<SubmitResult, { ok: true }>['issuance'];
          offerUrl?: string;
      }
    | { ok: false; code: string; message: string };

const toJson = (config: DemoLmsConfig, result: SubmitResult): CompleteJson =>
    result.ok
        ? {
              ok: true,
              recordId: result.recordId,
              status: result.status,
              issuance: result.issuance,
              offerUrl:
                  result.issuance?.status === 'OFFERED'
                      ? claimLinkFor(result.issuance.offerUri, config.learnCardAppUrl)
                      : undefined,
          }
        : { ok: false, code: result.code, message: result.message };

const wantsJson = (request: Request): boolean =>
    (request.headers.get('accept') ?? '').includes('application/json');

export type Submit = (
    config: DemoLmsConfig,
    subjectProfileId: string,
    fields: CompletionFields
) => Promise<SubmitResult>;

export const createHandler =
    (config: DemoLmsConfig, submit: Submit = submitCompletion) =>
    async (request: Request): Promise<Response> => {
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
            const json = wantsJson(request);
            const form = await request.formData();
            const learner = String(form.get('learner') ?? '').trim();
            const course = COURSES.find(candidate => candidate.id === form.get('course'));
            // Scripted callers may pin the completion to replay it (idempotency).
            const completionId = String(form.get('completionId') ?? '').trim();
            if (!learner || !course) {
                return json
                    ? Response.json(
                          {
                              ok: false,
                              code: 'BAD_REQUEST',
                              message: 'learner and a known course are required',
                          },
                          { status: 400 }
                      )
                    : new Response(page(config), { status: 400, headers: html });
            }
            const result = await submit(config, learner, {
                completionId: completionId || `completion_${randomUUID()}`,
                courseId: course.id,
                courseTitle: course.title,
                completedAt: new Date().toISOString().slice(0, 10),
            });
            return json
                ? Response.json(toJson(config, result))
                : new Response(page(config, result), { headers: html });
        }

        if (url.pathname === '/') return new Response(page(config), { headers: html });

        return new Response('Not found', { status: 404 });
    };
