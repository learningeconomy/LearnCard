import React from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

import X from 'learn-card-base/svgs/X';

export const FamilyEmojiPicker: React.FC<{
    handleSetEmoji: (_emoji: EmojiClickData) => void;
    handleCloseModal: () => void;
}> = ({ handleSetEmoji, handleCloseModal }) => {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full transparent">
            <div className="flex items-center justify-center mb-2">
                <button
                    onClick={() => handleCloseModal()}
                    className="w-[50px] h-[50px] bg-white rounded-full flex items-center justify-center shadow-3xl"
                >
                    <X className="text-black w-[30px]" />
                </button>
            </div>
            <EmojiPicker
                className="z-9999"
                lazyLoadEmojis
                theme="auto"
                onEmojiClick={emojiSelected => {
                    handleSetEmoji(emojiSelected);
                    handleCloseModal();
                }}
            />
        </div>
    );
};

export default FamilyEmojiPicker;
