'use client';

import { useState } from 'react';
import { Compass, Calendar as CalendarIcon, Map as MapIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GeminiAssistant from './GeminiAssistant';
import OverviewView from './OverviewView';
import ItineraryView from './ItineraryView';
import PlacesView from './PlacesView';

const tabs = [
    { id: 'overview', label: 'Overview', icon: Compass },
    { id: 'itinerary', label: 'Itinerary', icon: CalendarIcon },
    { id: 'places', label: 'Places to Visit', icon: MapIcon },
    { id: 'assistant', label: 'AI Assistant', icon: Sparkles },
];

export default function AppShell({
    itineraryData,
    foodData,
    spotsData
}: {
    itineraryData: any[];
    foodData: any[];
    spotsData: any[];
}) {
    const [activeTab, setActiveTab] = useState('overview');

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewView />;
            case 'itinerary':
                return <ItineraryView itineraryData={itineraryData} />;
            case 'places':
                return <PlacesView foodData={foodData} spotsData={spotsData} />;
            case 'assistant':
                return (
                    <div className="max-w-3xl mx-auto flex-1 h-full w-full md:py-6 md:px-4 flex flex-col">
                        <div className="relative flex-1 w-full h-full md:shadow-lg md:rounded-2xl overflow-hidden md:border md:border-slate-200 bg-white flex flex-col">
                            <GeminiAssistant isFullScreen />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200 flex flex-col">
            {/* Desktop Top Navigation */}
            <nav className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
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
                                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                    <span className="z-10 relative">{tab.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="desktopNavIndicator"
                                            className="absolute inset-0 bg-blue-50 border border-blue-100 rounded-lg -z-0 pointer-events-none"
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
            <main className={`flex-1 w-full max-w-7xl mx-auto relative flex flex-col ${activeTab === 'assistant' ? 'h-[calc(100dvh-4rem)] md:h-[calc(100vh-4rem)] overflow-hidden' : 'pb-24 md:pb-0 min-h-[100dvh] md:min-h-[calc(100vh-4rem)]'}`}>
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className={`w-full flex-1 flex flex-col ${activeTab === 'assistant' ? 'h-full' : ''}`}
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
                                    <Icon size={22} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobileNavIndicator"
                                            className="absolute -inset-2 bg-blue-50 rounded-full -z-10"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </div>
                                <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
