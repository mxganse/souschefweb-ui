export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-900 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-orange-500">
          Sous Chef Web: Status Check
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="p-6 border border-slate-700 rounded-xl bg-slate-800">
            <h2 className="text-xl font-semibold mb-2">Build Environment</h2>
            <p className="text-slate-400">If you see this, the Page is rendering.</p>
            <p className="mt-2 text-green-400">✓ Server Component Active</p>
          </div>

          <div className="p-6 border border-slate-700 rounded-xl bg-slate-800">
            <h2 className="text-xl font-semibold mb-2">Routing Check</h2>
            <p className="text-slate-400">Current Path: <span className="text-orange-300">/souschefweb</span></p>
            <p className="mt-2 text-blue-400">✓ BasePath Configured</p>
          </div>
        </div>

        <div className="mt-12 text-center text-slate-500 italic">
          Push your real video logic back once this screen is visible at fig8culinary.com/souschefweb
        </div>
      </div>
    </main>
  );
}