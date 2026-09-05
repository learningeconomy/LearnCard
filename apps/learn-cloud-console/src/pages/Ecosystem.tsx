import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { Globe, Building2, Search, Plus, Layers, School, ChevronDown, Network } from 'lucide-react';
import { InstitutionTypeEnum, type InstitutionType } from '@learncard/types';
import {
    listEcosystems,
    listGroupsByEcosystem,
    getGroupDetail,
    getEcosystemDetail,
    type EcosystemAccess,
    type EcosystemDetail,
    type Group,
} from '../api';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { PageSkeleton } from '../components/PageSkeleton';
import { ErrorState } from '../components/ErrorState';
import { DropdownMenu, DropdownMenuItem } from '../components/ui/dropdown-menu';
import { AddEntityDialog } from '../components/ecosystem/AddEntityDialog';
import { EcosystemMapDialog } from '../components/ecosystem/EcosystemMapDialog';

const institutionTypeLabels: Record<InstitutionType, string> = {
    [InstitutionTypeEnum.enum.preschool]: 'Preschool',
    [InstitutionTypeEnum.enum.primary_school]: 'Primary School',
    [InstitutionTypeEnum.enum.secondary_school]: 'Secondary School',
    [InstitutionTypeEnum.enum.college]: 'College',
    [InstitutionTypeEnum.enum.university]: 'University',
};

type UnifiedEntity = {
    id: string;
    name: string;
    subtitle: React.ReactNode;
    searchString: string;
    typeLabel: string;
    kind: 'ecosystem' | 'group' | 'institution' | 'employer';
    status?: string;
    role?: string;
    link?: string;
    slugPath?: string[];
    ownerEcosystemId?: string;
    groupIds?: string[];
    groupNames?: string[];
};

type EcosystemMember = EcosystemDetail['members'][number];
type OrgProfile = Pick<EcosystemMember, 'profileId' | 'displayName' | 'organization'> & {
    type: 'institution' | 'employer';
    anchorEcosystemId: string;
    groupNames: string[];
    groupIds: string[];
};

const isOrgMember = (
    member: EcosystemMember
): member is EcosystemMember & { type: 'institution' | 'employer' } =>
    member.type === 'institution' || member.type === 'employer';

export function Ecosystem() {
    const [, setLocation] = useLocation();
    const [entries, setEntries] = useState<EcosystemAccess[]>([]);
    const [deepEcosystems, setDeepEcosystems] = useState<EcosystemDetail[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [orgProfiles, setOrgProfiles] = useState<OrgProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<
        'group' | 'institution' | 'employer' | 'ecosystem'
    >('institution');
    const [mapOpen, setMapOpen] = useState(false);

    const load = useCallback(async () => {
        setError(false);
        setLoading(true);
        try {
            // ecosystem.listMine returns direct children only; walk CHILD_OF breadth-first so deep subtrees render (ADR-001 D3)
            const ecoData = await listEcosystems();
            setEntries(ecoData);

            const allEcoDetails = new Map<string, EcosystemDetail>();
            const queue = new Set<string>();

            ecoData.forEach(e => {
                queue.add(e.ecosystemId);
                e.children.forEach(c => queue.add(c.id));
            });

            let currentLevel = Array.from(queue);
            let depth = 0;

            while (currentLevel.length > 0 && depth < 8) {
                const details = await Promise.all(
                    currentLevel.map(id => getEcosystemDetail(id).catch(() => null))
                );

                const nextLevel = new Set<string>();
                for (const detail of details) {
                    if (!detail) continue;
                    allEcoDetails.set(detail.ecosystemId, detail);
                    for (const child of detail.children) {
                        if (!allEcoDetails.has(child.id)) {
                            nextLevel.add(child.id);
                        }
                    }
                }
                currentLevel = Array.from(nextLevel);
                depth++;
            }

            const uniqueEcoIds = Array.from(allEcoDetails.keys());
            setDeepEcosystems(Array.from(allEcoDetails.values()));

            const groupsDataArrays = await Promise.all(
                uniqueEcoIds.map(id => listGroupsByEcosystem(id).catch(() => []))
            );
            const allGroups = groupsDataArrays.flat();
            setGroups(allGroups);

            const groupDetails = await Promise.all(
                allGroups.map(g => getGroupDetail(g.id).catch(() => null))
            );

            const profileIdToGroupNames = new Map<string, string[]>();
            const profileIdToGroupIds = new Map<string, string[]>();
            for (const detail of groupDetails) {
                if (!detail) continue;
                for (const member of detail.members) {
                    const existing = profileIdToGroupNames.get(member.profileId) || [];
                    if (!existing.includes(detail.group.name)) existing.push(detail.group.name);
                    profileIdToGroupNames.set(member.profileId, existing);

                    const existingIds = profileIdToGroupIds.get(member.profileId) || [];
                    if (!existingIds.includes(detail.group.id)) existingIds.push(detail.group.id);
                    profileIdToGroupIds.set(member.profileId, existingIds);
                }
            }

            // ADR-001 D6: institutions/employers are Profiles anchored to the Ecosystem via MEMBER_OF; Groups (D11) are optional taxonomy
            const ecoDetails = Array.from(allEcoDetails.values());

            const allOrgs: OrgProfile[] = [];
            const seenProfileIds = new Set<string>();

            for (const detail of ecoDetails) {
                if (!detail) continue;
                for (const member of detail.members) {
                    if (isOrgMember(member)) {
                        if (!seenProfileIds.has(member.profileId)) {
                            seenProfileIds.add(member.profileId);
                            allOrgs.push({
                                profileId: member.profileId,
                                displayName: member.displayName,
                                type: member.type,
                                organization: member.organization,
                                anchorEcosystemId: detail.ecosystemId,
                                groupNames: profileIdToGroupNames.get(member.profileId) || [],
                                groupIds: profileIdToGroupIds.get(member.profileId) || [],
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
        void Promise.resolve().then(load);
    }, [load]);

    const openDialog = (mode: 'group' | 'institution' | 'employer' | 'ecosystem') => {
        setDialogMode(mode);
        setDialogOpen(true);
    };

    const unifiedEntities: UnifiedEntity[] = [];

    const ecoNameMap = new Map<string, string>();
    deepEcosystems.forEach(eco => {
        if (eco.ecosystem) ecoNameMap.set(eco.ecosystemId, eco.ecosystem.name);
    });
    entries.forEach(entry => {
        if (entry.ecosystem) ecoNameMap.set(entry.ecosystemId, entry.ecosystem.name);
        entry.children.forEach(child => ecoNameMap.set(child.id, child.name));
    });

    // Helper to generate ecosystem summary
    const getEcoSummary = (ecoId: string, childrenCount: number) => {
        const groupCount = groups.filter(g => g.ownerEcosystemId === ecoId).length;
        const memberCount = orgProfiles.filter(o => o.anchorEcosystemId === ecoId).length;

        const parts: string[] = [];
        if (childrenCount > 0)
            parts.push(`${childrenCount} child ecosystem${childrenCount === 1 ? '' : 's'}`);
        if (groupCount > 0) parts.push(`${groupCount} group${groupCount === 1 ? '' : 's'}`);
        if (memberCount > 0) parts.push(`${memberCount} member${memberCount === 1 ? '' : 's'}`);

        // Slug is a URL detail; hierarchy is conveyed by sectioning + breadcrumb. Cards summarize contents instead.
        return parts.length > 0 ? parts.join(' · ') : null;
    };

    const addedEcoIds = new Set<string>();
    entries.forEach(entry => {
        addedEcoIds.add(entry.ecosystemId);
        unifiedEntities.push({
            id: entry.ecosystemId,
            name: entry.ecosystem ? entry.ecosystem.name : entry.ecosystemId,
            subtitle: getEcoSummary(entry.ecosystemId, entry.children.length),
            searchString: entry.ecosystem
                ? '/' + entry.ecosystem.slugPath.join('/')
                : 'Details unavailable from LearnCloud yet.',
            typeLabel: 'Ecosystem',
            kind: 'ecosystem',
            status: entry.ecosystem?.status,
            role: entry.role,
            link: `/ecosystem/${entry.ecosystemId}`,
            slugPath: entry.ecosystem?.slugPath || [entry.ecosystemId],
        });
        entry.children.forEach(child => {
            if (!addedEcoIds.has(child.id)) {
                addedEcoIds.add(child.id);
                unifiedEntities.push({
                    id: child.id,
                    name: child.name,
                    subtitle: getEcoSummary(child.id, 0),
                    searchString: '/' + child.slugPath.join('/'),
                    typeLabel: 'Ecosystem',
                    kind: 'ecosystem',
                    status: child.status,
                    link: `/ecosystem/${child.id}`,
                    slugPath: child.slugPath,
                });
            }
        });
    });

    deepEcosystems.forEach(eco => {
        if (!addedEcoIds.has(eco.ecosystemId)) {
            addedEcoIds.add(eco.ecosystemId);
            unifiedEntities.push({
                id: eco.ecosystemId,
                name: eco.ecosystem ? eco.ecosystem.name : eco.ecosystemId,
                subtitle: getEcoSummary(eco.ecosystemId, eco.children.length),
                searchString: eco.ecosystem
                    ? '/' + eco.ecosystem.slugPath.join('/')
                    : 'Details unavailable from LearnCloud yet.',
                typeLabel: 'Ecosystem',
                kind: 'ecosystem',
                status: eco.ecosystem?.status,
                link: `/ecosystem/${eco.ecosystemId}`,
                slugPath: eco.ecosystem?.slugPath || [eco.ecosystemId],
            });
        }
    });

    groups.forEach(group => {
        const ownerName = ecoNameMap.get(group.ownerEcosystemId) || group.ownerEcosystemId;
        unifiedEntities.push({
            id: group.id,
            name: group.name,
            subtitle: (
                <>
                    in <span className="font-medium text-foreground">{ownerName}</span>
                </>
            ),
            searchString: `in ${ownerName}`,
            typeLabel: group.type.charAt(0).toUpperCase() + group.type.slice(1),
            kind: 'group',
            status: group.status,
            link: `/group/${group.id}`,
            ownerEcosystemId: group.ownerEcosystemId,
        });
    });

    orgProfiles.forEach(org => {
        const parts: string[] = [];
        if (org.type === 'institution' && org.organization?.institutionType) {
            parts.push(
                institutionTypeLabels[org.organization.institutionType] ||
                    org.organization.institutionType
            );
        }
        if (
            org.organization?.address?.addressLocality ||
            org.organization?.address?.addressRegion
        ) {
            const loc = [
                org.organization.address.addressLocality,
                org.organization.address.addressRegion,
            ]
                .filter(Boolean)
                .join(', ');
            if (loc) parts.push(loc);
        }

        let subtitle: React.ReactNode;
        const ownerName = ecoNameMap.get(org.anchorEcosystemId) || org.anchorEcosystemId;
        if (parts.length > 0) {
            subtitle = parts.join(' · ');
        } else {
            subtitle = (
                <>
                    in <span className="font-medium text-foreground">{ownerName}</span>
                </>
            );
        }

        unifiedEntities.push({
            id: org.profileId,
            name: org.displayName || org.profileId,
            subtitle,
            searchString: parts.length > 0 ? parts.join(' · ') : `in ${ownerName}`,
            typeLabel: org.type === 'institution' ? 'Institution' : 'Employer',
            kind: org.type,
            link: `/ecosystem/${org.anchorEcosystemId}`,
            ownerEcosystemId: org.anchorEcosystemId,
            groupIds: org.groupIds,
            groupNames: org.groupNames, // Pass groupNames for chips
        });
    });

    const filtered = unifiedEntities.filter(entity => {
        if (selectedTypes.length > 0 && !selectedTypes.includes(entity.typeLabel)) {
            return false;
        }

        if (!search) return true;
        const term = search.toLowerCase();
        if (entity.name.toLowerCase().includes(term)) return true;
        if (entity.searchString.toLowerCase().includes(term)) return true;
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
        .flatMap(entry => [
            ...(entry.ecosystem
                ? [
                      {
                          id: entry.ecosystemId,
                          name: entry.ecosystem.name,
                          slugPath: entry.ecosystem.slugPath,
                      },
                  ]
                : []),
            ...entry.children.map(child => ({
                id: child.id,
                name: child.name,
                slugPath: child.slugPath,
            })),
        ])
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
                    <Button
                        variant="outline"
                        size="sm"
                        className="sm:size-default"
                        onClick={() => setMapOpen(true)}
                    >
                        <Network className="w-4 h-4 mr-1.5" />
                        MAP
                    </Button>
                    <DropdownMenu
                        trigger={
                            <Button variant="hero" size="sm" className="sm:size-default">
                                <Plus className="w-4 h-4 mr-1.5" />
                                Add
                                <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-80" />
                            </Button>
                        }
                    >
                        <DropdownMenuItem onClick={() => openDialog('group')}>
                            <Layers className="w-4 h-4 mr-2 text-violet" />
                            Add Group
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDialog('employer')}>
                            <Building2 className="w-4 h-4 mr-2 text-coral" />
                            Add Employer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDialog('institution')}>
                            <School className="w-4 h-4 mr-2 text-emerald" />
                            Add Institution
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDialog('ecosystem')}>
                            <Globe className="w-4 h-4 mr-2 text-primary" />
                            Add Ecosystem
                        </DropdownMenuItem>
                    </DropdownMenu>
                </div>
            </div>

            <AddEntityDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                mode={dialogMode}
                ecosystems={parentOptions}
                groups={groups.map(group => ({
                    id: group.id,
                    name: group.name,
                    ownerEcosystemId: group.ownerEcosystemId,
                }))}
                onCreated={result => {
                    if (result.kind === 'ecosystem') {
                        setLocation(`/ecosystem/${result.id}`);
                    } else {
                        void load();
                    }
                }}
            />
            <EcosystemMapDialog
                open={mapOpen}
                onOpenChange={setMapOpen}
                entities={unifiedEntities}
            />

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
                <div className="space-y-6">
                    {(() => {
                        // Group by ecosystem
                        const ecoMap = new Map<string, UnifiedEntity>();
                        const childrenMap = new Map<string, UnifiedEntity[]>();

                        // First, collect all ecosystems
                        unifiedEntities.forEach(e => {
                            if (e.kind === 'ecosystem') {
                                ecoMap.set(e.id, e);
                                if (!childrenMap.has(e.id)) childrenMap.set(e.id, []);
                            }
                        });

                        // Then assign children
                        unifiedEntities.forEach(e => {
                            if (e.kind !== 'ecosystem' && e.ownerEcosystemId) {
                                if (!childrenMap.has(e.ownerEcosystemId))
                                    childrenMap.set(e.ownerEcosystemId, []);
                                childrenMap.get(e.ownerEcosystemId)!.push(e);
                            }
                        });

                        // Sort ecosystems by slugPath length (roots first)
                        const sortedEcos = Array.from(ecoMap.values()).sort((a, b) => {
                            const aLen = a.slugPath?.length || 0;
                            const bLen = b.slugPath?.length || 0;
                            if (aLen !== bLen) return aLen - bLen;
                            return a.name.localeCompare(b.name);
                        });

                        const renderCard = (entity: UnifiedEntity) => {
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

                            // Exception-only: ACTIVE is the norm; only DRAFT/ARCHIVED (Ecosystem/Group lifecycle) is signal
                            const showStatus = entity.status && entity.status !== 'ACTIVE';

                            // ADR-001 D11: groups are taxonomy tags on a Profile — render as chips, not prose
                            const hasGroups = entity.groupNames && entity.groupNames.length > 0;

                            const content = (
                                <>
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
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
                                            {entity.subtitle && (
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {entity.subtitle}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {(showStatus || hasGroups) && (
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto shrink-0 justify-end">
                                            {hasGroups && (
                                                <div
                                                    className="flex flex-wrap items-center gap-1.5"
                                                    title={entity.groupNames!.join(', ')}
                                                >
                                                    {entity.groupNames!.slice(0, 2).map(gName => (
                                                        <Badge
                                                            key={gName}
                                                            variant="outline"
                                                            className="text-xs whitespace-nowrap"
                                                        >
                                                            {gName}
                                                        </Badge>
                                                    ))}
                                                    {entity.groupNames!.length > 2 && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs whitespace-nowrap"
                                                        >
                                                            +{entity.groupNames!.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                            {showStatus && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs text-muted-foreground"
                                                >
                                                    {entity.status}
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </>
                            );

                            if (isLink) {
                                return (
                                    <Link
                                        key={entity.id}
                                        href={entity.link as string}
                                        className={cn(
                                            'bg-card border border-border rounded-xl p-4 md:p-5 flex items-center gap-3 shadow-card transition-shadow hover:shadow-elevated cursor-pointer'
                                        )}
                                    >
                                        {content}
                                    </Link>
                                );
                            }

                            return (
                                <div
                                    key={entity.id}
                                    className={cn(
                                        'bg-card border border-border rounded-xl p-4 md:p-5 flex items-center gap-3 shadow-card transition-shadow'
                                    )}
                                >
                                    {content}
                                </div>
                            );
                        };

                        const renderedSections: React.ReactNode[] = [];
                        const processedEcoIds = new Set<string>();

                        const renderSection = (eco: UnifiedEntity) => {
                            if (processedEcoIds.has(eco.id)) return null;
                            processedEcoIds.add(eco.id);

                            const children = childrenMap.get(eco.id) || [];

                            // Filter children based on search/type
                            const filteredChildren = children.filter(c =>
                                filtered.some(f => f.id === c.id)
                            );
                            const isEcoFiltered = filtered.some(f => f.id === eco.id);

                            if (!isEcoFiltered && filteredChildren.length === 0) return null;

                            const depth = (eco.slugPath?.length || 1) - 1;

                            // Sort children: groups first, then institutions, then employers
                            const kindOrder = {
                                group: 0,
                                institution: 1,
                                employer: 2,
                                ecosystem: 3,
                            };
                            filteredChildren.sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind]);

                            return (
                                <div
                                    key={eco.id}
                                    className={cn(
                                        'space-y-3',
                                        depth >= 1 && 'border-l-2 border-border pl-4'
                                    )}
                                >
                                    {isEcoFiltered ? (
                                        renderCard(eco)
                                    ) : (
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            {eco.name}
                                        </p>
                                    )}
                                    {filteredChildren.map(child => renderCard(child))}

                                    {/* Render child ecosystems recursively */}
                                    {sortedEcos
                                        .filter(
                                            e =>
                                                e.slugPath &&
                                                e.slugPath.length > 1 &&
                                                e.slugPath[e.slugPath.length - 2] ===
                                                    eco.slugPath?.[eco.slugPath.length - 1]
                                        )
                                        .map(childEco => renderSection(childEco))}
                                </div>
                            );
                        };

                        // Start with root ecosystems (depth 0)
                        sortedEcos
                            .filter(e => !e.slugPath || e.slugPath.length === 1)
                            .forEach(eco => {
                                const section = renderSection(eco);
                                if (section) renderedSections.push(section);
                            });

                        return renderedSections;
                    })()}
                </div>
            )}
        </div>
    );
}
