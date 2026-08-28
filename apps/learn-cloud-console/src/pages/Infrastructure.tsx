import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plug } from 'lucide-react';
import { InstallTargetList } from '../components/InstallTargetList';
import { listWorkloadDeployments } from '../api';
import type { DashboardSession, WorkloadDeployment } from '../api';

export function Infrastructure({ session }: { session: DashboardSession }) {
    const ecosystemId = session.effectiveAccess.ecosystemRoles[0]?.ecosystemId;
    const [deployments, setDeployments] = useState<WorkloadDeployment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDeployments = useCallback(async () => {
        if (!ecosystemId) return;

        setError(null);
        try {
            setDeployments(await listWorkloadDeployments({ ecosystemId }));
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [ecosystemId]);

    useEffect(() => {
        void loadDeployments();
    }, [loadDeployments]);

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
                    <Plug className="w-7 h-7 text-lc-blue" />
                    Infrastructure
                </h1>
                <p className="text-muted-foreground mt-1">
                    Core services and workloads deployed for your ecosystem.
                </p>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive border border-destructive/20">
                    {error}
                </div>
            )}

            <InstallTargetList
                targets={deployments}
                icon={Plug}
                emptyMessage="No workloads deployed yet — workloads arrive via bundle installs."
            />
        </div>
    );
}
