import { useEffect, useState } from 'react';
import { trpc } from '../trpc';
import type { DashboardSession, ProjectedConsoleSurface } from '../api';

// ADR-015 D4: surface visibility is a projection the server computes from install targets,
// bindings and role. The console only asks "which surfaces render right now?".
export function useConsoleSurfaces(session: DashboardSession | null): ProjectedConsoleSurface[] {
    const [surfaces, setSurfaces] = useState<ProjectedConsoleSurface[]>([]);
    const ecosystemId = session?.effectiveAccess.ecosystemRoles[0]?.ecosystemId;

    useEffect(() => {
        if (!ecosystemId) return;
        let cancelled = false;
        void Promise.resolve().then(async () => {
            try {
                const result = await trpc.surfaces.list.query({ ecosystemId });
                if (!cancelled) setSurfaces(result);
            } catch {
                if (!cancelled) setSurfaces([]);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [ecosystemId]);

    return surfaces;
}
