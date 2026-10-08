import React, { useCallback, useState } from 'react';

import { buildFinalTranscriptVariant, prepareFixtureById } from '@learncard/credential-library';
import type { ManagedCredentialRefreshService, UnsignedVC } from '@learncard/types';

import { useWallet } from '../context/WalletContext';

type DemoState = {
    refreshId: string;
    refreshService: ManagedCredentialRefreshService;
    credentialId: string;
    provisional: UnsignedVC;
    version: number;
    issuedAt: string;
    publishedAt?: string;
    notification?: string;
};

type Action = 'issue' | 'publish' | null;

interface ManagedRefreshPanelProps {
    onClose?: () => void;
}

/**
 * Small issuer demo for the managed provisional-to-final CLR lifecycle.
 *
 * It self-issues to the connected profile so one wallet can demonstrate allocation,
 * signing, managed send, acceptance, and publication without exposing credential
 * subject data in the panel's diagnostics.
 */
export const ManagedRefreshPanel: React.FC<ManagedRefreshPanelProps> = ({ onClose }) => {
    const { wallet, did, profile, status } = useWallet();
    const [demo, setDemo] = useState<DemoState | null>(null);
    const [action, setAction] = useState<Action>(null);
    const [error, setError] = useState<string | null>(null);

    const canIssue = status === 'connected' && Boolean(wallet && did && profile) && !action;
    const canPublish = Boolean(demo) && !action;

    const issueProvisional = useCallback(async (): Promise<void> => {
        if (!wallet || !did || !profile || action) return;

        setAction('issue');
        setError(null);

        try {
            const provisional = prepareFixtureById('clr/provisional-transcript', {
                issuerDid: did,
                subjectDid: did,
            });
            const credentialId = provisional.id;

            if (typeof credentialId !== 'string' || credentialId.length === 0) {
                throw new Error('Fixture did not produce a stable credential ID');
            }

            // Allocation must happen before the proof is created because the service
            // descriptor is part of the signed credential.
            const allocation = await wallet.invoke.allocateCredentialRefresh({
                holder: { profileId: profile.profileId, did },
                credentialId,
            });

            provisional.refreshService = allocation.refreshService;

            const signed = await wallet.invoke.issueCredential(provisional);
            const sentUri = await wallet.invoke.sendRefreshableCredential(
                allocation.refreshId,
                signed
            );

            // This self-issued demo must explicitly claim the managed credential so
            // its refresh aggregate becomes active.
            await wallet.invoke.acceptCredential(sentUri);

            setDemo({
                refreshId: allocation.refreshId,
                refreshService: allocation.refreshService,
                credentialId,
                provisional,
                version: 1,
                issuedAt: new Date().toISOString(),
            });
        } catch {
            setError('Could not issue the provisional transcript. Please try again.');
        } finally {
            setAction(null);
        }
    }, [action, did, profile, wallet]);

    const publishFinal = useCallback(async (): Promise<void> => {
        if (!wallet || !demo || action) return;

        setAction('publish');
        setError(null);

        try {
            const finalCredential = buildFinalTranscriptVariant(demo.provisional, {
                validFrom: new Date().toISOString(),
            });

            if (finalCredential.id !== demo.credentialId) {
                throw new Error('Final credential ID changed');
            }

            const signedFinal = await wallet.invoke.issueCredential(finalCredential);
            const publication = await wallet.invoke.publishCredentialRefresh({
                mode: 'issuer-signed',
                refreshId: demo.refreshId,
                signedCredential: signedFinal,
            });

            setDemo(current =>
                current
                    ? {
                          ...current,
                          version: publication.version,
                          publishedAt: publication.publishedAt,
                          notification: publication.notification,
                      }
                    : current
            );
        } catch {
            setError('Could not publish the final transcript. Please try again.');
        } finally {
            setAction(null);
        }
    }, [action, demo, wallet]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <section className="w-full max-w-xl mx-4 overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
                <header className="flex items-start justify-between border-b border-gray-800 px-6 py-4">
                    <div>
                        <h2 className="text-sm font-bold text-white">Managed Transcript Refresh</h2>
                        <p className="mt-1 text-xs text-gray-400">
                            Issue a provisional transcript, then publish its final version in place.
                        </p>
                    </div>

                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close managed refresh demo"
                            className="rounded-md px-2 py-1 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                        >
                            Close
                        </button>
                    )}
                </header>

                <div className="space-y-5 px-6 py-5">
                    {!canIssue && !demo && status !== 'connected' && (
                        <p className="rounded-xl border border-amber-800/50 bg-amber-950/30 p-3 text-xs text-amber-300">
                            Connect a network account and create a profile to run this demo.
                        </p>
                    )}

                    {error && (
                        <p
                            role="alert"
                            className="rounded-xl border border-red-800/50 bg-red-950/30 p-3 text-xs text-red-300"
                        >
                            {error}
                        </p>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                        <button
                            type="button"
                            disabled={!canIssue || Boolean(demo)}
                            onClick={issueProvisional}
                            className="rounded-xl bg-blue-600 px-4 py-3 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {action === 'issue' ? 'Issuing...' : 'Issue Provisional Transcript'}
                        </button>

                        <button
                            type="button"
                            disabled={!canPublish || (demo?.version ?? 0) > 1}
                            onClick={publishFinal}
                            className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {action === 'publish' ? 'Publishing...' : 'Publish Final Transcript'}
                        </button>
                    </div>

                    {demo && (
                        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl border border-gray-800 bg-gray-950/60 p-4 text-xs">
                            <dt className="text-gray-500">Refresh ID</dt>
                            <dd className="break-all font-mono text-gray-200">{demo.refreshId}</dd>
                            <dt className="text-gray-500">Version</dt>
                            <dd className="text-gray-200">Managed version {demo.version}</dd>
                            <dt className="text-gray-500">Issued</dt>
                            <dd className="text-gray-200">{demo.issuedAt}</dd>
                            {demo.publishedAt && (
                                <>
                                    <dt className="text-gray-500">Published</dt>
                                    <dd className="text-gray-200">{demo.publishedAt}</dd>
                                </>
                            )}
                            {demo.notification && (
                                <>
                                    <dt className="text-gray-500">Notification</dt>
                                    <dd className="text-gray-200">{demo.notification}</dd>
                                </>
                            )}
                        </dl>
                    )}
                </div>
            </section>
        </div>
    );
};
