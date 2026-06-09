import React from 'react';
import DownloadIcon from 'learn-card-base/svgs/DownloadIcon';
import { downloadEvidence } from '../../../clr-transcript/clr.helpers';
import { useToast, ToastTypeEnum } from 'learn-card-base';
import type { EvidenceDisplayModel } from '../../../../helpers/clrRenderer.helpers';

type ClrEvidenceHeaderProps = {
    evidence: EvidenceDisplayModel[];
};

const ClrEvidenceHeader: React.FC<ClrEvidenceHeaderProps> = ({ evidence }) => {
    const { presentToast } = useToast();

    const handleDownload = async (item: EvidenceDisplayModel) => {
        const ok = await downloadEvidence(item);
        if (!ok) {
            presentToast('Could not open evidence file', { type: ToastTypeEnum.Error, hasDismissButton: true });
        }
    };

    return (
        <div className="shrink-0 border-b border-grayscale-200 bg-white/95 backdrop-blur-sm px-4 py-3 safe-area-top-margin absolute top-0 left-0 right-0 z-9999 flex items-center justify-between">
            <div className="flex items-center gap-2">
                {evidence.map(item => (
                    <button
                        key={item.id?.value ?? item.name?.value}
                        onClick={() => handleDownload(item)}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-grayscale-200 border-solid bg-white hover:bg-grayscale-50 text-indigo-500 font-semibold text-sm transition-colors"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        {item.name?.value ||
                            (item.mimeType === 'application/pdf' ? 'Download PDF' : 'Download')}
                    </button>
                ))}
            </div>
            <span className="text-sm font-semibold text-grayscale-900">
                {evidence.length === 1 ? '1 attachment' : `${evidence.length} attachments`}
            </span>
        </div>
    );
};

export default ClrEvidenceHeader;
