import React from 'react';

export const AdminToolsBulkBoostImportPrepareUploadStep: React.FC = () => {
    return (
        <section className="bg-white max-w-[800px] w-full rounded-[20px]">
            <div className="flex flex-col items-start justify-center w-full ion-padding">
                <h4 className="text-indigo-500 font-notoSans text-left mb-2 text-sm font-semibold">
                    Step 1
                </h4>
                <p className="text-xl text-grayscale-900 text-left mb-4">
                    Prepare & Export Your File
                </p>

                <ol className="w-full flex flex-col mx-auto text-grayscale-700 text-sm">
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
                            <li>
                                OR simple filenames (image.png) for images you'll upload in a ZIP
                            </li>
                        </ul>
                    </li>
                    <li className="mt-2">
                        <span className="font-semibold">Export to CSV:</span>
                        <br />
                        File → Download → Comma Separated Values (.csv)
                    </li>
                </ol>
            </div>
        </section>
    );
};

export default AdminToolsBulkBoostImportPrepareUploadStep;
