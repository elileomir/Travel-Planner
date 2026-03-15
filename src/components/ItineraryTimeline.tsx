'use client';

import { MapPin, Clock, GripVertical, CheckCircle2, ChevronDown, Map as MapIcon, Calendar, Trophy, Image as ImageIcon, MapPinned, Tent, Loader2, Info, Plus, Search, Trash2, Edit2, X, AlertCircle, Link as LinkIcon, Check, List } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import { supabase } from '../lib/supabase';
import 'mapbox-gl/dist/mapbox-gl.css';

const TRIP_ID = 'b3d81829-5735-46fd-bcc5-7dfb2e27be8e';

export interface ItineraryItem {
    id: string;
    day: string;
    time: string;
    duration: number; // in minutes
    activity: string;
    location: string;
    coordinates?: [number, number];
    cost: number;
    costForTwo?: number; // total cost for 2 people (used for budget calculation)
    notes?: string;
    link?: string;
    actualDate: Date;
    lat?: number;
    lng?: number;
    destination?: string;
}

// Destination theming helper
const getDestinationTheme = (dest?: string) => {
    if (!dest) return { label: 'Baguio', emoji: '🏔️', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', headerBorder: 'border-l-blue-500' };
    if (dest === 'Home' || dest.includes('San Pedro')) return { label: 'Home', emoji: '🏠', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', headerBorder: 'border-l-emerald-500' };
    if (dest.includes('En Route')) return { label: 'En Route', emoji: '🚗', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', headerBorder: 'border-l-slate-400' };
    if (dest.includes('La Union') || dest.includes('Elyu')) return { label: 'Elyu', emoji: '🏖️', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', headerBorder: 'border-l-amber-500' };
    return { label: 'Baguio', emoji: '🏔️', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', headerBorder: 'border-l-blue-500' };
};

const parseTimeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    try {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (hours === 12 && modifier === 'AM') hours = 0;
        if (modifier === 'PM' && hours < 12) hours += 12;
        return hours * 60 + minutes;
    } catch {
        return 0;
    }
};

const formatMinutesToTime = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hours12 = h % 12 || 12;
    return `${hours12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
};

export default function ItineraryTimeline({
    initialItems,
    onShowMap
}: {
    initialItems: ItineraryItem[],
    onShowMap: (item: ItineraryItem) => void
}) {
    // Core State
    const [items, setItems] = useState<ItineraryItem[]>(initialItems);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    // Day grouping
    const uniqueDays = useMemo(() => Array.from(new Set(items.map(i => i.day))), [items]);
    const [selectedDay, setSelectedDay] = useState<string>(uniqueDays[0] || '');

    // Gamification & Features state
    const [visitedItemIds, setVisitedItemIds] = useState<Set<string>>(new Set());
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [formData, setFormData] = useState<Partial<ItineraryItem>>({});

    // Delete Confirmation State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Active tooltip for mobile
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    // Location Autocomplete State
    const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);

    const handleLocationChange = async (val: string) => {
        setFormData({ ...formData, location: val, coordinates: undefined });
        if (val.length < 3) {
            setLocationSuggestions([]);
            return;
        }

        setIsSearchingLocation(true);
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (token) {
            try {
                const geoUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${token}&country=ph&autocomplete=true&limit=4`;
                const geoRes = await fetch(geoUrl);
                const geoData = await geoRes.json();
                if (geoData.features) {
                    setLocationSuggestions(geoData.features);
                }
            } catch (err) { }
        }
        setIsSearchingLocation(false);
    };

    const handleSelectLocation = (feature: any) => {
        setFormData({
            ...formData,
            location: feature.place_name,
            coordinates: feature.center // [lng, lat]
        });
        setLocationSuggestions([]);
    };

    // Portal mount state
    const [mounted, setMounted] = useState(false);

    // Initialization hook (load user customization)
    useEffect(() => {
        setMounted(true);
        const savedVisited = localStorage.getItem('baguio_visited_items');
        if (savedVisited) {
            try { setVisitedItemIds(new Set(JSON.parse(savedVisited))); } catch (e) { }
        }

        async function loadItinerary() {
            try {
                const { data, error } = await supabase
                    .from('trip_notes')
                    .select('itinerary_json')
                    .eq('trip_id', TRIP_ID)
                    .single();

                if (data && data.itinerary_json) {
                    const revived = data.itinerary_json.map((i: any) => ({
                        ...i,
                        actualDate: new Date(i.actualDate)
                    }));
                    if (revived.length > 0) setItems(revived);
                }
            } catch (err) {
                console.error("Failed to load custom itinerary", err);
            }
        }
        loadItinerary();
    }, [initialItems]);

    const persistItems = async (newItems: ItineraryItem[]) => {
        setItems(newItems);
        window.dispatchEvent(new CustomEvent('itineraryUpdated', { detail: newItems }));

        try {
            const { data: existingData } = await supabase
                .from('trip_notes')
                .select('id')
                .eq('trip_id', TRIP_ID)
                .single();

            if (existingData) {
                await supabase
                    .from('trip_notes')
                    .update({ itinerary_json: newItems, updated_at: new Date().toISOString() })
                    .eq('id', existingData.id);
            } else {
                await supabase
                    .from('trip_notes')
                    .insert([{ trip_id: TRIP_ID, itinerary_json: newItems }]);
            }
        } catch (error) {
            console.error("Error saving itinerary to Supabase", error);
        }
    };

    const toggleVisited = (item: ItineraryItem) => {
        if (new Date() < item.actualDate) {
            setToastMessage(`Not yet! Scheduled for ${item.actualDate.toLocaleDateString()}`);
            setTimeout(() => setToastMessage(null), 3000);
            return;
        }

        setVisitedItemIds(prev => {
            const next = new Set(prev);
            if (next.has(item.id)) next.delete(item.id);
            else {
                next.add(item.id);
                setToastMessage(`Great work making new memories at ${item.location || item.activity}!`);
                setTimeout(() => setToastMessage(null), 4000);
            }
            localStorage.setItem('baguio_visited_items', JSON.stringify(Array.from(next)));
            return next;
        });
    };

    const completionPercentage = items.length === 0 ? 0 : Math.round((visitedItemIds.size / items.length) * 100);

    // Filtering & Grouping
    const displayedItems = viewMode === 'list'
        ? items
        : items.filter(item => item.day === selectedDay);

    const listGroups = useMemo(() => {
        const groups: Record<string, ItineraryItem[]> = {};
        for (const item of items) {
            if (!groups[item.day]) groups[item.day] = [];
            groups[item.day].push(item);
        }
        return groups;
    }, [items]);

    // --- Smart Auto-Recalculation & Pacing ---
    const recalculateDay = (dayItems: ItineraryItem[]): ItineraryItem[] => {
        let sorted = [...dayItems].sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
        const BUFFER_MINS = 30; // 30 mins smart travel/buffer time

        for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const prevStart = parseTimeToMinutes(prev.time);
            const prevEnd = prevStart + prev.duration + BUFFER_MINS;

            const currStart = parseTimeToMinutes(sorted[i].time);

            // Smart push: if current activity overlaps with previous end time + buffer, auto-adjust its start time
            if (currStart < prevEnd) {
                sorted[i] = {
                    ...sorted[i],
                    time: formatMinutesToTime(prevEnd)
                };
            }
        }
        return sorted;
    };

    const pacingInsights = useMemo(() => {
        let maxDurationMins = 0;
        let warnings: string[] = [];

        Object.entries(listGroups).forEach(([day, dayItems]) => {
            const totalMins = dayItems.reduce((acc, curr) => acc + curr.duration, 0);
            if (totalMins > maxDurationMins) maxDurationMins = totalMins;

            // Overpacked day warning (> 10 hours)
            if (totalMins > 600) {
                warnings.push(`Warning: ${day} is overpacked with over ${Math.round(totalMins / 60)} hrs of activities. Consider spacing them out!`);
            }
        });

        if (warnings.length > 0) return { type: 'warning', text: warnings[0] };

        if (Object.keys(listGroups).length >= 5 && maxDurationMins > 0) {
            return { type: 'success', text: "✨ Great pacing! You are maximizing your 7-Day Baguio & Elyu trip perfectly." };
        } else if (Object.keys(listGroups).length > 0 && Object.keys(listGroups).length < 5) {
            return { type: 'info', text: "💡 You have room to explore more spots in Baguio or La Union!" };
        }

        return null;
    }, [listGroups]);

    // --- CRUD Handlers ---
    const handleAddClick = () => {
        setFormData({
            id: Date.now().toString(),
            day: uniqueDays[0] || 'Day 1',
            time: '12:00 PM',
            duration: 60,
            activity: '',
            location: '',
            cost: 0,
            notes: '',
            actualDate: new Date()
        });
        setModalMode('add');
        setIsModalOpen(true);
    };

    const handleEditClick = (item: ItineraryItem) => {
        const editData = { ...item };
        if (!editData.coordinates && editData.lng && editData.lat) {
            editData.coordinates = [editData.lng, editData.lat];
        }
        setFormData(editData);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        const targetDay = items.find(i => i.id === itemToDelete)?.day;
        const newItems = items.filter(i => i.id !== itemToDelete);

        if (targetDay) {
            const otherDaysItems = newItems.filter(i => i.day !== targetDay);
            const dayItems = newItems.filter(i => i.day === targetDay);
            const recalculatedDay = recalculateDay(dayItems);
            persistItems([...otherDaysItems, ...recalculatedDay]);
        } else {
            persistItems(newItems);
        }

        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        setToastMessage('Item removed');
        setTimeout(() => setToastMessage(null), 2000);
    };

    // --- Smart Modal Context ---
    const { prevActivity, nextActivity } = useMemo(() => {
        if (!formData.time || !formData.day) return { prevActivity: null, nextActivity: null };
        const currentTime = parseTimeToMinutes(formData.time);

        const dayItems = items.filter(i => i.day === formData.day).sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

        let prev = null;
        let next = null;

        for (const item of dayItems) {
            if (modalMode === 'edit' && item.id === formData.id) continue;

            const itemTime = parseTimeToMinutes(item.time);
            if (itemTime <= currentTime) {
                prev = item;
            } else if (itemTime > currentTime && !next) {
                next = item;
            }
        }

        return { prevActivity: prev, nextActivity: next };
    }, [formData.time, formData.day, formData.id, modalMode, items]);

    const submitForm = () => {
        if (!formData.activity || !formData.location) {
            alert('Activity and Location are required!');
            return;
        }

        // Time overlap check
        const overlappingItem = items.find(i => i.day === formData.day && i.time === formData.time && i.id !== formData.id);
        if (overlappingItem) {
            alert(`Time overlap detected! The activity "${overlappingItem.activity}" is already scheduled for ${formData.time} on ${formData.day}. Please select a different time to proceed.`);
            return;
        }

        const completedItem = formData as ItineraryItem;
        let newItems = [...items];

        if (modalMode === 'add') {
            newItems.push(completedItem);
        } else {
            const index = newItems.findIndex(i => i.id === completedItem.id);
            if (index !== -1) newItems[index] = completedItem;
        }

        // Smart Re-calculate Day Timings
        const targetDay = completedItem.day;
        const otherDaysItems = newItems.filter(i => i.day !== targetDay);
        const dayItems = newItems.filter(i => i.day === targetDay);
        const recalculatedDay = recalculateDay(dayItems);
        const finalItems = [...otherDaysItems, ...recalculatedDay];

        // Ensure overall temporal sorting based on day and parsed time so list UI renders exactly right
        finalItems.sort((a, b) => {
            if (a.day !== b.day) return a.day.localeCompare(b.day);
            return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
        });

        persistItems(finalItems);
        setIsModalOpen(false);
        setToastMessage(`Activity ${modalMode === 'add' ? 'added' : 'updated'}!`);
        setTimeout(() => setToastMessage(null), 3000);
    };


    const renderItemCard = (item: ItineraryItem) => {
        const isVisited = visitedItemIds.has(item.id);
        const isUnlocked = new Date() >= item.actualDate;

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id}
                className="relative pl-10 group"
            >
                {/* Timeline Dot */}
                <div className={`absolute left-[3px] top-6 -translate-x-1/2 w-4 h-4 rounded-full border-2 shadow-sm transition-colors z-10 flex items-center justify-center ${isVisited ? 'border-emerald-500 bg-emerald-500' : 'bg-white border-blue-200 group-hover:border-blue-500'}`}>
                    {isVisited ? (
                        <Check className="w-3 h-3 text-white" />
                    ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </div>

                <div className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-all ${isVisited ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 hover:border-blue-200'}`}>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col gap-1 w-[60%]">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`font-bold text-lg leading-tight ${isVisited ? 'text-emerald-800 line-through opacity-70' : 'text-slate-800'}`}>
                                    {item.activity}
                                </h4>
                                {/* Mini Edit/Delete Buttons, hidden until hover */}
                                <div className="flex opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity gap-1 ml-2">
                                    <button onClick={() => handleEditClick(item)} className="p-1 rounded bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDeleteClick(item.id)} className="p-1 rounded bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            {/* Destination Badge */}
                            {(() => {
                                const theme = getDestinationTheme(item.destination);
                                return (
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit ${theme.bg} ${theme.text} ${theme.border} border`}>
                                        {theme.emoji} {theme.label}
                                    </span>
                                );
                            })()}
                            <div className="flex items-center text-sm text-slate-600">
                                <MapPin className="w-3.5 h-3.5 mr-1.5 text-rose-500 shrink-0" />
                                <span className="truncate">{item.location}</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-md border shadow-sm ${isVisited ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-blue-700 bg-blue-50 border-blue-100'}`}>
                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                {item.time}
                            </span>
                            <span className="flex items-center text-[11px] font-medium text-slate-400">
                                {item.duration} min
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                {item.actualDate instanceof Date && !isNaN(item.actualDate.getTime())
                                    ? item.actualDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
                                    : item.day.replace(/Day \d+\s*/, '').replace(/[()]/g, '').trim() || item.day
                                }
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => toggleVisited(item)}
                                className={`flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isVisited
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : isUnlocked
                                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        : 'bg-slate-50 text-slate-400'
                                    }`}
                                title={!isUnlocked ? "You can't check in yet!" : "Mark as visited"}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                {isVisited ? 'Visited' : 'Check In'}
                            </button>

                            <button
                                onClick={() => onShowMap(item)}
                                className="flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                                <MapIcon className="w-3.5 h-3.5 mr-1.5" />
                                Show Route
                            </button>
                        </div>

                        {(item.costForTwo || item.cost) > 0 && (
                            <div className="relative flex items-center gap-0.5 text-xs font-semibold text-emerald-700">
                                ₱{item.costForTwo || item.cost}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTooltip(activeTooltip === item.id ? null : item.id);
                                    }}
                                    className="p-1 rounded-full hover:bg-emerald-100 transition-colors cursor-pointer"
                                >
                                    <Info className="w-3.5 h-3.5 text-emerald-500/80" />
                                </button>

                                <AnimatePresence>
                                    {activeTooltip === item.id && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl z-50 font-normal leading-relaxed text-center"
                                        >
                                            This is an estimate based on online data. Actual prices may change.
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-800" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {item.notes && (
                        <p className="mt-4 text-xs italic text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                            "{item.notes}"
                        </p>
                    )}
                    {item.link && item.link !== '-' && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50/50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-100">
                            <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
                            View Details
                        </a>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="p-5 border-b border-slate-100 bg-white shrink-0 shadow-sm z-30 relative">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            Trip Dashboard
                            {completionPercentage === 100 && <Trophy className="w-5 h-5 text-yellow-500" />}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Tap 'Check In' to track your trip</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAddClick} className="flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm">
                            <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg ml-2">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Calendar className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercentage}%` }}
                        className="bg-blue-500 h-2.5 rounded-full"
                        style={{ background: completionPercentage === 100 ? 'linear-gradient(90deg, #10b981, #3b82f6)' : '' }}
                    />
                </div>
                <div className="flex justify-between text-xs font-medium text-slate-500 mt-2 mb-4">
                    <span>{visitedItemIds.size} of {items.length} completed</span>
                    <span className={completionPercentage === 100 ? 'text-emerald-600' : ''}>{completionPercentage}%</span>
                </div>

                {/* Smart Pacing Insights */}
                {pacingInsights && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-xl border text-xs font-medium shadow-sm flex items-start gap-2 ${pacingInsights.type === 'warning' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                            pacingInsights.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                'bg-blue-50 border-blue-100 text-blue-700'
                            }`}
                    >
                        {pacingInsights.text}
                    </motion.div>
                )}

                {viewMode === 'calendar' && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                        {uniqueDays.map(day => {
                            const dayCount = items.filter(i => i.day === day).length;
                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedDay === day
                                        ? 'bg-slate-800 text-white border-slate-800'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    {day.replace(/\(.*?\)/, '').trim()} <span className="opacity-50 ml-1">({dayCount})</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm font-medium px-5 py-3 rounded-full shadow-2xl shadow-blue-500/20 whitespace-nowrap"
                    >
                        ✨ {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto p-6 pb-32 relative">
                <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-slate-100" />
                {items.length === 0 && <div className="text-center text-slate-400 mt-10 text-sm">No items yet. Add one!</div>}

                {viewMode === 'list' ? (
                    Object.entries(listGroups).map(([day, dayItems]) => {
                        // Determine dominant destination for this day's header
                        const dominantDest = dayItems[0]?.destination || 'Baguio';
                        const headerTheme = getDestinationTheme(dominantDest);
                        return (
                            <div key={day} className="mb-10 last:mb-0 relative">
                                <h3 className={`sticky top-[-1px] z-20 bg-white/95 backdrop-blur-md text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 py-2 border-b border-slate-100 pl-8 rounded-b-md shadow-sm border-l-4 ${headerTheme.headerBorder}`}>
                                    {day}
                                    <span className={`ml-2 text-[10px] ${headerTheme.text} normal-case tracking-normal font-semibold`}>
                                        {headerTheme.emoji} {headerTheme.label}
                                    </span>
                                </h3>
                                <div className="flex flex-col gap-6">
                                    {dayItems.map(renderItemCard)}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <motion.div
                        key={selectedDay}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col gap-6"
                    >
                        {displayedItems.map(renderItemCard)}
                    </motion.div>
                )}
            </div>

            {/* Modal for Add/Edit */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isModalOpen && (
                        <motion.div
                            key="add-edit-modal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
                        >
                            <motion.div
                                key="add-edit-modal-content"
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
                                    <h3 className="font-bold text-lg text-slate-800">
                                        {modalMode === 'add' ? 'Add New Activity' : 'Edit Activity'}
                                    </h3>
                                    <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Activity Name</label>
                                        <input
                                            type="text"
                                            value={formData.activity || ''}
                                            onChange={e => setFormData({ ...formData, activity: e.target.value })}
                                            placeholder="e.g. Lunch at Good Taste"
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800"
                                        />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location / Address</label>
                                        <input
                                            type="text"
                                            value={formData.location || ''}
                                            onChange={e => handleLocationChange(e.target.value)}
                                            placeholder="Search for a location..."
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800"
                                        />
                                        {isSearchingLocation && (
                                            <div className="absolute right-4 top-[34px] w-4 h-4 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                                        )}
                                        <AnimatePresence>
                                            {locationSuggestions.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                                    className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
                                                >
                                                    {locationSuggestions.map((feature: any) => (
                                                        <button
                                                            key={feature.id}
                                                            onClick={(e) => { e.preventDefault(); handleSelectLocation(feature); }}
                                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex items-start gap-3"
                                                        >
                                                            <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-slate-800">{feature.text}</span>
                                                                <span className="text-xs text-slate-500 mt-0.5 leading-snug">{feature.place_name}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        <div className="mt-3 w-full h-40 rounded-xl overflow-hidden border border-slate-200 relative shadow-inner group">
                                            {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
                                                <>
                                                    <Map
                                                        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                                                        longitude={formData.coordinates?.[0] || 120.5960}
                                                        latitude={formData.coordinates?.[1] || 16.4023}
                                                        zoom={14}
                                                        onMove={(evt: any) => setFormData({ ...formData, coordinates: [evt.viewState.longitude, evt.viewState.latitude] })}
                                                        mapStyle="mapbox://styles/mapbox/outdoors-v12"
                                                        style={{ width: '100%', height: '100%' }}
                                                    >
                                                        <NavigationControl showCompass={false} position="bottom-right" />
                                                        <Marker
                                                            longitude={formData.coordinates?.[0] || 120.5960}
                                                            latitude={formData.coordinates?.[1] || 16.4023}
                                                            anchor="bottom"
                                                        >
                                                            <MapPin className="w-8 h-8 text-rose-500 fill-rose-500/20 drop-shadow-md -ml-4 -mt-8" />
                                                        </Marker>
                                                    </Map>
                                                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 pointer-events-none shadow-sm flex items-center gap-1 border border-slate-200/50">
                                                        <MapPinned className="w-3.5 h-3.5 text-rose-500" />
                                                        Drag map to refine pin
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-xs text-slate-400">
                                                    <MapIcon className="w-5 h-5 mb-1 opacity-50" />
                                                    Map unavailable
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Day Group</label>
                                            <select
                                                value={formData.day || ''}
                                                onChange={e => setFormData({ ...formData, day: e.target.value })}
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800 bg-white"
                                            >
                                                {uniqueDays.map(day => (
                                                    <option key={day} value={day}>{day}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Scheduled Time</label>
                                            <input
                                                type="time"
                                                value={formData.time ? (() => {
                                                    const mins = parseTimeToMinutes(formData.time);
                                                    const h = Math.floor(mins / 60).toString().padStart(2, '0');
                                                    const m = (mins % 60).toString().padStart(2, '0');
                                                    return `${h}:${m}`;
                                                })() : ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (!val) {
                                                        setFormData({ ...formData, time: '' });
                                                    } else {
                                                        const [h, m] = val.split(':').map(Number);
                                                        setFormData({ ...formData, time: formatMinutesToTime(h * 60 + m) });
                                                    }
                                                }}
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800 bg-white"
                                            />
                                        </div>
                                    </div>

                                    {(prevActivity || nextActivity) && (
                                        <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-xl text-xs flex flex-col gap-2 mt-1">
                                            <span className="font-bold text-indigo-800 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Smart Schedule Context</span>
                                            {prevActivity && (
                                                <div className="text-indigo-600 flex justify-between items-center bg-white/60 p-2 rounded-lg border border-indigo-50">
                                                    <span className="truncate pr-4 flex-1">Previous: {prevActivity.activity}</span>
                                                    <span className="font-bold shrink-0">{prevActivity.time}</span>
                                                </div>
                                            )}
                                            {nextActivity && (
                                                <div className="text-indigo-600 flex justify-between items-center bg-white/60 p-2 rounded-lg border border-indigo-50">
                                                    <span className="truncate pr-4 flex-1">Next: {nextActivity.activity}</span>
                                                    <span className="font-bold shrink-0">{nextActivity.time}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cost (PHP)</label>
                                            <input
                                                type="number"
                                                value={formData.cost || 0}
                                                onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })}
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (Mins)</label>
                                            <input
                                                type="number"
                                                value={formData.duration || 60}
                                                onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                                        <textarea
                                            rows={3}
                                            value={formData.notes || ''}
                                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800 resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={submitForm} className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-95 transition-all">
                                        Save Activity
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Modal for Delete Confirmation */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isDeleteModalOpen && (
                        <motion.div
                            key="delete-modal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
                        >
                            <motion.div
                                key="delete-modal-content"
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center"
                            >
                                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-lg text-slate-800 mb-2">Delete Activity</h3>
                                <p className="text-sm text-slate-500 mb-6 font-medium">Are you sure you want to remove this from your itinerary? This action cannot be undone.</p>

                                <div className="flex justify-center gap-3">
                                    <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors flex-1">
                                        Cancel
                                    </button>
                                    <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-500/20 active:scale-95 transition-all flex-1">
                                        Yes, Delete
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
