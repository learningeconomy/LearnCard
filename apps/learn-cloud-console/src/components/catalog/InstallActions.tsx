import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Check, Loader2, ShieldCheck, FileText, Rocket, Trash2, XCircle } from 'lucide-react';
import { trpc } from '../../trpc';
import { cn } from '../../lib/utils';
import { TRPCClientError } from '@trpc/client';
import type { InstallIntent } from '@learncard/types';

type InstallState = 'plan' | 'approve' | 'applying' | 'ready' | 'failed';

interface Props {
    ecosystemId: string;
    itemId: string;
    itemName: string;
    category?: string;
    isInstalled: boolean;
    existingIntentId?: string;
    className?: string;
    onChanged: () => void;
}

export function InstallActions({
    ecosystemId,
    itemId,
    itemName,
    category,
    isInstalled,
    existingIntentId,
    className,
    onChanged,
}: Props) {
    const [installOpen, setInstallOpen] = useState(false);
    const [state, setState] = useState<InstallState>(isInstalled ? 'ready' : 'plan');
    const [intent, setIntent] = useState<InstallIntent | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setState(isInstalled ? 'ready' : 'plan');
    }, [isInstalled]);

    const describeError = (e: unknown): string => {
        let msg = '';
        if (e instanceof TRPCClientError) msg = e.message;
        else msg = e instanceof Error ? e.message : String(e);

        const lower = msg.toLowerCase();
        if (lower.includes('invalid signature') || lower.includes('signed manifest')) {
            return "This listing doesn't have a signed integration manifest yet, so it can't be installed. Ask the publisher to publish a signed version.";
        }
        return msg;
    };

    const loadIntent = async (id: string) => {
        const res = await trpc.installIntents.getInstallIntent.query({ intentId: id });
        setIntent(res as InstallIntent);
        return res as InstallIntent;
    };

    const handlePlan = async () => {
        setBusy(true);
        setError(null);
        try {
            const catalogRes = await trpc.catalog.get.query({ listingId: itemId });
            if (!catalogRes.versions || catalogRes.versions.length === 0) {
                throw new Error('No versions available for this integration.');
            }
            const latestVersion = catalogRes.versions[0].version_id;

            const res = await trpc.installIntents.planInstallIntent.mutate({
                ecosystemId,
                listingId: itemId,
                versionId: latestVersion,
                requestedConfig: {},
                proposedBindings: [],
            });

            await loadIntent(String((res as { intentId: unknown }).intentId));
            setState('approve');
        } catch (e) {
            setError(describeError(e));
        } finally {
            setBusy(false);
        }
    };

    const handleApproveAndApply = async () => {
        if (!intent?.plan) return;
        setBusy(true);
        setError(null);
        setState('applying');
        try {
            await trpc.installIntents.approveInstallIntent.mutate({
                intentId: intent.intentId,
                planHash: intent.plan.planHash,
                planRevision: intent.plan.planRevision,
            });

            const updatedIntent = await loadIntent(intent.intentId);
            if (!updatedIntent.status) throw new Error('Intent status missing after approval');

            await trpc.installIntents.applyInstallIntent.mutate({
                intentId: intent.intentId,
                expectedStatusRevision: updatedIntent.status.statusRevision,
            });

            setState('ready');
            onChanged();
        } catch (e) {
            setError(describeError(e));
            setState('failed');
        } finally {
            setBusy(false);
        }
    };

    const handleRevoke = async () => {
        const targetIntentId = intent?.intentId || existingIntentId;
        if (!targetIntentId) return;

        setBusy(true);
        setError(null);
        try {
            const currentIntent = await loadIntent(targetIntentId);
            if (!currentIntent.status) throw new Error('Intent status missing');

            await trpc.installIntents.revokeInstallIntent.mutate({
                intentId: targetIntentId,
                expectedStatusRevision: currentIntent.status.statusRevision,
            });

            setState('plan');
            setIntent(null);
            setInstallOpen(false);
            onChanged();
        } catch (e) {
            setError(describeError(e));
        } finally {
            setBusy(false);
        }
    };

    const permissions = [
        { label: 'Read ecosystem roster', detail: 'Entity names, groups, and learner counts' },
        {
            label: 'Read/write credential records',
            detail: `Records produced or consumed by ${itemName}`,
        },
        { label: 'Registry lookups', detail: 'Resolve issuers, skills, and credit references' },
    ];

    const renderPermissions = () => {
        if (intent?.plan?.consentTiers && Object.keys(intent.plan.consentTiers).length > 0) {
            return (
                <ul className="text-sm space-y-1">
                    {Object.entries(intent.plan.consentTiers).map(([tier, details]) => (
                        <li key={tier} className="text-foreground">
                            <span className="font-medium">{tier}</span>{' '}
                            <span className="text-muted-foreground">
                                — {JSON.stringify(details)}
                            </span>
                        </li>
                    ))}
                </ul>
            );
        }
        return (
            <ul className="text-sm space-y-1">
                {permissions.map(p => (
                    <li key={p.label} className="text-foreground">
                        {p.label} <span className="text-muted-foreground">— {p.detail}</span>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <>
            <div className={cn('flex', className)}>
                <Button
                    variant={isInstalled ? 'outline' : 'hero'}
                    size="sm"
                    className="flex-1"
                    disabled={busy && state === 'applying'}
                    onClick={e => {
                        e.stopPropagation();
                        setInstallOpen(true);
                    }}
                >
                    {busy && state === 'applying' ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Applying...
                        </>
                    ) : isInstalled ? (
                        <>
                            <Check className="w-4 h-4 mr-2" /> Installed
                        </>
                    ) : (
                        'Install'
                    )}
                </Button>
            </div>

            <Dialog open={installOpen} onOpenChange={setInstallOpen}>
                <DialogContent
                    className="w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto sm:max-w-lg"
                    onClick={e => e.stopPropagation()}
                >
                    <DialogHeader>
                        <DialogTitle>Install {itemName}</DialogTitle>
                        <DialogDescription>
                            Installation runs in four stages: plan, approve, apply, revoke. Nothing
                            changes until an approved plan is applied.
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20 flex items-start gap-2">
                            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Plan */}
                        <div className="border border-border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-lc-blue" />
                                <h4 className="font-display font-bold text-sm text-foreground">
                                    1. Plan
                                </h4>
                                <Badge variant="secondary" className="text-xs ml-auto">
                                    read-only
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                                The system read the listing and produced this plain summary.
                            </p>
                            <ul className="text-sm space-y-1.5">
                                <li>
                                    <span className="text-muted-foreground">Will install:</span>{' '}
                                    <span className="text-foreground font-medium">{itemName}</span>
                                    {category ? ` (${category})` : ''}
                                </li>
                                <li>
                                    <span className="text-muted-foreground">Scope:</span>{' '}
                                    <span className="text-foreground">this ecosystem only</span>
                                </li>
                            </ul>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-3 mb-1">
                                Permissions requested
                            </p>
                            {renderPermissions()}
                        </div>

                        {/* Approve */}
                        <div className="border border-border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck className="w-4 h-4 text-emerald" />
                                <h4 className="font-display font-bold text-sm text-foreground">
                                    2. Approve
                                </h4>
                                {(state === 'approve' ||
                                    state === 'applying' ||
                                    state === 'ready') && (
                                    <Badge className="text-xs ml-auto bg-emerald/10 text-emerald border-emerald/30">
                                        approved
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Someone with authority reviews the plan and signs off (or rejects).
                                The exact plan approved is locked in, so it can't quietly change
                                afterward.
                            </p>
                        </div>

                        {/* Apply */}
                        <div className="border border-border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Rocket className="w-4 h-4 text-lc-blue" />
                                <h4 className="font-display font-bold text-sm text-foreground">
                                    3. Apply
                                </h4>
                                <Badge variant="secondary" className="text-xs ml-auto">
                                    {state === 'applying'
                                        ? 'applying'
                                        : state === 'ready'
                                        ? 'ready'
                                        : state === 'failed'
                                        ? 'failed'
                                        : 'pending'}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                The approved plan is rolled out. Status moves from applying to ready
                                (or failed).
                            </p>
                            {state === 'approve' && (
                                <Button
                                    variant="hero"
                                    size="sm"
                                    className="mt-3"
                                    onClick={handleApproveAndApply}
                                    disabled={busy}
                                >
                                    Apply plan
                                </Button>
                            )}
                            {state === 'applying' && (
                                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Applying...
                                </div>
                            )}
                            {state === 'failed' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3"
                                    onClick={handleApproveAndApply}
                                    disabled={busy}
                                >
                                    Retry
                                </Button>
                            )}
                        </div>

                        {/* Revoke */}
                        <div className="border border-border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Trash2 className="w-4 h-4 text-destructive" />
                                <h4 className="font-display font-bold text-sm text-foreground">
                                    4. Revoke
                                </h4>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                The installation can be removed later. Permissions and provisioned
                                data links are cleaned up automatically.
                            </p>
                            {state === 'ready' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3 text-destructive"
                                    onClick={handleRevoke}
                                    disabled={busy}
                                >
                                    Revoke installation
                                </Button>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setInstallOpen(false)}
                            disabled={busy}
                        >
                            Close
                        </Button>
                        {state === 'plan' && (
                            <Button variant="hero" onClick={handlePlan} disabled={busy}>
                                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Continue to approval
                            </Button>
                        )}
                        {state === 'approve' && (
                            <Button variant="hero" onClick={handleApproveAndApply} disabled={busy}>
                                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Approve & apply
                            </Button>
                        )}
                        {state === 'applying' && (
                            <Button variant="hero" disabled>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Applying...
                            </Button>
                        )}
                        {state === 'ready' && (
                            <Button variant="hero" onClick={() => setInstallOpen(false)}>
                                <Check className="w-4 h-4 mr-2" /> Installed
                            </Button>
                        )}
                        {state === 'failed' && (
                            <Button variant="hero" onClick={handleApproveAndApply} disabled={busy}>
                                Retry
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
