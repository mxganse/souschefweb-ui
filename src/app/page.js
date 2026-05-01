"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, ChefHat, Clock, Utensils, Flame, X, Link, BookOpen } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default function PrivateArchive() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function getEntries() {
      if (!supabase) return;
      const { data, error } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
      if (!error) setRecipes(data || []);
      setLoading(false);
    }
    getEntries();
  }, []);

  const filtered = recipes.filter(r => 
    (r.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.station || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 p-8 md:p-16">
      <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-2xl font-bold flex items-center gap-3 uppercase tracking-tighter">
          <ChefHat className="text-orange-500" /> Culinary Archive
        </h1>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-3 text-slate-600" size={18} />
          <input 
            type="text" 
            placeholder="Search archive..." 
            className="w-full bg-[#111] border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-600 animate-pulse uppercase tracking-widest text-xs">Accessing Database...</div>
        ) : filtered.map(recipe => (
          <article 
            key={recipe.id} 
            onClick={() => setSelected(recipe)}
            className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all cursor-pointer group"
          >
            <div className="aspect-video bg-slate-900 relative">
              {recipe.final_plate_url ? (
                <img src={recipe.final_plate_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-800"><Utensils size={40} /></div>
              )}
            </div>
            <div className="p-5">
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{recipe.station || 'General'}</span>
              <h3 className="text-lg font-bold text-white mt-1">{recipe.title}</h3>
            </div>
          </article>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95" onClick={() => setSelected(null)} />
          <div className="relative bg-[#0f0f0f] border border-white/10 w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-3xl p-8 md:p-12">
            <button onClick={() => setSelected(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X /></button>
            <h2 className="text-3xl font-bold text-white mb-6">{selected.title}</h2>
            <div className="prose prose-invert text-slate-300 whitespace-pre-wrap font-serif text-lg leading-relaxed">
              {selected.instructions_markdown || "No instructions provided."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}