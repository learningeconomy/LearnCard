import React from 'react';
import Logo from './svgs/Logo';
import Pencil from './svgs/Pencil';
import Lock from './svgs/Lock';
// Use direct path to the image in the public folder
const profilePic = '/GenericProfilePic.png';

type ExampleChatColumnProps = {};

const ExampleChatColumn: React.FC<ExampleChatColumnProps> = () => {
    return (
        <div className="py-[30px] max-w-[510px] hidden xl:flex flex-col justify-center text-grayscale-900 font-poppins text-[17px] leading-[24px] tracking-[0.25px] grow-1">
            <div className="flex items-center gap-[5px] py-[10px]">
                <Logo size="50" className="shrink-0" />
                <div className="bg-white-semi-transparent rounded-[20px] py-[10px] px-[15px]">
                    What would you like to <strong className="font-[600]">learn</strong> about?
                </div>
            </div>

            <div className="self-end flex items-center gap-[10px] py-[10px]">
                <div className="bg-cyan-50 rounded-[20px] py-[10px] px-[15px] flex gap-[10px] items-center">
                    <strong className="font-[600]">Fractions</strong>
                    <Pencil />
                </div>
                <img
                    src={
                        process.env.NODE_ENV === 'production'
                            ? profilePic
                            : '/src/assets/GenericProfilePic.png'
                    }
                    alt="Profile"
                    className="w-[50px] h-[50px] rounded-full border-solid border-[1px] border-white"
                />
            </div>

            <div className="flex items-center gap-[5px] py-[10px]">
                <Logo size="50" className="shrink-0 invisible" />
                <div className="bg-white-semi-transparent rounded-t-[20px] rounded-br-[20px] py-[10px] px-[15px]">
                    Amazing! Choose a <strong className="font-[600]">Learning Pathway...</strong>
                </div>
            </div>

            <div className="flex items-end gap-[5px] pb-[10px] max-w-full">
                <Logo size="50" className="shrink-0" />
                <div className="bg-white-semi-transparent rounded-b-[20px] rounded-tr-[20px] py-[10px] px-[15px] flex gap-[20px] overflow-x-hidden">
                    <div className="bg-white p-[15px] flex flex-col gap-[10px] w-[255px] h-[200px] rounded-[20px] shrink-0">
                        <span className="font-poppins text-grayscale-900 text-[20px] font-[600]">
                            Fraction Basics Explained
                        </span>
                        <span className="text-grayscale-90 line-clamp-3 text-[14px]">
                            Learn how to recognize parts of fractions and identify different types
                            of fractions.
                        </span>
                        <div className="bg-indigo-100 rounded-[20px] px-[10px] py-[2px] flex gap-[3px] items-center text-[14px]">
                            <Lock className="shrink-0" />
                            <span className="text-indigo-500">
                                <strong className="font-[600]">Earn 4 Skills</strong> in{' '}
                                <strong className="font-[600]">Fractions</strong>
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-[15px] flex flex-col gap-[10px] w-[255px] h-[200px] rounded-[20px] shrink-0">
                        <span className="font-poppins text-grayscale-900 text-[20px] font-[600]">
                            Adding & Subtracting Fractions
                        </span>
                        <span className="text-grayscale-90 line-clamp-3 text-[14px]">
                            Since you know the basics, it's time to learn how to add & subtract
                            fractions!
                        </span>
                        <div className="bg-indigo-100 rounded-[20px] px-[10px] py-[2px] flex gap-[3px] items-center text-[14px]">
                            <Lock className="shrink-0" />
                            <span className="text-indigo-500">
                                <strong className="font-[600]">Earn 3 Skills</strong> in{' '}
                                <strong className="font-[600]">Fractions</strong>
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-[15px] flex flex-col gap-[10px] w-[255px] h-[200px] rounded-[20px] shrink-0">
                        <span className="font-poppins text-grayscale-900 text-[20px] font-[600]">
                            Multiplying & Dividing Fractions
                        </span>
                        <span className="text-grayscale-90 line-clamp-3 text-[14px]">
                            Master the art of multiplying and dividing fractions with these
                            interactive lessons.
                        </span>
                        <div className="bg-indigo-100 rounded-[20px] px-[10px] py-[2px] flex gap-[3px] items-center text-[14px]">
                            <Lock className="shrink-0" />
                            <span className="text-indigo-500">
                                <strong className="font-[600]">Earn 5 Skills</strong> in{' '}
                                <strong className="font-[600]">Fractions</strong>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExampleChatColumn;
