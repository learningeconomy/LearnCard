import React from 'react';
import * as m from '../../../paraglide/messages.js';
import TransP from '../../../i18n/TransP';

const BulkBoostImportInstructions: React.FC = () => {
    return (
        <ol className="flex flex-col w-[550px] mx-auto">
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
            <li className="mt-2">{m['adminTools.bulkImport.exportToCsv']()}</li>
            <li className="mt-2">{m['adminTools.bulkImport.uploadCsvInstruction']()}</li>
            <li className="mt-2">{m['adminTools.bulkImport.uploadZipInstruction']()}</li>
            <li className="mt-2">{m['adminTools.bulkImport.selectParentOptional']()}</li>
            <li className="mt-2">{m['adminTools.bulkImport.clickUploadInstruction']()}</li>
        </ol>
    );
};

export default BulkBoostImportInstructions;
