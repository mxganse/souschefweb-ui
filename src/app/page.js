"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BookOpen, ChefHat, Search, FileText, ClipboardList } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default function SousChefDashboard() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchGuides() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('guides')
          .select('*')
          .order('category', { ascending: true });

        if (!error) setGuides(data || []);
      } catch (err) {
        console.error("Fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchGuides();
  }, []);

  const filteredGuides = guides.filter(guide => 
    guide.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      {/* --- HEADER --- */}
      <header className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-sm font-bold border border-orange-500/20">
            <ChefHat size={16} /> INTERNAL SYSTEMS
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight">
            Sous Chef <span className="text-orange-500">Web</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            The central hub for Square Bar culinary procedures and station guides.
          </p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-4 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Find a guide or procedure..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-white"
          />
        </div>
      </header>

      {/* --- RESOURCE GRID --- */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-900/30 rounded-2xl border border-slate-800 animate-pulse" />
          ))
        ) : filteredGuides.length > 0 ? (
          filteredGuides.map((guide) => (
            <div 
              key={guide.id} 
              className="group bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 hover:border-orange-500/40 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-slate-800 rounded-xl text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  {guide.category === 'Operations' ? <ClipboardList size={24} /> : <FileText size={24} />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                  {guide.category}
                </span>
              </div>
              
              <h3 className="font-bold text-xl mb-2 group-hover:text-white transition-colors">
                {guide.title}
              </h3>
              <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                {guide.description || 'No additional details provided.'}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                <span className="text-xs text-slate-600 font-medium">By {guide.author}</span>
                <BookOpen size={16} className="text-slate-700 group-hover:text-orange-500 transition-colors" />
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-slate-600 border-2 border-dashed border-slate-900 rounded-3xl">
            <p className="text-lg">No resources found for "{searchQuery}"</p>
          </div>
        )}
      </div>
    </main>
  );
}