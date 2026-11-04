import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { showToast } from '../stores/toastStore';
import MagicWand from './svgs/MagicWand';
import ProfilePicture from './ProfilePicture';
import CloseToastButton from './CloseToastButton';

const feedback = [
    "👏 That answer showed real insight — you've earned a new achievement!",
    "💡 Great thinking! You've been awarded a credential for your understanding.",
    "🧠 That response showed true grasp — you've unlocked a learning badge.",
    '✨ We see your progress — credential granted!',
    "🔍 That reflection was powerful — you've earned recognition.",
    '📘 You really nailed that concept — milestone awarded!',
    "🎉 That clicked perfectly — you've just unlocked a new achievement.",
    "🙌 Love that response — here's a little recognition for it.",
];

const FeedbackToast = () => {
    const [currentFeedback, setCurrentFeedback] = useState('');
    const shouldShow = useStore(showToast);

    // Set random feedback on client side only
    useEffect(() => {
        const randomFeedback = feedback[Math.floor(Math.random() * feedback.length)];
        setCurrentFeedback(randomFeedback);
    }, []);

    if (!shouldShow || !currentFeedback) return null;

    return (
        <div className="w-full relative overflow-visible z-50">
            <header className="flex justify-between w-full pt-[50px] pb-[40px] md:py-[20px] px-[30px] bg-cyan-50 relative overflow-visible">
                <div className="flex flex-col">
                    <div className="flex items-center gap-[10px]">
                        <div className="rounded-full bg-indigo-500 w-[40px] h-[40px] flex items-center justify-center">
                            <MagicWand className="text-white w-[24px] h-[24px]" />
                        </div>
                        <h6 className="font-semibold text-lg text-indigo-500 tracking-tight text-[17px] font-poppins">
                            Feedback
                        </h6>
                    </div>
                    <p className="text-grayscale-900 font-[600] text-[14px] font-poppins mt-1">
                        {currentFeedback}
                    </p>
                </div>
                <ProfilePicture />
                <CloseToastButton />
            </header>
        </div>
    );
};

export default FeedbackToast;
