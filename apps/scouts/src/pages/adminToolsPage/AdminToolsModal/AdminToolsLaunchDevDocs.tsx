import React from 'react';
import * as m from '../../../paraglide/messages.js';

const AdminToolsLaunchDevDocs: React.FC = () => {
    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-2xl px-6 py-2 mt-4 rounded-[15px]">
            <div className="flex flex-col items-start justify-center py-2">
                <h4 className="text-lg text-grayscale-900 font-notoSans text-left mb-2">
                    {m['adminTools.wantToLearnMore']()}
                </h4>
                <p className="text-sm text-grayscale-600 font-notoSans text-left mb-4">
                    {m['adminTools.devDocsDescription']()}
                </p>
                <button
                    onClick={() => window.open('https://docs.learncard.com/', '_blank')}
                    className="w-full flex rounded-[30px] items-center justify-center text-indigo-500 bg-grayscale-100 py-[12px] font-semibold text-[17px]"
                >
                    {m['adminTools.launchDevDocs']()}
                </button>
            </div>
        </div>
    );
};

export default AdminToolsLaunchDevDocs;
