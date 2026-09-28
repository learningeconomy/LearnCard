import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Package } from 'lucide-react';
import { Button } from './ui/button';
import { trpc } from '../trpc';
import type { BindingRecord, DashboardSession } from '../api';
import type { Capability, InstallIntent } from '@learncard/types';

interface SurfaceGateProps {
    session: DashboardSession;
    pageName: string;
    listingName: string;
    listingId?: string;
    catalogHref: string;
    requiredCapabilities?: Capability[];
    minimumRole?: 'MEMBER' | 'ADMIN' | 'OWNER';
    children: ReactNode;
}

export function SurfaceGate({
    session,
    pageName,
    listingName,
    listingId,
    catalogHref,
    requiredCapabilities = [],
    minimumRole = 'MEMBER',
    children,
}: SurfaceGateProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [failureReason, setFailureReason] = useState<string | null>(null);

    const ecosystemId = session.effectiveAccess.ecosystemRoles[0]?.ecosystemId;
    const role = session.effectiveAccess.ecosystemRoles[0]?.role;

    const roleWeight: Record<string, number> = { VIEWER: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 };
    // ADR-015 §3.2 (c): role ≥ minimumRole. Synchronous prechecks are derived, not effect state.
    const precheckFailure = !ecosystemId
        ? 'No active ecosystem'
        : (roleWeight[role ?? ''] ?? 0) < roleWeight[minimumRole]
          ? `Requires ${minimumRole} role`
          : !listingId
            ? 'Listing ID not provided'
            : null;

    // Stable dependency: callers pass inline array literals.
    const capabilitiesKey = requiredCapabilities.join(',');

    useEffect(() => {
        if (precheckFailure || !ecosystemId) return;
        const required = capabilitiesKey ? (capabilitiesKey.split(',') as Capability[]) : [];

        let cancelled = false;

        void Promise.resolve().then(async () => {
            try {
                const [intentsRes, bindings] = await Promise.all([
                    trpc.installIntents.listInstallIntents.query({ ecosystemId }),
                    trpc.bindings.list.query({ ecosystemId }),
                ]);

                if (cancelled) return;

                const intents = intentsRes as InstallIntent[];

                // ADR-015 §3.2 (a): an Install Intent for this listing must be READY.
                const intent = intents.find(i => i.proposal.source.listingId === listingId);

                if (!intent || intent.status?.phase !== 'READY') {
                    setFailureReason('Install not READY');
                    setLoading(false);
                    return;
                }

                // ADR-015 §3.2 (b): every required capability must have an ACTIVE Binding
                // (ADR-008 5-state lifecycle; only ACTIVE counts — not PROPOSED/APPROVED).
                const activeCapabilities = new Set<Capability>(
                    bindings
                        .filter((b: BindingRecord) => b.status === 'ACTIVE')
                        .map((b: BindingRecord) => b.capability as Capability)
                );
                const missing = required.filter(cap => !activeCapabilities.has(cap));

                if (missing.length > 0) {
                    setFailureReason(`Binding for ${missing.join(', ')} not ACTIVE`);
                    setLoading(false);
                    return;
                }

                setIsReady(true);
                setLoading(false);
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : String(e));
                    setLoading(false);
                }
            }
        });

        return () => {
            cancelled = true;
        };
    }, [precheckFailure, ecosystemId, listingId, capabilitiesKey]);

    const reason = precheckFailure ?? failureReason;

    if (loading && !precheckFailure) {
        return null;
    }

    if (isReady) {
        return <>{children}</>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Package className="w-6 h-6" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                    {pageName} requires {listingName}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {pageName} is delivered by {listingName}. Install it to turn on this workspace.
                </p>
                {reason && (
                    <p className="text-xs text-muted-foreground/70">Not available: {reason}</p>
                )}
                {error && <p className="text-xs text-destructive">Error: {error}</p>}
                <Link href={catalogHref}>
                    <Button>Go to {catalogHref.split('/').pop() || 'catalog'}</Button>
                </Link>
            </div>
        </div>
    );
}
