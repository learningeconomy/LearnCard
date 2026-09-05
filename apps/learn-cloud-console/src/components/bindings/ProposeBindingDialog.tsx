import { useState } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { trpc } from '../../trpc';
import { TRPCClientError } from '@trpc/client';
import type { EcosystemInstallTarget } from '../../api';

type ResourceType = EcosystemInstallTarget['targetType'] | 'ECOSYSTEM';
type EndpointChoice = {
    key: string;
    label: string;
    resourceType: ResourceType;
    resourceId: string;
};

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ecosystemId: string;
    targets: EcosystemInstallTarget[];
    capabilities: string[];
    onProposed: () => void;
}

export function ProposeBindingDialog({
    open,
    onOpenChange,
    ecosystemId,
    targets,
    capabilities,
    onProposed,
}: Props) {
    const [capability, setCapability] = useState(capabilities[0] ?? '');
    const [providerKey, setProviderKey] = useState('');
    const [consumerKey, setConsumerKey] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const choices: EndpointChoice[] = [
        {
            key: 'ecosystem',
            label: 'This ecosystem',
            resourceType: 'ECOSYSTEM',
            resourceId: ecosystemId,
        },
        ...targets
            .filter(target => target.status === 'READY')
            .map(target => ({
                key: target.id,
                label: `${target.displayName ?? target.id} (${target.targetType.toLowerCase().replace(/_/g, ' ')})`,
                resourceType: target.targetType,
                resourceId: target.id,
            })),
    ];

    const resolve = (key: string) => choices.find(choice => choice.key === key);

    const submit = async () => {
        const provider = resolve(providerKey);
        const consumer = resolve(consumerKey);
        if (!provider || !consumer || !capability) {
            setError('Choose a capability, a provider, and a consumer.');
            return;
        }
        if (provider.key === consumer.key) {
            setError('Provider and consumer must be different endpoints.');
            return;
        }

        setBusy(true);
        setError(null);
        try {
            await trpc.bindings.propose.mutate({
                ecosystemId,
                capability,
                provider: {
                    resourceType: provider.resourceType,
                    resourceId: provider.resourceId,
                    ecosystemId,
                },
                consumer: {
                    resourceType: consumer.resourceType,
                    resourceId: consumer.resourceId,
                    ecosystemId,
                },
            });
            onProposed();
            onOpenChange(false);
            setProviderKey('');
            setConsumerKey('');
        } catch (e) {
            setError(e instanceof TRPCClientError ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Propose a binding</DialogTitle>
                    <DialogDescription>
                        Name the provider, the consumer, and the capability that connects them. The
                        binding stays proposed until an accountable administrator approves it.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20 flex items-start gap-2">
                        <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <label className="block space-y-1.5">
                        <span className="text-sm font-medium">Capability</span>
                        <Select
                            value={capability}
                            onValueChange={setCapability}
                            options={capabilities.map(c => ({ value: c, label: c }))}
                            className="font-mono"
                        />
                    </label>
                    <label className="block space-y-1.5">
                        <span className="text-sm font-medium">Provider</span>
                        <Select
                            value={providerKey}
                            onValueChange={setProviderKey}
                            options={choices.map(choice => ({
                                value: choice.key,
                                label: choice.label,
                            }))}
                            placeholder="Select a provider…"
                        />
                    </label>
                    <label className="block space-y-1.5">
                        <span className="text-sm font-medium">Consumer</span>
                        <Select
                            value={consumerKey}
                            onValueChange={setConsumerKey}
                            options={choices.map(choice => ({
                                value: choice.key,
                                label: choice.label,
                            }))}
                            placeholder="Select a consumer…"
                        />
                    </label>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={busy}>
                        {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Propose
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
