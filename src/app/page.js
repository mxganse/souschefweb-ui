"use client";

export default function Heartbeat() {
  return (
    <div style={{ 
      backgroundColor: 'black', 
      color: '#0f0', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'monospace' 
    }}>
      <h1>[ SYSTEM ONLINE ]</h1>
      <p>Path: /souschefweb</p>
      <p style={{ color: '#444', fontSize: '12px' }}>Next.js + Cloudflare Workers</p>
    </div>
  );
}