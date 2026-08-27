import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { Globe, Building2, Search, Plus, Layers, School, ChevronDown } from 'lucide-react';
import {
    listEcosystems,
    listGroupsByEcosystem,
    getGroupDetail,
    type EcosystemAccess,
    type Group,
} from '../api';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { PageSkeleton } from '../components/PageSkeleton';
import { ErrorState } from '../components/ErrorState';
import { CreateEcosystemForm } from '../components/CreateEcosystemForm';
import { CreateGroupForm } from '../components/CreateGroupForm';
import { CreateOrgForm } from '../components/CreateOrgForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuItem } from '../components/ui/dropdown-menu';

type UnifiedEntity = {
    id: string;
    name: string;
    subtitle: string;
    typeLabel: string;
    kind: 'ecosystem' | 'group' | 'institution' | 'employer';
    status?: string;
    role?: string;
    link?: string;
};

export function Ecosystem() {
    const [, setLocation] = useLocation();
    const [entries, setEntries] = useState<EcosystemAccess[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [orgProfiles, setOrgProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

    const [showCreateEcosystem, setShowCreateEcosystem] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showCreateOrg, setShowCreateOrg] = useState(false);
    const [createOrgType, setCreateOrgType] = useState<'institution' | 'employer'>('institution');

    const load = useCallback(async () => {
        setError(false);
        setLoading(true);
        try {
            const ecoData = await listEcosystems();
            setEntries(ecoData);

            const grantedEcosystemIds = ecoData.map(e => e.ecosystemId);
            const groupsDataArrays = await Promise.all(
                grantedEcosystemIds.map(id => listGroupsByEcosystem(id).catch(() => []))
            );
            const allGroups = groupsDataArrays.flat();
            setGroups(allGroups);

            const groupDetails = await Promise.all(
                allGroups.map(g => getGroupDetail(g.id).catch(() => null))
            );

            const allOrgs = [];
            const seenProfileIds = new Set<string>();

            for (const detail of groupDetails) {
                if (!detail) continue;
                for (const member of detail.members) {
                    if (member.type === 'institution' || member.type === 'employer') {
                        if (!seenProfileIds.has(member.profileId)) {
                            seenProfileIds.add(member.profileId);
                            allOrgs.push({
                                ...member,
                                groupName: detail.group.name,
                            });
                        }
                    }
                }
            }
            setOrgProfiles(allOrgs);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const unifiedEntities: UnifiedEntity[] = [];

    entries.forEach(entry => {
        unifiedEntities.push({
            id: entry.ecosystemId,
            name: entry.ecosystem ? entry.ecosystem.name : entry.ecosystemId,
            subtitle: entry.ecosystem
                ? entry.ecosystem.description || '/' + entry.ecosystem.slugPath.join('/')
                : 'Details unavailable from LearnCloud yet.',
            typeLabel: 'Ecosystem',
            kind: 'ecosystem',
            status: entry.ecosystem?.status,
            role: entry.role,
            link: `/ecosystem/${entry.ecosystemId}`,
        });
        entry.children.forEach(child => {
            unifiedEntities.push({
                id: child.id,
                name: child.name,
                subtitle: child.description || '/' + child.slugPath.join('/'),
                typeLabel: 'Ecosystem',
                kind: 'ecosystem',
                status: child.status,
                link: `/ecosystem/${child.id}`,
            });
        });
    });

    groups.forEach(group => {
        unifiedEntities.push({
            id: group.id,
            name: group.name,
            subtitle: group.description || '/' + group.slug,
            typeLabel: group.type.charAt(0).toUpperCase() + group.type.slice(1),
            kind: 'group',
            status: group.status,
            link: `/group/${group.id}`,
        });
    });

    orgProfiles.forEach(org => {
        unifiedEntities.push({
            id: org.profileId,
            name: org.displayName || org.profileId,
            subtitle: `Member of ${org.groupName} · ${org.profileId}`,
            typeLabel: org.type === 'institution' ? 'Institution' : 'Employer',
            kind: org.type as 'institution' | 'employer',
        });
    });

    const filtered = unifiedEntities.filter(entity => {
        if (selectedTypes.length > 0 && !selectedTypes.includes(entity.typeLabel)) {
            return false;
        }

        if (!search) return true;
        const term = search.toLowerCase();
        if (entity.name.toLowerCase().includes(term)) return true;
        if (entity.subtitle.toLowerCase().includes(term)) return true;
        if (entity.id.toLowerCase().includes(term)) return true;
        return false;
    });

    const typeCounts = unifiedEntities.reduce<Record<string, number>>((acc, entity) => {
        acc[entity.typeLabel] = (acc[entity.typeLabel] || 0) + 1;
        return acc;
    }, {});

    const availableTypes = Object.keys(typeCounts).sort();

    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const parentOptions = entries
        .flatMap(entry => {
            const opts = [];
            if (entry.ecosystem) {
                opts.push({ id: entry.ecosystemId, name: entry.ecosystem.name });
            }
            opts.push(...entry.children.map(c => ({ id: c.id, name: c.name })));
            return opts;
        })
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    if (loading) return <PageSkeleton rows={5} />;
    if (error)
        return (
            <div className="max-w-5xl mx-auto">
                <ErrorState message="Failed to load ecosystem data." onRetry={load} />
            </div>
        );

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                        Your Ecosystem
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        Your full ecosystem, filtered to only what you have permission to see.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu
                        trigger={
                            <Button variant="hero" size="sm" className="sm:size-default">
                                <Plus className="w-4 h-4 mr-1.5" />
                                Add
                                <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-80" />
                            </Button>
                        }
                    >
                        <DropdownMenuItem onClick={() => setShowCreateGroup(true)}>
                            <Layers className="w-4 h-4 mr-2 text-violet" />
                            Add Group
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                setCreateOrgType('employer');
                                setShowCreateOrg(true);
                            }}
                        >
                            <Building2 className="w-4 h-4 mr-2 text-coral" />
                            Add Employer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                setCreateOrgType('institution');
                                setShowCreateOrg(true);
                            }}
                        >
                            <School className="w-4 h-4 mr-2 text-emerald" />
                            Add Institution
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowCreateEcosystem(true)}>
                            <Globe className="w-4 h-4 mr-2 text-primary" />
                            Add Ecosystem
                        </DropdownMenuItem>
                    </DropdownMenu>
                </div>
            </div>

            <Dialog open={showCreateEcosystem} onOpenChange={setShowCreateEcosystem}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-display capitalize">Add Ecosystem</DialogTitle>
                    </DialogHeader>
                    <CreateEcosystemForm
                        parentOptions={parentOptions}
                        onCreated={eco => {
                            setShowCreateEcosystem(false);
                            setLocation(`/ecosystem/${eco.id}`);
                        }}
                        onCancel={() => setShowCreateEcosystem(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-display capitalize">Add Group</DialogTitle>
                    </DialogHeader>
                    <CreateGroupForm
                        ecosystemOptions={parentOptions}
                        onCreated={() => {
                            setShowCreateGroup(false);
                            load();
                        }}
                        onCancel={() => setShowCreateGroup(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={showCreateOrg} onOpenChange={setShowCreateOrg}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-display capitalize">
                            Add {createOrgType === 'institution' ? 'Institution' : 'Employer'}
                        </DialogTitle>
                    </DialogHeader>
                    <CreateOrgForm
                        type={createOrgType}
                        groupOptions={groups.map(g => ({ id: g.id, name: g.name }))}
                        onCreated={() => {
                            setShowCreateOrg(false);
                            load();
                        }}
                        onCancel={() => setShowCreateOrg(false)}
                    />
                </DialogContent>
            </Dialog>

            <div className="space-y-3">
                {availableTypes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        {availableTypes.map(type => {
                            const active = selectedTypes.includes(type);
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => toggleType(type)}
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                                        active
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-card text-foreground border-border hover:bg-muted'
                                    )}
                                >
                                    <span>{type}</span>
                                    <span
                                        className={active ? 'opacity-80' : 'text-muted-foreground'}
                                    >
                                        ({typeCounts[type]})
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        className="pl-10"
                        placeholder="Search ecosystem..."
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSearch(e.target.value)
                        }
                    />
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-20 bg-card border border-border rounded-xl">
                    <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">
                        {unifiedEntities.length === 0 ? 'Your ecosystem is empty' : 'No results'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {unifiedEntities.length === 0
                            ? 'Add groups, institutions, or employers to build your network.'
                            : 'Try a different search term or filter.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(entity => {
                        const isLink = !!entity.link;

                        let Icon = Globe;
                        let iconColor = 'bg-violet/10 text-violet';
                        if (entity.kind === 'group') {
                            Icon = Layers;
                            iconColor = 'bg-violet/10 text-violet';
                        } else if (entity.kind === 'institution') {
                            Icon = School;
                            iconColor = 'bg-emerald/10 text-emerald';
                        } else if (entity.kind === 'employer') {
                            Icon = Building2;
                            iconColor = 'bg-coral/10 text-coral';
                        }

                        if (isLink) {
                            return (
                                <Link
                                    key={entity.id}
                                    href={entity.link as string}
                                    className={cn(
                                        'bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card transition-shadow hover:shadow-elevated cursor-pointer block'
                                    )}
                                >
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                        <div
                                            className={cn(
                                                'w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0',
                                                iconColor
                                            )}
                                        >
                                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-medium text-foreground truncate">
                                                {entity.name}
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs shrink-0 align-middle ml-2"
                                                >
                                                    {entity.typeLabel}
                                                </Badge>
                                            </h3>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {entity.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        {entity.role && (
                                            <Badge variant="outline" className="text-xs">
                                                {entity.role}
                                            </Badge>
                                        )}
                                        {entity.status && (
                                            <Badge
                                                variant={
                                                    entity.status === 'ACTIVE'
                                                        ? 'success'
                                                        : entity.status === 'DRAFT'
                                                        ? 'warning'
                                                        : 'outline'
                                                }
                                            >
                                                {entity.status}
                                            </Badge>
                                        )}
                                    </div>
                                </Link>
                            );
                        }

                        return (
                            <div
                                key={entity.id}
                                className={cn(
                                    'bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card transition-shadow'
                                )}
                            >
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <div
                                        className={cn(
                                            'w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0',
                                            iconColor
                                        )}
                                    >
                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-foreground truncate">
                                            {entity.name}
                                            <Badge
                                                variant="secondary"
                                                className="text-xs shrink-0 align-middle ml-2"
                                            >
                                                {entity.typeLabel}
                                            </Badge>
                                        </h3>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {entity.subtitle}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    {entity.role && (
                                        <Badge variant="outline" className="text-xs">
                                            {entity.role}
                                        </Badge>
                                    )}
                                    {entity.status && (
                                        <Badge
                                            variant={
                                                entity.status === 'ACTIVE'
                                                    ? 'success'
                                                    : entity.status === 'DRAFT'
                                                    ? 'warning'
                                                    : 'outline'
                                            }
                                        >
                                            {entity.status}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
