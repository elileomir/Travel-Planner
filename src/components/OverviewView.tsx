'use client';

import { CloudSun, Sunrise, Sunset, Wind, MapPin, Calendar, Home, Umbrella, Thermometer, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TRIP_ID = 'b3d81829-5735-46fd-bcc5-7dfb2e27be8e';

export default function OverviewView() {
    const [totalBudget, setTotalBudget] = useState(12500);

    useEffect(() => {
        const calculateTotal = async () => {
            try {
                const { data, error } = await supabase
                    .from('trip_notes')
                    .select('itinerary_json')
                    .eq('trip_id', TRIP_ID)
                    .single();

                if (data && data.itinerary_json) {
                    const itineraryTotal = data.itinerary_json.reduce((sum: number, item: any) => sum + (Number(item.cost) || 0), 0);
                    setTotalBudget(itineraryTotal);
                }
            } catch (e) {
                console.error("Error fetching itinerary for budget", e);
            }
        };

        calculateTotal();

        // Listen for internal updates
        const handleItineraryUpdate = (e: any) => {
            if (e.detail) {
                const total = e.detail.reduce((sum: number, item: any) => sum + (Number(item.cost) || 0), 0);
                setTotalBudget(total);
            } else {
                calculateTotal();
            }
        };

        window.addEventListener('itineraryUpdated', handleItineraryUpdate);

        return () => {
            window.removeEventListener('itineraryUpdated', handleItineraryUpdate);
        };
    }, []);
    return (
        <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
            <div className="flex flex-col md:flex-row gap-6">

                {/* Weather Widget */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-semibold opacity-90 flex items-center gap-2">
                                <MapPin size={18} /> Baguio & La Union
                            </h2>
                            <p className="text-blue-100 text-sm mt-1">Thursday, Mar 19 - Mar 25</p>
                        </div>
                        <CloudSun size={48} className="text-yellow-300 drop-shadow-md" />
                    </div>

                    <div className="flex items-end gap-4 mb-8">
                        <span className="text-6xl font-bold tracking-tighter">16°</span>
                        <span className="text-2xl font-medium text-blue-100 pb-2">/ 24°</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                                <Wind size={14} /> Wind
                            </div>
                            <span className="font-semibold text-lg">12 km/h</span>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                                <Umbrella size={14} /> Rain Risk
                            </div>
                            <span className="font-semibold text-lg">20%</span>
                        </div>
                    </div>
                </motion.div>

                {/* Trip Logistics */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-200"
                >
                    <h3 className="text-xl font-bold text-slate-800 mb-6 font-serif">Trip Details</h3>

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="mt-1 bg-blue-50 p-2 rounded-xl text-blue-600">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Dates</p>
                                <p className="text-slate-800 font-semibold mt-0.5">Mar 19 - 25, 2026</p>
                                <p className="text-sm text-slate-500 mt-1">7 Days, 6 Nights</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="mt-1 bg-emerald-50 p-2 rounded-xl text-emerald-600 shrink-0">
                                <Home size={20} />
                            </div>
                            <div className="w-full">
                                <p className="text-sm font-medium text-slate-500">Accommodation</p>
                                <p className="text-slate-800 font-semibold mt-0.5">
                                    <a href="https://www.airbnb.com/rooms/1358670721935477961" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 underline decoration-emerald-200 underline-offset-4 transition-colors">
                                        Secured Airbnb Booking
                                    </a>
                                </p>
                                <div className="text-sm text-slate-600 mt-3 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                        <span className="text-slate-500">Check-in</span>
                                        <span className="font-semibold text-slate-700">Thu, Mar 19 • 2:00 PM</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                        <span className="text-slate-500">Check-out (La Union)</span>
                                        <span className="font-semibold text-slate-700">Wed, Mar 25 • 12:00 PM</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-t border-slate-200 mt-2 pt-3">
                                        <div className="flex flex-col">
                                            <span className="text-slate-500 font-medium">Itinerary Budget</span>
                                            <span className="text-[10px] text-slate-400 italic">Excludes accommodation</span>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <span className="font-bold text-emerald-600 text-lg">₱{totalBudget.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-orange-50 rounded-3xl p-6 border border-orange-100"
            >
                <h4 className="flex items-center gap-2 font-bold text-orange-800 mb-2">
                    <Info size={18} /> Pro Tip from your AI
                </h4>
                <p className="text-orange-800 text-sm leading-relaxed">
                    Baguio gets quite chilly at night in March (can drop to 14°C). Remeber to pack a light jacket or sweater. Good Taste is also notoriously crowded; try visiting their original branch behind Baguio Center Mall for shorter lines.
                </p>
            </motion.div>
        </div>
    );
}
