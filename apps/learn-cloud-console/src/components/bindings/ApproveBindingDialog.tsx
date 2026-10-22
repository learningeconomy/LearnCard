import { useCallback, useEffect, useState } from 'react';
import { Loader2, XCircle, AlertCircle } from 'lucide-react';
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
import { trpc } from '../../trpc';
import { TRPCClientError } from '@trpc/client';
import type { BindingRecord } from '../../api';
import type { BindingConsentPreflight } from '@learncard/types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    binding: BindingRecord | null;
    providerName: string;
    consumerName: string;
    onApproved: () => void;
}

export function ApproveBindingDialog({
    open,
    onOpenChange,
    binding,
    providerName,
    consumerName,
    onApproved,
}: Props) {
    const [preflight, setPreflight] = useState<BindingConsentPreflight | null>(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPreflight = useCallback(async () => {
        if (!binding || binding.capability === 'registry-adapter') return;
        setPreflight(null);
        setLoading(true);
        setError(null);
        try {
            const result = await trpc.bindings.prepareConsentPreflight.mutate({
                bindingId: binding.bindingId,
            });
            setPreflight(result as unknown as BindingConsentPreflight);
        } catch (e) {
            setError(e instanceof TRPCClientError ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [binding]);

    useEffect(() => {
        if (open && binding) {
            void Promise.resolve().then(loadPreflight);
        }
    }, [open, binding, loadPreflight]);

    const submit = async () => {
        if (!binding) return;
        setBusy(true);
        setError(null);
        try {
            if (binding.capability === 'registry-adapter') {
                await trpc.bindings.approve.mutate({
                    bindingId: binding.bindingId,
                    expectedRevision: binding.revision,
                });
            } else {
                if (!preflight) throw new Error('Preflight not loaded');
                await trpc.bindings.approve.mutate({
                    bindingId: binding.bindingId,
                    expectedRevision: binding.revision,
                    preflightId: preflight.preflightId,
                    preflightHash: preflight.hash,
                });
            }
            onApproved();
            onOpenChange(false);
        } catch (e) {
            const msg = e instanceof TRPCClientError ? e.message : String(e);
            if (msg.includes('PREFLIGHT_STALE')) {
                setError('The evidence changed since this check — re-checking…');
                void Promise.resolve().then(loadPreflight);
            } else {
                setError(msg);
            }
        } finally {
            setBusy(false);
        }
    };

    if (!binding) return null;

    const isRegistry = binding.capability === 'registry-adapter';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Approve binding</DialogTitle>
                    <DialogDescription>
                        {providerName} → {consumerName} ({binding.capability})
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20 flex items-start gap-2">
                        <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {isRegistry ? (
                    <div className="space-y-4 text-sm">
                        <p>
                            This is a reference-data binding. It does not carry subject data and
                            requires no governance evidence.
                        </p>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : preflight ? (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold">Governance evidence</h4>
                            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm space-y-2">
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground shrink-0">
                                        Agreement
                                    </span>
                                    <span className="font-medium text-right break-all">
                                        {preflight.evidence.governanceContractId ? (
                                            preflight.evidence.contractRevision ? (
                                                `${preflight.evidence.governanceContractId} (rev ${preflight.evidence.contractRevision})`
                                            ) : (
                                                preflight.evidence.governanceContractId
                                            )
                                        ) : (
                                            <span className="text-muted-foreground italic">
                                                None
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground shrink-0">
                                        Accepted by
                                    </span>
                                    <span className="font-medium text-right break-all">
                                        {preflight.evidence.acceptedBy ? (
                                            `${preflight.evidence.acceptedBy.profileId} (${preflight.evidence.acceptedBy.role})`
                                        ) : (
                                            <span className="text-muted-foreground italic">
                                                None
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground shrink-0">
                                        Granted scopes
                                    </span>
                                    <span className="font-medium text-right break-all">
                                        {preflight.evidence.grant?.scopes.join(', ') || (
                                            <span className="text-muted-foreground italic">
                                                None
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground shrink-0">
                                        Granted tiers
                                    </span>
                                    <span className="font-medium text-right break-all">
                                        {preflight.evidence.grant?.tiers.join(', ') || (
                                            <span className="text-muted-foreground italic">
                                                None
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold">Consent collection</h4>
                            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3 text-sm">
                                <span className="text-muted-foreground">Path</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {preflight.collectionPath.kind}
                                    </span>
                                    {preflight.collectionPath.implemented ? (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] bg-emerald/10 text-emerald border-emerald/30"
                                        >
                                            Implemented
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] bg-destructive/10 text-destructive border-destructive/30"
                                        >
                                            Not implemented
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {!preflight.satisfied && preflight.missing.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                                    <AlertCircle className="h-4 w-4" /> Missing before approval
                                </h4>
                                <div className="space-y-2">
                                    {preflight.missing.map((m, i) => (
                                        <div
                                            key={i}
                                            className="rounded-md border border-destructive/20 bg-destructive/5 p-3"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-medium">{m.message}</p>
                                                <Badge
                                                    variant="outline"
                                                    className="shrink-0 text-[10px] font-mono"
                                                >
                                                    {m.code}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {m.howToSatisfy}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="rounded-xl border border-lc-blue/30 bg-lc-blue/5 p-3 text-xs text-muted-foreground">
                            {/* ADR-011 amendment (D3/D4/D8): readiness evidence, not subject consent */}
                            This approves the connection, not access to any learner's data. Each
                            release still checks that learner's consent.
                        </div>
                    </div>
                ) : null}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                        Cancel
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={busy || loading || (!isRegistry && !preflight?.satisfied)}
                    >
                        {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Approve
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
