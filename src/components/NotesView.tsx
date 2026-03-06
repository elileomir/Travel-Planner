'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotebookText, CheckCircle2, Circle, Plus, Trash2, ShoppingBag } from 'lucide-react';

interface ShoppingItem {
    id: string;
    text: string;
    completed: boolean;
}

export default function NotesView() {
    const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
    const [generalNotes, setGeneralNotes] = useState('');
    const [newItemText, setNewItemText] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        const savedNotes = localStorage.getItem('custom_notes_data');
        if (savedNotes) {
            try {
                const parsed = JSON.parse(savedNotes);
                if (parsed.shoppingList) setShoppingList(parsed.shoppingList);
                if (parsed.generalNotes) setGeneralNotes(parsed.generalNotes);
            } catch (e) {
                console.error("Error loading notes", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to local storage on change
    useEffect(() => {
        if (!isLoaded) return;
        const dataToSave = {
            shoppingList,
            generalNotes
        };
        localStorage.setItem('custom_notes_data', JSON.stringify(dataToSave));
    }, [shoppingList, generalNotes, isLoaded]);

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
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full space-y-8 pb-20 md:pb-0">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl shadow-sm">
                        <NotebookText size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Trip Notes</h1>
                        <p className="text-slate-500 text-sm">Shopping checklists and general thoughts</p>
                    </div>
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
                                                className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${item.completed
                                                        ? 'bg-slate-50 border-transparent'
                                                        : 'bg-white border-slate-200 hover:border-emerald-200 hover:shadow-sm'
                                                    }`}
                                                onClick={() => toggleItem(item.id)}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
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
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteItem(item.id);
                                                    }}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 lg:group-hover:opacity-100 transition-all focus:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
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
