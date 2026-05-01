"use client";
import { useEffect, useState } from 'react';

export default function BareDiagnostic() {
  const [browserLog, setBrowserLog] = useState([]);

  const log = (msg) => {
    console.log(msg); // Check F12 for this
    setBrowserLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    log("JavaScript is alive in the browser.");
    log(`URL Check: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "Detected" : "MISSING"}`);
    log(`Key Check: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Detected" : "MISSING"}`);
    log("Diagnostic complete. If you see this, we can add Supabase back.");
  }, []);

  return (
    <div style={{ padding: '50px', background: '#000', color: '#0f0', minHeight: '100vh', fontFamily: 'monospace' }}>
      <h1>System Heartbeat</h1>
      <div style={{ border: '1px solid #333', padding: '20px', background: '#111' }}>
        {browserLog.length === 0 ? (
          <p style={{ color: 'red' }}>NO LOGS RECORDED. JavaScript is failing to execute.</p>
        ) : (
          browserLog.map((line, i) => <div key={i}>{line}</div>)
        )}
      </div>
      
      <p style={{ marginTop: '20px', color: '#555' }}>
        Check the Browser Console (F12) for detailed red error messages.
      </p>
    </div>
  );
}