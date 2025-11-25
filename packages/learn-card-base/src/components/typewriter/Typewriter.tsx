import React, { useState, useEffect } from 'react';

// Typewriter effect component
const Typewriter: React.FC<{ messages: string[] }> = ({ messages }) => {
    const [text, setText] = useState<string>('');
    const [index, setIndex] = useState<number>(Math.floor(Math.random() * messages.length));
    const [charIndex, setCharIndex] = useState<number>(0);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [interval, setInterval] = useState<number>(100); // Typing speed in milliseconds

    useEffect(() => {
        const currentMessage = messages[index];
        if (charIndex === currentMessage.length && !isDeleting) {
            // Pause and start deleting
            setIsDeleting(true);
            setInterval(50); // Deleting speed
        } else if (charIndex === 0 && isDeleting) {
            // Move to the next message
            setIsDeleting(false);
            setIndex(prevIndex => (prevIndex + 1) % messages.length);
            setInterval(100); // Typing speed
        }

        const timeout = setTimeout(() => {
            const newText = isDeleting
                ? currentMessage.substring(0, charIndex - 1)
                : currentMessage.substring(0, charIndex + 1);
            setText(newText);
            setCharIndex(prevCharIndex => (isDeleting ? prevCharIndex - 1 : prevCharIndex + 1));
        }, interval);

        return () => clearTimeout(timeout);
    }, [charIndex, isDeleting, index, interval]);

    return (
        <div className="flex items-start justify-center text-center px-4">
            <h1>
                {text}
                <span className="animate-pulse-opacity">|</span>
            </h1>
        </div>
    );
};

export default Typewriter;
