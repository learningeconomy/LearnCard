import React from 'react';

import { IonCol, IonRow, IonFooter, IonInput } from '@ionic/react';

const CredentialStorageFooter: React.FC<{
    accept: () => void;
    reject: () => void;
    title: string;
    setTitle: React.Dispatch<React.SetStateAction<string>>;
    isLoading: boolean;
    className?: string;
    claimCount?: number;
    totalToClaim?: number;
}> = ({ accept, reject, title, setTitle, isLoading, className, claimCount, totalToClaim }) => {
    const acceptingText = totalToClaim
        ? `Accepting ${(claimCount || 0) + 1}/${totalToClaim}...`
        : 'Accepting...';
    return (
        <IonFooter className={`w-full bg-white px-3 py-3 ${className}`}>
            <IonRow className="w-full flex flex-col items-center justify-center bg-white">
                <IonCol size="12" className="flex flex-col items-center justify-center w-full">
                    {/* <IonInput
                        placeholder="Credential Title"
                        type="text"
                        className="bg-grayscale-100 text-grayscale-800 rounded-[15px] py-3 px-3 font-medium tracking-widest text-base max-w-[400px]"
                        value={title}
                        onIonInput={e => setTitle(e.detail.value)}
                    /> */}

                    <div className="flex items-center justify-center w-full mt-4">
                        <button
                            type="button"
                            className="bg-emerald-700 rounded-full text-white font-bold border px-4 py-2 mr-2 w-full max-w-[200px]"
                            onClick={accept}
                        >
                            {isLoading ? acceptingText : 'Accept'}
                        </button>
                        <button
                            type="button"
                            className="bg-rose-600 rounded-full text-white font-bold border px-4 py-2 w-full max-w-[200px]"
                            onClick={reject}
                        >
                            Reject
                        </button>
                    </div>
                </IonCol>
            </IonRow>
        </IonFooter>
    );
};

export default CredentialStorageFooter;
