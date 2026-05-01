"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";

export default function DiagnosticPage() {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

  useEffect(() => {
    async function runDiagnostic() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      addLog("Starting diagnostic...");
      
      if (!url || !key) {
        setError("Keys missing in browser environment.");
        return;
      }

      try {
        addLog("Initializing Supabase client...");
        const supabase = createClient(url, key);

        addLog("Attempting to select from 'recipes' table...");
        const { data, error: dbError } = await supabase
          .from('recipes')
          .select('*') // Changed to * to see everything
          .limit(3);

        if (dbError) {
          addLog(`Database Error: ${dbError.message}`);
          throw dbError;
        }

        addLog(`Success! Found ${data?.length || 0} rows.`);
        setItems(data || []);
      } catch (err) {
        addLog(`Caught Exception: ${err.message}`);
        setError(err.message);
      }
    }
    runDiagnostic();
  }, []);

  return (
    <div style={{ padding: '40px', backgroundColor: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'monospace' }}>
      <h1 style={{ color: '#f97316', borderBottom: '1px solid #333', paddingBottom: '10px' }}>System Audit</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        
        {/* LEFT COLUMN: LOGS */}
        <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: '1px solid #222' }}>
          <h3 style={{ marginTop: 0, color: '#666' }}>Process Logs</h3>
          <div style={{ fontSize: '13px', color: '#888' }}>
            {logs.map((log, i) => <div key={i} style={{ marginBottom: '5px' }}>{log}</div>)}
          </div>
          {error && (
            <div style={{ marginTop: '20px', padding: '10px', background: '#450a0a', color: '#f87171', borderRadius: '5px', fontSize: '12px' }}>
              <strong>CRITICAL ERROR:</strong> {error}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DATA SAMPLES */}
        <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: '1px solid #222' }}>
          <h3 style={{ marginTop: 0, color: '#666' }}>Data Sample (First 3)</h3>
          {items.length > 0 ? (
            <pre style={{ fontSize: '11px', color: '#4ade80', overflow: 'auto' }}>
              {JSON.stringify(items, null, 2)}
            </pre>
          ) : (
            <p style={{ color: '#444' }}>No data to display.</p>
          )}
        </div>
      </div>

      <div style={{ marginTop: '40px', fontSize: '11px', color: '#333' }}>
        <p>Environment: Cloudflare Worker / Next.js</p>
        <p>Target Table: recipes</p>
      </div>
    </div>
  );
}