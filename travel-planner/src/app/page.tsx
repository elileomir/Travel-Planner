'use client';

import { useState } from 'react';
import { Compass, Calendar as CalendarIcon, Map, Sparkles, CloudSun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// import { ItineraryView } from '@/components/ItineraryView';
// import { OverviewView } from '@/components/OverviewView';
// import { PlacesView } from '@/components/PlacesView';
import GeminiAssistant from '@/components/GeminiAssistant';

const tabs = [
    { id: 'overview', label: 'Overview', icon: Compass },
    { id: 'itinerary', label: 'Itinerary', icon: CalendarIcon },
    { id: 'places', label: 'Places to Visit', icon: Map },
    { id: 'assistant', label: 'AI Assistant', icon: Sparkles },
];

export default function Home() {
    const [activeTab, setActiveTab] = useState('overview');

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <div className="p-8"><h1 className="text-2xl font-bold text-slate-800">Overview</h1></div>;
            case 'itinerary':
                return <div className="p-8"><h1 className="text-2xl font-bold text-slate-800">Itinerary</h1></div>;
            case 'places':
                return <div className="p-8"><h1 className="text-2xl font-bold text-slate-800">Places to Visit</h1></div>;
            case 'assistant':
                return (
                    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] py-6 px-4">
                        <div className="relative w-full h-full shadow-lg rounded-2xl overflow-hidden border border-slate-200 bg-white">
                            <GeminiAssistant isFullScreen />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">
            {/* Desktop Top Navigation */}
            <nav className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm shadow-blue-600/20">
                            <Compass size={20} />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900">Travel Planner</span>
                    </div>

                    <div className="flex items-center space-x-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                    <span className="z-10 relative">{tab.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="desktopNavIndicator"
                                            className="absolute inset-0 bg-blue-50 border border-blue-100 rounded-lg -z-0"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="w-full max-w-7xl mx-auto pb-24 md:pb-0 relative min-h-screen md:min-h-[calc(100vh-4rem)]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="w-full h-full"
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 pb-safe z-50">
                <div className="flex items-center justify-around h-16 px-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex flex-col items-center justify-center w-full h-full gap-1 ${isActive ? 'text-blue-600' : 'text-slate-500'
                                    }`}
                            >
                                <div className="relative">
                                    <Icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobileNavIndicator"
                                            className="absolute -inset-2 bg-blue-50 rounded-full -z-10"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </div>
                                <span className="text-[10px] font-medium">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
