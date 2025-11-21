import React from 'react';

const AdminToolsLaunchDevDocs: React.FC = () => {
    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-2xl px-6 py-2 mt-4 rounded-[15px]">
            <div className="flex flex-col items-start justify-center py-2">
                <h4 className="text-lg text-grayscale-900 font-notoSans text-left mb-2">
                    Want to learn more?
                </h4>
                <p className="text-sm text-grayscale-600 font-notoSans text-left mb-4">
                    Check out the LearnCard developer docs to learn how to build and integrate with
                    our SDKs and APIs.
                </p>
                <button
                    onClick={() => window.open('https://docs.learncard.com/', '_blank')}
                    className="w-full flex rounded-[30px] items-center justify-center text-indigo-500 bg-grayscale-100 py-[12px] font-semibold text-[17px]"
                >
                    Launch Developer Docs
                </button>
            </div>
        </div>
    );
};

export default AdminToolsLaunchDevDocs;
