import { ShieldCheck } from 'lucide-react';
import { InstallTargetCatalogPage } from '../components/InstallTargetCatalogPage';
import { listRegistrySubscriptions } from '../api';
import type { DashboardSession } from '../api';

export function TrustRegistries({ session }: { session: DashboardSession }) {
    return (
        <InstallTargetCatalogPage
            session={session}
            targetType="REGISTRY_SUBSCRIPTION"
            title="Trust Registries"
            subtitle="Install trusted issuer registries. Everything you install merges into your own trust registry."
            icon={ShieldCheck}
            sectionLabel="Trust Registries"
            searchPlaceholder="Search trust registries..."
            emptyMessage="No registry subscriptions yet — subscriptions arrive via bundle installs."
            fetchTargets={listRegistrySubscriptions}
        />
    );
}
