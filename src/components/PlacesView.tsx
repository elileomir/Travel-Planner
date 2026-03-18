'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Utensils, MountainSnow, Plus, Trash2, Edit2, X, Save, Banknote } from 'lucide-react';
import { supabase } from '../lib/supabase';

export type PlaceType = 'spot' | 'food';

export interface PlaceItem {
    id: string;
    type: PlaceType;
    title: string;
    category: string;
    description: string;
    location: string;
    durationOrTime: string;
    price: string;
    destination: string;
    latitude?: number;
    longitude?: number;
    isCustom?: boolean;
}

export default function PlacesView({ foodData, spotsData }: { foodData: any[], spotsData: any[] }) {
    const [destinationFilter, setDestinationFilter] = useState<'Baguio' | 'La Union (Elyu)'>('Baguio');
    const [filter, setFilter] = useState<'all' | 'food' | 'spot'>('all');
    const [places, setPlaces] = useState<PlaceItem[]>([]);

    // Modals
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingPlace, setEditingPlace] = useState<PlaceItem | null>(null);
    const [placeToDelete, setPlaceToDelete] = useState<PlaceItem | null>(null);

    // Form
    const [formData, setFormData] = useState<PlaceItem>({
        id: '',
        type: 'spot',
        title: '',
        category: '',
        description: '',
        location: '',
        durationOrTime: '',
        price: '',
        destination: 'Baguio',
        isCustom: true
    });

    const TRIP_ID = 'b3d81829-5735-46fd-bcc5-7dfb2e27be8e';
    const isLoadedRef = useRef(false);

    // Parse CSV data into PlaceItem format
    const buildCsvItems = (): PlaceItem[] => {
        const initialSpots: PlaceItem[] = spotsData.filter(s => s.Attraction || s.Spot).map(s => ({
            id: crypto.randomUUID(), type: 'spot' as PlaceType,
            title: s.Attraction || s.Spot, category: s.Category || 'Landmark',
            description: s.Highlights || s.Description || '', location: s.Address || s.Location || '',
            durationOrTime: `${s['Best Time'] || 'Anytime'} (${s['Suggested Duration'] || s.Duration || ''})`,
            price: s['Entrance Fee'] || s['Entrance Fee (₱)'] || 'Free',
            destination: s.Destination || 'Baguio',
            latitude: s.Latitude ? Number(s.Latitude) : undefined,
            longitude: s.Longitude ? Number(s.Longitude) : undefined,
            isCustom: false
        }));
        const initialFood: PlaceItem[] = foodData.filter(f => f['Restaurant / Food Spot'] || f.Restaurant).map(f => ({
            id: crypto.randomUUID(), type: 'food' as PlaceType,
            title: f['Restaurant / Food Spot'] || f.Restaurant,
            category: f['Cuisine / Type'] || f.Cuisine || 'Local',
            description: f['Specialty / Must Try'] || (f['Must Try'] ? `Must Try: ${f['Must Try']}` : ''),
            location: f['Location / Link'] || f.Location || '',
            durationOrTime: f['Best For'] || 'Anytime',
            price: f['Price Range per Person (₱)'] || f['Price Range'] || 'Varies',
            destination: f.Destination || 'Baguio',
            latitude: f.Latitude ? Number(f.Latitude) : undefined,
            longitude: f.Longitude ? Number(f.Longitude) : undefined,
            isCustom: false
        }));
        return [...initialSpots, ...initialFood];
    };

    // Load places from Supabase on mount; seed CSV data if empty
    useEffect(() => {
        async function loadPlaces() {
            try {
                const { data, error } = await supabase
                    .from('trip_notes')
                    .select('places_json')
                    .eq('trip_id', TRIP_ID)
                    .single();

                if (data && data.places_json && data.places_json.length > 0) {
                    // Supabase has saved places — use them
                    // But also merge any missing CSV items (e.g. if La Union was added later)
                    const savedPlaces: PlaceItem[] = data.places_json;
                    const csvItems = buildCsvItems();
                    const savedTitles = new Set(savedPlaces.map((p: PlaceItem) => `${p.title}__${p.destination}`));
                    const missingItems = csvItems.filter(ci => !savedTitles.has(`${ci.title}__${ci.destination}`));
                    if (missingItems.length > 0) {
                        const merged = [...savedPlaces, ...missingItems];
                        setPlaces(merged);
                        await persistToSupabase(merged);
                    } else {
                        setPlaces(savedPlaces);
                    }
                } else {
                    // No saved places — seed with CSV data and persist to Supabase
                    const csvItems = buildCsvItems();
                    setPlaces(csvItems);
                    await persistToSupabase(csvItems);
                }
            } catch (err) {
                console.error('Failed to load places from Supabase, using CSV fallback', err);
                setPlaces(buildCsvItems());
            }
            isLoadedRef.current = true;
        }
        loadPlaces();
    }, [foodData, spotsData]);

    // Save places array to Supabase
    const persistToSupabase = async (items: PlaceItem[]) => {
        try {
            const { data: existingData } = await supabase
                .from('trip_notes')
                .select('id')
                .eq('trip_id', TRIP_ID)
                .single();

            if (existingData) {
                await supabase
                    .from('trip_notes')
                    .update({ places_json: items, updated_at: new Date().toISOString() })
                    .eq('id', existingData.id);
            } else {
                await supabase
                    .from('trip_notes')
                    .insert([{ trip_id: TRIP_ID, places_json: items }]);
            }
        } catch (error) {
            console.error('Error saving places to Supabase', error);
        }
    };

    const persistPlaces = (newPlaces: PlaceItem[]) => {
        setPlaces(newPlaces);
        persistToSupabase(newPlaces);
    };

    const handleSave = () => {
        if (!formData.title || !formData.location) return;
        let updated: PlaceItem[];
        if (editingPlace) {
            updated = places.map(p => p.id === editingPlace.id ? { ...formData } : p);
        } else {
            updated = [{ ...formData, id: crypto.randomUUID() }, ...places];
        }
        persistPlaces(updated);
        setIsAddEditModalOpen(false);
    };

    const handleDelete = () => {
        if (!placeToDelete) return;
        persistPlaces(places.filter(p => p.id !== placeToDelete.id));
        setIsDeleteModalOpen(false);
        setPlaceToDelete(null);
    };

    const openAddModal = () => {
        setEditingPlace(null);
        setFormData({
            id: '', type: filter === 'food' ? 'food' : 'spot', title: '', category: '',
            description: '', location: '', durationOrTime: '', price: '',
            destination: destinationFilter, isCustom: true
        });
        setIsAddEditModalOpen(true);
    };

    const openEditModal = (place: PlaceItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingPlace(place);
        setFormData({ ...place });
        setIsAddEditModalOpen(true);
    };

    const openDeleteModal = (place: PlaceItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setPlaceToDelete(place);
        setIsDeleteModalOpen(true);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const filteredPlaces = places.filter(p => {
        const dest = p.destination || 'Baguio'; // Fallback for legacy local storage items
        const matchesDestination = destinationFilter === 'Baguio' ? dest.includes('Baguio') : dest.includes('La Union');
        const matchesType = filter === 'all' || filter === p.type;
        return matchesDestination && matchesType;
    });

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 relative">
            <div className="flex justify-center mb-8">
                <div className="flex bg-slate-200/60 p-1.5 rounded-2xl w-full max-w-md relative shadow-inner">
                    <motion.div
                        layoutId="destinationHighlight"
                        className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm border border-slate-100/50"
                        animate={{ left: destinationFilter === 'Baguio' ? '6px' : 'calc(50%)' }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                    <button
                        onClick={() => setDestinationFilter('Baguio')}
                        className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl text-sm font-bold z-10 transition-colors ${destinationFilter === 'Baguio' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-600'}`}
                    >
                        Baguio City
                        <span className={`text-[10px] font-medium transition-colors ${destinationFilter === 'Baguio' ? 'text-blue-500/70' : 'text-slate-400'}`}>Cool Mountains</span>
                    </button>
                    <button
                        onClick={() => setDestinationFilter('La Union (Elyu)')}
                        className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl text-sm font-bold z-10 transition-colors ${destinationFilter === 'La Union (Elyu)' ? 'text-orange-600' : 'text-slate-500 hover:text-slate-600'}`}
                    >
                        La Union
                        <span className={`text-[10px] font-medium transition-colors ${destinationFilter === 'La Union (Elyu)' ? 'text-orange-500/70' : 'text-slate-400'}`}>Sunny Surf</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-200/60 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Discover {destinationFilter === 'Baguio' ? 'Baguio' : 'Elyu'}</h2>
                    <p className="text-slate-500 mt-1">Curated recommendations & your saved places</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
                        <button onClick={() => setFilter('all')} className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${filter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All</button>
                        <button onClick={() => setFilter('spot')} className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${filter === 'spot' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Attractions</button>
                        <button onClick={() => setFilter('food')} className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${filter === 'food' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Food</button>
                    </div>
                    <button onClick={openAddModal} className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors shadow-sm whitespace-nowrap cursor-pointer">
                        <Plus size={16} /> Add
                    </button>
                </div>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPlaces.map((place) => (
                    <motion.div key={place.id} variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow group flex flex-col relative overflow-hidden">

                        {/* Action Buttons (Always visible on mobile, visible on hover desktop) */}
                        <div className="absolute top-4 right-4 flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                            <button onClick={(e) => openEditModal(place, e)} className="p-2 bg-white/90 backdrop-blur border border-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full shadow-sm transition-colors cursor-pointer" aria-label="Edit place">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={(e) => openDeleteModal(place, e)} className="p-2 bg-white/90 backdrop-blur border border-slate-100 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-full shadow-sm transition-colors cursor-pointer" aria-label="Delete place">
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 transition-colors ${place.type === 'spot' ? 'bg-blue-100 text-blue-600 md:group-hover:bg-blue-600 md:group-hover:text-white' : 'bg-orange-100 text-orange-600 md:group-hover:bg-orange-600 md:group-hover:text-white'}`}>
                            {place.type === 'spot' ? <MountainSnow size={20} /> : <Utensils size={20} />}
                        </div>

                        <h3 className="font-bold text-slate-800 text-lg mb-1 pr-16">{place.title}</h3>
                        <div className="flex gap-2 flex-wrap mb-4">
                            <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium">{place.category}</span>
                            {place.isCustom && <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md font-medium shrink-0">Custom Area</span>}
                        </div>

                        <p className="text-sm text-slate-600 mb-6 flex-1 line-clamp-3">{place.description}</p>

                        <div className="space-y-2 mt-auto">
                            <div className="flex items-center text-xs text-slate-500">
                                <MapPin size={14} className="mr-2 text-slate-400 shrink-0" />
                                <span className="truncate">{place.location}</span>
                                {place.latitude && place.longitude && (
                                    <a
                                        href={`https://maps.google.com/?q=${place.latitude},${place.longitude}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Open in Maps"
                                        className="ml-auto flex items-center gap-1 shrink-0 text-blue-500 hover:text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
                                    >
                                        Map &rarr;
                                    </a>
                                )}
                            </div>
                            {place.durationOrTime && (
                                <div className="flex items-center text-xs text-slate-500">
                                    <Clock size={14} className="mr-2 text-slate-400 shrink-0" />
                                    <span className="truncate">{place.durationOrTime}</span>
                                </div>
                            )}
                            <div className={`flex items-center text-xs font-medium mt-2 px-2 py-1 rounded-lg w-fit ${place.type === 'spot' ? 'text-emerald-600 bg-emerald-50' : 'text-orange-600 bg-orange-50'}`}>
                                <Banknote size={14} className="mr-1" />
                                {place.price}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {filteredPlaces.length === 0 && (
                    <div className="col-span-full py-12 text-center flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <MapPin className="w-12 h-12 text-slate-300 mb-3" />
                        <h3 className="text-lg font-semibold text-slate-700 mb-1">No places found</h3>
                        <p className="text-slate-500 mb-4 text-sm">You haven't added any {filter === 'spot' ? 'attractions' : filter === 'food' ? 'food spots' : 'places'} yet.</p>
                        <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm cursor-pointer">
                            <Plus size={16} /> Add a Place
                        </button>
                    </div>
                )}
            </motion.div>

            <AnimatePresence>
                {/* Delete Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Place?</h3>
                                <p className="text-slate-600 text-sm mb-6">Are you sure you want to remove "{placeToDelete?.title}" from your curated list?</p>
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">Cancel</button>
                                    <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm cursor-pointer">Delete</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Add/Edit Modal */}
                {isAddEditModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm pt-24 md:pt-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
                                <h3 className="text-xl font-bold text-slate-800">{editingPlace ? 'Edit Place' : 'Add New Place'}</h3>
                                <button onClick={() => setIsAddEditModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"><X size={20} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex gap-4 mb-2">
                                    <button onClick={() => setFormData({ ...formData, type: 'spot' })} className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${formData.type === 'spot' ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Attraction</button>
                                    <button onClick={() => setFormData({ ...formData, type: 'food' })} className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${formData.type === 'food' ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Food / Dining</button>
                                </div>

                                <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Name / Title *</label><input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" placeholder="e.g. Session Road" /></div>
                                <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category / Cuisine</label><input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" placeholder="e.g. Landmark or Filipino" /></div>
                                <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description / Highlights</label><textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none" placeholder="What makes it special..."></textarea></div>
                                <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location / Address *</label><input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" placeholder="Search or type an address..." /></div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Time / Duration</label><input type="text" value={formData.durationOrTime} onChange={e => setFormData({ ...formData, durationOrTime: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" placeholder="e.g. 2 hours" /></div>
                                    <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Est. Price</label><input type="text" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" placeholder="e.g. ₱200 or Free" /></div>
                                </div>
                            </div>
                            <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex justify-end gap-3 z-10">
                                <button onClick={() => setIsAddEditModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">Cancel</button>
                                <button onClick={handleSave} disabled={!formData.title || !formData.location} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm cursor-pointer"><Save size={16} /> Save Place</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
