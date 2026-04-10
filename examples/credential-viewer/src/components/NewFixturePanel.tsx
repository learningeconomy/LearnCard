import React, { useState, useEffect, useCallback, useRef } from 'react';

import {
    CREDENTIAL_SPECS,
    CREDENTIAL_PROFILES,
    CREDENTIAL_FEATURES,
    FIXTURE_SOURCES,
    FIXTURE_VALIDITIES,
    type CredentialSpec,
    type CredentialProfile,
    type CredentialFeature,
    type FixtureSource,
    type FixtureValidity,
} from '@learncard/credential-library';

import { SPEC_LABELS, PROFILE_LABELS } from '../lib/colors';
import { useWallet } from '../context/WalletContext';
import { inferMetadata } from '../lib/infer-metadata';

interface NewFixturePanelProps {
    onClose: () => void;
    onSaved?: () => void;
}

type SaveStep = 'editing' | 'saving' | 'success' | 'error';

const DEFAULT_CREDENTIAL = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
    ],
    type: ['VerifiableCredential'],
    issuer: { id: 'did:example:issuer' },
    validFrom: new Date().toISOString().slice(0, 19) + 'Z',
    credentialSubject: {
        id: 'did:example:subject',
    },
};

const toggleFeature = (arr: CredentialFeature[], item: CredentialFeature): CredentialFeature[] =>
    arr.includes(item) ? arr.filter(f => f !== item) : [...arr, item];

type TestResult = { status: 'idle' | 'testing' | 'pass' | 'fail'; message: string };

export const NewFixturePanel: React.FC<NewFixturePanelProps> = ({ onClose, onSaved }) => {
    const { wallet, status: walletStatus } = useWallet();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Folder state
    const [folders, setFolders] = useState<string[]>([]);
    const [folder, setFolder] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [isNewFolder, setIsNewFolder] = useState(false);

    // Metadata
    const [filename, setFilename] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [spec, setSpec] = useState<CredentialSpec>('vc-v2');
    const [profile, setProfile] = useState<CredentialProfile>('generic');
    const [features, setFeatures] = useState<CredentialFeature[]>([]);
    const [source, setSource] = useState<FixtureSource>('synthetic');
    const [signed, setSigned] = useState(false);
    const [validity, setValidity] = useState<FixtureValidity>('valid');
    const [tags, setTags] = useState('');

    // Credential JSON
    const [credentialJson, setCredentialJson] = useState(
        JSON.stringify(DEFAULT_CREDENTIAL, null, 2),
    );
    const [jsonError, setJsonError] = useState<string | null>(null);

    // Test issue state
    const [testResult, setTestResult] = useState<TestResult>({ status: 'idle', message: '' });

    // Save state
    const [step, setStep] = useState<SaveStep>('editing');
    const [saveError, setSaveError] = useState('');
    const [savedPath, setSavedPath] = useState('');

    // Fetch folder list on mount
    useEffect(() => {
        fetch('/api/fixture-folders')
            .then(r => r.json())
            .then((data: { folders: string[] }) => {
                setFolders(data.folders);

                if (data.folders.length > 0) {
                    setFolder(data.folders[0]);
                }
            })
            .catch(() => {});
    }, []);

    // Derive fixture ID from folder + filename
    const effectiveFolder = isNewFolder ? newFolderName : folder;
    const fixtureId = effectiveFolder && filename ? `${effectiveFolder}/${filename}` : '';

    // Validate JSON and auto-infer metadata on change
    useEffect(() => {
        let parsed: Record<string, unknown>;

        try {
            parsed = JSON.parse(credentialJson);
            setJsonError(null);
        } catch (e) {
            setJsonError(e instanceof Error ? e.message : 'Invalid JSON');

            return;
        }

        const inferred = inferMetadata(parsed);

        // Only fill fields that are still at their default/empty values
        if (!name && inferred.name) setName(inferred.name);

        if (!description && inferred.description) setDescription(inferred.description);

        if (spec === 'vc-v2' && inferred.spec && inferred.spec !== 'vc-v2') setSpec(inferred.spec);

        if (profile === 'generic' && inferred.profile) setProfile(inferred.profile);

        if (features.length === 0 && inferred.features && inferred.features.length > 0) {
            setFeatures(inferred.features);
        }

        if (!signed && inferred.signed) setSigned(true);

        if (inferred.folder && !isNewFolder && folders.includes(inferred.folder)) {
            setFolder(prev => {
                // Only change folder if still at initial value (first in list)
                if (prev === folders[0] || prev === '') return inferred.folder!;

                return prev;
            });
        }

        if (!tags && inferred.tags && inferred.tags.length > 0) {
            setTags(inferred.tags.join(', '));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [credentialJson]);

    const isWalletConnected = walletStatus === 'connected' && wallet;

    const canSave =
        fixtureId &&
        name &&
        description &&
        effectiveFolder &&
        filename &&
        !jsonError;

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = (evt) => {
            const text = evt.target?.result as string;

            // Reset fields so inference can re-fill them from the new file
            setName('');
            setDescription('');
            setSpec('vc-v2');
            setProfile('generic');
            setFeatures([]);
            setSigned(false);
            setTags('');

            try {
                const parsed = JSON.parse(text);

                setCredentialJson(JSON.stringify(parsed, null, 2));
            } catch {
                setCredentialJson(text);
            }
        };

        reader.readAsText(file);

        // Reset so the same file can be re-selected
        e.target.value = '';
    }, []);

    const handleTestIssue = useCallback(async () => {
        if (!isWalletConnected || jsonError) return;

        setTestResult({ status: 'testing', message: '' });

        try {
            const credential = JSON.parse(credentialJson);

            // Fill in the issuer DID from the connected wallet
            const did = wallet!.id.did();

            const toIssue = {
                ...credential,
                issuer: typeof credential.issuer === 'string'
                    ? did
                    : { ...(credential.issuer ?? {}), id: did },
            };

            // If credentialSubject has a placeholder DID, replace it
            if (toIssue.credentialSubject?.id === 'did:example:subject') {
                toIssue.credentialSubject = { ...toIssue.credentialSubject, id: did };
            }
            const signed = await wallet!.invoke.issueCredential(toIssue);

            if (signed && (signed as Record<string, unknown>).proof) {
                setTestResult({
                    status: 'pass',
                    message: 'Credential issued successfully with proof.',
                });
            } else {
                setTestResult({
                    status: 'pass',
                    message: 'issueCredential returned without error (no proof — may be unsigned format).',
                });
            }
        } catch (err) {
            setTestResult({
                status: 'fail',
                message: err instanceof Error ? err.message : String(err),
            });
        }
    }, [isWalletConnected, jsonError, credentialJson, wallet]);

    const handleSave = useCallback(async () => {
        if (!canSave) return;

        setStep('saving');
        setSaveError('');

        try {
            const credential = JSON.parse(credentialJson);

            const tagList = tags
                .split(',')
                .map(t => t.trim())
                .filter(Boolean);

            const metadata = {
                id: fixtureId,
                name,
                description,
                spec,
                profile,
                features,
                source,
                signed,
                validity,
                tags: tagList,
            };

            const res = await fetch('/api/save-fixture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folder: effectiveFolder,
                    metadata,
                    credential,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            setSavedPath(data.path);
            setStep('success');
            onSaved?.();
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : String(err));
            setStep('error');
        }
    }, [
        canSave, credentialJson, tags, fixtureId, name, description,
        spec, profile, features, source, signed, validity,
        effectiveFolder, onSaved,
    ]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-base font-semibold text-white">New Fixture</h2>
                            <p className="text-xs text-gray-500">Create a new credential fixture file</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable form body */}
                {step === 'editing' && (
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                        {/* Folder + Filename */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Folder</label>

                                <div className="space-y-1.5">
                                    <select
                                        value={isNewFolder ? '__new__' : folder}
                                        onChange={e => {
                                            if (e.target.value === '__new__') {
                                                setIsNewFolder(true);
                                            } else {
                                                setIsNewFolder(false);
                                                setFolder(e.target.value);
                                            }
                                        }}
                                        className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                    >
                                        {folders.map(f => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}

                                        <option value="__new__">+ New folder...</option>
                                    </select>

                                    {isNewFolder && (
                                        <input
                                            type="text"
                                            placeholder="folder-name"
                                            value={newFolderName}
                                            onChange={e => setNewFolderName(e.target.value.replace(/[^a-z0-9-]/g, ''))}
                                            className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                        />
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Filename</label>

                                <input
                                    type="text"
                                    placeholder="my-credential"
                                    value={filename}
                                    onChange={e => setFilename(e.target.value.replace(/[^a-z0-9-]/g, ''))}
                                    className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                />

                                {fixtureId && (
                                    <p className="mt-1 text-[11px] text-gray-500 font-mono">
                                        {effectiveFolder}/{filename}.ts
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Name + Description */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>

                            <input
                                type="text"
                                placeholder="Human-readable credential name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>

                            <textarea
                                placeholder="What this fixture tests or demonstrates"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={2}
                                className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                            />
                        </div>

                        {/* Spec + Profile + Source row */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Spec</label>

                                <select
                                    value={spec}
                                    onChange={e => setSpec(e.target.value as CredentialSpec)}
                                    className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                >
                                    {CREDENTIAL_SPECS.map(s => (
                                        <option key={s} value={s}>{SPEC_LABELS[s] ?? s}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Profile</label>

                                <select
                                    value={profile}
                                    onChange={e => setProfile(e.target.value as CredentialProfile)}
                                    className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                >
                                    {CREDENTIAL_PROFILES.map(p => (
                                        <option key={p} value={p}>{PROFILE_LABELS[p] ?? p}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Source</label>

                                <select
                                    value={source}
                                    onChange={e => setSource(e.target.value as FixtureSource)}
                                    className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                >
                                    {FIXTURE_SOURCES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Validity + Signed row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Validity</label>

                                <select
                                    value={validity}
                                    onChange={e => setValidity(e.target.value as FixtureValidity)}
                                    className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                >
                                    {FIXTURE_VALIDITIES.map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-end pb-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={signed}
                                        onChange={e => setSigned(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/50"
                                    />

                                    <span className="text-sm text-gray-300">Signed credential</span>
                                </label>
                            </div>
                        </div>

                        {/* Features */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Features</label>

                            <div className="flex flex-wrap gap-1.5">
                                {CREDENTIAL_FEATURES.map(feat => (
                                    <button
                                        key={feat}
                                        onClick={() => setFeatures(prev => toggleFeature(prev, feat))}
                                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                            features.includes(feat)
                                                ? 'bg-blue-600/30 text-blue-300 ring-1 ring-blue-500/30'
                                                : 'bg-gray-800 text-gray-500 hover:text-gray-300 hover:bg-gray-700'
                                        }`}
                                    >
                                        {feat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Tags (comma-separated)</label>

                            <input
                                type="text"
                                placeholder="learncard, boost, test"
                                value={tags}
                                onChange={e => setTags(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                        </div>

                        {/* Credential JSON */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-medium text-gray-400">Credential JSON</label>

                                <div className="flex items-center gap-2">
                                    {jsonError && (
                                        <span className="text-[11px] text-red-400">{jsonError}</span>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".json,application/json"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors cursor-pointer"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        Upload JSON
                                    </button>
                                </div>
                            </div>

                            <textarea
                                value={credentialJson}
                                onChange={e => setCredentialJson(e.target.value)}
                                rows={14}
                                spellCheck={false}
                                className={`w-full font-mono text-xs leading-relaxed bg-gray-950 border rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:ring-1 resize-y ${
                                    jsonError
                                        ? 'border-red-700 focus:ring-red-500/50'
                                        : 'border-gray-700 focus:ring-blue-500/50'
                                }`}
                            />
                        </div>
                    </div>
                )}

                {/* Success state */}
                {step === 'success' && (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-green-900/40 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h3 className="text-lg font-semibold text-white mb-1">Fixture Saved</h3>

                        <p className="text-sm text-gray-400 mb-1">
                            Written to <span className="font-mono text-emerald-400">{savedPath}</span>
                        </p>

                        <p className="text-xs text-gray-500 mb-6">
                            The index has been updated. Reload the page to see the new fixture.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors cursor-pointer"
                            >
                                Reload Page
                            </button>

                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Error state */}
                {step === 'error' && (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-red-900/40 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h3 className="text-lg font-semibold text-white mb-1">Save Failed</h3>

                        <p className="text-sm text-red-400 font-mono mb-6">{saveError}</p>

                        <button
                            onClick={() => setStep('editing')}
                            className="px-4 py-2 text-sm font-medium bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                            Back to Editor
                        </button>
                    </div>
                )}

                {/* Saving state */}
                {step === 'saving' && (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />

                        <p className="text-sm text-gray-400">Saving fixture...</p>
                    </div>
                )}

                {/* Footer — only in editing mode */}
                {step === 'editing' && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 flex-shrink-0">
                        <div className="text-[11px] text-gray-500">
                            {fixtureId ? (
                                <span>ID: <span className="font-mono text-gray-400">{fixtureId}</span></span>
                            ) : (
                                <span className="text-amber-500">Set folder + filename to generate ID</span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Test result indicator */}
                            {testResult.status === 'testing' && (
                                <div className="flex items-center gap-1.5 text-[11px] text-blue-400">
                                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    Testing...
                                </div>
                            )}

                            {testResult.status === 'pass' && (
                                <div className="flex items-center gap-1 text-[11px] text-green-400 max-w-[200px] truncate" title={testResult.message}>
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Pass
                                </div>
                            )}

                            {testResult.status === 'fail' && (
                                <div className="flex items-center gap-1 text-[11px] text-red-400 max-w-[200px] truncate" title={testResult.message}>
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    {testResult.message}
                                </div>
                            )}

                            <button
                                onClick={handleTestIssue}
                                disabled={!isWalletConnected || !!jsonError || testResult.status === 'testing'}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                                    isWalletConnected && !jsonError
                                        ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30'
                                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                }`}
                                title={!isWalletConnected ? 'Connect wallet first to test issue' : ''}
                            >
                                Test Issue
                            </button>

                            <button
                                onClick={onClose}
                                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={!canSave}
                                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                                    canSave
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                }`}
                            >
                                Save to Disk
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
