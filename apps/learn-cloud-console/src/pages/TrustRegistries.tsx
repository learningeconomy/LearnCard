import { useCallback, useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { InstallTargetList } from '../components/InstallTargetList';
import { listRegistrySubscriptions } from '../api';
import type { DashboardSession, RegistrySubscription } from '../api';

export function TrustRegistries({ session }: { session: DashboardSession }) {
    const ecosystemId = session.effectiveAccess.ecosystemRoles[0]?.ecosystemId;
    const [subscriptions, setSubscriptions] = useState<RegistrySubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSubscriptions = useCallback(async () => {
        if (!ecosystemId) return;

        setError(null);
        try {
            setSubscriptions(await listRegistrySubscriptions({ ecosystemId }));
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [ecosystemId]);

    useEffect(() => {
        void loadSubscriptions();
    }, [loadSubscriptions]);

    if (!ecosystemId) {
        return <div className="p-6 text-muted-foreground">No ecosystem access.</div>;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-7 h-7 text-lc-blue" />
                    Trust Registries
                </h1>
                <p className="text-muted-foreground mt-1">
                    Registries your ecosystem subscribes to for issuer and credential trust.
                </p>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive border border-destructive/20">
                    {error}
                </div>
            )}

            <InstallTargetList
                targets={subscriptions}
                icon={ShieldCheck}
                emptyMessage="No registry subscriptions yet — subscriptions arrive via bundle installs."
            />
        </div>
    );
}
