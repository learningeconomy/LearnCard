import { useCallback, useEffect, useState } from 'react';
import { Building2, Loader2, Settings as SettingsIcon, Shield } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AuditLog } from '../components/audit/AuditLog';
import { getEcosystemDetail, type DashboardSession } from '../api';

type Detail = Awaited<ReturnType<typeof getEcosystemDetail>>;

// Prototype Settings has General / Branding / API / Email / Notifications / Security. Only
// General (real ecosystem record) and Security (real ADR-011 audit log) have primitives; the
// rest are omitted, not faked (AGENTS.md rule 4). The prototype's Security tab carried an
// "Audit Logging" toggle that implied a log existed — this is that log.
export function Settings({ session }: { session: DashboardSession }) {
    const ecosystemId = session.effectiveAccess.ecosystemRoles[0]?.ecosystemId;
    const role = session.effectiveAccess.ecosystemRoles[0]?.role;
    const [detail, setDetail] = useState<Detail | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!ecosystemId) return;
        try {
            setDetail(await getEcosystemDetail(ecosystemId));
        } finally {
            setLoading(false);
        }
    }, [ecosystemId]);

    useEffect(() => {
        void Promise.resolve().then(load);
    }, [load]);

    if (!ecosystemId) return <div className="p-6 text-muted-foreground">No ecosystem access.</div>;

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const eco = detail?.ecosystem;
    const owner = detail?.members.find(m => m.profileId === eco?.ownerProfileId);

    const field = (label: string, value: React.ReactNode) => (
        <div>
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className="mt-1.5 text-sm text-foreground">{value}</div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
                    <SettingsIcon className="w-7 h-7 text-lc-blue" /> Settings
                </h1>
                <p className="text-muted-foreground mt-1">
                    Manage your ecosystem configuration and review governance decisions.
                </p>
            </div>

            <Tabs defaultValue="general">
                <TabsList>
                    <TabsTrigger value="general" className="gap-1.5 text-xs sm:text-sm">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>General</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-1.5 text-xs sm:text-sm">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Security</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6 mt-4">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-6">
                        <h2 className="font-display text-lg font-bold text-foreground">
                            Ecosystem Details
                        </h2>
                        {eco ? (
                            <div className="grid gap-5 sm:grid-cols-2">
                                {field('Ecosystem Name', eco.name)}
                                {field(
                                    'Slug',
                                    <span className="font-mono">{eco.slugPath.join(' / ')}</span>
                                )}
                                {field('Description', eco.description || '—')}
                                {field(
                                    'Status',
                                    <Badge
                                        variant={eco.status === 'ACTIVE' ? 'success' : 'outline'}
                                        className="text-[10px]"
                                    >
                                        {eco.status}
                                    </Badge>
                                )}
                                {field(
                                    'Owner',
                                    owner
                                        ? `${owner.displayName} (${owner.profileId})`
                                        : eco.ownerProfileId
                                )}
                                {field('Your role', role ?? '—')}
                                {field(
                                    'Tree position',
                                    eco.parentEcosystemId
                                        ? `Depth ${eco.depth} · child of ${eco.parentEcosystemId}`
                                        : 'Tenant root'
                                )}
                                {field('Created', new Date(eco.createdAt).toLocaleString())}
                                {field(
                                    'Ecosystem ID',
                                    <span className="font-mono text-xs">{eco.id}</span>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Ecosystem record not found.
                            </p>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-6 mt-4">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-2">
                        <h2 className="font-display text-lg font-bold text-foreground">
                            Audit Log
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Every install, binding, and consent decision in this ecosystem, with who
                            made it and when. Records are append-only (ADR-011 D2). Expand a row for
                            the full state-transition chain.
                        </p>
                    </div>
                    <AuditLog ecosystemId={ecosystemId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
