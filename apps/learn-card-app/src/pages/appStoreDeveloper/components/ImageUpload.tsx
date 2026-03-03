import React from 'react';
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';

import { useFilestack } from 'learn-card-base';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    onRemove?: () => void;
    placeholder?: string;
    className?: string;
    previewClassName?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    value,
    onChange,
    onRemove,
    placeholder = 'Click to upload image',
    className = '',
    previewClassName = 'w-24 h-24',
}) => {
    const { handleFileSelect, isLoading } = useFilestack({
        onUpload: (url: string) => {
            onChange(url);
        },
        fileType: 'image/*',
    });

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove?.();
        onChange('');
    };

    return (
        <div className={className}>
            <div
                onClick={() => !isLoading && handleFileSelect()}
                className={`
                    relative rounded-xl bg-gray-100 border-2 border-dashed border-gray-300
                    flex items-center justify-center overflow-hidden cursor-pointer
                    hover:border-cyan-500 hover:bg-gray-50 transition-colors
                    ${previewClassName}
                    ${isLoading ? 'pointer-events-none opacity-70' : ''}
                `}
            >
                {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />

                        <span className="text-xs text-gray-500">Uploading...</span>
                    </div>
                ) : value ? (
                    <>
                        <img
                            src={value}
                            alt="Uploaded"
                            className="w-full h-full object-cover"
                        />

                        {onRemove && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />

                        <span className="text-xs text-gray-500">{placeholder}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

interface ScreenshotUploadProps {
    value: string;
    onChange: (url: string) => void;
    onRemove: () => void;
    index: number;
}

export const ScreenshotUpload: React.FC<ScreenshotUploadProps> = ({
    value,
    onChange,
    onRemove,
    index,
}) => {
    const { handleFileSelect, isLoading } = useFilestack({
        onUpload: (url: string) => {
            onChange(url);
        },
        fileType: 'image/*',
    });

    return (
        <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder="https://example.com/screenshot.png"
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        disabled={isLoading}
                    />

                    <button
                        type="button"
                        onClick={() => handleFileSelect()}
                        disabled={isLoading}
                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                    </button>
                </div>

                {value && (
                    <img
                        src={value}
                        alt={`Screenshot ${index + 1}`}
                        className="h-32 object-contain rounded-xl border border-gray-200"
                        onError={e => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                )}
            </div>

            <button
                type="button"
                onClick={onRemove}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

export default ImageUpload;
