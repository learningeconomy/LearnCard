import React from 'react';
import * as m from '../../../paraglide/messages.js';
import TransP from '../../../i18n/TransP';

export const AdminToolsBulkBoostImportPrepareUploadStep: React.FC = () => {
    return (
        <section className="bg-white max-w-[800px] w-full rounded-[20px]">
            <div className="flex flex-col items-start justify-center w-full ion-padding">
                <h4 className="text-indigo-500 font-notoSans text-left mb-2 text-sm font-semibold">
                    {m['adminTools.bulkImport.step1']()}
                </h4>
                <p className="text-xl text-grayscale-900 text-left mb-4">
                    {m['adminTools.bulkImport.prepareExport']()}
                </p>

                <ol className="w-full flex flex-col mx-auto text-grayscale-700 text-sm">
                    <li>
                        <TransP
                            m={m['adminTools.bulkImport.step1FillSheet']}
                            components={[
                                <a
                                    className="text-blue-700 underline"
                                    target="_blank"
                                    href="https://docs.google.com/spreadsheets/d/1CQNRq3c3mMRA6FQWC3iw8X27OxD98E7LjtyI5dgv0jo/copy"
                                />,
                            ]}
                        />
                        <ul className="ml-8 mt-2 list-disc">
                            <li>{m['adminTools.bulkImport.fullImageUrls']()}</li>
                            <li>{m['adminTools.bulkImport.simpleFilenames']()}</li>
                        </ul>
                    </li>
                    <li className="mt-2">
                        <span className="font-semibold">
                            {m['adminTools.bulkImport.exportToCsv']()}
                        </span>
                    </li>
                </ol>
            </div>
        </section>
    );
};

export default AdminToolsBulkBoostImportPrepareUploadStep;
