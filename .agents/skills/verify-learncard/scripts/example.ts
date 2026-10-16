/**
 * Reference ad-hoc verification script: one of everything `v` offers.
 *
 *   bun run --cwd apps/learn-card-app lc verify script \
 *       .agents/skills/verify-learncard/scripts/example.ts --dir /tmp/lcv
 *
 * Copy it, keep the parts you need, and assert the behavior *your* change introduced.
 * Reuse an owned --dir for quick iterations; do not run the full catalog after every edit.
 * All endpoint access comes from v.stack, never fixed dev ports.
 */
import type { VerificationScript } from '../../../../apps/learn-card-app/scripts/verification/script';

const script: VerificationScript = async v => {
    const { learner, issuer } = v.actors;

    // SDK (checkout source) as the issuer; `sdk()` creates the network profile if needed.
    const { issuerLc, verification } = await v.step(null, 'example-sdk-proof', async () => {
        const issuerLc = await v.sdk(issuer);
        const credential = await issuerLc.invoke.issueCredential(issuerLc.invoke.getTestVc());
        const verification = await issuerLc.invoke.verifyCredential(credential);
        v.expect(verification.errors).toEqual([]);
        return { issuerLc, verification };
    });

    // Web app as the learner: real seed sign-in, then a captured user action.
    const page = await v.newPage('learner', { signInAs: learner });
    await v.step(page, 'open-passport', async () => {
        await page.getByRole('link', { name: 'Passport', exact: true }).click();
        await v.expect(page).toHaveURL(/\/passport/);
    });

    // The learner's own SDK wallet (same seed as the browser session) sees the same profile.
    const learnerLc = await v.sdk(learner);
    v.expect((await learnerLc.invoke.getProfile())?.profileId).toBe(learner.profileId);

    // The `learncard` CLI, pinned to the owned network. A workdir keeps one CLI identity (.env).
    const init = await v.cli(['init', '--yes', '--json', '--name', 'Example Issuer'], 'example');
    v.expect(init.exitCode, init.stderr).toBe(0);
    const whoami = await v.cli(['whoami', '--json'], 'example');
    v.expect(whoami.exitCode, whoami.stderr).toBe(0);

    // Read-only corroboration from the network graph.
    const profiles = await v.db.neo4j(
        `MATCH (p:Profile) WHERE p.profileId IN ['${learner.profileId}', '${issuer.profileId}'] RETURN count(p) AS n`
    );
    v.expect(profiles).toMatch(/^n\n2$/m);

    // Returned values land in report.json next to the screenshots and traces.
    return {
        issuerDid: issuerLc.id.did(),
        checks: verification.checks,
        cliWhoami: whoami.json,
    };
};

export default script;
