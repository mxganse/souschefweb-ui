"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Search, 
  Plus, 
  ChefHat, 
  Clock, 
  Utensils, 
  ExternalLink,
  Flame,
  X,
  Link as LinkIcon,
  Tag as TagIcon,
  BookOpen,
  Globe,
  AlertCircle
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default function PrivateCulinaryArchive() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [scanUrl, setScanUrl] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      if (!supabase) {
        setError("Supabase configuration missing.");
        setLoading(false);
        return;
      }
      try {
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
    fetchData();
  }, []);

  const filteredRecipes = recipes.filter(recipe => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (recipe.title || "").toLowerCase().includes(searchLower) ||
      (recipe.category || "").toLowerCase().includes(searchLower) ||
      (recipe.station || "").toLowerCase().includes(searchLower)
    );
  });

  const handleScan = (e) => {
    e.preventDefault();
    console.log("Scanning URL:", scanUrl);
    setScanUrl("");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans">
      
      {/* --- NAVIGATION --- */}
      <nav className="border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-lg">
              <ChefHat className="text-white" size={20} />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white uppercase italic">Private Archive</h1>
          </div>

          <form onSubmit={handleScan} className="hidden md:flex flex-grow max-w-md relative">
            <input 
              type="url" 
              placeholder="Paste URL to scan..." 
              value={scanUrl}
              onChange={(e) => setScanUrl(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 px-5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all"
            />
            <button type="submit" className="absolute right-2 top-1 p-1.5 bg-orange-600 rounded-full hover:bg-orange-500 transition-colors">
              <Plus size={14} className="text-white" />
            </button>
          </form>

          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
            {recipes.length} Entries
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        
        {/* --- ERROR DISPLAY --- */}
        {error && (
          <div className="mb-8 p-4 bg-red-950/20 border border-red-900/50 rounded-xl flex items-center gap-3 text-red-400 text-xs">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* --- SEARCH --- */}
        <section className="mb-12">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input 
              type="text" 
              placeholder="Filter archive..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111] border border-white/5 rounded-xl py-4 pl-12 pr-6 focus:outline-none focus:border-orange-500/30 transition-all text-white placeholder:text-slate-700"
            />
          </div>
        </section>

        {/* --- GRID --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            [1, 2, 3, 6].map((i) => (
              <div key={i} className="h-80 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
            ))
          ) : filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => (
              <article 
                key={recipe.id} 
                onClick={() => setSelectedRecipe(recipe)}
                className="group bg-[#0f0f0f] rounded-3xl border border-white/5 overflow-hidden hover:border-orange-500/40 transition-all duration-300 cursor-pointer flex flex-col h-full shadow-lg"
              >
                <div className="aspect-[4/3] bg-slate-900 relative">
                  {recipe.final_plate_url ? (
                    <img 
                      src={recipe.final_plate_url} 
                      alt={recipe.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-800 bg-gradient-to-b from-[#111] to-black">
                      <Utensils size={48} strokeWidth={1} />
                    </div>
                  )}
                  
                  {recipe.station && (
                    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-white/10">
                      {recipe.station}
                    </div>
                  )}
                </div>

                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-1 block">
                      {recipe.category || 'Recipe'}
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
                      {recipe.title || 'Untitled Entry'}
                    </h3>
                  </div>

                  <div className="mt-6 flex items-center gap-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    {recipe.prep_time_minutes && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>{recipe.prep_time_minutes}m</span>
                      </div>
                    )}
                    {recipe.yield_amount && (
                      <div className="flex items-center gap-1.5">
                        <Flame size={12} />
                        <span>{recipe.yield_amount} {recipe.yield_unit}</span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full py-32 text-center border border-dashed border-white/5 rounded-3xl">
              <p className="text-slate-600 font-medium">Archive contains no entries.</p>
            </div>
          )}
        </section>
      </main>

      {/* --- DETAIL MODAL --- */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setSelectedRecipe(null)} />
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#0f0f0f] border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-2xl">
            <button onClick={() => setSelectedRecipe(null)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-all z-10">
              <X size={20} />
            </button>
            <div className="overflow-y-auto p-8 md:p-12">
              <div className="mb-10">
                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest block mb-2">{selectedRecipe.category}</span>
                <h2 className="text-3xl font-bold text-white">{selectedRecipe.title}</h2>
                <div className="mt-4 flex gap-4 text-slate-500 text-xs font-bold uppercase tracking-widest">
                  {selectedRecipe.station && <span className="bg-white/5 px-2 py-1 rounded">Station: {selectedRecipe.station}</span>}
                  {selectedRecipe.prep_time_minutes && <span>{selectedRecipe.prep_time_minutes}m Prep</span>}
                </div>
              </div>

              {selectedRecipe.instructions_markdown ? (
                <div className="text-slate-300 leading-relaxed whitespace-pre-wrap font-serif text-lg">
                  {selectedRecipe.instructions_markdown}
                </div>
              ) : (
                <p className="text-slate-600 italic">No instructions available.</p>
              )}

              {selectedRecipe.source_url && (
                <div className="mt-12 pt-8 border-t border-white/5">
                  <a href={selectedRecipe.source_url} target="_blank" className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 font-bold text-[10px] uppercase tracking-widest transition-colors">
                    Source Link <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}