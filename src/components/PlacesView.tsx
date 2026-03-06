'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, DollarSign, Utensils, MountainSnow } from 'lucide-react';

export default function PlacesView({ foodData, spotsData }: { foodData: any[], spotsData: any[] }) {
    const [filter, setFilter] = useState<'all' | 'food' | 'spots'>('all');

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Discover Baguio</h2>
                    <p className="text-slate-500 mt-1">Curated recommendations for your trip</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                    <button
                        onClick={() => setFilter('all')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('spots')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'spots' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Attractions
                    </button>
                    <button
                        onClick={() => setFilter('food')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'food' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Food
                    </button>
                </div>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                {(filter === 'all' || filter === 'spots') && spotsData.filter(s => s.Attraction).map((spot, idx) => (
                    <motion.div key={`spot-${idx}`} variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow group flex flex-col">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <MountainSnow size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{spot.Attraction}</h3>
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium mb-4 w-fit">{spot.Category}</span>

                        <p className="text-sm text-slate-600 mb-6 flex-1 line-clamp-3">{spot.Highlights}</p>

                        <div className="space-y-2 mt-auto">
                            <div className="flex items-center text-xs text-slate-500">
                                <MapPin size={14} className="mr-2 text-slate-400" />
                                <span className="truncate">{spot.Address || spot.Location}</span>
                            </div>
                            <div className="flex items-center text-xs text-slate-500">
                                <Clock size={14} className="mr-2 text-slate-400" />
                                {spot['Best Time'] || 'Anytime'} ({spot.Duration})
                            </div>
                            <div className="flex items-center text-xs font-medium text-emerald-600 mt-2 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                                <DollarSign size={14} className="mr-1" />
                                {spot['Entrance Fee'] || 'Free'}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {(filter === 'all' || filter === 'food') && foodData.filter(f => f.Restaurant).map((food, idx) => (
                    <motion.div key={`food-${idx}`} variants={item} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow group flex flex-col">
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <Utensils size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{food.Restaurant}</h3>
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium mb-4 w-fit">{food.Cuisine}</span>

                        <p className="text-sm text-slate-600 mb-6 flex-1"><span className="font-semibold block mb-1">Must Try:</span> {food['Must Try']}</p>

                        <div className="space-y-2 mt-auto">
                            <div className="flex items-center text-xs text-slate-500">
                                <MapPin size={14} className="mr-2 text-slate-400" />
                                <span className="truncate">{food.Location}</span>
                            </div>
                            <div className="flex items-center text-xs font-medium text-emerald-600 mt-2 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                                <DollarSign size={14} className="mr-1" />
                                {food['Price Range']}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
