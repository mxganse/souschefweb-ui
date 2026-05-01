"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Standard Lucide imports - Turbopack handles the optimization
import { Play, ChefHat, Search } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SousChefDashboard() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error) setVideos(data || []);
      } catch (err) {
        console.error("Supabase fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <header className="max-w-7xl mx-auto mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-orange-500">
            <ChefHat size={32} /> Sous Chef Web
          </h1>
          <p className="text-slate-400 mt-1">West Chester’s Culinary Knowledge Base</p>
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search techniques..." 
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-900 rounded-xl animate-pulse" />
          ))
        ) : (
          videos.map((video) => (
            <div key={video.id} className="group bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-orange-500/50 transition-all">
              <div className="aspect-video bg-slate-800 relative flex items-center justify-center">
                <Play className="text-white opacity-50 group-hover:opacity-100 transition-opacity" size={48} />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg">{video.title}</h3>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-full border border-orange-500/20">
                    {video.technique}
                  </span>
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">
                    {video.creator}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}