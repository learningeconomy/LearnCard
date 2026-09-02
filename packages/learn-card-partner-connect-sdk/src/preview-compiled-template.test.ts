/**
 * Regression tests for `parseCompiledTemplateObject`, the private helper
 * `previewCompiledTemplate` uses to turn compiled-but-unrendered template JSON
 * into a plain object with `{{variables}}` left intact.
 *
 * Background: `@learncard/partner-connect-core`'s `compile.ts` renders
 * `TemplateNumber` fields (currently only `credits.earned` / `credits.available`)
 * as BARE, unquoted `{{variable}}` tokens inside the compiled
 * `credentialTemplateJson` string — see `NUMERIC_SENTINEL_PREFIX` and
 * `finalizeCredentialTemplateJson` in partner-connect-core's `compile.ts`. That
 * string is intentionally NOT valid JSON until either (a) real template data is
 * rendered in (`renderCompiledTemplate`, which does a blind string substitution
 * so position doesn't matter), or (b) the SDK re-quotes the bare tokens for the
 * unrendered `compiled` preview (`parseCompiledTemplateObject`).
 *
 * `parseCompiledTemplateObject` re-quoted those tokens with a regex anchored on
 * a preceding `:` — i.e. it only recognized object-value positions
 * (`"key": {{var}}`). A bare numeric token landing as a direct ARRAY ELEMENT
 * (`[{{var}}, ...]`, no preceding colon) fell through untouched, leaving
 * invalid JSON that crashed `JSON.parse`.
 *
 * Verified finding: on the *current* Simple inline template compiler, this is
 * NOT reachable through `alignments`/`evidence` as literally suggested — every
 * field on `InlineAlignment`/`InlineEvidence` is a plain string
 * (`TemplateText`), so nothing there ever goes through the numeric-sentinel
 * path; those arrays only ever contain fully-quoted strings (see the first
 * test below). The numeric-sentinel path is only reachable via `credits.earned`
 * / `credits.available`, and both are always object-value positions, which the
 * old regex already handled correctly.
 *
 * However, the SAME finalization step (`finalizeCredentialTemplateJson`) also
 * runs for `rawCredential` templates, which copy the caller's structure
 * verbatim — so a bare numeric-sentinel token placed directly inside an array
 * (e.g. a list of scores) reproduces the exact "invalid JSON" crash the
 * finding described, just via a different door than the one it named. The
 * fix must therefore be position-agnostic rather than colon-anchored.
 */
import { previewCompiledTemplate } from './index';
import type { InlineCredentialTemplate } from './types';

describe('parseCompiledTemplateObject (via previewCompiledTemplate)', () => {
    it('alignments/evidence arrays never trigger numeric-sentinel unquoting (string-only fields)', () => {
        const template: InlineCredentialTemplate = {
            name: 'Numeric-looking alignment code',
            alignments: [
                {
                    name: 'Level {{level}}',
                    url: 'https://example.com/{{level}}',
                    code: '{{level}}',
                },
            ],
            evidence: [{ name: 'Score {{score}}', narrative: 'n/a' }],
        };

        const result = previewCompiledTemplate(template, { level: 3, score: '95' });

        expect(result.valid).toBe(true);

        const achievement = (result.compiled?.credentialSubject as Record<string, unknown>)
            ?.achievement as Record<string, unknown>;

        // Stays a quoted string both compiled and rendered — alignment/evidence
        // item fields never receive numeric-sentinel treatment.
        expect((achievement.alignment as Record<string, unknown>[])[0]?.targetCode).toBe(
            '{{level}}'
        );
    });

    it('verified failure mode: throws a JSON syntax error when a numeric-sentinel token is a bare array element', () => {
        // Mirrors exactly what compile.ts's `toNumericSentinel` +
        // `finalizeCredentialTemplateJson` produce for `credits.earned`
        // (`"__LC_NUM__{{var}}__"` -> bare `{{var}}`), but placed as array
        // elements instead of object values so there is no preceding `:`.
        const template = {
            rawCredential: {
                '@context': ['https://www.w3.org/ns/credentials/v2'],
                type: ['VerifiableCredential'],
                credentialSubject: {
                    achievement: {
                        scores: ['__LC_NUM__{{scoreOne}}__', '__LC_NUM__{{scoreTwo}}__'],
                    },
                },
            },
        } as unknown as InlineCredentialTemplate;

        // Before the fix, compileInlineTemplate emits
        // `"scores":[{{scoreOne}},{{scoreTwo}}]` — neither element has a
        // preceding colon, the old colon-anchored regex leaves both bare, and
        // `JSON.parse` throws a SyntaxError that `previewCompiledTemplate`
        // propagates uncaught instead of returning `{ valid: false, errors }`.
        expect(() => previewCompiledTemplate(template)).not.toThrow();
    });

    it('preserves {{variables}} intact in `compiled` and substitutes real numbers in `rendered` for array elements', () => {
        const template = {
            rawCredential: {
                '@context': ['https://www.w3.org/ns/credentials/v2'],
                type: ['VerifiableCredential'],
                credentialSubject: {
                    achievement: {
                        scores: ['__LC_NUM__{{scoreOne}}__', '__LC_NUM__{{scoreTwo}}__'],
                    },
                },
            },
        } as unknown as InlineCredentialTemplate;

        const preview = previewCompiledTemplate(template);
        expect(preview.valid).toBe(true);

        const compiledAchievement = (preview.compiled?.credentialSubject as Record<string, unknown>)
            ?.achievement as Record<string, unknown>;
        expect(compiledAchievement.scores).toEqual(['{{scoreOne}}', '{{scoreTwo}}']);

        const rendered = previewCompiledTemplate(template, { scoreOne: 10, scoreTwo: 20 });
        expect(rendered.valid).toBe(true);

        const renderedAchievement = (
            rendered.rendered?.credentialSubject as Record<string, unknown>
        )?.achievement as Record<string, unknown>;
        expect(renderedAchievement.scores).toEqual([10, 20]);
    });

    it('still re-quotes numeric-sentinel tokens at object-value positions (no regression)', () => {
        // credits.earned/available: the pre-existing, already-passing case —
        // must keep working exactly as before.
        const preview = previewCompiledTemplate(
            {
                name: 'Completed {{courseName}}',
                credits: { earned: '{{earnedCredits}}', available: 10 },
            },
            { courseName: 'Intro to Baking', earnedCredits: 3 }
        );

        expect(preview.valid).toBe(true);
        expect(preview.compiled?.credentialSubject).toMatchObject({
            creditsEarned: '{{earnedCredits}}',
            creditsAvailable: 10,
        });
        expect(preview.rendered?.credentialSubject).toMatchObject({
            creditsEarned: 3,
            creditsAvailable: 10,
        });
    });
});
