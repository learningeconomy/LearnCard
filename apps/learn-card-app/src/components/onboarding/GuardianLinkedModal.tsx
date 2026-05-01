import React from 'react';

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

    let nameText: string;
    if (names.length === 1) {
        nameText = names[0]!;
    } else if (names.length === 2) {
        nameText = `${names[0]} and ${names[1]}`;
    } else {
        const rest = names.length - 2;
        nameText = `${names[0]}, ${names[1]}, and ${rest} other${rest > 1 ? 's' : ''}`;
    }

    return (
        <div className="flex flex-col items-center text-center px-4 py-6 max-w-[360px]">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <span className="text-emerald-700 text-xl">✓</span>
            </div>
            <h2 className="text-[18px] font-[700] font-notoSans text-grayscale-900 mb-3">
                You're all set up!
            </h2>
            <p className="text-[14px] font-notoSans text-grayscale-600 mb-6">
                You're now set up to manage credentials for{' '}
                <span className="font-[600] text-grayscale-900">{nameText}</span>. Future
                approvals will appear directly in the app.
            </p>
            <button
                onClick={onDismiss}
                className="w-full rounded-full bg-emerald-700 text-white py-[12px] text-[15px] font-[600] font-notoSans"
            >
                Got it
            </button>
        </div>
    );
};

export default GuardianLinkedModal;
