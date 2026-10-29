/**
 * The EducationOS MVP walkthrough (WORKPLAN §1a) as an ordered step list, written only
 * against ScenarioPort so the live and in-process drivers run the same steps.
 *
 * Slice 1 runs F1–F2, S00–S12, N1, N4 and a minimal S17. S13–S16, N2, N3, O1 and N5 are
 * listed so the report shows them, and SKIP with reason 'slice 2'.
 */
import type { AuditEventView, ScenarioPort } from './port';
import { DEMO_COURSE_ID, DEMO_LMS_SLUG, need, type ScenarioIds } from './core/ids';
import {
    check,
    expectAuditSubsequence,
    expectDenied,
    expectOk,
    type ExpectedAudit,
} from './core/expect';
import { createReporter, type Reporter } from './core/report';
import { runScenario, type RunSummary } from './core/run';
import type { ScenarioOptions, Step, StepContext, StepResult } from './core/types';

const SLICE_2 = 'slice 2';

/** Brain and runner clocks can differ slightly; look a second before the run started. */
const auditFloor = (context: StepContext): string =>
    new Date(Date.parse(context.runStartedAt) - 1_000).toISOString();

const eventsSince = async (
    context: StepContext,
    ecosystemId: string
): Promise<AuditEventView[]> => {
    const floor = Date.parse(auditFloor(context));
    return (await context.port.auditEvents({ ecosystemId, limit: 500 })).filter(
        event => Date.parse(event.timestamp) >= floor
    );
};

const expectAuditSince = async (
    context: StepContext,
    ecosystemId: string,
    actions: readonly ExpectedAudit[]
): Promise<void> => {
    expectAuditSubsequence(
        await context.port.auditEvents({ ecosystemId, limit: 500 }),
        actions,
        auditFloor(context)
    );
};

const passed = (results: readonly StepResult[], id: string): boolean =>
    results.some(
        result =>
            result.id === id &&
            (result.status === 'PASS' || result.status === 'WARN' || result.status === 'OBSERVED')
    );

const completionFor = (context: StepContext, suffix: string): string =>
    `scenario-${context.runId}-${suffix}`;

const labelDirectInLive = (context: StepContext): void => {
    if (context.port.driver === 'live') context.label('DIRECT');
};

const deferred = (
    id: string,
    title: string,
    kind: Step['kind'],
    via: Step['via'],
    needs: (keyof ScenarioIds)[] = []
): Step => ({
    id,
    title,
    needs,
    produces: [],
    kind,
    via,
    deferred: SLICE_2,
    run: async () => undefined,
});

export const MVP_STEPS: readonly Step[] = [
    {
        id: 'S00',
        title: 'doctor: dev stack ready',
        needs: [],
        produces: [],
        kind: 'SETUP',
        via: 'DIRECT',
        drivers: ['live'],
        gate: true,
        run: async context => {
            const { runDoctor, doctorStatus } = await import('./doctor');
            const checks = await runDoctor();
            for (const item of checks.filter(candidate => candidate.status !== 'PASS')) {
                context.note(
                    `${item.status} ${item.name}: ${item.detail}${item.fix ? ` → ${item.fix}` : ''}`
                );
            }
            const status = doctorStatus(checks);
            const failing = checks.filter(item => item.status === 'FAIL').map(item => item.name);
            check(status !== 'FAIL', `doctor failed: ${failing.join(', ')}`);
            if (status === 'WARN') {
                return {
                    status: 'WARN',
                    reason: `${checks.filter(item => item.status === 'WARN').length} warning(s)`,
                };
            }
            return undefined;
        },
    },
    {
        id: 'F1',
        title: 'root ecosystem with the operator as OWNER',
        needs: [],
        produces: ['rootEcosystemId', 'operatorProfileId'],
        kind: 'SETUP',
        via: 'DIRECT',
        run: async context => {
            context.label('DIRECT');
            const foundation = await context.port.ensureFoundation();
            check(
                foundation.operatorRole === 'OWNER',
                `operator ${foundation.operatorProfileId} is ${foundation.operatorRole} of ${foundation.rootEcosystemId}, expected OWNER`
            );
            context.ids.rootEcosystemId = foundation.rootEcosystemId;
            context.ids.operatorProfileId = foundation.operatorProfileId;
        },
    },
    {
        id: 'F2',
        title: 'signed Demo LMS listing',
        needs: [],
        produces: ['listingId', 'versionId'],
        kind: 'SETUP',
        via: 'DIRECT',
        run: async context => {
            context.label('DIRECT');
            const listing = await context.port.ensureListing();
            // Live on a non-default LMS port publishes its own `demo-lms-scenario` listing so
            // a developer's `demo-lms` install keeps its pinned health URL.
            check(
                listing.slug === DEMO_LMS_SLUG || listing.slug === `${DEMO_LMS_SLUG}-scenario`,
                `listing slug is ${listing.slug}`
            );
            context.note(`health endpoint pinned at ${listing.healthUrl}`);
            context.ids.listingId = listing.listingId;
            context.ids.versionId = listing.versionId;
        },
    },
    {
        id: 'S01',
        title: 'state enables the Demo LMS listing',
        needs: ['rootEcosystemId', 'listingId'],
        produces: [],
        kind: 'PRODUCT',
        via: 'CONSOLE',
        run: async context => {
            const { port, ids } = context;
            const rootEcosystemId = need(ids, 'rootEcosystemId');
            const listingId = need(ids, 'listingId');
            const enabled = await port.enableListing({ ecosystemId: rootEcosystemId, listingId });
            if (enabled.written) {
                // A permissive catalog shows every listing, so visibility alone cannot prove
                // the enablement was written: check the policy itself, then read it back.
                check(
                    enabled.allowedListings?.includes(listingId),
                    `enable returned allowedListings ${JSON.stringify(enabled.allowedListings)} without ${listingId}`
                );
                const policy = await port.catalogPolicy(rootEcosystemId);
                check(
                    policy.allowedListings?.includes(listingId),
                    `catalog policy of ${rootEcosystemId} does not allow ${listingId} after enable`
                );
            }
            const visible = await port.visibleListings(rootEcosystemId);
            check(
                visible.some(listing => listing.listingId === listingId),
                `Demo LMS is not in the catalog of ${rootEcosystemId}`
            );
            if (!enabled.written) {
                return {
                    status: 'WARN',
                    reason:
                        `${rootEcosystemId} has an unrestricted catalog; enablement not exercised ` +
                        '(the first enable would curate the shared root to this listing only)',
                };
            }
            return undefined;
        },
    },
    {
        id: 'S02',
        title: 'district with learners A and B as members',
        needs: ['rootEcosystemId', 'listingId'],
        produces: ['districtId', 'learnerA', 'learnerB'],
        kind: 'PRODUCT',
        via: 'CONSOLE',
        run: async context => {
            const { port, ids, runId, options } = context;
            const listingId = need(ids, 'listingId');
            const { ecosystemId } = await port.createDistrict({
                parentEcosystemId: need(ids, 'rootEcosystemId'),
                name: `Scenario district ${runId}`,
                slug: `scenario-${runId}`,
                reuseId: options.districtId,
            });
            if (options.districtId) context.note(`reusing district ${ecosystemId}`);
            // The state enablement (S01) is inherited by the district.
            const visible = await port.visibleListings(ecosystemId);
            check(
                visible.some(listing => listing.listingId === listingId),
                `Demo LMS is not inherited into ${ecosystemId}`
            );
            const rootPolicy = await port.catalogPolicy(need(ids, 'rootEcosystemId'));
            if (rootPolicy.unrestricted) {
                context.note('root catalog is unrestricted: visibility does not prove inheritance');
            }

            const learnerA = await port.ensureWallet('learnerA');
            const learnerB = await port.ensureWallet('learnerB');
            for (const learner of [learnerA, learnerB]) {
                await port.grantMember({
                    ecosystemId,
                    profileId: learner.profileId,
                    role: 'MEMBER',
                });
            }
            const members = await port.listMembers(ecosystemId);
            for (const learner of [learnerA, learnerB]) {
                check(
                    members.some(member => member.profileId === learner.profileId),
                    `${learner.profileId} is not listed as a member of ${ecosystemId}`
                );
            }
            ids.districtId = ecosystemId;
            ids.learnerA = learnerA;
            ids.learnerB = learnerB;
        },
    },
    {
        id: 'S03',
        title: 'district issuing identity',
        needs: ['districtId'],
        produces: ['issuer'],
        kind: 'PRODUCT',
        via: 'CONSOLE',
        run: async context => {
            const districtId = need(context.ids, 'districtId');
            const identity = await context.port.provisionIssuer({
                ecosystemId: districtId,
                name: 'Scenario District',
            });
            check(identity.signingReady, `issuing identity ${identity.did} is not signingReady`);
            const audited = (event: AuditEventView): boolean =>
                event.action === 'ISSUING_IDENTITY_PROVISIONED' &&
                event.afterSummary?.profileId === identity.profileId;
            if (!(await eventsSince(context, districtId)).some(audited)) {
                // Provisioning is idempotent: an already signingReady identity is returned
                // without a new audit event, which only a reused district can hold.
                check(
                    context.options.districtId,
                    `no ISSUING_IDENTITY_PROVISIONED audit event this run for ${identity.profileId}`
                );
                context.note(`issuing identity ${identity.profileId} already provisioned`);
            }
            context.ids.issuer = {
                did: identity.did,
                groupId: identity.groupId,
                profileId: identity.profileId,
            };
        },
    },
    {
        id: 'S04',
        title: 'plan the Demo LMS install',
        needs: ['districtId', 'listingId', 'versionId'],
        produces: ['intentId', 'intent', 'freshInstall'],
        kind: 'PRODUCT',
        via: 'CONSOLE',
        run: async context => {
            const { port, ids } = context;
            const intent = await port.plan({
                ecosystemId: need(ids, 'districtId'),
                listingId: need(ids, 'listingId'),
                versionId: need(ids, 'versionId'),
            });
            check(intent.planHash, 'plan has no planHash');
            ids.intentId = intent.intentId;
            ids.intent = intent;
            ids.freshInstall = intent.approvalState === 'PENDING_ADOPTION';
            if (!ids.freshInstall) {
                // Only a reused district can already hold an adopted intent.
                check(
                    context.options.districtId,
                    `new plan is ${intent.approvalState}, expected PENDING_ADOPTION`
                );
                context.note(`reusing intent ${intent.intentId} (${intent.approvalState})`);
            }
        },
    },
    {
        id: 'S05',
        title: 'approve and apply; integration install and ServiceAccount materialise',
        needs: ['districtId', 'intent'],
        produces: ['installId', 'serviceAccountId'],
        kind: 'PRODUCT',
        via: 'CONSOLE',
        run: async context => {
            const { port, ids } = context;
            const districtId = need(ids, 'districtId');
            let intent = need(ids, 'intent');
            if (intent.approvalState === 'PENDING_ADOPTION') {
                intent = await port.approve(intent);
                check(intent.approvalState === 'APPROVED', `approval is ${intent.approvalState}`);
                intent = await port.apply(intent);
            }
            ids.intent = intent;
            // Apply reconciles synchronously, so the target exists now: read once, no polling.
            const target = await port.findInstallTarget({
                ecosystemId: districtId,
                intentId: intent.intentId,
            });
            check(target, `no INTEGRATION_INSTALL target for intent ${intent.intentId}`);
            const account = await port.readServiceAccount({ installId: target.installId });
            check(account, `no ServiceAccount for install ${target.installId}`);
            if (ids.freshInstall) {
                check(
                    account.status === 'PROVISIONED',
                    `ServiceAccount is ${account.status}, expected PROVISIONED`
                );
            } else {
                context.note(`ServiceAccount is ${account.status}`);
            }
            ids.installId = target.installId;
            ids.serviceAccountId = account.id;
        },
    },
    {
        id: 'S06',
        title: 'issue the integration credential to the partner',
        needs: ['districtId', 'installId', 'serviceAccountId'],
        produces: ['partnerReady'],
        kind: 'PRODUCT',
        via: 'BRAIN',
        run: async context => {
            const { port, ids } = context;
            const serviceAccountId = need(ids, 'serviceAccountId');
            const districtId = need(ids, 'districtId');
            labelDirectInLive(context);
            await port.issueCredential({
                serviceAccountId,
                ecosystemId: districtId,
                installId: need(ids, 'installId'),
            });
            expectOk(await port.exchangeToken({ serviceAccountId }), 'token exchange');
            await expectAuditSince(context, districtId, ['SERVICE_ACCOUNT_CREDENTIAL_ISSUED']);
            ids.partnerReady = true;
        },
    },
    {
        id: 'S07',
        title: 'on-demand health probe enables the ServiceAccount',
        needs: ['serviceAccountId', 'partnerReady'],
        produces: ['partnerHealthy'],
        kind: 'PRODUCT',
        via: 'BRAIN',
        run: async context => {
            context.label('DEV-PROBE');
            const probe = await context.port.probeHealth({
                serviceAccountId: need(context.ids, 'serviceAccountId'),
            });
            check(
                !probe.blockedBy,
                `probe blocked by ${probe.blockedBy}: ${probe.blockedDetail ?? ''}`
            );
            check(
                probe.status === 'ENABLED',
                `ServiceAccount is ${probe.status}` +
                    (probe.enableCause ? ` (${probe.enableCause})` : '') +
                    (probe.disabledCause ? ` (disabledCause ${probe.disabledCause})` : '')
            );
            check(probe.healthFailures === 0, `healthFailures is ${probe.healthFailures}`);
            context.ids.partnerHealthy = true;
        },
    },
    {
        id: 'S08',
        title: 'district governs and accepts the data-sharing agreement',
        needs: ['districtId'],
        produces: ['contractId', 'contractUri'],
        kind: 'SETUP',
        via: 'DIRECT',
        run: async context => {
            context.label('DIRECT');
            const governance = await context.port.governAndAccept({
                ecosystemId: need(context.ids, 'districtId'),
            });
            context.ids.contractId = governance.contractId;
            context.ids.contractUri = governance.contractUri;
        },
    },
    {
        id: 'S09',
        title: 'push binding: propose → preflight → approve',
        needs: ['districtId', 'installId', 'issuer', 'contractId'],
        produces: ['bindingId', 'bindingRevision'],
        kind: 'PRODUCT',
        via: 'CONSOLE',
        run: async context => {
            const { port, ids } = context;
            const districtId = need(ids, 'districtId');
            const proposed = await port.proposeBinding({
                ecosystemId: districtId,
                installId: need(ids, 'installId'),
                issuer: need(ids, 'issuer'),
                delivery: 'push',
            });
            const preflight = await port.preflight({ bindingId: proposed.bindingId });
            check(
                preflight.satisfied,
                `preflight unsatisfied: ${preflight.missing.map(item => item.code).join(', ')}`
            );
            const binding = await port.approveBinding({
                bindingId: proposed.bindingId,
                expectedRevision: preflight.bindingRevision,
                preflightId: preflight.preflightId,
                preflightHash: preflight.hash,
            });
            check(binding.status === 'ACTIVE', `binding is ${binding.status}, expected ACTIVE`);
            await expectAuditSince(context, districtId, [
                'BINDING_PROPOSED',
                'BINDING_APPROVED',
                'BINDING_ACTIVATED',
            ]);
            ids.bindingId = binding.bindingId;
            ids.bindingRevision = binding.revision;
        },
    },
    {
        id: 'N1',
        title: 'learner B (never consented) is refused',
        needs: ['bindingId', 'learnerB', 'partnerHealthy'],
        produces: [],
        kind: 'NEGATIVE',
        via: 'PARTNER',
        run: async context => {
            const { port, ids } = context;
            const learnerB = need(ids, 'learnerB');
            const bindingId = need(ids, 'bindingId');
            expectDenied(
                await port.submit({
                    subject: learnerB,
                    completionId: completionFor(context, 'b1'),
                    courseId: DEMO_COURSE_ID,
                }),
                'CONSENT_DENIED',
                'FORBIDDEN'
            );
            const floor = Date.parse(auditFloor(context));
            const decisions = await port.consentDecisions({ bindingId });
            check(
                decisions.some(
                    decision =>
                        decision.subjectProfileId === learnerB.profileId &&
                        decision.decision === 'DENY' &&
                        decision.reasonCodes.includes('CONSENT_INACTIVE') &&
                        Date.parse(decision.occurredAt) >= floor
                ),
                'no DENY ConsentDecisionRecord with CONSENT_INACTIVE for learner B'
            );
        },
    },
    {
        id: 'S10',
        title: 'learner A consents to the agreement',
        needs: ['learnerA', 'contractUri'],
        produces: ['termsUri'],
        kind: 'PRODUCT',
        via: 'WALLET',
        run: async context => {
            const consent = await context.port.consent({
                wallet: need(context.ids, 'learnerA'),
                contractUri: need(context.ids, 'contractUri'),
                via: 'contract',
            });
            check(consent.termsUri, 'consent returned no terms URI');
            context.ids.termsUri = consent.termsUri;
        },
    },
    {
        id: 'S11',
        title: 'partner submits a completion; credential issued (push)',
        needs: ['learnerA', 'bindingId', 'termsUri', 'partnerHealthy'],
        produces: ['completionId', 'recordId'],
        kind: 'PRODUCT',
        via: 'PARTNER',
        run: async context => {
            const { port, ids } = context;
            if (port.mockSigner) context.label('MOCK-SIGNER');
            const completionId = completionFor(context, 'a1');
            const released = expectOk(
                await port.submit({
                    subject: need(ids, 'learnerA'),
                    completionId,
                    courseId: DEMO_COURSE_ID,
                }),
                'submit'
            );
            check(
                released.status === 'ACCEPTED',
                `release is ${released.status}, expected ACCEPTED`
            );
            check(
                released.issuance?.status === 'ISSUED',
                `issuance is ${released.issuance?.status ?? 'absent'}, expected ISSUED`
            );
            ids.completionId = completionId;
            ids.recordId = released.recordId;
            ids.credentialUri = released.issuance.credentialUri;
        },
    },
    {
        id: 'S12',
        title: 'resubmitting the same completion is a DUPLICATE',
        needs: ['learnerA', 'completionId', 'recordId'],
        produces: [],
        kind: 'PRODUCT',
        via: 'PARTNER',
        run: async ({ port, ids }) => {
            const again = expectOk(
                await port.submit({
                    subject: need(ids, 'learnerA'),
                    completionId: need(ids, 'completionId'),
                    courseId: DEMO_COURSE_ID,
                }),
                'resubmit'
            );
            check(again.status === 'DUPLICATE', `resubmit is ${again.status}, expected DUPLICATE`);
            check(
                again.recordId === need(ids, 'recordId'),
                `resubmit returned record ${again.recordId}, expected ${ids.recordId}`
            );
        },
    },
    deferred('S13', 'learner A claims the pushed credential', 'PRODUCT', 'WALLET'),
    deferred('S14', 'revoke the push binding; approve an offer binding', 'PRODUCT', 'CONSOLE'),
    deferred('S15', 'partner submits; claim offer returned (offer)', 'PRODUCT', 'PARTNER'),
    deferred('N2', 'another wallet cannot claim the offer', 'NEGATIVE', 'WALLET'),
    deferred('S16', 'learner A claims the offer', 'PRODUCT', 'WALLET'),
    deferred('N3', 'withdrawn consent refuses the next submit', 'NEGATIVE', 'WALLET'),
    deferred('O1', 'offer stays claimable after withdraw', 'OBSERVE', 'WALLET'),
    {
        id: 'N4',
        title: 'revoked binding refuses the next submit',
        needs: [
            'bindingId',
            'bindingRevision',
            'learnerA',
            'districtId',
            'serviceAccountId',
            // The refusal must come from the binding check, so the partner must be healthy.
            'partnerHealthy',
        ],
        produces: [],
        kind: 'NEGATIVE',
        via: 'CONSOLE',
        run: async context => {
            const { port, ids } = context;
            const districtId = need(ids, 'districtId');
            const serviceAccountId = need(ids, 'serviceAccountId');
            const revoked = await port.revokeBinding({
                bindingId: need(ids, 'bindingId'),
                expectedRevision: need(ids, 'bindingRevision'),
            });
            check(revoked.status === 'REVOKED', `binding is ${revoked.status}, expected REVOKED`);
            ids.bindingRevision = revoked.revision;
            expectDenied(
                await port.submit({
                    subject: need(ids, 'learnerA'),
                    completionId: completionFor(context, 'a-revoked'),
                    courseId: DEMO_COURSE_ID,
                }),
                'NO_ACTIVE_BINDING',
                'FORBIDDEN'
            );
            const events = await eventsSince(context, districtId);
            check(
                events.some(
                    event =>
                        event.action === 'BINDING_REVOKED' && event.bindingId === revoked.bindingId
                ),
                'no BINDING_REVOKED audit event for the binding'
            );
            // The DENY carries no bindingId (known gap), so match it by ecosystem and account.
            check(
                events.some(
                    event =>
                        event.action === 'RECORD_PROVISION_DENY' &&
                        event.afterSummary?.serviceAccountId === serviceAccountId &&
                        event.afterSummary?.reason === 'NO_ACTIVE_BINDING'
                ),
                'no RECORD_PROVISION_DENY (NO_ACTIVE_BINDING) audit event for the ServiceAccount'
            );
        },
    },
    deferred('N5', 'health flip disables, one probe re-enables', 'NEGATIVE', 'BRAIN'),
    {
        id: 'S17',
        title: 'audit trail shows every step in order',
        needs: ['districtId'],
        produces: [],
        kind: 'AUDIT',
        via: 'CONSOLE',
        run: async context => {
            const { ids, results } = context;
            const districtId = need(ids, 'districtId');
            const expected: ExpectedAudit[] = [];
            const add = (stepId: string, actions: ExpectedAudit[]): void => {
                if (passed(results, stepId)) expected.push(...actions);
            };
            if (ids.freshInstall) {
                add('S04', [['PLAN_CREATED', 'PLAN_UPDATED']]);
                add('S05', ['APPROVED', 'APPLIED']);
            }
            add('S06', ['SERVICE_ACCOUNT_CREDENTIAL_ISSUED']);
            add('S09', ['BINDING_PROPOSED', 'BINDING_APPROVED', 'BINDING_ACTIVATED']);
            add('N1', ['RECORD_PROVISION_DENY']);
            add('S11', ['RECORD_PROVISION_ALLOW', 'RECORD_CREDENTIAL_ISSUED']);
            add('S12', ['RECORD_PROVISION_ALLOW']);
            add('N4', ['BINDING_REVOKED', 'RECORD_PROVISION_DENY']);
            check(expected.length, 'no audited step passed; nothing to check');

            const events = await eventsSince(context, districtId);
            expectAuditSubsequence(events, expected, auditFloor(context));
            context.note(`matched ${expected.length} audit positions`);

            // Known gaps (owner decision 2026-10-29: WARN now, FAIL once fixed).
            const gaps: string[] = [];
            if (passed(results, 'N4')) {
                const deny = events
                    .filter(event => event.action === 'RECORD_PROVISION_DENY')
                    .find(event => event.afterSummary?.reason === 'NO_ACTIVE_BINDING');
                if (deny && !deny.bindingId) gaps.push('DENY after revoke has no bindingId');
            }
            context.note(
                'not exercised in slice 1: withdraw audit (N3), cascade-revoke BINDING_REVOKED'
            );
            if (gaps.length)
                return { status: 'WARN', reason: `known audit gaps: ${gaps.join('; ')}` };
            return undefined;
        },
    },
];

export const newRunId = (): string =>
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Runs MVP_STEPS against a port; shared by cli.ts and the vitest wrapper. */
export const runMvpWalkthrough = async (input: {
    port: ScenarioPort;
    options: ScenarioOptions;
    runId: string;
    reporter?: Reporter;
}): Promise<RunSummary> =>
    runScenario({
        steps: MVP_STEPS,
        port: input.port,
        options: input.options,
        runId: input.runId,
        reporter: input.reporter ?? createReporter(input.options.json),
    });
