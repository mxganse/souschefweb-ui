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
  Instagram,
  Tag as TagIcon,
  BookOpen,
  Globe
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

  // Fetch all recipes on load
  useEffect(() => {
    async function fetchData() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRecipes(data || []);
      } catch (err) {
        console.error("Archive fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredRecipes = recipes.filter(recipe => 
    recipe.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.station?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleScan = (e) => {
    e.preventDefault();
    console.log("Scanning URL:", scanUrl);
    // Add your scanning logic/API call here
    setScanUrl("");
  };

  return (
    <div className="min-h-screen bg-[#080808] text-slate-200 font-sans selection:bg-orange-500/30">
      
      {/* --- TOP NAVIGATION & SCANNER --- */}
      <nav className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-xl shadow-lg shadow-orange-950/20">
              <ChefHat className="text-white" size={22} />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white uppercase italic">Archive</h1>
          </div>

          <form onSubmit={handleScan} className="hidden md:flex flex-grow max-w-xl relative">
            <input 
              type="url" 
              placeholder="Paste Instagram or Web URL to scan..." 
              value={scanUrl}
              onChange={(e) => setScanUrl(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            />
            <button type="submit" className="absolute right-2 top-1.5 p-1.5 bg-orange-600 rounded-full hover:bg-orange-500 transition-colors">
              <Plus size={16} className="text-white" />
            </button>
          </form>

          <div className="flex-shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Private Access
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        
        {/* --- SEARCH & FILTERS --- */}
        <section className="mb-12">
          <div className="relative max-w-2xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
            <input 
              type="text" 
              placeholder="Filter by station, category, or title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111] border border-white/5 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:border-white/20 transition-all text-white placeholder:text-slate-700 text-lg shadow-inner"
            />
          </div>
        </section>

        {/* --- MAIN GRID --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-white/5 rounded-3xl border border-white/5 animate-pulse" />
            ))
          ) : filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => (
              <article 
                key={recipe.id} 
                onClick={() => setSelectedRecipe(recipe)}
                className="group bg-[#0f0f0f] rounded-3xl border border-white/5 overflow-hidden hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-950/10 transition-all duration-500 cursor-pointer flex flex-col"
              >
                {/* Image Section */}
                <div className="aspect-[4/5] bg-slate-900 relative overflow-hidden">
                  {recipe.final_plate_url ? (
                    <img 
                      src={recipe.final_plate_url} 
                      alt={recipe.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-800 bg-gradient-to-b from-[#111] to-black">
                      <Utensils size={64} strokeWidth={1} />
                    </div>
                  )}
                  
                  {/* Metadata Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black via-black/40 to-transparent">
                    <div className="flex items-center gap-2 mb-2">
                      {recipe.station && (
                        <span className="bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                          {recipe.station}
                        </span>
                      )}
                      {recipe.category && (
                        <span className="bg-white/10 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-white/10">
                          {recipe.category}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors leading-tight">
                      {recipe.title}
                    </h3>
                  </div>

                  {/* Source Icon */}
                  <div className="absolute top-4 right-4">
                    {recipe.source_type === 'instagram' ? (
                      <Instagram size={18} className="text-white/50" />
                    ) : (
                      <Globe size={18} className="text-white/50" />
                    )}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="p-5 flex items-center gap-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-t border-white/5">
                  {recipe.prep_time_minutes && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-orange-500/50" />
                      <span>{recipe.prep_time_minutes}m</span>
                    </div>
                  )}
                  {recipe.yield_amount && (
                    <div className="flex items-center gap-1.5">
                      <Flame size={14} className="text-orange-500/50" />
                      <span>Yield {recipe.yield_amount}</span>
                    </div>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full py-40 text-center border border-dashed border-white/5 rounded-[40px]">
              <BookOpen size={48} className="mx-auto text-slate-800 mb-4" />
              <p className="text-slate-500 font-medium">Archive contains no entries matching this filter.</p>
            </div>
          )}
        </section>
      </main>

      {/* --- DETAIL OVERLAY --- */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setSelectedRecipe(null)} />
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#0f0f0f] border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-2xl">
            
            <button 
              onClick={() => setSelectedRecipe(null)}
              className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all z-10"
            >
              <X size={24} />
            </button>

            <div className="overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                
                {/* Left: Media */}
                <div className="bg-black aspect-square lg:aspect-auto">
                  {selectedRecipe.final_plate_url ? (
                    <img src={selectedRecipe.final_plate_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-900">
                      <Utensils size={120} />
                    </div>
                  )}
                </div>

                {/* Right: Content */}
                <div className="p-8 md:p-14 space-y-10">
                  <header>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-orange-600/10 text-orange-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-orange-500/20">
                        {selectedRecipe.station}
                      </span>
                      <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
                        {selectedRecipe.category}
                      </span>
                    </div>
                    <h2 className="text-4xl font-bold text-white leading-tight">{selectedRecipe.title}</h2>
                  </header>

                  {selectedRecipe.instructions_markdown && (
                    <section>
                      <h4 className="text-white text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <BookOpen size={14} className="text-orange-500" /> Preparation & Logic
                      </h4>
                      <div className="text-slate-400 leading-relaxed whitespace-pre-wrap font-serif text-lg">
                        {selectedRecipe.instructions_markdown}
                      </div>
                    </section>
                  )}

                  <footer className="pt-10 border-t border-white/5 flex flex-wrap gap-6">
                    {selectedRecipe.source_url && (
                      <a 
                        href={selectedRecipe.source_url} 
                        target="_blank" 
                        className="inline-flex items-center gap-2 text-white bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                      >
                        <Instagram size={14} /> View Source Original
                      </a>
                    )}
                    <button className="inline-flex items-center gap-2 text-slate-500 hover:text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all">
                      <TagIcon size={14} /> Edit Metadata
                    </button>
                  </footer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}