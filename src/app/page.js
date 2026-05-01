"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function TestPage() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function checkDB() {
      try {
        setStatus("Fetching from 'recipes' table...");
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
    <div style={{ padding: '50px' }}>
      <h1 style={{ color: 'orange' }}>System Diagnostic</h1>
      <p><strong>Current Status:</strong> {status}</p>
      {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}
      
      <hr style={{ borderColor: '#333' }} />
      
      <h3>Database Samples:</h3>
      {items.length === 0 ? <p>No records found in table 'recipes'.</p> : (
        <ul>
          {items.map((item, i) => <li key={i}>{item.title}</li>)}
        </ul>
      )}
    </div>
  );
}