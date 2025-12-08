import React from 'react';
import { useHistory } from 'react-router-dom';
import { Sparkles, ArrowRight, Code2, Rocket } from 'lucide-react';

export const LaunchPadBecomeAnApp: React.FC = () => {
    const history = useHistory();

    const handleClick = () => {
        history.push('/app-store/developer');
    };

    return (
        <div className="w-full max-w-[600px] mt-4 px-2">
            <button
                onClick={handleClick}
                className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-[1px] transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.99]"
            >
                {/* Inner container */}
                <div className="relative overflow-hidden rounded-[15px] bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 px-5 py-5">
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                    
                    {/* Floating icons */}
                    <div className="absolute top-3 right-4 opacity-20">
                        <Code2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute bottom-3 right-16 opacity-15">
                        <Rocket className="w-6 h-6 text-white rotate-45" />
                    </div>

                    {/* Content */}
                    <div className="relative flex items-center gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                            <Sparkles className="w-7 h-7 text-white" />
                        </div>

                        {/* Text content */}
                        <div className="flex-1 text-left">
                            <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-0.5">
                                Developer Program
                            </p>
                            <h3 className="text-white text-lg font-bold leading-tight">
                                Build Your Own App
                            </h3>
                            <p className="text-white/80 text-sm mt-0.5">
                                Join our developer community today
                            </p>
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-white/30 transition-colors">
                            <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>
                </div>
            </button>
        </div>
    );
};

export default LaunchPadBecomeAnApp;
