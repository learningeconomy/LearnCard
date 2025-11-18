import React from 'react';

import { useGetVCInfo } from 'learn-card-base';

import { VC } from '@learncard/types';

const OpenSyllabusTextbooks: React.FC<{ credential: VC }> = ({ credential }) => {
    const { evidence } = useGetVCInfo(credential);

    const textbooks = evidence.filter(evidenceItem => evidenceItem.genre === 'Textbook');
    const textbooksCount = textbooks.length ?? 0;

    if (textbooksCount === 0) return null;

    return (
        <div className="p-[15px] bg-white flex flex-col items-start gap-[10px] rounded-[20px] w-full shadow-bottom-2-4">
            <h3 className="text-[17px] font-poppins text-grayscale-900">
                {textbooksCount} {textbooksCount > 1 ? 'Textbooks' : 'Textbook'}
            </h3>
            <div className="flex flex-col gap-[10px]">
                {textbooks.map((textbook, index) => {
                    const url = new URL(textbook.id);
                    const params = new URLSearchParams(url.search);
                    const cover = params.get('cover');
                    const isbn = params.get('isbn');
                    const author = params.get('author');
                    const textbookUrl = textbook.id;

                    return (
                        <div key={index} className="flex items-start gap-[10px]">
                            <div className="w-[60px] h-[80px] rounded-[5px] overflow-hidden min-w-[60px] min-h-[80px]">
                                {cover ? (
                                    <img
                                        src={cover || ''}
                                        alt={textbook?.name}
                                        className="w-full h-full object-cover bg-grayscale-900"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-grayscale-900 flex items-center justify-center">
                                        <p className="text-[12px] text-center font-poppins text-grayscale-50 ">
                                            No
                                            <br />
                                            cover
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p
                                    key={index}
                                    className="text-[17px] font-poppins text-grayscale-800 font-semibold line-clamp-2 leading-[18px]"
                                >
                                    {textbook?.name}
                                </p>
                                <p className="text-xs font-semibold font-poppins text-grayscale-600">
                                    {author || ''}
                                </p>
                                <p className="text-xs font-semibold font-poppins text-grayscale-600">
                                    ISBN: {isbn || ''}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OpenSyllabusTextbooks;
