/**
 * The EducationOS MVP walkthrough (WORKPLAN §1a) as an ordered step list, written only
 * against ScenarioPort so the live and in-process drivers run the same steps.
 *
 * Slice 1 covers fixtures, install, push binding and push issuance (F1–F2, S00–S12, N1, N4);
 * slice 2 adds the learner's claims, the offer lane, consent withdrawal and the health flip
 * (S13–S16, N2, N3, O1, N5, and in-process N6). S17 checks the whole audit trail.
 */
import type { AuditEventView, ClaimedCredentialView, ScenarioPort } from './port';
import {
    DEMO_COURSE_ID,
    DEMO_LMS_SLUG,
    need,
    type ScenarioIssuer,
    type ScenarioWallet,
} from './core/ids';
import {
    check,
    expectAuditSubsequence,
    expectDenied,
    expectOk,
    toScenarioError,
    type ExpectedAudit,
} from './core/expect';
import { createReporter, type Reporter } from './core/report';
import { runScenario, type RunSummary } from './core/run';
import type { ScenarioOptions, Step, StepContext, StepResult } from './core/types';

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

/** Brain issues to the learner's did:web for push and to the presenting did:key for offers. */
const isLearnersDid = (did: string | undefined, learner: ScenarioWallet): boolean =>
    did === learner.did || Boolean(did?.endsWith(`:users:${learner.profileId}`));

/**
 * A credential the learner holds verifies, names the learner as subject and (live) the
 * district issuer as issuer. In-process the test signer replaces the issuer, so the issuer
 * is reported, not asserted, and the step is labelled MOCK-SIGNER.
 */
const expectLearnerCredential = (
    context: StepContext,
    credential: ClaimedCredentialView,
    learner: ScenarioWallet,
    issuer: ScenarioIssuer
): void => {
    check(credential.verified, `credential ${credential.id ?? ''} does not verify`);
    check(
        isLearnersDid(credential.subjectDid, learner),
        `credential subject is ${credential.subjectDid ?? 'absent'}, expected ${learner.profileId}`
    );
    if (context.port.mockSigner) {
        context.label('MOCK-SIGNER');
        context.note(`issuer ${credential.issuer} (test signer; district issuer not asserted)`);
        return;
    }
    check(
        credential.issuer === issuer.did,
        `credential issuer is ${credential.issuer}, expected the district issuer ${issuer.did}`
    );
};

/** The partner-facing refusal, as the report shows it. */
const describeRefusal = (outcome: { ok: true } | { ok: false; error: Error & { code: string } }) =>
    outcome.ok ? 'CLAIMABLE' : `refused (${outcome.error.code} '${outcome.error.message}')`;

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
    {
        id: 'S13',
        title: 'learner A claims the pushed credential',
        needs: ['learnerA', 'recordId', 'issuer'],
        produces: [],
        kind: 'PRODUCT',
        via: 'WALLET',
        run: async context => {
            const { port, ids } = context;
            const learnerA = need(ids, 'learnerA');
            const recordId = need(ids, 'recordId');
            const incoming = await port.incomingCredentials(learnerA);
            const entry =
                incoming.find(candidate => candidate.recordId === recordId) ??
                incoming.find(candidate => candidate.uri === ids.credentialUri);
            check(
                entry,
                `record ${recordId} is not among learner A's ${incoming.length} incoming credentials`
            );
            // Accept, then read it back: the stored copy is decrypted with the learner's key.
            const claimed = await port.acceptCredential({ wallet: learnerA, uri: entry.uri });
            if (claimed.unreadable) {
                // Only the test signer may leave a credential the learner cannot open.
                check(
                    port.mockSigner,
                    `learner A cannot read the credential: ${claimed.unreadable}`
                );
                context.label('MOCK-SIGNER');
                return {
                    status: 'WARN',
                    reason: `accepted; decrypt and verify not checkable in-process: ${claimed.unreadable}`,
                };
            }
            expectLearnerCredential(context, claimed, learnerA, need(ids, 'issuer'));
            return undefined;
        },
    },
    {
        id: 'S14',
        title: 'revoke the push binding; approve an offer binding',
        needs: ['districtId', 'installId', 'issuer', 'bindingId', 'bindingRevision'],
        produces: ['pushBindingId', 'offerBindingId'],
        kind: 'PRODUCT',
        via: 'CONSOLE',
        run: async context => {
            const { port, ids } = context;
            const districtId = need(ids, 'districtId');
            const revoked = await port.revokeBinding({
                bindingId: need(ids, 'bindingId'),
                expectedRevision: need(ids, 'bindingRevision'),
            });
            check(revoked.status === 'REVOKED', `push binding is ${revoked.status}`);
            const proposed = await port.proposeBinding({
                ecosystemId: districtId,
                installId: need(ids, 'installId'),
                issuer: need(ids, 'issuer'),
                delivery: 'offer',
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
            check(binding.status === 'ACTIVE', `offer binding is ${binding.status}`);
            await expectAuditSince(context, districtId, [
                'BINDING_REVOKED',
                'BINDING_PROPOSED',
                'BINDING_APPROVED',
                'BINDING_ACTIVATED',
            ]);
            ids.pushBindingId = revoked.bindingId;
            ids.offerBindingId = binding.bindingId;
            ids.bindingId = binding.bindingId;
            ids.bindingRevision = binding.revision;
        },
    },
    {
        id: 'S15',
        title: 'partner submits a completion; claim offer returned (offer)',
        needs: ['learnerA', 'offerBindingId', 'termsUri', 'partnerHealthy'],
        produces: ['offerUri', 'offerRecordId'],
        kind: 'PRODUCT',
        via: 'PARTNER',
        run: async context => {
            const { port, ids } = context;
            const released = expectOk(
                await port.submit({
                    subject: need(ids, 'learnerA'),
                    completionId: completionFor(context, 'a2'),
                    courseId: DEMO_COURSE_ID,
                }),
                'submit'
            );
            check(released.status === 'ACCEPTED', `release is ${released.status}`);
            check(
                released.issuance?.status === 'OFFERED',
                `issuance is ${released.issuance?.status ?? 'absent'}, expected OFFERED`
            );
            const { offerUri } = released.issuance;
            if (port.driver === 'live') {
                // The link the partner shows the learner, from the demo LMS JSON (never HTML).
                check(released.offerUrl, 'the demo LMS JSON carried no offerUrl');
                check(
                    released.offerUrl === offerUri ||
                        released.offerUrl.includes(encodeURIComponent(offerUri)),
                    `the demo LMS offerUrl does not carry brain's offer ${offerUri}`
                );
            } else {
                context.note('offer link from the submitRecord result (no LMS in-process)');
            }
            ids.offerUri = released.offerUrl ?? offerUri;
            ids.offerRecordId = released.recordId;
        },
    },
    {
        id: 'N2',
        title: 'another wallet cannot claim the offer',
        needs: ['offerUri', 'offerBindingId', 'districtId'],
        produces: ['otherWallet'],
        kind: 'NEGATIVE',
        via: 'WALLET',
        run: async context => {
            const { port, ids } = context;
            const offerBindingId = need(ids, 'offerBindingId');
            const other = await port.ensureWallet('otherWallet');
            const outcome = await port.claimOffer({
                wallet: other,
                offerUri: need(ids, 'offerUri'),
            });
            check(!outcome.ok, `wallet ${other.profileId} claimed learner A's offer`);
            context.note(`refused with ${outcome.error.code} '${outcome.error.message}'`);
            // Assert the audit event, not the (deliberately generic) error text.
            check(
                (await eventsSince(context, need(ids, 'districtId'))).some(
                    event =>
                        event.action === 'RECORD_CREDENTIAL_CLAIM_DENIED' &&
                        event.bindingId === offerBindingId
                ),
                'no RECORD_CREDENTIAL_CLAIM_DENIED audit event for the offer binding'
            );
            ids.otherWallet = other;
        },
    },
    {
        id: 'S16',
        title: 'learner A claims the offer; a second claim re-delivers it',
        needs: ['learnerA', 'offerUri', 'offerRecordId', 'issuer', 'districtId'],
        produces: ['offerClaimed'],
        kind: 'PRODUCT',
        via: 'WALLET',
        run: async context => {
            const { port, ids } = context;
            const learnerA = need(ids, 'learnerA');
            const offerUri = need(ids, 'offerUri');
            const offerRecordId = need(ids, 'offerRecordId');
            const first = expectOk(await port.claimOffer({ wallet: learnerA, offerUri }), 'claim');
            expectLearnerCredential(context, first, learnerA, need(ids, 'issuer'));
            const again = expectOk(
                await port.claimOffer({ wallet: learnerA, offerUri }),
                'second claim'
            );
            check(again.verified, 'the re-delivered credential does not verify');
            check(
                again.id === first.id && again.issuer === first.issuer,
                `the second claim returned ${again.id ?? 'a credential without id'}, expected ${first.id ?? 'the first'}`
            );
            // Signed once: the re-delivery writes no second issuance.
            const issued = (await eventsSince(context, need(ids, 'districtId'))).filter(
                event =>
                    event.action === 'RECORD_CREDENTIAL_ISSUED' &&
                    event.afterSummary?.recordId === offerRecordId
            );
            check(
                issued.length === 1 && issued[0]?.afterSummary?.deliveredVia === 'offer',
                `expected one RECORD_CREDENTIAL_ISSUED (offer) for the record, saw ${issued.length}`
            );
            ids.offerClaimed = true;
        },
    },
    {
        id: 'N3',
        title: 'withdrawn consent refuses the next submit; learner re-consents',
        needs: ['learnerA', 'termsUri', 'contractUri', 'offerBindingId', 'partnerHealthy'],
        produces: ['termsUri'],
        kind: 'NEGATIVE',
        via: 'WALLET',
        run: async context => {
            const { port, ids } = context;
            const learnerA = need(ids, 'learnerA');
            const offerBindingId = need(ids, 'offerBindingId');
            await port.withdraw({ wallet: learnerA, termsUri: need(ids, 'termsUri') });
            expectDenied(
                await port.submit({
                    subject: learnerA,
                    completionId: completionFor(context, 'a-withdrawn'),
                    courseId: DEMO_COURSE_ID,
                }),
                'CONSENT_DENIED',
                'FORBIDDEN'
            );
            const floor = Date.parse(auditFloor(context));
            const deny = (await port.consentDecisions({ bindingId: offerBindingId })).find(
                decision =>
                    decision.subjectProfileId === learnerA.profileId &&
                    decision.decision === 'DENY' &&
                    Date.parse(decision.occurredAt) >= floor
            );
            check(deny, 'no DENY ConsentDecisionRecord for learner A after withdraw');
            context.note(`DENY reason codes: ${deny.reasonCodes.join(', ')}`);
            // Re-consent so later steps run with live consent.
            const consent = await port.consent({
                wallet: learnerA,
                contractUri: need(ids, 'contractUri'),
                via: 'contract',
            });
            check(consent.termsUri, 're-consent returned no terms URI');
            ids.termsUri = consent.termsUri;
        },
    },
    {
        id: 'O1',
        title: 'offers after consent withdraw (observed only; policy not yet decided)',
        needs: ['learnerA', 'termsUri', 'contractUri', 'offerUri', 'partnerHealthy'],
        produces: ['termsUri'],
        kind: 'OBSERVE',
        via: 'WALLET',
        // Owner decision 2026-10-29: OBSERVED only, never FAIL. Problems setting up the
        // observation report SKIP with the reason.
        run: async context => {
            const { port, ids } = context;
            const learnerA = need(ids, 'learnerA');
            const contractUri = need(ids, 'contractUri');
            const offered = await port.submit({
                subject: learnerA,
                completionId: completionFor(context, 'a-o1'),
                courseId: DEMO_COURSE_ID,
            });
            const fresh =
                offered.ok && offered.result.issuance?.status === 'OFFERED'
                    ? (offered.result.offerUrl ?? offered.result.issuance.offerUri)
                    : undefined;
            if (!fresh) {
                return {
                    status: 'SKIP',
                    reason: `could not create an unclaimed offer: ${
                        offered.ok
                            ? `issuance ${offered.result.issuance?.status ?? 'absent'}`
                            : `${offered.error.code} '${offered.error.message}'`
                    }`,
                };
            }
            try {
                await port.withdraw({ wallet: learnerA, termsUri: need(ids, 'termsUri') });
            } catch (error) {
                const failure = toScenarioError(error);
                return { status: 'SKIP', reason: `withdraw failed: ${failure.message}` };
            }
            const unclaimed = await port.claimOffer({ wallet: learnerA, offerUri: fresh });
            const claimed = await port.claimOffer({
                wallet: learnerA,
                offerUri: need(ids, 'offerUri'),
            });
            let reconsent = '';
            try {
                ids.termsUri = (
                    await port.consent({ wallet: learnerA, contractUri, via: 'contract' })
                ).termsUri;
            } catch (error) {
                reconsent = `; re-consent FAILED: ${toScenarioError(error).message}`;
            }
            return {
                status: 'OBSERVED',
                reason:
                    `after withdraw: unclaimed offer ${describeRefusal(unclaimed)}; ` +
                    `claimed offer (S15) re-delivery ${describeRefusal(claimed)}${reconsent}`,
            };
        },
    },
    {
        id: 'N4',
        title: 'revoked binding refuses the next submit',
        needs: [
            // N4 revokes the offer binding S14 left ACTIVE.
            'offerBindingId',
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
            const deny = events.find(
                event =>
                    event.action === 'RECORD_PROVISION_DENY' &&
                    event.afterSummary?.serviceAccountId === serviceAccountId &&
                    event.afterSummary?.reason === 'NO_ACTIVE_BINDING'
            );
            check(
                deny,
                'no RECORD_PROVISION_DENY (NO_ACTIVE_BINDING) audit event for the ServiceAccount'
            );
            // The denial is attributed to the binding that was just revoked.
            check(
                deny.bindingId === revoked.bindingId,
                `the NO_ACTIVE_BINDING denial carries bindingId ${deny.bindingId ?? 'none'}, expected ${revoked.bindingId}`
            );
        },
    },
    {
        id: 'N5',
        title: 'health flip disables, one probe re-enables',
        needs: ['serviceAccountId', 'partnerHealthy', 'learnerA'],
        produces: [],
        kind: 'NEGATIVE',
        via: 'BRAIN',
        run: async context => {
            const { port, ids } = context;
            if (port.healthFlipUnsupported) {
                return { status: 'SKIP', reason: `${port.driver}: ${port.healthFlipUnsupported}` };
            }
            context.label('DEV-PROBE');
            const serviceAccountId = need(ids, 'serviceAccountId');
            const before = await port.readServiceAccount({ serviceAccountId });
            await port.setPartnerHealthy(false);
            try {
                let probes = 0;
                let probe = await port.probeHealth({ serviceAccountId });
                // The failure threshold is brain config (default 3); stop well past it.
                for (probes = 1; probe.status === 'ENABLED' && probes < 10; probes++) {
                    check(!probe.blockedBy, `probe ${probes} blocked by ${probe.blockedBy}`);
                    probe = await port.probeHealth({ serviceAccountId });
                }
                check(
                    probe.status === 'DISABLED' && probe.disabledCause === 'HEALTH',
                    `after ${probes} unhealthy probes the ServiceAccount is ${probe.status}` +
                        (probe.disabledCause ? ` (${probe.disabledCause})` : '') +
                        (probe.blockedBy ? `, probe blocked by ${probe.blockedBy}` : '')
                );
                context.note(
                    `DISABLED(HEALTH) after ${probes} unhealthy probes (healthFailures ${probe.healthFailures})`
                );
                const refused = expectDenied(
                    await port.submit({
                        subject: need(ids, 'learnerA'),
                        completionId: completionFor(context, 'a-unhealthy'),
                        courseId: DEMO_COURSE_ID,
                    }),
                    ['NO_GRANT_FOR_SUBJECT', 'Invalid integration token']
                );
                context.note(`submit refused: ${refused.code} '${refused.message}'`);
            } finally {
                await port.setPartnerHealthy(true);
            }
            const recovered = await port.probeHealth({ serviceAccountId });
            check(
                !recovered.blockedBy,
                `recovery probe blocked by ${recovered.blockedBy}: ${recovered.blockedDetail ?? ''}`
            );
            check(
                recovered.status === 'ENABLED' && recovered.healthFailures === 0,
                `one healthy probe left the ServiceAccount ${recovered.status} (healthFailures ${recovered.healthFailures})`
            );
            if (before && before.credentialGeneration !== recovered.credentialGeneration) {
                context.note(
                    `credentialGeneration ${before.credentialGeneration} → ${recovered.credentialGeneration}: the partner needs a new credential`
                );
            }
            return undefined;
        },
    },
    {
        id: 'N6',
        title: 'removing an install revokes and audits its record binding',
        needs: ['rootEcosystemId', 'listingId', 'versionId'],
        produces: ['cascadeDistrictId', 'cascadeBindingId'],
        kind: 'NEGATIVE',
        via: 'CONSOLE',
        // Live would leave a removed scratch install in the developer's database each run.
        drivers: ['in-process'],
        run: async context => {
            const { port, ids, runId } = context;
            check(port.removeInstall, `the ${port.driver} driver cannot remove an install`);
            // A scratch district, so the walkthrough's own install and Bindings are untouched.
            const { ecosystemId } = await port.createDistrict({
                parentEcosystemId: need(ids, 'rootEcosystemId'),
                name: `Scenario cascade ${runId}`,
                slug: `scenario-cascade-${runId}`,
            });
            const issuer = await port.provisionIssuer({ ecosystemId, name: 'Scenario Cascade' });
            let intent = await port.plan({
                ecosystemId,
                listingId: need(ids, 'listingId'),
                versionId: need(ids, 'versionId'),
            });
            intent = await port.apply(await port.approve(intent));
            const target = await port.findInstallTarget({
                ecosystemId,
                intentId: intent.intentId,
            });
            check(target, `no INTEGRATION_INSTALL target for intent ${intent.intentId}`);
            await port.governAndAccept({ ecosystemId });
            const proposed = await port.proposeBinding({
                ecosystemId,
                installId: target.installId,
                issuer,
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
            // S17 checks the cascade's audit event even if the checks below fail.
            ids.cascadeDistrictId = ecosystemId;
            ids.cascadeBindingId = binding.bindingId;

            const removed = await port.removeInstall({ intentId: intent.intentId });
            check(
                removed.phase === 'REMOVED',
                `install intent is ${removed.phase ?? 'without a phase'}, expected REMOVED`
            );
            const revoked = (await eventsSince(context, ecosystemId)).find(
                event => event.action === 'BINDING_REVOKED' && event.bindingId === binding.bindingId
            );
            check(revoked, `no BINDING_REVOKED audit event for ${binding.bindingId}`);
            check(
                revoked.intentId === intent.intentId &&
                    revoked.afterSummary?.cause === 'INTENT_REMOVED',
                `BINDING_REVOKED for ${binding.bindingId} is not attributed to the removal ` +
                    `(intent ${revoked.intentId ?? 'none'}, cause ${String(revoked.afterSummary?.cause)})`
            );
        },
    },
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
            add('S14', [
                'BINDING_REVOKED',
                'BINDING_PROPOSED',
                'BINDING_APPROVED',
                'BINDING_ACTIVATED',
            ]);
            add('S15', ['RECORD_PROVISION_ALLOW', 'RECORD_CREDENTIAL_OFFERED']);
            add('N2', ['RECORD_CREDENTIAL_CLAIM_DENIED']);
            add('S16', ['RECORD_CREDENTIAL_ISSUED']);
            add('N3', ['RECORD_PROVISION_DENY']);
            add('N4', ['BINDING_REVOKED', 'RECORD_PROVISION_DENY']);
            add('N5', ['SERVICE_ACCOUNT_HEALTH_TRANSITION']);
            check(expected.length, 'no audited step passed; nothing to check');

            const events = await eventsSince(context, districtId);
            expectAuditSubsequence(events, expected, auditFloor(context));
            context.note(`matched ${expected.length} audit positions`);

            // Formerly known gaps, fixed in brain: a revoke-time DENY names the revoked binding,
            // and every revoke (operator, or cascade from N6) writes BINDING_REVOKED.
            const unattributed = events.filter(
                event =>
                    event.action === 'RECORD_PROVISION_DENY' &&
                    event.afterSummary?.reason === 'NO_ACTIVE_BINDING' &&
                    !event.bindingId
            );
            check(
                !unattributed.length,
                `${unattributed.length} NO_ACTIVE_BINDING denial(s) carry no bindingId`
            );
            const revokedThisRun = [
                passed(results, 'S14') ? ids.pushBindingId : undefined,
                passed(results, 'N4') ? ids.offerBindingId : undefined,
            ].filter((bindingId): bindingId is string => Boolean(bindingId));
            const unaudited = revokedThisRun.filter(
                bindingId =>
                    !events.some(
                        event => event.action === 'BINDING_REVOKED' && event.bindingId === bindingId
                    )
            );
            check(!unaudited.length, `no BINDING_REVOKED audit event for ${unaudited.join(', ')}`);
            // Cascade revokes: N6 (in-process only) removes a scratch install.
            if (ids.cascadeDistrictId && ids.cascadeBindingId) {
                const cascadeBindingId = ids.cascadeBindingId;
                check(
                    (await eventsSince(context, ids.cascadeDistrictId)).some(
                        event =>
                            event.action === 'BINDING_REVOKED' &&
                            event.bindingId === cascadeBindingId &&
                            event.afterSummary?.cause === 'INTENT_REMOVED'
                    ),
                    `no BINDING_REVOKED (cause INTENT_REMOVED) audit event for the cascade-revoked ${cascadeBindingId}`
                );
            } else {
                context.note(
                    `cascade revokes not checked: N6 did not reach the install removal ` +
                        `(${context.port.driver} driver); record-release.spec.ts covers them`
                );
            }

            // Known gap kept as WARN (owner decision 2026-10-29): fixing it touches ConsentFlow.
            if (passed(results, 'N3') && !events.some(event => event.action.includes('WITHDRAW'))) {
                return {
                    status: 'WARN',
                    reason: 'known audit gap: consent withdraw writes no audit event',
                };
            }
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
