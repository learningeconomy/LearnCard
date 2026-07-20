import React from 'react';
import * as m from '../../paraglide/messages.js';
import { getLocale } from '../../paraglide/runtime.js';
import { TransP } from '../../i18n/TransP';

type LinkedChild = {
    childProfileId: string;
    childDisplayName: string;
    managerId: string | null;
};

type Props = {
    children: LinkedChild[];
    onDismiss: () => void;
};

const GuardianLinkedModal: React.FC<Props> = ({ children, onDismiss }) => {
    const names = children.map(c => c.childDisplayName || c.childProfileId);
    const listFormat = new Intl.ListFormat(getLocale(), { style: 'long', type: 'conjunction' });

    let nameText: string;
    if (names.length <= 2) {
        nameText = listFormat.format(names);
    } else {
        const rest = names.length - 2;
        const othersLabel =
            rest === 1
                ? m['onboarding.guardianLinked.otherOne']({ count: rest })
                : m['onboarding.guardianLinked.otherOther']({ count: rest });
        nameText = listFormat.format([names[0]!, names[1]!, othersLabel]);
    }

    return (
        <div className="flex flex-col items-center text-center px-4 py-6 max-w-[360px]">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <span className="text-emerald-700 text-xl">✓</span>
            </div>
            <h2 className="text-[18px] font-[700] font-notoSans text-grayscale-900 mb-3">
                {m['onboarding.guardianLinked.heading']()}
            </h2>
            <p className="text-[14px] font-notoSans text-grayscale-600 mb-6">
                <TransP
                    m={m['onboarding.guardianLinked.description']}
                    values={{ name: nameText }}
                    components={[<span className="font-[600] text-grayscale-900" key="n" />]}
                />
            </p>
            <button
                onClick={onDismiss}
                className="w-full rounded-full bg-emerald-700 text-white py-[12px] text-[15px] font-[600] font-notoSans"
            >
                {m['onboarding.guardianLinked.gotIt']()}
            </button>
        </div>
    );
};

export default GuardianLinkedModal;
