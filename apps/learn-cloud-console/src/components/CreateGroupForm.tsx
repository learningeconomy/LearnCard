import { useState } from 'react';
import { createGroup } from '../api';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
                    <select
                        value={ownerEcosystemId}
                        onChange={e => setOwnerEcosystemId(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        disabled={busy}
                    >
                        {ecosystemOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>
                                {opt.name}
                            </option>
                        ))}
                    </select>
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
                <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    disabled={busy}
                >
                    <option value="geographic">Geographic</option>
                    <option value="administrative">Administrative</option>
                    <option value="programmatic">Programmatic</option>
                    <option value="functional">Functional</option>
                    <option value="cohort">Cohort</option>
                    <option value="custom">Custom</option>
                </select>
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
