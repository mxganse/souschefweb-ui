"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";

export default function TestPage() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function checkDB() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // 1. Check if variables exist before initializing
      if (!url || !key) {
        setError("Environment variables missing. Build succeeded, but runtime keys are not found.");
        setStatus("Configuration Error");
        return;
      }

      try {
        setStatus("Fetching from 'recipes' table...");
        
        // 2. Initialize client ONLY inside the effect
        const supabase = createClient(url, key);

        const { data, error: dbError } = await supabase
          .from('recipes')
          .select('title')
          .limit(5);

        if (dbError) throw dbError;
        
        setItems(data || []);
        setStatus("Connected Successfully");
      } catch (err) {
        setError(err.message);
        setStatus("Connection Failed");
      }
    }
    checkDB();
  }, []);

  return (
    <div style={{ padding: '50px', backgroundColor: '#000', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ color: 'orange' }}>System Diagnostic</h1>
      <p><strong>Current Status:</strong> {status}</p>
      
      {error && (
        <div style={{ border: '1px solid red', padding: '10px', marginTop: '10px', color: '#ff7777' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <hr style={{ borderColor: '#333', margin: '30px 0' }} />
      
      <h3>Database Samples:</h3>
      {items.length === 0 && !error ? <p>No records found (or still loading)...</p> : (
        <ul>
          {items.map((item, i) => <li key={i} style={{ marginBottom: '10px' }}>{item.title}</li>)}
        </ul>
      )}

      <div style={{ marginTop: '50px', fontSize: '12px', color: '#555' }}>
        <p>Debug Info:</p>
        <p>URL Present: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Yes" : "No"}</p>
        <p>Key Present: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Yes" : "No"}</p>
      </div>
    </div>
  );
}