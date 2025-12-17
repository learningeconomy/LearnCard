import React from 'react';

import { IonInput } from '@ionic/react';
import Search from 'learn-card-base/svgs/Search';

import useTheme from '../../../../theme/hooks/useTheme';

import { isPlatformIOS, useDeviceTypeByWidth, useKeyboardHeight } from 'learn-card-base';

export const ExistingTopicSearch: React.FC<{
    search: string | null | undefined;
    setSearch: React.Dispatch<React.SetStateAction<string | null | undefined>>;
}> = ({ search, setSearch }) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { isDesktop } = useDeviceTypeByWidth();
    const kbHeight = useKeyboardHeight(80);

    const isEmpty = (search?.length ?? 0) === 0;

    const styles = isPlatformIOS() ? {} : { marginBottom: kbHeight };

    return (
        <div
            style={styles}
            className="w-full flex items-center justify-center sticky bottom-0 z-9999"
        >
            <div
                onSubmit={e => {
                    e.preventDefault();
                }}
                className={`w-full ion-padding flex fade-enter ${
                    isDesktop
                        ? 'bg-white rounded-[20px] shadow-box-bottom my-4 max-w-[99%]'
                        : 'bg-cyan-50'
                }`}
            >
                <IonInput
                    onIonInput={e => setSearch(e.detail.value)}
                    className={`bg-white text-grayscale-800 flex-1 w-full rounded-[16px] !px-4 ${
                        isDesktop ? '' : 'border-solid border-[1px] border-grayscale-200'
                    }`}
                    placeholder="Browse..."
                />
                <button
                    className={` p-2 rounded-[16px] flex items-center justify-center ml-2 min-h-[44px] min-w-[44px] ${
                        isEmpty ? 'bg-grayscale-300' : `bg-${primaryColor}`
                    }`}
                    disabled={!search}
                >
                    <Search version="2" className="text-white" />
                </button>
            </div>
        </div>
    );
};

export default ExistingTopicSearch;
