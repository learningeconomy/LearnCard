import { useStore } from '@nanostores/react';
import { errorModalState, hideErrorModal } from '../stores/ErrorModalStore';

export const ErrorModal: React.FC = () => {
    const { isOpen, title, message } = useStore(errorModalState);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-red-600">{title}</h2>
                    <button
                        onClick={hideErrorModal}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Close"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                <div className="text-gray-700 mb-6">{message}</div>
                <div className="flex justify-end">
                    <button
                        onClick={hideErrorModal}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorModal;
