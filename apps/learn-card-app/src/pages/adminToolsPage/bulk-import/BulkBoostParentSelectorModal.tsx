import React from 'react';

import { useModal } from 'learn-card-base';
import { SetState } from 'packages/shared-types/dist';
import ViewAllManagedBoosts from '../ViewAllManagedBoosts';

type BulkBoostParentSelectorModalProps = {
    parentUri?: string;
    setParentUri: SetState<string>;
};

const BulkBoostParentSelectorModal: React.FC<BulkBoostParentSelectorModalProps> = ({
    parentUri,
    setParentUri,
}) => {
    const { closeModal } = useModal();

    return (
        <div className="flex items-center justify-center p-[20px]">
            <ViewAllManagedBoosts
                actionButtonOverride={{
                    text: 'Select',
                    onClick: boost => {
                        setParentUri(boost.uri);
                        closeModal();
                    },
                }}
            />
        </div>
    );
};

export default BulkBoostParentSelectorModal;
