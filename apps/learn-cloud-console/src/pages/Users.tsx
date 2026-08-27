import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Users as UsersIcon,
    Search,
    Plus,
    Trash2,
    ShieldCheck,
    Globe,
    MoreHorizontal,
} from 'lucide-react';
import {
    getEcosystemDetail,
    grantEcosystemMembership,
    revokeEcosystemMembership,
    type DashboardSession,
    type EcosystemDetail,
} from '../api';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table';
import { DropdownMenu, DropdownMenuItem } from '../components/ui/dropdown-menu';
import { cn } from '../lib/utils';
import { PageSkeleton } from '../components/PageSkeleton';
import { ErrorState } from '../components/ErrorState';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning';

const PERSONA_BADGE_CLASSES: Record<string, string> = {
    teacher: 'border-transparent bg-violet/10 text-violet',
    learner: 'border-transparent bg-lc-blue/10 text-lc-blue',
    student: 'border-transparent bg-lc-blue/10 text-lc-blue',
    developer: 'border-transparent bg-teal/10 text-teal',
};

const PERSONA_BADGE_VARIANTS: Record<string, BadgeVariant> = {
    admin: 'warning',
    staff: 'warning',
};

const getPersonaBadgeProps = (
    profileRole: string
): { variant: BadgeVariant; className?: string } => {
    const key = profileRole.toLowerCase();
    const className = PERSONA_BADGE_CLASSES[key];

    if (className) return { variant: 'outline', className };

    return { variant: PERSONA_BADGE_VARIANTS[key] ?? 'secondary' };
};

export function Users({ session }: { session: DashboardSession }) {
    const ecosystemRoles = session.effectiveAccess.ecosystemRoles;
    const ecosystemIds = ecosystemRoles.map(r => r.ecosystemId);

    const [selectedEcosystemId, setSelectedEcosystemId] = useState<string>(ecosystemIds[0] ?? '');
    const [detail, setDetail] = useState<EcosystemDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('All');

    const [showAddUser, setShowAddUser] = useState(false);
    const [newMemberProfileId, setNewMemberProfileId] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
    const [granting, setGranting] = useState(false);
    const [grantError, setGrantError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!selectedEcosystemId) {
            setLoading(false);
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const data = await getEcosystemDetail(selectedEcosystemId);
            setDetail(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [selectedEcosystemId]);

    useEffect(() => {
        void load();
    }, [load]);

    const handleGrant = async () => {
        if (!selectedEcosystemId || !newMemberProfileId.trim()) return;
        setGranting(true);
        setGrantError(null);
        try {
            await grantEcosystemMembership({
                id: selectedEcosystemId,
                profileId: newMemberProfileId.trim(),
                role: newMemberRole,
            });
            setNewMemberProfileId('');
            setShowAddUser(false);
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
        if (!selectedEcosystemId) return;
        if (!window.confirm('Are you sure you want to revoke this membership?')) return;
        try {
            await revokeEcosystemMembership({ id: selectedEcosystemId, profileId });
            await load();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to revoke membership.');
        }
    };

    const members = detail?.members || [];

    const filteredMembers = useMemo(() => {
        return members.filter(member => {
            if (selectedRole !== 'All' && member.role !== selectedRole.toUpperCase()) {
                return false;
            }
            if (!search) return true;
            const term = search.toLowerCase();
            if (member.displayName?.toLowerCase().includes(term)) return true;
            if (member.profileId.toLowerCase().includes(term)) return true;
            return false;
        });
    }, [members, search, selectedRole]);

    const roleCounts = useMemo(() => {
        const counts: Record<string, number> = {
            All: members.length,
            Owner: 0,
            Admin: 0,
            Member: 0,
            Viewer: 0,
        };
        members.forEach(m => {
            const role = m.role.charAt(0).toUpperCase() + m.role.slice(1).toLowerCase();
            if (counts[role] !== undefined) {
                counts[role]++;
            }
        });
        return counts;
    }, [members]);

    const availableRoles = ['All', 'Owner', 'Admin', 'Member', 'Viewer'];

    if (ecosystemIds.length === 0) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="text-center py-20 bg-card border border-border rounded-xl">
                    <UsersIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">
                        No Ecosystem Access
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        You do not have access to any ecosystems.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) return <PageSkeleton rows={5} />;
    if (error)
        return (
            <div className="max-w-5xl mx-auto">
                <ErrorState message={error} onRetry={load} />
            </div>
        );

    const currentRole = ecosystemRoles.find(r => r.ecosystemId === selectedEcosystemId)?.role;
    const canManageMembers = currentRole === 'OWNER' || currentRole === 'ADMIN';

    const totalUsers = members.length;
    const adminsCount = members.filter(m => m.role === 'OWNER' || m.role === 'ADMIN').length;
    const ecosystemsCount = ecosystemIds.length;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">Users</h1>
                    <p className="text-muted-foreground mt-1">
                        People with access to your ecosystems — roles are granted per ecosystem.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {ecosystemIds.length > 1 && (
                        <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm">
                            <label
                                htmlFor="ecosystem-select"
                                className="text-sm font-medium text-muted-foreground px-2"
                            >
                                Ecosystem
                            </label>
                            <select
                                id="ecosystem-select"
                                value={selectedEcosystemId}
                                onChange={event => setSelectedEcosystemId(event.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                {ecosystemIds.map(id => (
                                    <option key={id} value={id}>
                                        {id}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {canManageMembers && (
                        <Button variant="hero" onClick={() => setShowAddUser(true)}>
                            <Plus className="w-4 h-4 mr-1.5" />
                            Add User
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {[
                    {
                        label: 'Total Users',
                        value: totalUsers,
                        icon: UsersIcon,
                        color: 'text-emerald',
                    },
                    {
                        label: 'Admins',
                        value: adminsCount,
                        icon: ShieldCheck,
                        color: 'text-lc-blue',
                    },
                    {
                        label: 'Ecosystems',
                        value: ecosystemsCount,
                        icon: Globe,
                        color: 'text-violet',
                    },
                ].map(stat => (
                    <div
                        key={stat.label}
                        className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-card"
                    >
                        <stat.icon
                            className={cn('w-5 h-5 md:w-6 md:h-6 mb-2 md:mb-3', stat.color)}
                        />
                        <div className="font-display text-2xl md:text-3xl font-bold text-foreground">
                            {stat.value.toLocaleString()}
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground mt-1">
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-display capitalize">Add User</DialogTitle>
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
                            onChange={e => setNewMemberRole(e.target.value as any)}
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

            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    {availableRoles.map(role => {
                        const active = selectedRole === role;
                        return (
                            <button
                                key={role}
                                type="button"
                                onClick={() => setSelectedRole(role)}
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                                    active
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-card text-foreground border-border hover:bg-muted'
                                )}
                            >
                                <span>{role}</span>
                                <span className={active ? 'opacity-80' : 'text-muted-foreground'}>
                                    ({roleCounts[role]})
                                </span>
                            </button>
                        );
                    })}
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        className="pl-10"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSearch(e.target.value)
                        }
                    />
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="text-xs">User</TableHead>
                            <TableHead className="text-xs">Role</TableHead>
                            {canManageMembers && (
                                <TableHead className="text-right text-xs"></TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={canManageMembers ? 3 : 2}
                                    className="h-24 text-center"
                                >
                                    <UsersIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                    <h4 className="font-display font-bold text-foreground mb-1">
                                        No results
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Try a different search term or filter.
                                    </p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMembers.map(member => {
                                let roleBadgeVariant:
                                    | 'default'
                                    | 'secondary'
                                    | 'outline'
                                    | 'success'
                                    | 'warning' = 'secondary';

                                if (member.role === 'OWNER') {
                                    roleBadgeVariant = 'success';
                                } else if (member.role === 'ADMIN') {
                                    roleBadgeVariant = 'warning';
                                } else if (member.role === 'MEMBER') {
                                    roleBadgeVariant = 'secondary';
                                } else if (member.role === 'VIEWER') {
                                    roleBadgeVariant = 'outline';
                                }

                                const personaBadge = member.profileRole
                                    ? getPersonaBadgeProps(member.profileRole)
                                    : null;

                                return (
                                    <TableRow key={member.profileId}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-foreground truncate">
                                                        {member.displayName || member.profileId}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {member.email || member.profileId}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {personaBadge && (
                                                    <Badge
                                                        variant={personaBadge.variant}
                                                        className={cn(
                                                            'text-xs capitalize',
                                                            personaBadge.className
                                                        )}
                                                    >
                                                        {member.profileRole?.toLowerCase()}
                                                    </Badge>
                                                )}
                                                <Badge
                                                    variant={roleBadgeVariant}
                                                    className="text-xs capitalize"
                                                >
                                                    {member.role.toLowerCase()}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        {canManageMembers && (
                                            <TableCell className="text-right">
                                                <DropdownMenu
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    }
                                                >
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() =>
                                                            handleRevoke(member.profileId)
                                                        }
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Remove from ecosystem
                                                    </DropdownMenuItem>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
