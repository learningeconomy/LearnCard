import React from 'react';

export const FormatQuestionTitle: React.FC<{ title: string; phraseToEmphasize: string }> = ({
    title,
    phraseToEmphasize,
}) => {
    if (!phraseToEmphasize || !title.includes(phraseToEmphasize)) {
        return title; // Return original if no phrase specified or phrase not found
    }

    // Split the title around the phrase to emphasize using a regex with capturing group
    const regex = new RegExp(`(${phraseToEmphasize})`, 'i');
    const parts = title.split(regex);

    // Return the formatted JSX with the span
    return (
        <>
            {parts.map((part, index) => {
                // If this part matches the phrase to emphasize, wrap in span
                if (part.toLowerCase() === phraseToEmphasize.toLowerCase()) {
                    return (
                        <span key={index} className="font-semibold">
                            {part}
                        </span>
                    );
                }
                return part;
            })}
        </>
    );
};

export default FormatQuestionTitle;
