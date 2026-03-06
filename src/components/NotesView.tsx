'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotebookText, CheckCircle2, Circle, Plus, Trash2, ShoppingBag, Loader2, Save, Edit2, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ShoppingItem {
    id: string;
    text: string;
    completed: boolean;
}

export default function NotesView() {
    const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
    const [generalNotes, setGeneralNotes] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newItemText, setNewItemText] = useState('');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingItemText, setEditingItemText] = useState('');
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    const TRIP_ID = 'b3d81829-5735-46fd-bcc5-7dfb2e27be8e'; // Hardcoded for this personal app instance

    // Load from Supabase on mount
    useEffect(() => {
        async function loadNotes() {
            try {
                const { data, error } = await supabase
                    .from('trip_notes')
                    .select('*')
                    .eq('trip_id', TRIP_ID)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    // PGRST116 means zero rows, which is fine on first load
                    console.error("Error loading notes from Supabase", error);
                } else if (data) {
                    if (data.shopping_list) setShoppingList(data.shopping_list);
                    if (data.general_notes) setGeneralNotes(data.general_notes);
                }
            } catch (err) {
                console.error("Unexpected error loading notes", err);
            } finally {
                setIsLoaded(true);
            }
        }
        loadNotes();
    }, []);

    // Save to Supabase on change with debounce
    useEffect(() => {
        if (!isLoaded) return;

        setIsSaving(true);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                // Upsert logic based on trip_id
                const { data: existingData } = await supabase
                    .from('trip_notes')
                    .select('id')
                    .eq('trip_id', TRIP_ID)
                    .single();

                if (existingData) {
                    // Update
                    await supabase
                        .from('trip_notes')
                        .update({
                            shopping_list: shoppingList,
                            general_notes: generalNotes,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existingData.id);
                } else {
                    // Insert
                    await supabase
                        .from('trip_notes')
                        .insert([{
                            trip_id: TRIP_ID,
                            shopping_list: shoppingList,
                            general_notes: generalNotes
                        }]);
                }
            } catch (error) {
                console.error("Error saving notes to Supabase", error);
            } finally {
                setIsSaving(false);
            }
        }, 1000); // 1 second debounce

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [shoppingList, generalNotes, isLoaded]);

    // Handle focusing the edit input when it appears
    useEffect(() => {
        if (editingItemId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingItemId]);

    const handleAddItem = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newItemText.trim()) return;

        const newItem: ShoppingItem = {
            id: crypto.randomUUID(),
            text: newItemText.trim(),
            completed: false
        };

        setShoppingList([...shoppingList, newItem]);
        setNewItemText('');
    };

    const toggleItem = (id: string) => {
        setShoppingList(shoppingList.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const deleteItem = (id: string) => {
        setShoppingList(shoppingList.filter(item => item.id !== id));
        if (editingItemId === id) {
            cancelEdit();
        }
    };

    const startEditing = (item: ShoppingItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingItemId(item.id);
        setEditingItemText(item.text);
    };

    const saveEdit = (id: string) => {
        if (!editingItemText.trim()) {
            deleteItem(id);
            return;
        }

        setShoppingList(shoppingList.map(item =>
            item.id === id ? { ...item, text: editingItemText.trim() } : item
        ));
        setEditingItemId(null);
        setEditingItemText('');
    };

    const cancelEdit = () => {
        setEditingItemId(null);
        setEditingItemText('');
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full space-y-8 pb-20 md:pb-0">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl shadow-sm">
                            <NotebookText size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Trip Notes</h1>
                            <p className="text-slate-500 text-sm">Shopping checklists and general thoughts</p>
                        </div>
                    </div>
                    {isLoaded && (
                        <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500">
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                                    <span>Saving to cloud...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Saved to cloud</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Shopping List Section */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 h-full flex flex-col">
                            <div className="flex items-center gap-2 mb-5">
                                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                                <h2 className="text-lg font-bold text-slate-800 font-serif">What to Buy</h2>
                            </div>

                            <form onSubmit={handleAddItem} className="relative mb-5 shrink-0">
                                <input
                                    type="text"
                                    value={newItemText}
                                    onChange={(e) => setNewItemText(e.target.value)}
                                    placeholder="Add an item..."
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!newItemText.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg transition-colors shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </form>

                            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                                <AnimatePresence initial={false}>
                                    {shoppingList.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-10 text-slate-400 text-sm"
                                        >
                                            Your shopping list is empty!
                                        </motion.div>
                                    ) : (
                                        shoppingList.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className={`group flex items-center justify-between p-3 rounded-xl border transition-all select-none ${item.completed && editingItemId !== item.id
                                                    ? 'bg-slate-50 border-transparent'
                                                    : editingItemId === item.id
                                                        ? 'bg-emerald-50/50 border-emerald-200'
                                                        : 'bg-white border-slate-200 hover:border-emerald-200 hover:shadow-sm cursor-pointer'
                                                    }`}
                                                onClick={() => {
                                                    if (editingItemId !== item.id) {
                                                        toggleItem(item.id);
                                                    }
                                                }}
                                            >
                                                {editingItemId === item.id ? (
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <input
                                                            ref={editInputRef}
                                                            type="text"
                                                            value={editingItemText}
                                                            onChange={(e) => setEditingItemText(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    saveEdit(item.id);
                                                                } else if (e.key === 'Escape') {
                                                                    cancelEdit();
                                                                }
                                                            }}
                                                            className="flex-1 bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full"
                                                        />
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); saveEdit(item.id); }}
                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors shrink-0"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                                                            className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors shrink-0"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center flex-1 gap-3 overflow-hidden">
                                                            {item.completed ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                                            ) : (
                                                                <Circle className="w-5 h-5 text-slate-300 shrink-0 group-hover:text-emerald-400 transition-colors" />
                                                            )}
                                                            <span className={`text-sm truncate transition-all ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'
                                                                }`}>
                                                                {item.text}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-all focus-within:opacity-100 shrink-0">
                                                            <button
                                                                onClick={(e) => startEditing(item, e)}
                                                                className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                                title="Edit item"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteItem(item.id);
                                                                }}
                                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                title="Delete item"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* General Notes Section */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 h-full flex flex-col min-h-[400px]">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="font-semibold text-slate-800 font-serif text-lg">General Notes</span>
                            </div>

                            <textarea
                                value={generalNotes}
                                onChange={(e) => setGeneralNotes(e.target.value)}
                                placeholder="Jot down interesting places, reminders, or random thoughts here..."
                                className="flex-1 w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-4 text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none font-medium leading-relaxed"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
