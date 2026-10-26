import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Loader2 } from 'lucide-react';
import { TRPCClientError } from '@trpc/client';
import { getIssuingIdentity, provisionIssuingIdentity, type IssuingIdentity } from '../../api';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface IssuingIdentityPanelProps {
    ecosystemId: string;
    defaultName: string;
    canManage: boolean;
}

/**
 * RFC 2026-10 Stage 4: the managed identity this ecosystem issues credentials as. Bring-your-
 * own-DID is a later option; until then the managed path is the only one offered here.
 */
export function IssuingIdentityPanel({
    ecosystemId,
    defaultName,
    canManage,
}: IssuingIdentityPanelProps) {
    const [identity, setIdentity] = useState<IssuingIdentity | null>(null);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState(defaultName);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setIdentity(await getIssuingIdentity(ecosystemId));
        } finally {
            setLoading(false);
        }
    }, [ecosystemId]);

    useEffect(() => {
        void Promise.resolve().then(load);
    }, [load]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setBusy(true);
        setError(null);
        try {
            setIdentity(await provisionIssuingIdentity({ id: ecosystemId, name: name.trim() }));
        } catch (err) {
            setError(
                err instanceof TRPCClientError
                    ? err.message
                    : 'Something went wrong. Please try again.'
            );
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4">
            <div>
                <h2 className="font-display text-lg font-bold text-foreground">Issuing identity</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Credentials issued by this ecosystem through Platform Issuance carry this
                    identity as their issuer. Its signing key is managed for you and never leaves
                    the signing service.
                </p>
            </div>

            {identity ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <BadgeCheck className="w-5 h-5 text-lc-blue" />
                        <span className="text-sm font-medium text-foreground">{identity.name}</span>
                        <Badge
                            variant={identity.signingReady ? 'success' : 'outline'}
                            className="text-[10px]"
                        >
                            {identity.signingReady ? 'Ready to issue' : 'Signing key pending'}
                        </Badge>
                    </div>
                    <div>
                        <div className="text-xs font-medium text-muted-foreground">Issuer DID</div>
                        <div className="mt-1 font-mono text-xs text-foreground break-all">
                            {identity.did}
                        </div>
                    </div>
                    {!identity.signingReady && canManage && (
                        <Button size="sm" onClick={handleSubmit} disabled={busy}>
                            {busy ? 'Retrying…' : 'Retry key setup'}
                        </Button>
                    )}
                </div>
            ) : canManage ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            Name learners will see
                        </label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Springfield District"
                            disabled={busy}
                        />
                    </div>
                    <Button type="submit" disabled={busy || !name.trim()}>
                        {busy ? 'Setting up…' : 'Set up issuing identity'}
                    </Button>
                </form>
            ) : (
                <p className="text-sm text-muted-foreground">
                    No issuing identity yet. An owner or admin can set one up.
                </p>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
