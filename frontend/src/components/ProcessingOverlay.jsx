import React, { useEffect, useState } from 'react';

export const ProcessingOverlay = ({ stage }) => {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    if (stage === 'IDLE') return null;

    const getMessage = () => {
        switch (stage) {
            case 'SEARCHING':
                return 'Searching Yoga Knowledge Base';
            case 'RETRIEVING':
                return 'Found relevant context in Yoga Manual';
            case 'GENERATING':
                return 'Synthesizing expert answer';
            default:
                return 'Processing';
        }
    };

    const getIcon = () => {
        switch (stage) {
            case 'SEARCHING':
                return '🔍';
            case 'RETRIEVING':
                return '📄';
            case 'GENERATING':
                return '🧠';
            default:
                return '⚙️';
        }
    };

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl z-50 pointer-events-none">
            {/* Main Glass Card */}
            <div className="relative overflow-hidden bg-black bg-opacity-60 backdrop-blur-xl rounded-lg border border-white/20 shadow-2xl p-6">

                {/* Scanning Light Effect */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>

                <div className="flex items-center gap-6">
                    {/* Icon Circle */}
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl animate-pulse border border-white/30">
                        {getIcon()}
                    </div>

                    {/* Text Content */}
                    <div className="flex-1">
                        <h3 className="text-white font-mono text-lg font-bold tracking-wider uppercase flex items-center gap-2">
                            {stage}
                            <span className="text-pink-500 text-xs bg-pink-500/20 px-2 py-0.5 rounded">AI AGENT</span>
                        </h3>
                        <p className="text-gray-300 font-light text-sm mt-1">
                            {getMessage()}{dots}
                        </p>
                    </div>

                    {/* Progress Visualizer */}
                    <div className="hidden md:flex gap-1">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="w-1 h-8 bg-pink-500/50 rounded-full animate-[bounce_1s_infinite]"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        ))}
                    </div>
                </div>

                {/* Bottom Progress Bar */}
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
                    style={{
                        width: stage === 'SEARCHING' ? '30%' : stage === 'RETRIEVING' ? '70%' : '95%'
                    }}
                />
            </div>
        </div>
    );
};
