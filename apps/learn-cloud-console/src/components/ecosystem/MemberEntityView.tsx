import { Building2, Layers, Mail, Shield, Users } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { LABELS, ecosystemDisplayLabel } from '../../lib/labels';
import type { EcosystemDetail as EcosystemDetailData, Group } from '../../api';

interface MemberEntityViewProps {
    detail: EcosystemDetailData;
    groups: Group[];
}

/**
 * ADR-015 / prototype MemberEntityView port: read-only view for a principal whose
 * `EcosystemDetail.role` is MEMBER or VIEWER (`canManageMembers` false in
 * EcosystemDetail.tsx). Shows the public profile, the caller's own access grant, and
 * the OWNER/ADMIN roster to contact — never the management controls. Renders only
 * from data already returned by `getEcosystemDetail`/`listGroupsByEcosystem`; there is
 * no membership-leave mutation, so no "Leave" action is offered (see reference
 * src/components/entity/MemberEntityView.tsx in EducationOS/educationos, adapted here
 * to the real Ecosystem/Group vocabulary instead of the prototype's mocked entity).
 */
export function MemberEntityView({ detail, groups }: MemberEntityViewProps) {
    const ecosystem = detail.ecosystem;
    // ADR-001: the console vocabulary displays a root Ecosystem as "Ecosystem" and a
    // child Ecosystem (CHILD_OF) as "Group" — never "Network" (that is the Group/D11
    // curated-collection primitive `groups` below).
    const isRoot = !ecosystem || ecosystem.pathIds.length <= 1;
    const typeLabel = ecosystemDisplayLabel(isRoot);
    const typeLabelLower = typeLabel.toLowerCase();
    const admins = detail.members.filter(m => m.role === 'OWNER' || m.role === 'ADMIN');

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet/10 text-violet flex items-center justify-center shrink-0">
                        {isRoot ? (
                            <Building2 className="w-6 h-6" />
                        ) : (
                            <Layers className="w-6 h-6" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1
                                className={cn(
                                    'font-display text-2xl font-bold text-foreground',
                                    !ecosystem && 'font-mono'
                                )}
                            >
                                {ecosystem ? ecosystem.name : detail.ecosystemId}
                            </h1>
                            <Badge variant="secondary">{typeLabel}</Badge>
                            {ecosystem && (
                                <Badge
                                    variant={
                                        ecosystem.status === 'ACTIVE'
                                            ? 'success'
                                            : ecosystem.status === 'DRAFT'
                                              ? 'warning'
                                              : 'outline'
                                    }
                                >
                                    {ecosystem.status}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {ecosystem
                                ? ecosystem.description || '/' + ecosystem.slugPath.join('/')
                                : 'Details unavailable from LearnCloud yet.'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                    <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-xs text-muted-foreground">Your access</p>
                        <p className="font-display text-xl font-bold text-foreground">
                            {detail.role}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Granted by a {typeLabelLower} admin
                        </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-xs text-muted-foreground">{LABELS.members}</p>
                        <p className="font-display text-xl font-bold text-foreground">
                            {detail.members.length.toLocaleString()}
                        </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-xs text-muted-foreground">{LABELS.networks}</p>
                        <p className="font-display text-xl font-bold text-foreground">
                            {groups.length.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border bg-card shadow-card p-6">
                <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-primary" />
                    {typeLabel} admins
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                    Contact an admin to request additional access or ask about this {typeLabelLower}
                    .
                </p>
                {admins.length === 0 ? (
                    <div className="bg-muted/40 rounded-lg p-8 text-center text-sm text-muted-foreground">
                        No admins listed for this {typeLabelLower} yet.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {admins.map(admin => (
                            <div
                                key={admin.profileId}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/50 rounded-lg px-4 py-3"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                                        {(admin.displayName || admin.profileId)
                                            .slice(0, 1)
                                            .toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm text-foreground truncate">
                                            {admin.displayName || admin.profileId}
                                        </p>
                                        {admin.email && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {admin.email}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge
                                        variant={admin.role === 'OWNER' ? 'default' : 'secondary'}
                                    >
                                        {admin.role}
                                    </Badge>
                                    {admin.email && (
                                        <a href={`mailto:${admin.email}`}>
                                            <Button variant="outline" size="sm" type="button">
                                                <Mail className="w-4 h-4 mr-1.5" />
                                                Email
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
                <Users className="w-3.5 h-3.5" />
                You joined this {typeLabelLower} as a {(detail.role || '').toLowerCase()}. Admin
                rights are granted by a {typeLabelLower} admin.
            </p>
        </div>
    );
}
