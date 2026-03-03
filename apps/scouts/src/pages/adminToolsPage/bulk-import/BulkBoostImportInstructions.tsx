import React from 'react';

const BulkBoostImportInstructions: React.FC = () => {
    return (
        <ol className="flex flex-col w-[550px] mx-auto">
            <li>
                1. Fill out this{' '}
                <a
                    className="text-blue-700 underline"
                    target="_blank"
                    href="https://docs.google.com/spreadsheets/d/1CQNRq3c3mMRA6FQWC3iw8X27OxD98E7LjtyI5dgv0jo/copy"
                >
                    Google Sheet
                </a>{' '}
                using:
                <ul className="ml-8 mt-2 list-disc">
                    <li>Full image URLs (https://...) for direct use</li>
                    <li>OR simple filenames (image.png) for images you'll upload in a ZIP</li>
                </ul>
            </li>
            <li className="mt-2">
                2. Export to CSV: File -{'>'} Download -{'>'} Comma Separated Values (.csv)
            </li>
            <li className="mt-2">3. Upload the .csv file using the "Choose File" button below</li>
            <li className="mt-2">
                4. If you used filenames instead of URLs, upload a ZIP file containing those image
                files
            </li>
            <li className="mt-2">
                5. (Optional) Select the parent boost that these boosts will be created under
            </li>
            <li className="mt-2">6. Click "Upload!" once all image issues are resolved</li>
        </ol>
    );
};

export default BulkBoostImportInstructions;
