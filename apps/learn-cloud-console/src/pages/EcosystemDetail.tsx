import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { ArrowLeft, Users, Trash2, Building2, Plus, Layers, ChevronRight } from 'lucide-react';
import {
    getEcosystemDetail,
    grantEcosystemMembership,
    revokeEcosystemMembership,
    listGroupsByEcosystem,
    type EcosystemDetail as EcosystemDetailData,
    type Group,
    listEcosystems,
} from '../api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';
import { PageSkeleton } from '../components/PageSkeleton';
import { ErrorState } from '../components/ErrorState';
import { CreateEcosystemForm } from '../components/CreateEcosystemForm';
import { CreateGroupForm } from '../components/CreateGroupForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export function EcosystemDetail() {
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const [, setLocation] = useLocation();
    const [detail, setDetail] = useState<EcosystemDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberProfileId, setNewMemberProfileId] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
    const [granting, setGranting] = useState(false);
    const [grantError, setGrantError] = useState<string | null>(null);
    const [showAddChild, setShowAddChild] = useState(false);
    const [groups, setGroups] = useState<Group[]>([]);
    const [ancestors, setAncestors] = useState<{ id: string; name: string }[]>([]);
    const [showAddGroup, setShowAddGroup] = useState(false);

    const load = useCallback(async () => {
        if (!id) return;
        setError(null);
        setLoading(true);
        try {
            const [data, groupsData, allEcos] = await Promise.all([
                getEcosystemDetail(id),
                listGroupsByEcosystem(id).catch(() => []),
                listEcosystems().catch(() => []),
            ]);
            setDetail(data);
            setGroups(groupsData);

            if (data.ecosystem && data.ecosystem.pathIds.length > 1) {
                const pathIds = data.ecosystem.pathIds.slice(0, -1); // Exclude self
                const ecoMap = new Map<string, string>();
                allEcos.forEach(e => {
                    if (e.ecosystem) ecoMap.set(e.ecosystemId, e.ecosystem.name);
                    e.children.forEach(c => ecoMap.set(c.id, c.name));
                });

                setAncestors(
                    pathIds.map(pid => ({
                        id: pid,
                        name: ecoMap.get(pid) || pid,
                    }))
                );
            } else {
                setAncestors([]);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void Promise.resolve().then(load);
    }, [load]);

    const handleGrant = async () => {
        if (!id || !newMemberProfileId.trim()) return;
        setGranting(true);
        setGrantError(null);
        try {
            await grantEcosystemMembership({
                id,
                profileId: newMemberProfileId.trim(),
                role: newMemberRole,
            });
            setNewMemberProfileId('');
            setShowAddMember(false);
            await load();
        } catch (e) {
            setGrantError(
                e instanceof Error ? e.message : 'Something went wrong. Please try again.'
            );
        } finally {
            setGranting(false);
        }
    };

    const handleRevoke = async (profileId: string) => {
        if (!id) return;
        if (!window.confirm('Are you sure you want to revoke this membership?')) return;
        try {
            await revokeEcosystemMembership({ id, profileId });
            await load();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to revoke membership.');
        }
    };

    if (loading) return <PageSkeleton rows={3} />;
    if (error || !detail)
        return (
            <div className="max-w-5xl mx-auto">
                <ErrorState message={error || 'Failed to load ecosystem data.'} onRetry={load} />
            </div>
        );

    const canManageMembers = detail.role === 'OWNER' || detail.role === 'ADMIN';

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Link
                href="/ecosystem"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Ecosystem
            </Link>

            <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-card space-y-2">
                {ancestors.length > 0 && (
                    <nav
                        aria-label="Breadcrumb"
                        className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2"
                    >
                        {ancestors.map(anc => (
                            <React.Fragment key={anc.id}>
                                <Link
                                    href={`/ecosystem/${anc.id}`}
                                    className="hover:text-foreground"
                                >
                                    {anc.name}
                                </Link>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </React.Fragment>
                        ))}
                        <span className="text-foreground font-medium">
                            {detail.ecosystem ? detail.ecosystem.name : detail.ecosystemId}
                        </span>
                    </nav>
                )}

                <div className="flex items-center gap-2">
                    {detail.role && (
                        <Badge variant="secondary" className="text-xs">
                            {detail.role}
                        </Badge>
                    )}
                    {detail.ecosystem && <Badge variant="outline">{detail.ecosystem.status}</Badge>}
                </div>
                <h1
                    className={cn(
                        'font-display text-2xl font-bold text-foreground',
                        !detail.ecosystem && 'font-mono'
                    )}
                >
                    {detail.ecosystem ? detail.ecosystem.name : detail.ecosystemId}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {detail.ecosystem
                        ? detail.ecosystem.description || '/' + detail.ecosystem.slugPath.join('/')
                        : 'Details unavailable from LearnCloud yet.'}
                </p>
                {detail.ecosystem && (
                    <p className="text-sm text-muted-foreground">
                        Created {new Date(detail.ecosystem.createdAt).toLocaleDateString()}
                    </p>
                )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <h2 className="font-display font-bold">
                            Members ({detail.members.length})
                        </h2>
                    </div>
                    {canManageMembers && (
                        <Button variant="hero" size="sm" onClick={() => setShowAddMember(true)}>
                            <Plus className="w-4 h-4 mr-1.5" />
                            Add Members
                        </Button>
                    )}
                </div>

                <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="font-display capitalize">
                                Add Member
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-md bg-muted/30 border mt-2">
                            <Input
                                placeholder="profile-id"
                                value={newMemberProfileId}
                                onChange={e => setNewMemberProfileId(e.target.value)}
                                className="flex-1"
                                disabled={granting}
                            />
                            <select
                                value={newMemberRole}
                                onChange={e => {
                                    const role = e.target.value;
                                    if (
                                        role === 'ADMIN' ||
                                        role === 'MEMBER' ||
                                        role === 'VIEWER'
                                    ) {
                                        setNewMemberRole(role);
                                    }
                                }}
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={granting}
                            >
                                <option value="MEMBER">MEMBER</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="VIEWER">VIEWER</option>
                            </select>
                            <Button
                                onClick={handleGrant}
                                disabled={granting || !newMemberProfileId.trim()}
                            >
                                {granting ? 'Granting...' : 'Grant'}
                            </Button>
                        </div>
                        {grantError && (
                            <div className="rounded-lg bg-destructive/15 p-4 text-destructive border border-destructive/20 text-sm mt-2">
                                {grantError}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {detail.members.length === 0 ? (
                    <div className="bg-muted/30 rounded-lg py-10 text-center">
                        <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            No members in this ecosystem yet.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {detail.members.map(member => (
                            <div
                                key={member.profileId}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 bg-emerald/10 text-emerald">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium">
                                            {member.displayName || member.profileId}
                                        </div>
                                        {member.displayName &&
                                            member.displayName !== member.profileId && (
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    {member.profileId}
                                                </div>
                                            )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={
                                            member.role === 'OWNER'
                                                ? 'default'
                                                : member.role === 'ADMIN'
                                                  ? 'secondary'
                                                  : 'outline'
                                        }
                                    >
                                        {member.role}
                                    </Badge>
                                    {canManageMembers && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleRevoke(member.profileId)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        <h2 className="font-display font-bold">Groups ({groups.length})</h2>
                    </div>
                    <Button variant="hero" size="sm" onClick={() => setShowAddGroup(true)}>
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add Group
                    </Button>
                </div>

                <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="font-display capitalize">Add Group</DialogTitle>
                        </DialogHeader>
                        <CreateGroupForm
                            ecosystemOptions={[
                                {
                                    id: detail.ecosystemId,
                                    name: detail.ecosystem?.name || detail.ecosystemId,
                                },
                            ]}
                            fixedEcosystemId={detail.ecosystemId}
                            onCreated={() => {
                                setShowAddGroup(false);
                                load();
                            }}
                            onCancel={() => setShowAddGroup(false)}
                        />
                    </DialogContent>
                </Dialog>

                {groups.length === 0 ? (
                    <div className="bg-muted/30 rounded-lg py-10 text-center">
                        <Layers className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            No groups in this ecosystem yet.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {groups.map(group => (
                            <Link
                                key={group.id}
                                href={`/group/${group.id}`}
                                className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card hover:shadow-elevated transition-shadow cursor-pointer block"
                            >
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 bg-violet/10 text-violet">
                                        <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-foreground truncate">
                                            {group.name}
                                            <Badge
                                                variant="secondary"
                                                className="text-xs shrink-0 align-middle ml-2 capitalize"
                                            >
                                                {group.type}
                                            </Badge>
                                        </h3>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {group.description || '/' + group.slug}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Badge
                                        variant={
                                            group.status === 'ACTIVE'
                                                ? 'success'
                                                : group.status === 'DRAFT'
                                                  ? 'warning'
                                                  : 'outline'
                                        }
                                    >
                                        {group.status}
                                    </Badge>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <h2 className="font-display font-bold">
                            Child Ecosystems ({detail.children.length})
                        </h2>
                    </div>
                    <Button variant="hero" size="sm" onClick={() => setShowAddChild(true)}>
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add Child
                    </Button>
                </div>

                <Dialog open={showAddChild} onOpenChange={setShowAddChild}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="font-display capitalize">
                                Add Child Ecosystem
                            </DialogTitle>
                        </DialogHeader>
                        <CreateEcosystemForm
                            parentOptions={[
                                {
                                    id: detail.ecosystemId,
                                    name: detail.ecosystem?.name || detail.ecosystemId,
                                },
                            ]}
                            fixedParentId={detail.ecosystemId}
                            onCreated={eco => {
                                setShowAddChild(false);
                                setLocation(`/ecosystem/${eco.id}`);
                            }}
                            onCancel={() => setShowAddChild(false)}
                        />
                    </DialogContent>
                </Dialog>

                {detail.children.length === 0 ? (
                    <div className="bg-muted/30 rounded-lg py-10 text-center">
                        <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No child ecosystems yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {detail.children.map(child => (
                            <Link
                                key={child.id}
                                href={`/ecosystem/${child.id}`}
                                className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card hover:shadow-elevated transition-shadow cursor-pointer block"
                            >
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 bg-emerald/10 text-emerald">
                                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-foreground truncate">
                                            {child.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {child.description || '/' + child.slugPath.join('/')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Badge
                                        variant={
                                            child.status === 'ACTIVE'
                                                ? 'success'
                                                : child.status === 'DRAFT'
                                                  ? 'warning'
                                                  : 'outline'
                                        }
                                    >
                                        {child.status}
                                    </Badge>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
