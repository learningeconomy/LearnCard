import type { EvidenceDisplayModel } from '../../helpers/clrRenderer.helpers';

type Props = {
    evidence: EvidenceDisplayModel[];
    compact?: boolean;
};

const openInNewTab = (item: EvidenceDisplayModel) => {
    const raw = item.id?.value;
    if (!raw) return;
    if (item.isInlineDataUri) {
        const [header, data] = raw.split(',');
        const mime = header.slice(5, header.indexOf(';'));
        const bytes = atob(data);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        const blob = new Blob([arr], { type: mime });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
    } else {
        window.open(raw, '_blank', 'noopener');
    }
};

const EvidencePreview = ({ item }: { item: EvidenceDisplayModel }) => {
    const id = item.id?.value;

    if (!id) return null;

    if (item.isLargeInlineDataUri) {
        return (
            <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-xs text-amber-700">Large inline artifact — preview disabled.</p>
                <button
                    onClick={() => openInNewTab(item)}
                    className="shrink-0 text-xs font-medium text-grayscale-900 underline underline-offset-2"
                >
                    Open anyway
                </button>
            </div>
        );
    }

    if (item.isInlineDataUri && item.mimeType?.startsWith('image/')) {
        return (
            <img
                src={id}
                alt={item.name?.value || 'Evidence image'}
                className="mt-2 max-h-48 rounded-lg border border-grayscale-200 object-contain"
            />
        );
    }

    const label = item.mimeType === 'application/pdf' ? 'Open PDF' : 'Open';

    return (
        <button
            onClick={() => openInNewTab(item)}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-grayscale-900 underline underline-offset-2"
        >
            {label}
        </button>
    );
};

const ClrTranscriptEvidenceList = ({ evidence, compact = false }: Props) => {
    if (evidence.length === 0) return null;

    if (compact) {
        return (
            <p className="text-xs text-grayscale-600">
                Original artifact available ({evidence.length})
            </p>
        );
    }

    return (
        <div className="space-y-2">
            <p className="text-sm font-medium text-grayscale-900">Evidence</p>
            {evidence.map((item, index) => (
                <div
                    key={`${item.sourceCredentialId}-${index}`}
                    className="bg-white border border-grayscale-200 rounded-xl p-3 space-y-1"
                >
                    <p className="text-sm text-grayscale-900">
                        {item.name?.value || 'Original artifact available'}
                    </p>
                    {item.description?.value && (
                        <p className="text-xs text-grayscale-600 leading-relaxed">
                            {String(item.description.value)}
                        </p>
                    )}
                    {item.narrative?.value && (
                        <p className="text-xs text-grayscale-700 leading-relaxed italic">
                            {String(item.narrative.value)}
                        </p>
                    )}
                    {(item.genre?.value || item.audience?.value) && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                            {item.genre?.value && (
                                <span className="text-xs text-grayscale-600 bg-grayscale-100 px-2 py-0.5 rounded-full">
                                    {item.genre.value}
                                </span>
                            )}
                            {item.audience?.value && (
                                <span className="text-xs text-grayscale-600 bg-grayscale-100 px-2 py-0.5 rounded-full">
                                    For: {item.audience.value}
                                </span>
                            )}
                        </div>
                    )}
                    <EvidencePreview item={item} />
                </div>
            ))}
        </div>
    );
};

export default ClrTranscriptEvidenceList;
