import { useState } from 'react';
import { createOrgProfile } from '../api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { TRPCClientError } from '@trpc/client';

interface CreateOrgFormProps {
    type: 'institution' | 'employer';
    groupOptions: { id: string; name: string }[];
    onCreated: () => void;
    onCancel: () => void;
}

export function CreateOrgForm({ type, groupOptions, onCreated, onCancel }: CreateOrgFormProps) {
    const [name, setName] = useState('');
    const [groupId, setGroupId] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmit = name.trim().length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setBusy(true);
        setError(null);
        try {
            await createOrgProfile({
                name: name.trim(),
                type,
                groupId: groupId || undefined,
            });
            onCreated();
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
            <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Name
                </label>
                <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={
                        type === 'institution' ? 'e.g. Lincoln High School' : 'e.g. Acme Corp'
                    }
                    disabled={busy}
                />
            </div>

            <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Assign to Group (optional)
                </label>
                <select
                    value={groupId}
                    onChange={e => setGroupId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    disabled={busy}
                >
                    <option value="">No group</option>
                    {groupOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>
                            {opt.name}
                        </option>
                    ))}
                </select>
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
