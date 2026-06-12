import React from 'react';

import { formatClrDate } from '../../../helpers/clrRenderer.helpers';
import type { ClrTranscriptDisplayModel } from '../../../helpers/clrRenderer.helpers';

const CredentialSummaryView: React.FC<{ model: ClrTranscriptDisplayModel }> = ({ model }) => {
    return (
        <div className="bg-white border border-grayscale-200 rounded-[20px] p-6 space-y-4">
            <div className="space-y-1">
                <p className="text-sm font-semibold text-grayscale-900">
                    {model.header.title.value}
                </p>
                {model.header.description?.value && (
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {model.header.description.value}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
                {model.header.issuerName?.value && (
                    <div>
                        <p className="font-medium text-grayscale-500 uppercase tracking-wide text-[10px] mb-0.5">
                            Issuer
                        </p>
                        <p className="text-grayscale-900">{model.header.issuerName.value}</p>
                    </div>
                )}
                {model.header.issuedAt?.value && (
                    <div>
                        <p className="font-medium text-grayscale-500 uppercase tracking-wide text-[10px] mb-0.5">
                            Issued
                        </p>
                        <p className="text-grayscale-900">
                            {formatClrDate(model.header.issuedAt.value)}
                        </p>
                    </div>
                )}
                {model.header.awardedDate?.value && (
                    <div>
                        <p className="font-medium text-grayscale-500 uppercase tracking-wide text-[10px] mb-0.5">
                            Awarded
                        </p>
                        <p className="text-grayscale-900">
                            {formatClrDate(model.header.awardedDate.value)}
                        </p>
                    </div>
                )}
                {model.header.validUntil?.value && (
                    <div>
                        <p className="font-medium text-grayscale-500 uppercase tracking-wide text-[10px] mb-0.5">
                            Valid until
                        </p>
                        <p className="text-grayscale-900">
                            {formatClrDate(model.header.validUntil.value)}
                        </p>
                    </div>
                )}
            </div>

            {model.header.learnerName?.value && (
                <div>
                    <p className="font-medium text-grayscale-500 uppercase tracking-wide text-[10px] mb-0.5">
                        Learner
                    </p>
                    <p className="text-xs text-grayscale-900 font-mono break-all">
                        {model.header.learnerName.value}
                    </p>
                </div>
            )}

            <p className="text-xs text-grayscale-400 pt-2">
                No structured course records were found in this credential. The issuer may use a
                different format or the record may be incomplete.
            </p>
        </div>
    );
};

export default CredentialSummaryView;
