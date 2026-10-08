import React from 'react';

/**
 * QR code symbol — the three finder patterns plus data marks.
 *
 * Distinct from `QRCodeScanner` in `learn-card-base/svgs`, which draws a
 * *scanner viewfinder* (four corner brackets). Exported from Figma node
 * 2865:28834 for the contacts invite CTA, which calls for the code itself
 * rather than the act of scanning one.
 *
 * Stroke follows `currentColor`, so colour it from the parent's text class.
 */
const QrCodeGlyph: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg
        width="25"
        height="25"
        viewBox="0 0 25 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
    >
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.1565 4.6875H5.46899C5.03752 4.6875 4.68774 5.03728 4.68774 5.46875V10.1562C4.68774 10.5877 5.03752 10.9375 5.46899 10.9375H10.1565C10.588 10.9375 10.9377 10.5877 10.9377 10.1562V5.46875C10.9377 5.03728 10.588 4.6875 10.1565 4.6875Z" />
            <path d="M10.1565 14.0625H5.46899C5.03752 14.0625 4.68774 14.4123 4.68774 14.8438V19.5312C4.68774 19.9627 5.03752 20.3125 5.46899 20.3125H10.1565C10.588 20.3125 10.9377 19.9627 10.9377 19.5312V14.8438C10.9377 14.4123 10.588 14.0625 10.1565 14.0625Z" />
            <path d="M19.5315 4.6875H14.844C14.4125 4.6875 14.0627 5.03728 14.0627 5.46875V10.1562C14.0627 10.5877 14.4125 10.9375 14.844 10.9375H19.5315C19.963 10.9375 20.3127 10.5877 20.3127 10.1562V5.46875C20.3127 5.03728 19.963 4.6875 19.5315 4.6875Z" />
            <path d="M14.0627 14.0625V17.1875" />
            <path d="M14.0627 20.3125H17.1877V14.0625" />
            <path d="M17.1877 15.625H20.3127" />
            <path d="M20.3127 18.75V20.3125" />
        </g>
    </svg>
);

export default QrCodeGlyph;
