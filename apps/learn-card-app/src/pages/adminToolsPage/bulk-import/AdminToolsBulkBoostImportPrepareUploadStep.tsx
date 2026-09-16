import React from 'react';
import { useTheme } from '../../../theme/hooks/useTheme';
import * as m from '../../../paraglide/messages.js';

export const AdminToolsBulkBoostImportPrepareUploadStep: React.FC = () => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    return (
        <section className="bg-white max-w-[800px] w-full rounded-[20px]">
            <div className="flex flex-col items-start justify-center w-full ion-padding">
                <h4
                    className={`text-${primaryColor} font-notoSans text-left mb-2 text-sm font-semibold`}
                >
                    {m['bulkImport.step']({ number: 1 })}
                </h4>
                <p className="text-xl text-grayscale-900 text-left mb-4">
                    {m['bulkImport.prepareTitle']()}
                </p>

                <ol className="w-full flex flex-col mx-auto text-grayscale-700 text-sm">
                    <li>
                        1. {m['bulkImport.fillSheetPrefix']()}{' '}
                        <a
                            className={`text-${primaryColor} underline`}
                            target="_blank"
                            rel="noreferrer"
                            href="https://docs.google.com/spreadsheets/d/13dI93yhClz95FKz4UDGEkteKLvqGHjxivPnKohFkkEM/copy"
                        >
                            {m['bulkImport.googleSheet']()}
                        </a>{' '}
                        {m['bulkImport.fillSheetSuffix']()}
                        <ul className="ml-8 mt-2 list-disc">
                            <li>{m['bulkImport.fullImageUrls']()}</li>
                            <li>{m['bulkImport.simpleFilenames']()}</li>
                        </ul>
                    </li>
                    <li className="mt-2">
                        <span className="font-semibold">{m['bulkImport.exportCsv']()}</span>
                        <br />
                        {m['bulkImport.downloadCsvPath']()}
                    </li>
                </ol>
            </div>
        </section>
    );
};

export default AdminToolsBulkBoostImportPrepareUploadStep;
