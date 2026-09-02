import React from 'react';

import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';

import { useTheme } from '../../theme/hooks/useTheme';
import { TransP } from '../../i18n/TransP';
import * as m from '../../paraglide/messages.js';

export const AiPassportPersonalizationFormHeader: React.FC = () => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-2xl p-6 mt-4 rounded-[15px]">
            <div className="bg-cyan-300 rounded-full overflow-visible flex items-center justify-center h-[50px] w-[50px]">
                <BlueMagicWand className="h-[60px] w-[60px] min-h-[60px] min-w-[60px]" />
            </div>

            <div className="mt-4 text-center">
                {/* "Personalize my AI Sessions" — "AI Sessions" keeps the colored +
                    semibold styling via the <0>…</0> markup component. */}
                <h1 className="text-grayscale-900 text-[22px] font-normal font-notoSans">
                    <TransP
                        m={m['aiPersonalization.header']}
                        components={[
                            <span
                                className={`text-${primaryColor} text-[22px] font-semibold font-notoSans`}
                            />,
                        ]}
                    />
                </h1>
            </div>
        </div>
    );
};

export default AiPassportPersonalizationFormHeader;
