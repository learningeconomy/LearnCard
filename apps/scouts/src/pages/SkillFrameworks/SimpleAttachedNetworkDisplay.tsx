import React from 'react';
import { useResolveBoost } from 'learn-card-base';
import { getDefaultBadgeThumbForCredential } from '../../helpers/troop.helpers';

type SimpleAttachedNetworkDisplayProps = {
    networkUri: string;
};

const SimpleAttachedNetworkDisplay: React.FC<SimpleAttachedNetworkDisplayProps> = ({
    networkUri,
}) => {
    const { data: boost } = useResolveBoost(networkUri);

    return (
        <div className="flex items-center gap-[10px] w-full py-[10px]">
            {boost?.image ? (
                <img
                    src={boost?.image}
                    alt={boost?.name}
                    className="w-[40px] h-[40px] rounded-full object-cover"
                />
            ) : (
                getDefaultBadgeThumbForCredential(boost)
            )}
            <p className="text-grayscale-900 font-poppins text-[17px] line-clamp-1">
                {boost?.name}
            </p>
        </div>
    );
};

export default SimpleAttachedNetworkDisplay;
