import React, { useEffect, useState } from 'react';

import { IonInput } from '@ionic/react';
import PaperPlane from 'learn-card-base/svgs/PaperPlane';

import { useDeviceTypeByWidth, useKeyboardHeight, isPlatformIOS } from 'learn-card-base';

import { useTheme } from '../../../../theme/hooks/useTheme';

export const AssessmentAnswerInput: React.FC<{
    handleAnswer: (index: number, answer: string) => void;
    index: number;
    scrollTo: (behavior: ScrollBehavior, block: ScrollLogicalPosition, timeout?: number) => void;
}> = ({ handleAnswer, index, scrollTo }) => {
    const { isDesktop } = useDeviceTypeByWidth();
    const [answer, setAnswer] = useState<string | null | undefined>('');

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const kbHeight = useKeyboardHeight(80);

    const isEmpty = (answer?.length ?? 0) === 0;

    const styles = isPlatformIOS() ? {} : { marginBottom: kbHeight };

    useEffect(() => {
        if (kbHeight > 0) scrollTo('smooth', 'end', 500);
    }, [kbHeight]);

    return (
        <form
            onSubmit={e => {
                e.preventDefault();
                handleAnswer(index, answer ?? '');
                setAnswer('');
            }}
            style={styles}
            className={`w-full ion-padding flex fade-enter ${
                isDesktop ? 'bg-white rounded-[20px] shadow-box-bottom' : 'bg-cyan-50'
            }`}
        >
            <IonInput
                onIonInput={e => setAnswer(e.detail.value)}
                className={`bg-white text-grayscale-800 flex-1 w-full rounded-[16px] !px-4  ${
                    isDesktop ? '' : 'border-solid border-[1px] border-grayscale-200'
                }`}
                placeholder="Answer... "
                value={answer}
            />
            <button
                className={` p-2 rounded-[16px] flex items-center justify-center ml-2 min-h-[44px] min-w-[44px] ${
                    isEmpty ? 'bg-grayscale-300' : `bg-${primaryColor}`
                }`}
                disabled={!answer}
                type="submit"
            >
                <PaperPlane className="text-white" />
            </button>
        </form>
    );
};

export default AssessmentAnswerInput;
