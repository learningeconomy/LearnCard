import React from 'react';

import * as m from '../../paraglide/messages.js';
import { AppFooter } from 'learn-card-base/ui/chrome';
import { AppInput } from 'learn-card-base/ui/controls/AppInput';
import { AppCol, AppRow } from 'learn-card-base/ui/layout';

const CredentialStorageFooter: React.FC<{
    accept: () => void;
    reject: () => void;
    title: string;
    setTitle: React.Dispatch<React.SetStateAction<string>>;
    isLoading: boolean;
    className?: string;
}> = ({ accept, reject, title, setTitle, isLoading, className }) => {
    return (
        <AppFooter className={`w-full bg-white px-3 py-3 ${className}`}>
            <AppRow className="w-full flex flex-col items-center justify-center bg-white">
                <AppCol size="12" className="flex flex-col items-center justify-center w-full">
                    {/* <AppInput
                        placeholder="Credential Title"
                        type="text"
                        className="bg-grayscale-100 text-grayscale-800 rounded-[15px] py-3 px-3 font-medium tracking-widest text-base max-w-[400px]"
                        value={title}
                        onValueInput={value => setTitle(value)}
                    /> */}

                    <div className="flex items-center justify-center w-full mt-4">
                        <button
                            type="button"
                            className="bg-emerald-700 rounded-full text-white font-bold border px-4 py-2 mr-2 w-full max-w-[200px]"
                            onClick={accept}
                        >
                            {m[
                                isLoading
                                    ? 'credentialStorage.accepting'
                                    : 'credentialStorage.accept'
                            ]()}
                        </button>
                        <button
                            type="button"
                            className="bg-rose-600 rounded-full text-white font-bold border px-4 py-2 w-full max-w-[200px]"
                            onClick={reject}
                        >
                            {m['credentialStorage.reject']()}
                        </button>
                    </div>
                </AppCol>
            </AppRow>
        </AppFooter>
    );
};

export default CredentialStorageFooter;
