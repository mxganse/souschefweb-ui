"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, ChefHat, Utensils, X, ExternalLink, BookOpen, AlertCircle, Globe } from 'lucide-react';

// This line tells Next.js to bypass the Incremental Cache
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default function PrivateArchive() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function getEntries() {
      try {
        if (!supabase) {
          setError("Database connection keys missing.");
          return;
        }
        const { data, error: dbError } = await supabase
          .from('recipes')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbError) throw dbError;
        setRecipes(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false); 
      }
    }
    getEntries();
  }, []);

  const filtered = recipes.filter(r => 
    (r.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.station || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 p-6 md:p-12 font-sans">
      <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-2 rounded-lg"><ChefHat className="text-white" size={20} /></div>
          <h1 className="text-xl font-bold uppercase tracking-tighter italic text-white">Archive</h1>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-2.5 text-slate-600" size={18} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full bg-[#111] border border-white/5 rounded-xl py-2 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 text-white"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {error && (
        <div className="max-w-6xl mx-auto mb-8 p-4 bg-red-950/20 border border-red-900/50 rounded-xl flex items-center gap-3 text-red-400 text-[10px] font-black uppercase tracking-widest">
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-600 animate-pulse uppercase tracking-[0.3em] text-[10px] font-black">
            Accessing Database...
          </div>
        ) : filtered.length > 0 ? (
          filtered.map(recipe => (
            <article 
              key={recipe.id} 
              onClick={() => setSelected(recipe)}
              className="bg-[#0f0f0f] border border-white/5 rounded-3xl overflow-hidden hover:border-orange-500/40 transition-all cursor-pointer group shadow-lg"
            >
              <div className="aspect-video bg-slate-900 relative">
                {recipe.final_plate_url ? (
                  <img src={recipe.final_plate_url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-800 bg-gradient-to-br from-slate-900 to-black"><Utensils size={40} /></div>
                )}
                {recipe.source_url && (
                  <div className="absolute top-4 right-4 text-white/30"><Globe size={16} /></div>
                )}
              </div>
              <div className="p-6">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{recipe.station || 'General'}</span>
                <h3 className="text-lg font-bold text-white mt-1 group-hover:text-orange-400 transition-colors">{recipe.title || 'Untitled'}</h3>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-slate-800 border border-dashed border-white/5 rounded-3xl uppercase text-[10px] font-black tracking-widest">
            Database Empty
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-[#0f0f0f] border border-white/10 w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-[32px] p-8 md:p-12 shadow-2xl">
            <button onClick={() => setSelected(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X /></button>
            <h2 className="text-3xl font-bold text-white mb-6 uppercase tracking-tight">{selected.title}</h2>
            <div className="text-slate-300 whitespace-pre-wrap font-serif text-lg leading-relaxed mb-10">
              {selected.instructions_markdown || "No instructions provided."}
            </div>
            {selected.source_url && (
              <a href={selected.source_url} target="_blank" className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:text-orange-400">
                Source Original <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}