import React, { useMemo, useState } from 'react';
import type { FC } from 'react';
import { getLogger } from 'learn-card-base';
const log = getLogger('learner-context-prompt-test-page');

import { IonSpinner } from '@ionic/react';

import { networkStore, useToast, useWallet } from 'learn-card-base';
import type { CredentialCategory } from 'learn-card-base';

import AdminPageStructure from '../AdminPageStructure';
import {
    formatLearnerContext,
    type LearnerContextFormatResponse,
} from '../../../hooks/post-message/learnerContext.helpers';
import {
    AiPassportAppsEnum,
    aiPassportApps,
} from '../../../components/ai-passport-apps/aiPassport-apps.helpers';

const hasNotExpired = (expiresAt?: string) =>
    !expiresAt || (Number.isFinite(Date.parse(expiresAt)) && Date.parse(expiresAt) > Date.now());

const LearnerContextPromptTestPage: FC = () => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const backendUrl = networkStore.use.aiServiceUrl();
    const [instructions, setInstructions] = useState('');
    const [detailLevel, setDetailLevel] = useState<'compact' | 'expanded'>('compact');
    const [personalFields, setPersonalFields] = useState<string[]>([]);
    const [availablePersonalFields, setAvailablePersonalFields] = useState<string[]>([]);
    const [availableByCategory, setAvailableByCategory] = useState<Record<string, string[]>>({});
    const [selectedByCategory, setSelectedByCategory] = useState<Record<string, string[]>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [response, setResponse] = useState<LearnerContextFormatResponse | null>(null);
    const [responseError, setResponseError] = useState<string | null>(null);

    const [formatterTimingMs, setFormatterTimingMs] = useState<number | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);
    const selectedUris = useMemo(
        () => Object.values(selectedByCategory).flat(),
        [selectedByCategory]
    );
    const selectedCount = selectedUris.length;
    const selectedCategoryCount = Object.values(selectedByCategory).filter(
        categoryUris => categoryUris.length > 0
    ).length;

    const updateCategorySelection = (category: string, uris: string[]) => {
        setSelectedByCategory(current => {
            if (uris.length === 0) {
                const { [category]: _removed, ...rest } = current;
                return rest;
            }

            return { ...current, [category]: uris };
        });
    };

    const loadConsentedSelection = async () => {
        const wallet = await initWallet();
        const contractUri = aiPassportApps.find(
            app => app.type === AiPassportAppsEnum.learncardapp
        )?.contractUri;
        if (!contractUri) throw new Error('LearnCard AI consent contract is not configured.');
        let page = await wallet.invoke.getConsentedContracts();
        const records = [...page.records];
        while (page.hasMore) {
            if (!page.cursor) throw new Error('Consent pagination returned no cursor.');
            page = await wallet.invoke.getConsentedContracts({ cursor: page.cursor });
            records.push(...page.records);
        }
        const consent = records.find(
            record =>
                record.contract.uri === contractUri &&
                record.status === 'live' &&
                hasNotExpired(record.expiresAt) &&
                hasNotExpired(record.contract.expiresAt)
        );
        if (!consent)
            throw new Error('Enable LearnCard AI data sharing before running a benchmark.');
        const byCategory: Record<string, string[]> = {};
        if (consent.terms.read.credentials.sharing !== false) {
            for (const [category, term] of Object.entries(
                consent.terms.read.credentials.categories
            )) {
                if (
                    term.sharing !== false &&
                    hasNotExpired(term.shareUntil) &&
                    term.shared?.length
                ) {
                    byCategory[category] = [...new Set(term.shared)];
                }
            }
        }
        return {
            wallet,
            byCategory,
            personalFields: Object.keys(consent.terms.read.personal),
        };
    };

    const handleSelectAllCategories = async () => {
        try {
            const selection = await loadConsentedSelection();
            setAvailableByCategory(selection.byCategory);
            setAvailablePersonalFields(selection.personalFields);
            setSelectedByCategory(selection.byCategory);
            setPersonalFields(current =>
                current.filter(field => selection.personalFields.includes(field))
            );
            setResponseError(null);
            presentToast(
                'Loaded current AI-consented selections. The server rechecks consent on every request.'
            );
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Failed to load consented data.';
            setResponseError(message);
            presentToast(message);
        }
    };

    const handleClearAllCategories = () => {
        setSelectedByCategory({});
        setPersonalFields([]);
        presentToast('Cleared all selections.');
    };

    const getBenchmarkUuid = (count: number, index: number) =>
        `00000000-0000-4000-8000-${String(count).padStart(4, '0')}${String(index).padStart(
            8,
            '0'
        )}`.slice(0, 36);

    const handleSeedBenchmarkCredentials = async (count: number) => {
        setIsSeeding(true);
        presentToast(`Seeding ${count} benchmark credentials...`);

        try {
            const wallet = await initWallet();
            const did = wallet.id.did();
            const uploadEncrypted = wallet.store.LearnCloud.uploadEncrypted;

            if (!uploadEncrypted) throw new Error('LearnCloud encrypted upload is unavailable.');

            for (let i = 0; i < count; i += 1) {
                const title = `Learner Context Benchmark ${count}-${i + 1}`;
                const role = ['Frontend Engineer', 'Data Analyst', 'Project Lead', 'UX Researcher'][
                    i % 4
                ];
                const skill = [
                    'TypeScript',
                    'credential design',
                    'learner analytics',
                    'accessibility review',
                    'systems thinking',
                ][i % 5];
                const issuer = `Benchmark Issuer ${(i % 7) + 1}`;
                const date = `202${i % 5}-${String((i % 12) + 1).padStart(2, '0')}-15`;
                const description = `${role} evidence for ${skill}. Issuer ${issuer} observed applied practice on ${date}. Evidence includes project delivery, collaboration notes, rubric feedback, and reflective growth text for realistic prompt diversity.`;
                const id = `learner-context-bench-${count}-${i}`;
                const uuid = getBenchmarkUuid(count, i);
                const unsignedCredential = {
                    '@context': [
                        'https://www.w3.org/2018/credentials/v1',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json',
                    ],
                    id: `urn:uuid:${uuid}`,
                    type: ['VerifiableCredential', 'OpenBadgeCredential'],
                    issuer: did,
                    issuanceDate: `${date}T00:00:00Z`,
                    name: title,
                    credentialSubject: {
                        id: did,
                        type: ['AchievementSubject'],
                        achievement: {
                            id: `urn:uuid:${uuid}`,
                            type: ['Achievement'],
                            achievementType: 'ext:Achievement',
                            criteria: {
                                narrative: description,
                            },
                            description,
                            name: title,
                            alignment: [
                                {
                                    type: ['Alignment'],
                                    targetUrl: `https://example.test/learner-context-benchmark/skills/${i % 5}`,
                                    targetName: skill,
                                    targetDescription: `${skill} demonstrated through ${role} work.`,
                                    targetFramework: 'Learner Context Benchmark',
                                },
                            ],
                        },
                    },
                };
                const vc = await wallet.invoke.issueCredential(unsignedCredential);
                const uri = await uploadEncrypted(vc);

                if (!uri) throw new Error('Benchmark credential upload failed.');

                await wallet.index.LearnCloud.remove(id).catch(() => undefined);
                await wallet.index.LearnCloud.add({
                    id,
                    uri,
                    category: 'Achievement' as CredentialCategory,
                });
            }

            presentToast(
                `Seeded ${count} benchmark credentials. Share them through LearnCard AI data sharing, wait for sync, then reload consented selections.`
            );
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Failed to seed benchmark credentials.';
            log.error('Failed to seed benchmark credentials:', error);
            presentToast(message);
        } finally {
            setIsSeeding(false);
        }
    };

    const handleSubmit = async () => {
        if (!backendUrl.trim()) {
            presentToast('The AI Passport service is not configured.');
            return;
        }

        if (selectedCount === 0 && personalFields.length === 0) {
            presentToast('Select at least one consented credential or personal field.');
            return;
        }

        setIsSubmitting(true);
        setResponse(null);
        setResponseError(null);
        setFormatterTimingMs(null);

        try {
            const fresh = await loadConsentedSelection();
            const allowedUris = new Set(Object.values(fresh.byCategory).flat());
            if (
                selectedUris.some(uri => !allowedUris.has(uri)) ||
                personalFields.some(field => !fresh.personalFields.includes(field))
            ) {
                throw new Error('Selection is no longer consented. Reload consented selections.');
            }
            const formatterStartedAt = performance.now();
            const data = await formatLearnerContext(fresh.wallet, {
                credentialUris: [...new Set(selectedUris)],
                personalFields,
                instructions: instructions.trim() || undefined,
                detailLevel,
                includeStructuredContext: true,
            });

            setFormatterTimingMs(performance.now() - formatterStartedAt);

            setResponse(data);
            presentToast('Learner context response received.');
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Failed to generate learner context.';
            setResponse(null);
            setFormatterTimingMs(null);
            setResponseError(message);
            presentToast(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AdminPageStructure title="Learner Context Test UX">
            <section className="w-full max-w-[1080px] flex flex-col gap-[20px]">
                <div className="bg-white rounded-[20px] shadow-box-bottom p-[20px] flex flex-col gap-[14px]">
                    <div>
                        <h2 className="text-[22px] font-[600] font-notoSans text-grayscale-900">
                            Backend Request
                        </h2>
                        <p className="text-[14px] text-grayscale-600 font-notoSans mt-[4px]">
                            Choose currently AI-consented data and benchmark the configured service.
                            Credentials and personal values are resolved by the server, not posted
                            here.
                        </p>
                    </div>

                    <label className="flex flex-col gap-[8px]">
                        <span className="text-[14px] font-[600] font-notoSans text-grayscale-800">
                            LearnCard Backend URL
                        </span>
                        <input
                            value={backendUrl}
                            readOnly
                            className="rounded-[14px] border border-grayscale-200 bg-grayscale-50 px-[14px] py-[12px] text-[15px] font-notoSans text-grayscale-900 outline-none focus:border-emerald-600"
                        />
                    </label>

                    <div className="grid gap-[14px] lg:grid-cols-2">
                        <label className="flex flex-col gap-[8px]">
                            <span className="text-[14px] font-[600] font-notoSans text-grayscale-800">
                                Prompt Instructions
                            </span>
                            <textarea
                                value={instructions}
                                onChange={event => setInstructions(event.target.value)}
                                placeholder="Optional extra guidance for the formatter"
                                rows={4}
                                className="rounded-[14px] border border-grayscale-200 bg-grayscale-50 px-[14px] py-[12px] text-[15px] font-notoSans text-grayscale-900 outline-none focus:border-emerald-600 resize-y"
                            />
                        </label>

                        <div className="flex flex-col gap-[12px]">
                            <span className="text-[14px] font-[600] font-notoSans text-grayscale-800">
                                Detail Level
                            </span>
                            <div className="flex gap-[10px]">
                                {(['compact', 'expanded'] as const).map(option => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setDetailLevel(option)}
                                        className={`rounded-full px-[16px] py-[10px] text-[14px] font-[600] font-notoSans border transition-colors ${
                                            detailLevel === option
                                                ? 'bg-emerald-700 border-emerald-700 text-white'
                                                : 'bg-white border-grayscale-200 text-grayscale-700'
                                        }`}
                                    >
                                        {option === 'compact' ? 'Compact' : 'Expanded'}
                                    </button>
                                ))}
                            </div>

                            <div className="rounded-[14px] bg-grayscale-50 border border-grayscale-200 p-[14px]">
                                <p className="text-[14px] text-grayscale-700 font-notoSans">
                                    Selected credentials: <strong>{selectedCount}</strong> across{' '}
                                    <strong>{selectedCategoryCount}</strong> categories.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-[14px] lg:grid-cols-2">
                        <fieldset className="flex flex-col gap-[8px]">
                            <span className="text-[14px] font-[600] font-notoSans text-grayscale-800">
                                Consented Personal Fields
                            </span>
                            <div className="flex flex-wrap gap-3">
                                {availablePersonalFields.map(field => (
                                    <label key={field} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={personalFields.includes(field)}
                                            onChange={event =>
                                                setPersonalFields(current =>
                                                    event.target.checked
                                                        ? [...current, field]
                                                        : current.filter(value => value !== field)
                                                )
                                            }
                                        />
                                        {field}
                                    </label>
                                ))}
                                {availablePersonalFields.length === 0 && (
                                    <p>Load consented selections to choose personal field names.</p>
                                )}
                            </div>
                        </fieldset>
                    </div>
                </div>

                <div className="bg-white rounded-[20px] shadow-box-bottom p-[20px] flex flex-col gap-[16px]">
                    <div className="flex flex-col gap-[4px]">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[22px] font-[600] font-notoSans text-grayscale-900">
                                Choose Credentials
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleSelectAllCategories}
                                    className="rounded-full bg-emerald-700 text-white px-4 py-2 text-sm font-[600] font-notoSans"
                                >
                                    Load / Select All Consented
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearAllCategories}
                                    disabled={selectedCount === 0}
                                    className="rounded-full border border-grayscale-200 bg-white px-4 py-2 text-sm font-[600] font-notoSans disabled:opacity-50"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                        <p className="text-[14px] text-grayscale-600 font-notoSans">
                            Only storage URIs already shared with LearnCard AI are selectable.
                            Seeding does not grant consent or automatically share new credentials.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-[10px]">
                        {[5, 50, 500].map(count => (
                            <button
                                key={count}
                                type="button"
                                onClick={() => handleSeedBenchmarkCredentials(count)}
                                disabled={isSeeding}
                                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-[600] font-notoSans text-emerald-700 disabled:opacity-50"
                            >
                                {isSeeding ? 'Seeding...' : `Seed ${count} Benchmark Credentials`}
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-[12px] md:grid-cols-2 xl:grid-cols-3">
                        {Object.entries(availableByCategory).map(([category, uris]) => (
                            <fieldset key={category} className="border rounded-[14px] p-3 min-w-0">
                                <legend>
                                    {category} ({uris.length})
                                </legend>
                                <div className="max-h-[260px] overflow-auto flex flex-col gap-2">
                                    {uris.map(uri => (
                                        <label
                                            key={uri}
                                            className="flex items-start gap-2 break-all text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={
                                                    selectedByCategory[category]?.includes(uri) ??
                                                    false
                                                }
                                                onChange={event =>
                                                    updateCategorySelection(
                                                        category,
                                                        event.target.checked
                                                            ? [
                                                                  ...(selectedByCategory[
                                                                      category
                                                                  ] ?? []),
                                                                  uri,
                                                              ]
                                                            : (
                                                                  selectedByCategory[category] ?? []
                                                              ).filter(value => value !== uri)
                                                    )
                                                }
                                            />
                                            {uri}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="min-w-[220px] rounded-full bg-emerald-700 text-white px-[24px] py-[14px] text-[16px] font-[600] font-notoSans disabled:opacity-50 flex items-center justify-center gap-[10px]"
                    >
                        {isSubmitting && (
                            <IonSpinner name="crescent" className="w-[18px] h-[18px]" />
                        )}
                        {isSubmitting ? 'Generating Context...' : 'Send Test Request'}
                    </button>
                </div>

                {(response || responseError) && (
                    <div className="bg-white rounded-[20px] shadow-box-bottom p-[20px] flex flex-col gap-[16px]">
                        <div>
                            <h2 className="text-[22px] font-[600] font-notoSans text-grayscale-900">
                                Backend Response
                            </h2>
                            <p className="text-[14px] text-grayscale-600 font-notoSans mt-[4px]">
                                Full response from the learner context formatting endpoint.
                            </p>
                        </div>

                        {responseError && (
                            <div className="rounded-[16px] border border-red-200 bg-red-50 px-[16px] py-[14px] text-red-700 text-[14px] font-notoSans">
                                {responseError}
                            </div>
                        )}
                        {response && (
                            <div className="rounded-[16px] border border-emerald-100 bg-emerald-50 px-[16px] py-[14px] text-[14px] font-notoSans text-grayscale-800">
                                <div>
                                    Formatter wall-clock:{' '}
                                    <strong>
                                        {formatterTimingMs === null
                                            ? 'n/a'
                                            : `${formatterTimingMs.toFixed(1)}ms`}
                                    </strong>
                                </div>
                                <div>
                                    promptCacheHit:{' '}
                                    <strong>
                                        {String(response.metadata?.promptCacheHit ?? 'n/a')}
                                    </strong>
                                </div>
                                <div>
                                    summaryCacheHits:{' '}
                                    <strong>
                                        {String(response.metadata?.summaryCacheHits ?? 'n/a')}
                                    </strong>
                                </div>
                                <div>
                                    summaryCacheMisses:{' '}
                                    <strong>
                                        {String(response.metadata?.summaryCacheMisses ?? 'n/a')}
                                    </strong>
                                </div>
                                <div className="mt-[6px]">
                                    tokenUsage:{' '}
                                    <code>
                                        {JSON.stringify(response.metadata?.tokenUsage ?? null)}
                                    </code>
                                </div>
                            </div>
                        )}

                        {response?.prompt && (
                            <div className="rounded-[16px] border border-grayscale-200 bg-grayscale-50 px-[16px] py-[14px]">
                                <h3 className="text-[16px] font-[600] font-notoSans text-grayscale-900 mb-[8px]">
                                    Prompt
                                </h3>
                                <pre className="whitespace-pre-wrap break-words text-[14px] leading-[1.6] font-notoSans text-grayscale-800">
                                    {response.prompt}
                                </pre>
                            </div>
                        )}

                        {response && (
                            <div
                                className="rounded-[16px] border border-grayscale-200 px-[16px] py-[14px] overflow-x-auto"
                                style={{ backgroundColor: '#0f172a' }}
                            >
                                <pre
                                    className="text-[13px] leading-[1.6] font-mono whitespace-pre-wrap break-words"
                                    style={{ color: '#f8fafc' }}
                                >
                                    {JSON.stringify(response, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </AdminPageStructure>
    );
};

export default LearnerContextPromptTestPage;
