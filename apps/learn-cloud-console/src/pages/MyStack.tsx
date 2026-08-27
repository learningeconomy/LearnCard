import { DashboardSession } from '../api';
import { InstallIntents } from '../InstallIntents';

export function MyStack({ session }: { session: DashboardSession }) {
    const ecosystemIds = [
        ...new Set(session.effectiveAccess.ecosystemRoles.map(grant => grant.ecosystemId)),
    ];

    return (
        <div className="space-y-8">
            <InstallIntents ecosystemIds={ecosystemIds} />
        </div>
    );
}
