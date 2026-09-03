import { Plug } from 'lucide-react';
import { InstallTargetCatalogPage } from '../components/InstallTargetCatalogPage';
import { listWorkloadDeployments } from '../api';
import type { DashboardSession } from '../api';

export function Infrastructure({ session }: { session: DashboardSession }) {
    return (
        <InstallTargetCatalogPage
            session={session}
            targetType="WORKLOAD_DEPLOYMENT"
            title="Infrastructure"
            subtitle="Install infrastructure plugins to extend platform capabilities."
            icon={Plug}
            sectionLabel="Infrastructure"
            searchPlaceholder="Search plugins..."
            emptyMessage="No infrastructure workloads yet — workloads arrive via bundle installs."
            fetchTargets={listWorkloadDeployments}
        />
    );
}
