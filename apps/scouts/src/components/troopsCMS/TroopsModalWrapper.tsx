import React, { useEffect } from 'react';
import TroopsModal from '../../pages/troop/TroopsModal';
import { CredentialCategoryEnum } from 'learn-card-base';
import { TroopParentLevel } from '../../pages/troop/troopConstants';

type TroopModalWrapperProps = {
    boostUri: string;
};

const TroopsModalWrapper: React.FC<TroopModalWrapperProps> = ({ boostUri }) => {
    return (
        <TroopsModal
            credentialType={CredentialCategoryEnum.troops}
            uri={boostUri}
            parentLevel={TroopParentLevel.global}
        />
    );
};

export default TroopsModalWrapper;
