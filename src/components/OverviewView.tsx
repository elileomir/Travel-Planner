'use client';

import { CloudSun, Sunrise, Sunset, Wind, MapPin, Calendar, Home, Umbrella, Thermometer, Info, Edit2, Trash2, Plus, Check, X, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TRIP_ID = 'b3d81829-5735-46fd-bcc5-7dfb2e27be8e';

export default function OverviewView({ itineraryData = [] }: { itineraryData?: any[] }) {
    // Calculate accurate baseline from CSV exactly
    const baseTotal = itineraryData.reduce((sum, item) => {
        const costRaw = item['Cost for 2 (₱)'];
        // Remove commas or currency symbols if any, though it's likely just a number string
        const costNum = costRaw ? Number(costRaw.replace(/[^0-9.-]+/g, "")) : 0;
        return sum + costNum;
    }, 0) || 12500;

    const [totalBudget, setTotalBudget] = useState(baseTotal);

    // Multi-location accommodations state
    const [baguioAcc, setBaguioAcc] = useState<{ link: string, name: string } | null>(null);
    const [luAcc, setLuAcc] = useState<{ link: string, name: string } | null>(null);

    // UI states
    const [isEditingBaguio, setIsEditingBaguio] = useState(false);
    const [baguioTempLink, setBaguioTempLink] = useState('');
    const [isEditingLu, setIsEditingLu] = useState(false);
    const [luTempLink, setLuTempLink] = useState('');

    const getSmartName = (url: string) => {
        const lower = url.toLowerCase();
        if (lower.includes('airbnb')) return 'Airbnb Booking';
        if (lower.includes('agoda')) return 'Agoda Booking';
        if (lower.includes('booking.com')) return 'Booking.com';
        if (lower.includes('expedia')) return 'Expedia Booking';
        return 'Accommodation Link';
    };

    const saveAccommodations = async (baguio: any, lu: any) => {
        const payload = { baguio, laUnion: lu };
        setBaguioAcc(baguio);
        setLuAcc(lu);

        try {
            await supabase
                .from('trip_notes')
                .update({ accommodations_json: payload, updated_at: new Date().toISOString() })
                .eq('trip_id', TRIP_ID);
        } catch (e) {
            console.error("Failed to save accommodations", e);
        }
    };

    const handleSaveBaguio = () => {
        if (!baguioTempLink.trim()) return;
        saveAccommodations({ link: baguioTempLink, name: getSmartName(baguioTempLink) }, luAcc);
        setIsEditingBaguio(false);
        setBaguioTempLink('');
    };

    const handleRemoveBaguio = () => saveAccommodations(null, luAcc);

    const handleSaveLu = () => {
        if (!luTempLink.trim()) return;
        saveAccommodations(baguioAcc, { link: luTempLink, name: getSmartName(luTempLink) });
        setIsEditingLu(false);
        setLuTempLink('');
    };

    const handleRemoveLu = () => saveAccommodations(baguioAcc, null);

    const [weather, setWeather] = useState({ temp: 16, max: 24, min: 14, wind: 12, rain: 20 });

    useEffect(() => {
        // Fetch real-time weather for Baguio City (No API Key Required)
        fetch('https://api.open-meteo.com/v1/forecast?latitude=16.416&longitude=120.593&current=temperature_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FManila')
            .then(res => res.json())
            .then(data => {
                if (data && data.current && data.daily) {
                    setWeather({
                        temp: Math.round(data.current.temperature_2m),
                        max: Math.round(data.daily.temperature_2m_max[0]),
                        min: Math.round(data.daily.temperature_2m_min[0]),
                        wind: Math.round(data.current.wind_speed_10m),
                        rain: data.daily.precipitation_probability_max[0]
                    });
                }
            })
            .catch(err => console.error("Weather fetch error", err));
    }, []);

    useEffect(() => {
        const calculateTotal = async () => {
            try {
                const { data, error } = await supabase
                    .from('trip_notes')
                    .select('itinerary_json, accommodations_json')
                    .eq('trip_id', TRIP_ID)
                    .single();

                if (data) {
                    if (data.itinerary_json && data.itinerary_json.length > 0) {
                        const itineraryTotal = data.itinerary_json.reduce((sum: number, item: any) => sum + (Number(item.cost) || 0), 0);
                        setTotalBudget(itineraryTotal);
                    } else {
                        setTotalBudget(baseTotal);
                    }
                    if (data.accommodations_json) {
                        setBaguioAcc(data.accommodations_json.baguio || null);
                        setLuAcc(data.accommodations_json.laUnion || null);
                    }
                }
            } catch (e) {
                console.error("Error fetching itinerary for budget", e);
            }
        };

        calculateTotal();

        // Listen for internal updates
        const handleItineraryUpdate = (e: any) => {
            if (e.detail && e.detail.length > 0) {
                const total = e.detail.reduce((sum: number, item: any) => sum + (Number(item.cost) || 0), 0);
                setTotalBudget(total);
            } else {
                setTotalBudget(baseTotal);
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
                                <MapPin size={18} /> Baguio City
                            </h2>
                            <p className="text-blue-100 text-sm mt-1">Real-time Current Weather</p>
                        </div>
                        <CloudSun size={48} className="text-yellow-300 drop-shadow-md" />
                    </div>

                    <div className="flex items-end gap-4 mb-8">
                        <span className="text-6xl font-bold tracking-tighter">{weather.temp}°</span>
                        <span className="text-2xl font-medium text-blue-100 pb-2">/ {weather.max}°</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                                <Wind size={14} /> Wind
                            </div>
                            <span className="font-semibold text-lg">{weather.wind} km/h</span>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                                <Umbrella size={14} /> Rain Risk
                            </div>
                            <span className="font-semibold text-lg">{weather.rain}%</span>
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
                                <p className="text-sm font-medium text-slate-500 mb-3">Accommodations</p>

                                {/* Baguio Stay */}
                                <div className="mb-4">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Baguio (Mar 19 - Mar 22)</p>
                                    {baguioAcc ? (
                                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 group">
                                            <a href={baguioAcc.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors w-full overflow-hidden">
                                                <LinkIcon size={14} className="shrink-0" />
                                                <span className="truncate text-sm">{baguioAcc.name}</span>
                                            </a>
                                            <button onClick={handleRemoveBaguio} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all lg:opacity-0 lg:group-hover:opacity-100">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ) : isEditingBaguio ? (
                                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-50 transition-all">
                                            <input
                                                type="url"
                                                value={baguioTempLink}
                                                onChange={e => setBaguioTempLink(e.target.value)}
                                                placeholder="Paste Airbnb/Agoda link..."
                                                autoFocus
                                                className="w-full bg-transparent text-sm outline-none px-2 text-slate-700"
                                                onKeyDown={e => e.key === 'Enter' && handleSaveBaguio()}
                                            />
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button onClick={handleSaveBaguio} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"><Check size={14} /></button>
                                                <button onClick={() => setIsEditingBaguio(false)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"><X size={14} /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsEditingBaguio(true)} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 px-3 py-2 rounded-xl border border-slate-100 hover:border-emerald-100 transition-all w-full border-dashed group">
                                            <Plus size={14} className="group-hover:scale-110 transition-transform" /> Add Baguio Stay
                                        </button>
                                    )}
                                </div>

                                {/* La Union Stay */}
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">La Union (Mar 22 - Mar 25)</p>
                                    {luAcc ? (
                                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 group">
                                            <a href={luAcc.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors w-full overflow-hidden">
                                                <LinkIcon size={14} className="shrink-0" />
                                                <span className="truncate text-sm">{luAcc.name}</span>
                                            </a>
                                            <button onClick={handleRemoveLu} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all lg:opacity-0 lg:group-hover:opacity-100">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ) : isEditingLu ? (
                                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-50 transition-all">
                                            <input
                                                type="url"
                                                value={luTempLink}
                                                onChange={e => setLuTempLink(e.target.value)}
                                                placeholder="Paste Airbnb/Agoda link..."
                                                autoFocus
                                                className="w-full bg-transparent text-sm outline-none px-2 text-slate-700"
                                                onKeyDown={e => e.key === 'Enter' && handleSaveLu()}
                                            />
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button onClick={handleSaveLu} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"><Check size={14} /></button>
                                                <button onClick={() => setIsEditingLu(false)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"><X size={14} /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsEditingLu(true)} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 px-3 py-2 rounded-xl border border-slate-100 hover:border-emerald-100 transition-all w-full border-dashed group">
                                            <Plus size={14} className="group-hover:scale-110 transition-transform" /> Add La Union Stay
                                        </button>
                                    )}
                                </div>

                                <div className="text-sm text-slate-600 mt-5 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                        <span className="text-slate-500">Trip Starts</span>
                                        <span className="font-semibold text-slate-700">Thu, Mar 19 • Early Morning</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                        <span className="text-slate-500">Check-out (La Union)</span>
                                        <span className="font-semibold text-slate-700">Wed, Mar 25 • 12:00 PM</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-t border-slate-200 mt-2 pt-3">
                                        <div className="flex flex-col">
                                            <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                                Itinerary Budget
                                                <span className="text-[9px] font-bold tracking-wider text-emerald-600 uppercase bg-emerald-100/50 px-1.5 py-0.5 rounded border border-emerald-100">Est</span>
                                            </span>
                                            <span className="text-[10px] text-slate-400 italic mt-0.5">Excludes accommodation</span>
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
                    Baguio gets chilly at night in March (can drop to 14°C) — pack a light jacket. Good Taste is crowded; try the original branch behind Baguio Center Mall. In La Union, book surf lessons early morning (8–10 AM) for the best waves and fewer crowds. Budget tip: carinderias serve ₱120–200 meals in both areas!
                </p>
            </motion.div>
        </div>
    );
}
