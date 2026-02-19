import React from 'react';
import { IonLabel, IonInput } from '@ionic/react';

const AiPathwaysDiscoverySearch: React.FC<{
    keywordInput: string;
    setKeywordInput: (value: string) => void;
    setSearchKeyword: (value: string) => void;
    searchKeyword: string;
}> = ({ keywordInput, setKeywordInput, searchKeyword, setSearchKeyword }) => {
    const handleSearch = () => {
        if (keywordInput.trim()) {
            setSearchKeyword(keywordInput.trim());
        }
    };

    const clearSearch = () => {
        setSearchKeyword('');
        setKeywordInput('');
    };

    return (
        <div className="flex items-center justify-center w-full rounded-[15px] px-4 max-w-[600px]">
            <div className="w-full bg-white rounded-lg p-4 shadow-sm flex flex-col gap-4">
                <div className="w-full gap-2 flex flex-col">
                    <IonLabel className="text-grayscale-600 font-poppins text-sm">
                        Enter a career keyword
                    </IonLabel>
                    <IonInput
                        value={keywordInput}
                        onIonInput={(e: any) => setKeywordInput(e.detail.value)}
                        onKeyDown={(e: any) => e.key === 'Enter' && handleSearch()}
                        autocapitalize="on"
                        className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-sm`}
                        placeholder="e.g. Software Engineer"
                        type="text"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={clearSearch}
                        className="p-[11px] bg-white rounded-full text-grayscale-900 border-grayscale-300 border-[1px] border-solid flex-1 font-poppins text-[17px]"
                    >
                        Clear
                    </button>

                    <button
                        onClick={handleSearch}
                        disabled={!keywordInput.trim()}
                        className="p-[11px] bg-emerald-700 rounded-full text-white flex-1 font-poppins text-[17px] font-semibold"
                    >
                        Search
                    </button>
                </div>
                {searchKeyword && (
                    <div className="mt-2 text-sm text-grayscale-600">
                        Searching for: <strong className="text-indigo-700">{searchKeyword}</strong>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiPathwaysDiscoverySearch;
