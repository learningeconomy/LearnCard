import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/badge';
import { trpc } from '../../trpc';
import type { ConsentDecisionRecord } from '@learncard/types';

// ADR-011 D2: each binding approval that touches subject data leaves an ecosystem-local,
// append-only decision record. This is the evidence trail for one binding.
export function BindingConsentTrail({ bindingId }: { bindingId: string }) {
    const [open, setOpen] = useState(false);
    const [records, setRecords] = useState<ConsentDecisionRecord[] | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || records !== null) return;
        let cancelled = false;
        void Promise.resolve().then(async () => {
            setLoading(true);
            try {
                const result = await trpc.bindings.consentRecords.query({ bindingId });
                if (!cancelled) setRecords(result);
            } catch {
                if (!cancelled) setRecords([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [open, records, bindingId]);

    return (
        <div className="mt-1">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
                {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <ShieldCheck className="h-3 w-3" /> Consent evidence
            </button>
            {open && (
                <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-2">
                    {loading && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                    {!loading && records?.length === 0 && (
                        <p className="text-muted-foreground">
                            No consent decision records. This binding's capability does not release
                            subject data, so ADR-011 preflight was not required.
                        </p>
                    )}
                    {records?.map(record => (
                        <div key={record.id} className="flex flex-wrap items-center gap-1.5">
                            <Badge
                                variant={record.decision === 'ALLOW' ? 'success' : 'destructive'}
                                className="text-[10px]"
                            >
                                {record.decision}
                            </Badge>
                            <span className="text-muted-foreground">
                                subject <span className="font-mono">{record.subjectProfileId}</span>{' '}
                                · {record.consentActor.type.toLowerCase().replace(/_/g, ' ')} ·
                                contract{' '}
                                <span className="font-mono">{record.consentFlowContractId}</span> ·{' '}
                                {new Date(record.occurredAt).toLocaleString()}
                            </span>
                            {record.consentTiers.map(tier => (
                                <Badge key={tier} variant="outline" className="text-[10px]">
                                    {tier}
                                </Badge>
                            ))}
                            {record.reasonCodes.map(code => (
                                <Badge
                                    key={code}
                                    variant="warning"
                                    className="text-[10px] font-mono"
                                >
                                    {code}
                                </Badge>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
