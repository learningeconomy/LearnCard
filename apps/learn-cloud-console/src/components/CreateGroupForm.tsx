import { useState } from 'react';
import { createGroup } from '../api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { TRPCClientError } from '@trpc/client';

interface CreateGroupFormProps {
    ecosystemOptions: { id: string; name: string }[];
    fixedEcosystemId?: string;
    onCreated: (group: { id: string }) => void;
    onCancel: () => void;
}

export function CreateGroupForm({
    ecosystemOptions,
    fixedEcosystemId,
    onCreated,
    onCancel,
}: CreateGroupFormProps) {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<
        'geographic' | 'administrative' | 'programmatic' | 'functional' | 'cohort' | 'custom'
    >('geographic');
    const [ownerEcosystemId, setOwnerEcosystemId] = useState(
        fixedEcosystemId || (ecosystemOptions[0]?.id ?? '')
    );
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [slugEdited, setSlugEdited] = useState(false);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        if (!slugEdited) {
            setSlug(
                newName
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '')
                    .slice(0, 64)
            );
        }
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSlug(e.target.value);
        setSlugEdited(true);
    };

    const isValidSlug = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(slug);
    const canSubmit = name.trim().length > 0 && isValidSlug && ownerEcosystemId;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setBusy(true);
        setError(null);
        try {
            const group = await createGroup({
                ownerEcosystemId,
                name: name.trim(),
                slug: slug.trim(),
                type,
                description: description.trim() || undefined,
            });
            onCreated(group);
        } catch (err) {
            if (err instanceof TRPCClientError) {
                setError(err.message);
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {!fixedEcosystemId && (
                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Owner Ecosystem
                    </label>
                    <Select
                        value={ownerEcosystemId}
                        onValueChange={setOwnerEcosystemId}
                        options={ecosystemOptions.map(opt => ({ value: opt.id, label: opt.name }))}
                        disabled={busy}
                    />
                </div>
            )}

            <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Name
                </label>
                <Input
                    value={name}
                    onChange={handleNameChange}
                    placeholder="e.g. Acme District"
                    disabled={busy}
                />
            </div>

            <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Slug
                </label>
                <Input
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="e.g. acme-district"
                    disabled={busy}
                />
                {!isValidSlug && slug.length > 0 && (
                    <p className="text-xs text-destructive mt-1">
                        Must be lowercase alphanumeric and hyphens only, 1-64 chars.
                    </p>
                )}
            </div>

            <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Type
                </label>
                <Select
                    value={type}
                    onValueChange={setType}
                    options={[
                        { value: 'geographic', label: 'Geographic' },
                        { value: 'administrative', label: 'Administrative' },
                        { value: 'programmatic', label: 'Programmatic' },
                        { value: 'functional', label: 'Functional' },
                        { value: 'cohort', label: 'Cohort' },
                        { value: 'custom', label: 'Custom' },
                    ]}
                    disabled={busy}
                />
            </div>

            <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Description (optional)
                </label>
                <Input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="A brief description"
                    disabled={busy}
                />
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive border border-destructive/20 text-sm">
                    {error}
                </div>
            )}

            <div className="flex items-center gap-2 pt-2">
                <Button type="submit" variant="hero" disabled={!canSubmit || busy}>
                    {busy ? 'Provisioning...' : 'Create & Provision'}
                </Button>
                <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
