import * as React from 'react';
import { InstitutionTypeEnum, type InstitutionType } from '@learncard/types';
import { Plus } from 'lucide-react';

import { createEcosystem, createGroup, createOrgProfile, type CreateGroupInput } from '../../api';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, type SelectOption } from '../ui/select';

type Mode = 'group' | 'institution' | 'employer' | 'ecosystem';
type GroupType = CreateGroupInput['type'];

interface AddEntityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: Mode;
    ecosystems: { id: string; name: string; slugPath: string[] }[];
    groups: { id: string; name: string; ownerEcosystemId: string }[];
    defaultEcosystemId?: string;
    onCreated: (result: { kind: Mode; id: string }) => void;
}

const institutionTypeOptions: SelectOption<InstitutionType>[] = InstitutionTypeEnum.options.map(
    value => ({
        value,
        label: {
            preschool: 'Preschool',
            primary_school: 'Primary School',
            secondary_school: 'Secondary School',
            college: 'College',
            university: 'University',
        }[value],
    })
);

// ADR-001 §4 (line 582): prototype's flat State/District/County list is intentionally replaced by Group.type taxonomy
const groupTypeOptions: SelectOption<GroupType>[] = [
    { value: 'geographic', label: 'Geographic', description: 'State, county, region' },
    {
        value: 'administrative',
        label: 'Administrative',
        description: 'District, university system, DOE',
    },
    {
        value: 'programmatic',
        label: 'Programmatic',
        description: 'Title I 2026, STEM consortium',
    },
    {
        value: 'functional',
        label: 'Functional',
        description: 'All K-12 schools, all community colleges',
    },
    { value: 'cohort', label: 'Cohort', description: 'Class of 2030, Spring 2026' },
    { value: 'custom', label: 'Custom', description: 'Tenant-defined' },
];

const slugify = (text: string): string =>
    text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 64);

const isValidSlug = (slug: string): boolean => /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(slug);

const errorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'Something went wrong. Please try again.';

export function AddEntityDialog({
    open,
    onOpenChange,
    mode,
    ecosystems,
    groups,
    defaultEcosystemId,
    onCreated,
}: AddEntityDialogProps) {
    const [ecosystemId, setEcosystemId] = React.useState('');
    const [name, setName] = React.useState('');
    const [institutionType, setInstitutionType] = React.useState<InstitutionType>('primary_school');
    const [groupType, setGroupType] = React.useState<GroupType>('geographic');
    const [city, setCity] = React.useState('');
    const [stateRegion, setStateRegion] = React.useState('');
    const [selectedGroupIds, setSelectedGroupIds] = React.useState<string[]>([]);
    const [newGroupName, setNewGroupName] = React.useState('');
    const [localGroups, setLocalGroups] = React.useState(groups);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isAddingGroup, setIsAddingGroup] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [slugOverride, setSlugOverride] = React.useState<string | null>(null);
    const [isEditingSlug, setIsEditingSlug] = React.useState(false);

    const defaultCandidateId =
        defaultEcosystemId ??
        ecosystems.find(ecosystem => ecosystem.slugPath.length === 1)?.id ??
        ecosystems[0]?.id ??
        '';

    const resetForm = React.useCallback(() => {
        setEcosystemId(defaultCandidateId);
        setName('');
        setInstitutionType('primary_school');
        setGroupType('geographic');
        setCity('');
        setStateRegion('');
        setSelectedGroupIds([]);
        setNewGroupName('');
        setLocalGroups(groups);
        setIsSubmitting(false);
        setIsAddingGroup(false);
        setError(null);
        setSlugOverride(null);
        setIsEditingSlug(false);
    }, [defaultCandidateId, groups]);

    React.useEffect(() => {
        if (open) void Promise.resolve().then(resetForm);
    }, [mode, open, resetForm]);

    const slug = slugOverride ?? slugify(name);
    const needsSlug = mode === 'group' || mode === 'ecosystem';
    const selectedEcosystem = ecosystems.find(ecosystem => ecosystem.id === ecosystemId);
    const availableGroups = localGroups.filter(group => group.ownerEcosystemId === ecosystemId);
    const ecosystemIsReadOnly = ecosystems.length === 1 || defaultEcosystemId !== undefined;
    const canSubmit =
        name.trim().length > 0 && ecosystemId.length > 0 && (!needsSlug || isValidSlug(slug));

    const handleEcosystemChange = (id: string): void => {
        setEcosystemId(id);
        setSelectedGroupIds([]);
    };

    const toggleGroup = (id: string): void => {
        setSelectedGroupIds(previous =>
            previous.includes(id) ? previous.filter(groupId => groupId !== id) : [...previous, id]
        );
    };

    const addInlineGroup = async (): Promise<void> => {
        const trimmedName = newGroupName.trim();
        if (!trimmedName || !ecosystemId || isAddingGroup) return;

        setIsAddingGroup(true);
        setError(null);
        try {
            const group = await createGroup({
                ownerEcosystemId: ecosystemId,
                name: trimmedName,
                slug: slugify(trimmedName),
                type: 'custom',
                description: undefined,
            });
            setLocalGroups(previous => [
                ...previous,
                {
                    id: group.id,
                    name: group.name,
                    ownerEcosystemId: group.ownerEcosystemId,
                },
            ]);
            setSelectedGroupIds(previous => [...previous, group.id]);
            setNewGroupName('');
        } catch (caughtError) {
            setError(errorMessage(caughtError));
        } finally {
            setIsAddingGroup(false);
        }
    };

    const handleSubmit = async (): Promise<void> => {
        if (!canSubmit || isSubmitting) return;

        setIsSubmitting(true);
        setError(null);
        try {
            let createdId: string;
            const trimmedName = name.trim();

            if (mode === 'institution' || mode === 'employer') {
                const hasLocation = city.trim().length > 0 || stateRegion.trim().length > 0;
                // Structured PostalAddress (OBv3 Address shape) — not a free-text location string
                const address = hasLocation
                    ? {
                          type: 'PostalAddress' as const,
                          addressLocality: city.trim() || undefined,
                          addressRegion: stateRegion.trim() || undefined,
                      }
                    : undefined;
                const organization =
                    mode === 'institution'
                        ? { institutionType, ...(address ? { address } : {}) }
                        : address
                          ? { address }
                          : undefined;

                const profile = await createOrgProfile({
                    ecosystemId,
                    name: trimmedName,
                    type: mode,
                    groupIds: selectedGroupIds,
                    organization,
                });
                createdId = profile.profileId;
            } else if (mode === 'group') {
                const group = await createGroup({
                    ownerEcosystemId: ecosystemId,
                    name: trimmedName,
                    slug,
                    type: groupType,
                    description: undefined,
                });
                createdId = group.id;
            } else {
                const ecosystem = await createEcosystem({
                    parentEcosystemId: ecosystemId,
                    name: trimmedName,
                    slug,
                });
                createdId = ecosystem.id;
            }

            resetForm();
            onCreated({ kind: mode, id: createdId });
            onOpenChange(false);
        } catch (caughtError) {
            setError(errorMessage(caughtError));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-display capitalize">
                        Add{' '}
                        {mode === 'institution'
                            ? 'Institution'
                            : mode === 'employer'
                              ? 'Employer'
                              : mode === 'group'
                                ? 'Group'
                                : 'Ecosystem'}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    {error && (
                        <div className="rounded-lg bg-destructive/15 p-4 text-destructive border border-destructive/20 text-sm">
                            {error}
                        </div>
                    )}
                    <div>
                        <Label>{mode === 'ecosystem' ? 'Parent Ecosystem' : 'Ecosystem'}</Label>
                        {ecosystemIsReadOnly && selectedEcosystem ? (
                            <p className="text-xs text-muted-foreground mt-1.5">
                                In{' '}
                                <span className="font-medium text-foreground">
                                    {selectedEcosystem.name}
                                </span>{' '}
                                · /{selectedEcosystem.slugPath.join('/')}
                            </p>
                        ) : (
                            <Select
                                value={ecosystemId}
                                onValueChange={handleEcosystemChange}
                                options={ecosystems.map(ecosystem => ({
                                    value: ecosystem.id,
                                    label: ecosystem.name,
                                    description: `/${ecosystem.slugPath.join('/')}`,
                                }))}
                                placeholder="Select ecosystem"
                                className="mt-1.5"
                            />
                        )}
                    </div>
                    <div>
                        <Label>Name</Label>
                        <Input
                            className="mt-1.5"
                            placeholder="Name"
                            value={name}
                            onChange={event => setName(event.target.value)}
                        />
                        {needsSlug &&
                            slug.length > 0 &&
                            (isEditingSlug ? (
                                <div className="flex items-center gap-2 mt-1.5">
                                    <Input
                                        className="flex-1"
                                        value={slug}
                                        onChange={event => setSlugOverride(event.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className="text-xs text-primary hover:underline"
                                        onClick={() => setIsEditingSlug(false)}
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground mt-1">
                                    /{slug}
                                    <button
                                        type="button"
                                        className="ml-1.5 text-primary hover:underline"
                                        onClick={() => setIsEditingSlug(true)}
                                    >
                                        Edit
                                    </button>
                                </p>
                            ))}
                        {needsSlug && slug.length > 0 && !isValidSlug(slug) && (
                            <p className="text-xs text-destructive mt-1">
                                Must be lowercase alphanumeric and hyphens only, 1-64 chars.
                            </p>
                        )}
                    </div>
                    {mode === 'institution' && (
                        <div>
                            <Label>Type</Label>
                            <Select
                                value={institutionType}
                                onValueChange={setInstitutionType}
                                options={institutionTypeOptions}
                                className="mt-1.5"
                            />
                        </div>
                    )}
                    {mode === 'employer' && (
                        <div>
                            <Label>Type</Label>
                            {/* ADR-001 §4 amendment: employer has no subtype; type is the coarse kind */}
                            <Select
                                value="employer"
                                onValueChange={() => undefined}
                                options={[{ value: 'employer', label: 'Employer' }]}
                                disabled
                                className="mt-1.5"
                            />
                        </div>
                    )}
                    {mode === 'group' && (
                        <div>
                            <Label>Type</Label>
                            <Select
                                value={groupType}
                                onValueChange={setGroupType}
                                options={groupTypeOptions}
                                className="mt-1.5"
                            />
                        </div>
                    )}
                    {(mode === 'institution' || mode === 'employer') && (
                        <>
                            <div>
                                <Label>Location</Label>
                                <div className="flex gap-2 mt-1.5">
                                    <Input
                                        className="flex-1"
                                        placeholder="City"
                                        value={city}
                                        onChange={event => setCity(event.target.value)}
                                    />
                                    <Input
                                        className="flex-1"
                                        placeholder="State"
                                        value={stateRegion}
                                        onChange={event => setStateRegion(event.target.value)}
                                    />
                                </div>
                            </div>
                            {/* Prototype's "Estimated Learners / Employees" omitted: no primitive; headcount is not Profile identity data (ADR-001 §4 amendment, AGENTS.md rule 4) */}
                            <div>
                                <Label>Assign to Groups</Label>
                                {availableGroups.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                        {availableGroups.map(group => (
                                            <Badge
                                                key={group.id}
                                                variant={
                                                    selectedGroupIds.includes(group.id)
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                className="cursor-pointer select-none"
                                                onClick={() => toggleGroup(group.id)}
                                            >
                                                {group.name}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        No groups yet.
                                    </p>
                                )}
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        placeholder="Create new group…"
                                        className="flex-1"
                                        value={newGroupName}
                                        onChange={event => setNewGroupName(event.target.value)}
                                        onKeyDown={event => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault();
                                                void addInlineGroup();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => void addInlineGroup()}
                                        disabled={isAddingGroup}
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        {isAddingGroup ? 'Adding…' : 'Add'}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                    <Button
                        type="button"
                        variant="hero"
                        className="w-full"
                        onClick={() => void handleSubmit()}
                        disabled={!canSubmit || isSubmitting}
                    >
                        {isSubmitting ? 'Provisioning…' : 'Create & Provision'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
