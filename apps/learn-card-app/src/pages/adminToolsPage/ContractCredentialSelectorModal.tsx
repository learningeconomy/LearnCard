import React, { useState } from 'react';

import { useModal } from 'learn-card-base';
import { SetState } from 'packages/shared-types/dist';
import ViewAllManagedBoosts from './ViewAllManagedBoosts';

type ContractCredentialSelectorModalProps = {
    selectedCredentialUris: string[];
    setSelectedCredentialUris: SetState<string[]>;
};

const ContractCredentialSelectorModal: React.FC<ContractCredentialSelectorModalProps> = ({
    selectedCredentialUris,
    setSelectedCredentialUris,
}) => {
    const { closeModal } = useModal();

    const [creds, setCreds] = useState(selectedCredentialUris);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-[20px] relative">
            <ViewAllManagedBoosts
                selectModeOptions={{
                    selectedUris: creds,
                    handleAdd: (uri: string) => setCreds([...creds, uri]),
                    handleRemove: (uri: string) => setCreds(creds.filter(u => u !== uri)),
                    handleSave: () => {
                        setSelectedCredentialUris(creds);
                        closeModal();
                    },
                    handleClearAll: () => setCreds([]),
                }}
            />
        </div>
    );
};

export default ContractCredentialSelectorModal;
