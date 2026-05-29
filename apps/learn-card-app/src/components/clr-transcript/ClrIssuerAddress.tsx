import type { IssuerAddressDisplayModel } from '../../helpers/clrRenderer.helpers';

type Props = {
    address: IssuerAddressDisplayModel;
    showSource: boolean;
};

const ClrIssuerAddress = ({ address, showSource }: Props) => {
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

export default ClrIssuerAddress;
