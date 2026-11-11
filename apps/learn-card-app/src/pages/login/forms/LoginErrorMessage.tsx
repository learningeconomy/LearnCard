import React from 'react';

type LoginErrorMessageProps = {
    id: string;
    message: string;
    className?: string;
};

/** Inline error pill shared by the email and phone login forms. */
export const LoginErrorMessage: React.FC<LoginErrorMessageProps> = ({
    id,
    message,
    className = '',
}) => (
    <div className={`flex items-center justify-start w-full ${className}`}>
        <p
            id={id}
            role="alert"
            className="flex w-fit items-center gap-2 rounded-lg bg-pink-50 px-2 py-1 text-sm font-medium text-red-500"
        >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-red-500 text-xs font-bold">
                !
            </span>
            {message}
        </p>
    </div>
);

export default LoginErrorMessage;
