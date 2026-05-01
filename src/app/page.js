"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Search, 
  Instagram, 
  ChefHat, 
  Clock, 
  Utensils, 
  ExternalLink,
  Flame
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default function CulinaryArchive() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!supabase) return;
      try {
        // Corrected to use your 'recipes' table
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

  return (
    <main className="min-h-screen bg-[#050505] text-slate-200 p-6 md:p-12 font-sans">
      {/* --- PRIVATE HEADER --- */}
      <header className="max-w-6xl mx-auto mb-16 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-lg">
              <ChefHat className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Culinary <span className="text-orange-500">Archive</span>
            </h1>
          </div>
          <div className="hidden md:block text-[10px] uppercase tracking-[0.2em] text-slate-500 border border-slate-800 px-4 py-1.5 rounded-full">
            Private Database • {recipes.length} Entries
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search by recipe, station (e.g. Sauté), or category..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0f0f0f] border border-white/5 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-white placeholder:text-slate-600 shadow-2xl"
          />
        </div>
      </header>

      {/* --- RECIPE CARD GRID --- */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1, 2, 3, 6].map((i) => (
            <div key={i} className="h-80 bg-white/5 rounded-3xl border border-white/5 animate-pulse" />
          ))
        ) : filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => (
            <div 
              key={recipe.id} 
              className="group bg-[#0f0f0f] rounded-3xl border border-white/5 overflow-hidden hover:border-orange-500/30 transition-all duration-500 flex flex-col shadow-lg"
            >
              {/* Card Top: Image / Final Plate URL */}
              <div className="aspect-[4/3] bg-slate-900 relative overflow-hidden">
                {recipe.final_plate_url ? (
                  <img 
                    src={recipe.final_plate_url} 
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-800">
                    <Utensils size={48} />
                  </div>
                )}
                
                {/* Station Badge */}
                {recipe.station && (
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md border border-white/10">
                    {recipe.station}
                  </div>
                )}

                {/* Source Icon (Instagram) */}
                {recipe.source_url?.includes('instagram.com') && (
                  <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/10">
                    <Instagram size={14} className="text-white" />
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-6 flex-grow space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                    {recipe.category || 'General'}
                  </span>
                  <h3 className="text-xl font-bold text-white leading-tight">
                    {recipe.title}
                  </h3>
                </div>

                <div className="flex items-center gap-4 text-slate-500 text-xs">
                  {recipe.prep_time_minutes && (
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{recipe.prep_time_minutes}m</span>
                    </div>
                  )}
                  {recipe.yield_amount && (
                    <div className="flex items-center gap-1">
                      <Flame size={14} />
                      <span>Yield: {recipe.yield_amount} {recipe.yield_unit}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Action */}
              <div className="px-6 pb-6 mt-auto">
                <a 
                  href={recipe.source_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all border border-white/5"
                >
                  View Archive Source <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <p className="text-slate-500 text-lg">No recipes found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </main>
  );
}