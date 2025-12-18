import React from 'react';
import { SkinTones, EmojiClickData } from 'emoji-picker-react';

interface EmojiRendererProps {
    data: EmojiClickData;
    /** Additional CSS classes */
    className?: string;
    /** Size in pixels (defaults to 24) */
    size?: number;
    /** Whether to prefer native rendering over images */
    preferNative?: boolean;
}

const EmojiRenderer: React.FC<EmojiRendererProps> = ({
    data,
    className = '',
    size = 24,
    preferNative = false,
}) => {
    const [imageError, setImageError] = React.useState<boolean>(false);

    const renderEmoji = (emojiData: EmojiClickData): React.ReactNode => {
        // For custom emojis or when image URL is provided and native rendering isn't preferred
        if ((emojiData?.imageUrl && !preferNative) || emojiData?.isCustom) {
            if (imageError) {
                // Fallback to native rendering if image fails
                return renderNativeEmoji(emojiData);
            }

            return (
                <img
                    src={emojiData.imageUrl}
                    alt={emojiData.names[0] || 'emoji'}
                    className={`inline-block align-middle ${className}`}
                    style={{ width: size, height: size }}
                    onError={() => setImageError(true)}
                />
            );
        }

        return renderNativeEmoji(emojiData);
    };

    const renderNativeEmoji = (emojiData: EmojiClickData): string => {
        try {
            const { unified, unifiedWithoutSkinTone, activeSkinTone } = emojiData;

            if (activeSkinTone && activeSkinTone !== SkinTones.NEUTRAL) {
                // Combine base emoji with skin tone modifier
                return String.fromCodePoint(
                    parseInt(unified || unifiedWithoutSkinTone, 16),
                    parseInt(activeSkinTone, 16)
                );
            }

            // Return basic emoji without skin tone
            return String.fromCodePoint(parseInt(unified || unifiedWithoutSkinTone, 16));
        } catch (error) {
            console.warn('Failed to render emoji:', error);
            return '□'; // Return empty box as fallback
        }
    };

    return (
        <span
            className={`inline-block ${className}`}
            role="img"
            aria-label={data?.names[0] || 'emoji'}
            title={data?.names[0] || 'emoji'}
            style={{
                fontSize: preferNative || imageError ? size : undefined,
                lineHeight: '1',
                verticalAlign: 'middle',
            }}
        >
            {renderEmoji(data)}
        </span>
    );
};

export default EmojiRenderer;
