import React from 'react';

import BulkBoostParentSelector from './BulkBoostParentSelector';

export const AdminToolsBulkBoostImportAssignParent: React.FC<{
    parentUri?: string;
    setParentUri: React.Dispatch<React.SetStateAction<string>>;
}> = ({ parentUri, setParentUri }) => {
    return (
        <section className="bg-white max-w-[800px] w-full rounded-[20px]">
            <div className="flex flex-col items-start justify-center w-full ion-padding">
                <h4 className="text-indigo-500 font-notoSans text-left mb-2 text-sm font-semibold">
                    Optional
                </h4>
                <p className="text-xl text-grayscale-900 text-left mb-4">
                    Assign a Parent Credential
                </p>
                <p className="text-left text-grayscale-700 text-sm mb-4">
                    Select the credential that these credentials will be created under.
                </p>

                <BulkBoostParentSelector parentUri={parentUri} setParentUri={setParentUri} />
            </div>
        </section>
    );
};

export default AdminToolsBulkBoostImportAssignParent;
