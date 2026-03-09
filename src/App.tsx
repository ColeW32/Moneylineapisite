import { useEffect, useState } from "react";

function App() {
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 550);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,_#1f293750,_transparent_55%),radial-gradient(circle_at_bottom,_#0f766e25,_transparent_55%),#050816] text-white">
      {/* Subtle grid overlay */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#4b5563_1px,transparent_1px),linear-gradient(to_bottom,#4b5563_1px,transparent_1px)] [background-size:64px_64px]" />

      {/* Navigation / Header */}
      <nav className="relative z-20 max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="text-lg font-mono font-semibold tracking-tight">
              <span>M</span>
              <span
                className={`inline-block w-3 ${
                  cursorVisible ? "opacity-100" : "opacity-0"
                } transition-opacity duration-150`}
              >
                _
              </span>
            </div>
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-medium text-slate-100">
              MoneyLine Sportsdata
            </span>
            <span className="text-xs text-slate-400">
              Sports betting & prediction markets API
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-7 text-sm text-slate-300">
          <a href="#" className="hover:text-white transition-colors">
            API
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Docs
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Pricing
          </a>
          <button className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-50 hover:bg-white/10 transition-colors cursor-pointer">
            Sign in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 lg:pt-28 lg:pb-28 grid lg:grid-cols-[minmax(0,_1.3fr)_minmax(0,_1fr)] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/5 px-3 py-1 text-xs font-medium text-emerald-300 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live odds · 100+ books tracked
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold tracking-tight text-slate-50">
              Sports betting data,
              <br />
              <span className="text-slate-200">as clean as your model.</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-400 max-w-xl">
              MoneyLine Sportsdata gives you normalized odds, props, EV and
              arbitrage signals, and prediction market feeds in one coherent
              API—built for quants, traders, and product teams.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
              <button className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-emerald-300 transition-colors cursor-pointer">
                Get API key
              </button>
              <button className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/0 px-5 py-2.5 text-sm font-medium text-slate-100 hover:bg-white/5 transition-colors cursor-pointer">
                Explore docs
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>All major US sports + soccer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                <span>Props, futures, live & pre-game</span>
              </div>
            </div>
          </div>

          {/* Right column: API-ish preview card */}
          <div className="lg:justify-self-end w-full max-w-md mx-auto">
            <div className="rounded-2xl border border-white/8 bg-slate-900/40 p-4 sm:p-5 shadow-[0_18px_45px_rgba(0,0,0,0.6)] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>GET</span>
                  <span className="font-mono text-[11px] text-slate-300">
                    /v1/ev-bets
                  </span>
                </div>
                <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                  &lt;5 ms p95
                </span>
              </div>

              <div className="rounded-xl bg-slate-950/60 border border-white/5 px-3 py-3 font-mono text-[11px] leading-relaxed text-slate-300">
                <div className="text-slate-500 mb-1">// EV & arbitrage snapshot</div>
                <pre className="whitespace-pre-wrap break-words">
{`{
  "sport": "NBA",
  "market": "player_points",
  "edges": [
    { "type": "EV", "edge": 4.2, "books": ["DK", "FD"] },
    { "type": "ARB", "edge": 1.1, "books": ["MGM", "365"] }
  ]
}`}
                </pre>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="rounded-xl border border-white/7 bg-slate-900/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    Books
                  </div>
                  <div className="mt-1 text-sm font-semibold">100+</div>
                </div>
                <div className="rounded-xl border border-white/7 bg-slate-900/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    Markets
                  </div>
                  <div className="mt-1 text-sm font-semibold">
                    Props · Futures
                  </div>
                </div>
                <div className="rounded-xl border border-white/7 bg-slate-900/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    Feeds
                  </div>
                  <div className="mt-1 text-sm font-semibold">
                    Kalshi · Poly
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
