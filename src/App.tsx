import { useEffect, useState } from "react";

const HERO_SNIPPET_RAW = `// One request. Real-time edge data.
GET /v1/odds?sport=nba&markets=moneyline,ev&books=all

// Response — 84ms
{
  "game": "Lakers vs. Celtics",
  "status": "live",
  "moneyline": {
    "draftkings": -108,
    "fanduel":   -112,
    "pinnacle":  -106
  },
  "ev":         +4.7,
  "best_line":  "pinnacle",
  "arbitrage":  true,
  "updated_ms": 84
}`;

const TICKER_ITEMS = [
  { label: "LAL/BOS · ML −108", trend: "up", arrow: "↑" },
  { label: "KC/PHI · Spread −3.5", trend: "up", arrow: "↑" },
  { label: "NYY/BOS · ML −122", trend: "down", arrow: "↓" },
  { label: "GSW/MIA · EV +5.2", trend: "up", arrow: "↑" },
  { label: "POLYMARKET · Chiefs SB 67.4%", trend: "up", arrow: "↑" },
  { label: "NFL · Arb +2.1% DK/FD", trend: "up", arrow: "↑" },
  { label: "LAC/PHX · Total 224.5", trend: "flat", arrow: "→" },
  { label: "KALSHI · Fed Rate Cut 42%", trend: "down", arrow: "↓" },
] as const;

const SPORTSBOOK_SOURCES = [
  "DraftKings",
  "FanDuel",
  "BetMGM",
  "Pinnacle",
  "Caesars",
  "PointsBet",
  "Kalshi",
  "Polymarket",
  "WynnBET",
  "BetRivers",
  "+90 more",
] as const;

function App() {
  const [slashVisible, setSlashVisible] = useState(true);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlashVisible((v) => !v);
    }, 550);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const copySnippet = async () => {
    await navigator.clipboard.writeText(HERO_SNIPPET_RAW);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#f5f2eb] text-[#1a1a1a]">
      {/* Navigation */}
      <nav className="relative z-20 max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <a href="/" className="flex items-center gap-0 font-bold text-[#1a1a1a] tracking-tight text-lg sm:text-xl no-underline">
          <span>Money</span>
          <span
            className={`inline-block min-w-[0.5em] transition-opacity duration-150 ${
              slashVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            \
          </span>
          <span>Line</span>
        </a>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#1a1a1a]">
          <a href="#" className="hover:opacity-70 transition-opacity">
            API
          </a>
          <a href="#" className="hover:opacity-70 transition-opacity">
            Docs
          </a>
          <a href="#" className="hover:opacity-70 transition-opacity">
            Pricing
          </a>
          <button className="group rounded-full bg-[#1a1a1a] text-white px-4 py-2 text-sm font-medium cursor-pointer border-2 border-transparent transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-[#e8ff47]/25 hover:border-[#e8ff47]/70 hover:text-[#1a1a1a]">
            Try API
            <span className="ml-1.5 inline-block transition-transform duration-200 ease-out group-hover:translate-x-[3px]" aria-hidden>→</span>
          </button>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero: big text on off-white */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 lg:pt-20 lg:pb-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-end">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1a1a1a] leading-[1.1]">
              Sports betting data that puts <span className="underline decoration-2 underline-offset-2">edges</span> at the frontier.
            </h1>
            <div>
              <p className="text-lg text-[#4a4a4a] leading-relaxed lg:pb-1">
                MoneyLine Sportsdata delivers normalized odds, props, EV and arbitrage signals, and prediction market feeds in one API—for quants, traders, and product teams.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
                <a href="/get-started" className="inline-flex items-center justify-center rounded-full bg-[#1a1a1a] text-white px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity no-underline">
                  Get API Key
                </a>
                <a href="/docs" className="inline-flex items-center justify-center rounded-full border-2 border-[#1a1a1a] text-[#1a1a1a] bg-transparent px-5 py-2.5 text-sm font-medium hover:bg-[#1a1a1a]/5 transition-colors no-underline">
                  Explore Docs
                </a>
              </div>
              <p className="mt-4 text-xs text-[#4a4a4a]/90">
                Trusted by quant funds, DFS operators, and trading teams.
              </p>
              {/* API code snippet */}
              <div className="mt-8 relative rounded-xl bg-[#0f0f0f] border border-[#222] shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
                <button
                  type="button"
                  onClick={copySnippet}
                  className="absolute top-3 right-3 p-1.5 rounded-md text-[#555] hover:text-[#888] hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Copy code"
                >
                  {copied ? (
                    <span className="text-xs font-medium text-[#86efac]">Copied</span>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <pre className="p-4 pr-12 pt-10 text-[13px] leading-relaxed font-mono overflow-x-auto" style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace" }}>
                  <code>
                    <span className="text-[#555]">// One request. Real-time edge data.</span>{"\n"}
                    <span className="text-[#7dd3fc]">GET</span> <span className="text-[#86efac]">/v1/odds?sport=nba&amp;markets=moneyline,ev&amp;books=all</span>{"\n\n"}
                    <span className="text-[#555]">// Response — 84ms</span>{"\n"}
                    <span className="text-[#888]">{"{"}</span>{"\n"}
                    <span className="text-[#7dd3fc]">  &quot;game&quot;</span><span className="text-[#888]">: </span><span className="text-[#86efac]">&quot;Lakers vs. Celtics&quot;</span><span className="text-[#888]">,</span>{"\n"}
                    <span className="text-[#7dd3fc]">  &quot;status&quot;</span><span className="text-[#888]">: </span><span className="text-[#86efac]">&quot;live&quot;</span><span className="text-[#888]">,</span>{"\n"}
                    <span className="text-[#7dd3fc]">  &quot;moneyline&quot;</span><span className="text-[#888]">: </span><span className="text-[#888]">{"{"}</span>{"\n"}
                    <span className="text-[#7dd3fc]">    &quot;draftkings&quot;</span><span className="text-[#888]">: </span><span className="text-[#fbbf24]">-108</span><span className="text-[#888]">,</span>{"\n"}
                    <span className="text-[#7dd3fc]">    &quot;fanduel&quot;</span><span className="text-[#888]">:   </span><span className="text-[#fbbf24]">-112</span><span className="text-[#888]">,</span>{"\n"}
                    <span className="text-[#7dd3fc]">    &quot;pinnacle&quot;</span><span className="text-[#888]">:  </span><span className="text-[#fbbf24]">-106</span>{"\n"}
                    <span className="text-[#888]">  {"}"}</span><span className="text-[#888]">,</span>{"\n"}
                    <span className="text-[#7dd3fc]">  &quot;ev&quot;</span><span className="text-[#888]">:         </span><span className="text-[#fbbf24]">+4.7</span><span className="text-[#888]">,</span>{"\n"}
                    <span className="text-[#7dd3fc]">  &quot;best_line&quot;</span><span className="text-[#888]">:  </span><span className="text-[#86efac]">&quot;pinnacle&quot;</span><span className="text-[#888]">,</span>{"\n"}
                    <span className="text-[#7dd3fc]">  &quot;arbitrage&quot;</span><span className="text-[#888]">:  </span><span className="text-[#fbbf24]">true</span><span className="text-[#888]">,</span>{"\n"}
                    <span className="text-[#7dd3fc]">  &quot;updated_ms&quot;</span><span className="text-[#888]">: </span><span className="text-[#fbbf24]">84</span>{"\n"}
                    <span className="text-[#888]">{"}"}</span>
                    <span className={`inline-block w-2 align-bottom ${cursorVisible ? "opacity-100" : "opacity-0"} transition-opacity duration-100`} style={{ color: "#86efac" }}>|</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Odds ticker */}
        <div className="odds-ticker border-y border-[#dedcd5]">
          <div className="odds-ticker-track px-6 py-3 text-[12px] sm:text-[13px] text-[#111827]">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => {
              const arrowColor =
                item.trend === "up"
                  ? "text-[#16a34a]"
                  : item.trend === "down"
                  ? "text-[#dc2626]"
                  : "text-[#6b7280]";
              return (
                <div key={index} className="flex items-center">
                  <span className="font-mono whitespace-nowrap">{item.label}</span>
                  <span className={`ml-1 font-mono ${arrowColor}`}>{item.arrow}</span>
                  <span className="mx-4 text-[#9ca3af]">•</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Off-black content section */}
        <section className="bg-[#1a1a1a] text-white">
          <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
            <p className="text-xs font-medium tracking-widest uppercase text-white/70 mb-6">
              Featured
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl">
              One API. Every book. Every edge.
            </h2>
            <p className="mt-6 text-lg text-white/80 max-w-xl">
              Real-time odds and props from 100+ sportsbooks and fantasy operators. EV and arbitrage across books and prediction markets like Kalshi and Polymarket.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button className="rounded-full bg-white text-[#1a1a1a] px-5 py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer border-0">
                Get API key
              </button>
              <a href="#" className="rounded-full border border-white/30 text-white px-5 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors inline-block">
                Explore docs
              </a>
            </div>
            <div className="mt-10 pt-6 border-t border-[#1e1e1e]">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#555] text-center mb-3">
                DATA SOURCED FROM
              </p>
              <div className="sportsbook-strip">
                <div className="sportsbook-track px-6 py-2 text-[13px] text-[#666]">
                  {[...SPORTSBOOK_SOURCES, ...SPORTSBOOK_SOURCES].map((name, index) => (
                    <div key={index} className="flex items-center">
                      <span className="sportsbook-name font-semibold whitespace-nowrap">{name}</span>
                      <span className="mx-4 text-[#444]">·</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Second off-white section with big text */}
        <section className="max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1a1a1a] leading-[1.1] max-w-3xl">
            Built for the way you work.
          </h2>
          <p className="mt-6 text-lg text-[#4a4a4a] max-w-xl">
            Normalized markets, live scores, and sub-second latency. No scraping—just one coherent API.
          </p>
        </section>

        {/* Second off-black content section */}
        <section className="bg-[#1a1a1a] text-white">
          <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
            <p className="text-xs font-medium tracking-widest uppercase text-white/70 mb-6">
              Coverage
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl">
              Props, futures, and live. Every sport.
            </h2>
            <div className="mt-10 grid sm:grid-cols-3 gap-6">
              {[
                { label: "Sportsbooks", value: "100+" },
                { label: "Markets", value: "Props · Futures · Live" },
                { label: "Prediction", value: "Kalshi · Polymarket" },
              ].map((item, i) => (
                <div key={i} className="border border-white/10 rounded-xl p-5">
                  <div className="text-xs uppercase tracking-wide text-white/60">{item.label}</div>
                  <div className="mt-2 text-lg font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
