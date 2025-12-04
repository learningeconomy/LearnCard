import React, { useState, useRef } from 'react';
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';

// Get Filestack API key from environment variable (Astro uses import.meta.env)
const FILESTACK_API_KEY = typeof import.meta !== 'undefined'
    ? (import.meta as any).env?.PUBLIC_FILESTACK_API_KEY
    : undefined;

const FILESTACK_UPLOAD_URL = 'https://www.filestackapi.com/api/store/S3';

// Check if file upload is available
const isUploadEnabled = Boolean(FILESTACK_API_KEY);

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    onRemove?: () => void;
    placeholder?: string;
    className?: string;
    previewClassName?: string;
    accept?: string;
    maxSizeMB?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    value,
    onChange,
    onRemove,
    placeholder = 'Click to upload image',
    className = '',
    previewClassName = 'w-24 h-24',
    accept = 'image/*',
    maxSizeMB = 10,
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) return;

        // Validate file size
        const maxBytes = maxSizeMB * 1024 * 1024;

        if (file.size > maxBytes) {
            setError(`File size exceeds ${maxSizeMB}MB limit`);
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('fileUpload', file);

            const response = await fetch(`${FILESTACK_UPLOAD_URL}?key=${FILESTACK_API_KEY}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            onChange(data.url);
        } catch (err) {
            setError('Failed to upload image. Please try again.');
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);

            // Reset input
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    const handleClick = () => {
        if (!isUploading && isUploadEnabled) {
            inputRef.current?.click();
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove?.();
        onChange('');
    };

    // Fallback to URL input if upload is not enabled
    if (!isUploadEnabled) {
        return (
            <div className={className}>
                <div className="flex flex-col items-center gap-3">
                    {value && (
                        <div className={`relative rounded-apple-lg bg-apple-gray-100 overflow-hidden ${previewClassName}`}>
                            <img
                                src={value}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />

                            {onRemove && (
                                <button
                                    type="button"
                                    onClick={() => { onRemove(); onChange(''); }}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    )}

                    <input
                        type="url"
                        value={value || ''}
                        onChange={e => onChange(e.target.value)}
                        placeholder="https://example.com/image.png"
                        className="input w-full max-w-md"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
            />

            <div
                onClick={handleClick}
                className={`
                    relative rounded-apple-lg bg-apple-gray-100 border-2 border-dashed border-apple-gray-300
                    flex items-center justify-center overflow-hidden cursor-pointer
                    hover:border-apple-blue hover:bg-apple-gray-50 transition-colors
                    ${previewClassName}
                    ${isUploading ? 'pointer-events-none opacity-70' : ''}
                `}
            >
                {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 text-apple-blue animate-spin" />

                        <span className="text-xs text-apple-gray-500">Uploading...</span>
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
                        <ImageIcon className="w-6 h-6 text-apple-gray-400" />

                        <span className="text-xs text-apple-gray-500">{placeholder}</span>
                    </div>
                )}
            </div>

            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
    );
};

// Compact version for screenshot list items
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
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) return;

        const maxBytes = 10 * 1024 * 1024;

        if (file.size > maxBytes) {
            setError('File size exceeds 10MB limit');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('fileUpload', file);

            const response = await fetch(`${FILESTACK_UPLOAD_URL}?key=${FILESTACK_API_KEY}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            onChange(data.url);
        } catch (err) {
            setError('Upload failed');
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);

            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    return (
        <div className="flex gap-2 items-start">
            {isUploadEnabled && (
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            )}

            <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder="https://example.com/screenshot.png"
                        className="input flex-1"
                        disabled={isUploading}
                    />

                    {isUploadEnabled && (
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={isUploading}
                            className="px-3 py-2 bg-apple-gray-100 text-apple-gray-600 rounded-apple hover:bg-apple-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>

                {value && (
                    <img
                        src={value}
                        alt={`Screenshot ${index + 1}`}
                        className="h-32 object-contain rounded-apple border border-apple-gray-200"
                        onError={e => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                )}

                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <button
                type="button"
                onClick={onRemove}
                className="p-2 text-apple-gray-400 hover:text-red-500 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

export default ImageUpload;
