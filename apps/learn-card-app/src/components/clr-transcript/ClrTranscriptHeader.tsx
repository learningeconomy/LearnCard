import type { ClrTranscriptDisplayModel, IssuerAddressDisplayModel } from '../../helpers/clrRenderer.helpers';

import ClrTranscriptSourceField from './ClrTranscriptSourceField';
import ClrTranscriptTrustBadge from './ClrTranscriptTrustBadge';

type Props = {
    model: ClrTranscriptDisplayModel;
    showSource?: boolean;
};

const IssuerAddress = ({ address, showSource }: { address: IssuerAddressDisplayModel; showSource: boolean }) => {
    const cityLine = [address.addressLocality, address.addressRegion, address.postalCode]
        .filter(Boolean)
        .join(', ');

    return (
        <div className="space-y-1">
            <p className="text-xs font-medium text-grayscale-700">Issuer Address</p>
            <div className="text-sm text-grayscale-900 leading-relaxed">
                {address.streetAddress && <p>{address.streetAddress}</p>}
                {cityLine && <p>{cityLine}</p>}
                {address.addressCountry && <p>{address.addressCountry}</p>}
            </div>
            {showSource && (
                <p className="text-xs text-grayscale-500 leading-relaxed">
                    issuer.address • {address.sourcePath}
                </p>
            )}
        </div>
    );
};

const ClrTranscriptHeader = ({ model, showSource = false }: Props) => {
    return (
        <div className="bg-white rounded-[20px] border border-grayscale-200 p-6 space-y-4">
            {model.meta.partial && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <p className="text-xs font-medium text-amber-800">
                        Partial transcript — the issuer indicated this record does not contain all
                        known achievements.
                    </p>
                </div>
            )}
            <div className="space-y-2">
                <ClrTranscriptSourceField
                    label="Credential"
                    field={model.header.title}
                    showSource={showSource}
                />
                {model.header.description && (
                    <ClrTranscriptSourceField
                        label="Description"
                        field={model.header.description}
                        showSource={showSource}
                    />
                )}
                <ClrTranscriptSourceField
                    label="Issuer"
                    field={model.header.issuerName}
                    showSource={showSource}
                />
                {model.header.issuerAddress && (
                    <IssuerAddress address={model.header.issuerAddress} showSource={showSource} />
                )}
                <ClrTranscriptSourceField
                    label="Learner"
                    field={model.header.learnerName}
                    showSource={showSource}
                />
                <ClrTranscriptSourceField
                    label="Issued"
                    field={model.header.issuedAt}
                    showSource={showSource}
                />
                {model.header.awardedDate && (
                    <ClrTranscriptSourceField
                        label="Awarded"
                        field={model.header.awardedDate}
                        showSource={showSource}
                    />
                )}
                {model.header.validUntil && (
                    <ClrTranscriptSourceField
                        label="Valid until"
                        field={model.header.validUntil}
                        showSource={showSource}
                    />
                )}
            </div>
            <ClrTranscriptTrustBadge
                verification={model.verification}
                evidenceCount={model.summary.evidenceCount}
            />
        </div>
    );
};

export default ClrTranscriptHeader;
