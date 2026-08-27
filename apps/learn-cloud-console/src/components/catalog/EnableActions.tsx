import { useState } from 'react';
import { Check, Loader2, Users, XCircle } from 'lucide-react';
import { TRPCClientError } from '@trpc/client';

import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { disableCatalogListing, enableCatalogListing } from '../../api';

interface Props {
    ecosystemId: string;
    listingId: string;
    itemName: string;
    enabled: boolean;
    unrestricted: boolean;
    onChanged: () => void | Promise<void>;
}

export function EnableActions({
    ecosystemId,
    listingId,
    itemName,
    enabled,
    unrestricted,
    onChanged,
}: Props) {
    const [enableOpen, setEnableOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            if (enabled) await disableCatalogListing({ ecosystemId, listingId });
            else await enableCatalogListing({ ecosystemId, listingId });

            await onChanged();
            setEnableOpen(false);
        } catch (e) {
            if (e instanceof TRPCClientError) setError(e.message);
            else setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className={`flex-1 ${
                    enabled ? 'border-emerald/40 text-emerald' : 'border-lc-blue/40 text-lc-blue'
                }`}
                onClick={e => {
                    e.stopPropagation();
                    setError(null);
                    setEnableOpen(true);
                }}
            >
                {enabled ? (
                    <>
                        <Check className="w-4 h-4 mr-2" /> Enabled
                    </>
                ) : (
                    <>
                        <Users className="w-4 h-4 mr-2" /> Enable
                    </>
                )}
            </Button>

            <Dialog open={enableOpen} onOpenChange={setEnableOpen}>
                <DialogContent
                    className="w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto sm:max-w-lg"
                    onClick={e => e.stopPropagation()}
                >
                    <DialogHeader>
                        <DialogTitle>Enable {itemName}</DialogTitle>
                        <DialogDescription>
                            Enabling makes {itemName} available in the catalog for members of the
                            ecosystems you select. They can then install it themselves — enabling
                            does not install anything.
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20 flex items-start gap-2">
                            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="border border-border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-lc-blue" />
                            <h4 className="font-display font-bold text-sm text-foreground">
                                Ecosystem
                            </h4>
                        </div>
                        <p className="text-sm text-foreground break-all">{ecosystemId}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {enabled
                                ? `${itemName} is enabled for this ecosystem's catalog.`
                                : `${itemName} is not enabled for this ecosystem's catalog.`}
                        </p>
                        {unrestricted && (
                            <p className="text-sm text-muted-foreground mt-3">
                                This ecosystem's catalog is currently unrestricted — every listed
                                app is available. Enabling starts explicit curation: only enabled
                                apps stay available.
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEnableOpen(false)}
                            disabled={busy}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={enabled ? 'outline' : 'hero'}
                            className={enabled ? 'text-destructive' : undefined}
                            onClick={submit}
                            disabled={busy}
                        >
                            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {enabled ? 'Disable' : 'Enable'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
