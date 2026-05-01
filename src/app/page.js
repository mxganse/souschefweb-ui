"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Play, ChefHat, Search } from 'lucide-react';

// --- INITIALIZATION ---
// We guard these variables so the build doesn't fail during static generation.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only create the client if both keys are present.
const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export default function SousChefDashboard() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchVideos() {
      // If keys were missing during build, we stop here and show a log.
      if (!supabase) {
        console.warn("Supabase client not initialized. Check environment variables.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setVideos(data || []);
      } catch (err) {
        console.error("Error fetching culinary videos:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  // Filter videos based on search input
  const filteredVideos = videos.filter(video => 
    video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.technique?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      {/* --- HEADER --- */}
      <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 text-orange-500">
            <ChefHat size={40} strokeWidth={2.5} />
            Sous Chef Web
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            West Chester’s Culinary Knowledge Base
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search techniques or creators..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-white"
          />
        </div>
      </header>

      {/* --- VIDEO GRID --- */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          // Skeleton Loading State
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse" />
          ))
        ) : filteredVideos.length > 0 ? (
          filteredVideos.map((video) => (
            <div 
              key={video.id} 
              className="group bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-orange-500/40 transition-all hover:shadow-2xl hover:shadow-orange-500/5"
            >
              {/* Video Thumbnail Placeholder */}
              <div className="aspect-video bg-slate-800 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                <Play 
                  className="text-white opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 relative z-10" 
                  size={56} 
                  fill="currentColor"
                />
              </div>

              {/* Video Details */}
              <div className="p-5">
                <h3 className="font-bold text-xl group-hover:text-orange-400 transition-colors">
                  {video.title}
                </h3>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-500 px-3 py-1 rounded-lg border border-orange-500/20">
                    {video.technique || 'General'}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-400 px-3 py-1 rounded-lg">
                    {video.creator || 'Chef'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-500 text-xl font-medium">
              No videos found matching "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      <footer className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-900 text-center text-slate-600 text-sm">
        Built for the Square Bar Culinary Team • 2026
      </footer>
    </main>
  );
}