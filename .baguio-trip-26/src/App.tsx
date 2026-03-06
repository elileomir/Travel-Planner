import React, { useState, useEffect } from 'react';
import { Compass, Map, ListTodo, MessageSquare, Menu, X } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Itinerary from './components/Itinerary';
import Places from './components/Places';
import AIAssistant from './components/AIAssistant';
import { initialItinerary } from './data/baguioData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [itinerary, setItinerary] = useState(initialItinerary);

  useEffect(() => {
    const saved = localStorage.getItem('baguio_itinerary');
    if (saved) {
      setItinerary(JSON.parse(saved));
    }
  }, []);

  const toggleComplete = (id: string) => {
    const updated = itinerary.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItinerary(updated);
    localStorage.setItem('baguio_itinerary', JSON.stringify(updated));
  };

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: Compass },
    { id: 'itinerary', label: 'Itinerary', icon: ListTodo },
    { id: 'places', label: 'Places to Visit', icon: Map },
    { id: 'ai', label: 'AI Assistant', icon: MessageSquare },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard itinerary={itinerary} />;
      case 'itinerary':
        return <Itinerary itinerary={itinerary} toggleComplete={toggleComplete} />;
      case 'places':
        return <Places />;
      case 'ai':
        return <AIAssistant />;
      default:
        return <Dashboard itinerary={itinerary} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 text-white p-2 rounded-xl">
                <Compass size={24} />
              </div>
              <span className="font-bold text-xl tracking-tight text-emerald-900">Baguio Trip '26</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-500 hover:text-slate-700 focus:outline-none p-2 rounded-lg hover:bg-slate-100"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white absolute w-full shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}
