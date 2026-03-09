import { useEffect, useRef, useState } from "react";

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

const STATS = {
  latency: { end: 84, suffix: "ms", label: "Average Latency", decimals: 0 },
  books: { end: 100, suffix: "+", label: "Books Normalized", decimals: 0 },
  uptime: { end: 99.9, suffix: "%", label: "Uptime SLA", decimals: 1 },
} as const;

const STAT_DURATION_MS = 1500;
const STAT_STAGGER_MS = 150;
const EASE_OUT_CUBIC = (t: number) => 1 - Math.pow(1 - t, 3);

const FEATURE_TILES = [
  { title: "Sub-100ms Updates", icon: "⚡", body: "Line moves delivered before most APIs finish polling." },
  { title: "Normalized Schema", icon: "🔄", body: "One consistent format across 100+ books. No custom parsers." },
  { title: "WebSocket + REST", icon: "📡", body: "Stream live updates via WebSocket or poll on your schedule." },
  { title: "EV Pre-computed", icon: "🧮", body: "Expected value and no-vig probability included in every response." },
  { title: "All Market Types", icon: "🏆", body: "Moneyline, spreads, totals, props, futures, and live in-play." },
  { title: "Prediction Markets", icon: "🔮", body: "Kalshi and Polymarket feeds alongside sportsbook odds." },
] as const;

const API_ENDPOINTS = [
  { method: "GET", path: "/v1/odds/{sport}", desc: "Live odds across all books" },
  { method: "GET", path: "/v1/ev/{sport}", desc: "Pre-computed EV by market" },
  { method: "GET", path: "/v1/arbitrage", desc: "Live arb opportunities" },
  { method: "GET", path: "/v1/props/{sport}", desc: "Player props across books" },
  { method: "GET", path: "/v1/scores/{sport}", desc: "Live scores and results" },
  { method: "WSS", path: "/v1/stream", desc: "Real-time line movement feed" },
  { method: "GET", path: "/v1/prediction", desc: "Kalshi + Polymarket feeds" },
] as const;

const LIVE_SAMPLE_RAW = `{
  "game_id":    "nba_lal_bos_20260309",
  "sport":      "nba",
  "status":     "live",
  "quarter":    3,
  "time":       "8:42",
  "moneyline": {
    "draftkings": -108,
    "fanduel":    -112,
    "betmgm":     -110,
    "pinnacle":   -106
  },
  "best_line":  "pinnacle",
  "ev":         +4.7,
  "arbitrage":  false,
  "updated_ms": 84
}`;

const INTEGRATION_SNIPPETS = {
  python: `import moneyline

client = moneyline.Client("YOUR_API_KEY")
odds = client.odds.get(sport="nba", markets=["moneyline", "ev"])

print(odds[0].ev)  # → +4.7`,
  javascript: `import MoneyLine from '@moneyline/sdk';

const client = new MoneyLine({ apiKey: 'YOUR_API_KEY' });
const odds = await client.odds.get({ sport: 'nba', markets: ['moneyline', 'ev'] });

console.log(odds[0].ev); // → +4.7`,
  curl: `curl https://api.moneyline.io/v1/odds \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -G \\
  --data-urlencode "sport=nba" \\
  --data-urlencode "markets=moneyline,ev"`,
} as const;

const INTEGRATION_RESPONSE_JSON = `{
  "game_id": "nba_lal_bos_20260309",
  "moneyline": { "draftkings": -108, "fanduel": -112 },
  "ev": 4.7,
  "updated_ms": 84
}`;

function App() {
  const [slashVisible, setSlashVisible] = useState(true);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedLiveSample, setCopiedLiveSample] = useState(false);
  const [integrateTab, setIntegrateTab] = useState<"python" | "javascript" | "curl">("python");
  const [responseExpanded, setResponseExpanded] = useState(false);
  const [copiedIntegrate, setCopiedIntegrate] = useState(false);
  const [stat1, setStat1] = useState(0);
  const [stat2, setStat2] = useState(0);
  const [stat3, setStat3] = useState(0);
  const statsSectionRef = useRef<HTMLElement>(null);
  const statsAnimatedRef = useRef(false);

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

  const copyLiveSample = async () => {
    await navigator.clipboard.writeText(LIVE_SAMPLE_RAW);
    setCopiedLiveSample(true);
    setTimeout(() => setCopiedLiveSample(false), 2000);
  };

  const copyIntegrate = async () => {
    await navigator.clipboard.writeText(INTEGRATION_SNIPPETS[integrateTab]);
    setCopiedIntegrate(true);
    setTimeout(() => setCopiedIntegrate(false), 2000);
  };

  useEffect(() => {
    const el = statsSectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || statsAnimatedRef.current) return;
        statsAnimatedRef.current = true;
        const start = performance.now();
        const run = (now: number) => {
          const t1 = Math.min(1, (now - start) / STAT_DURATION_MS);
          const t2 = Math.min(1, (now - start - STAT_STAGGER_MS) / STAT_DURATION_MS);
          const t3 = Math.min(1, (now - start - STAT_STAGGER_MS * 2) / STAT_DURATION_MS);
          setStat1(Math.round(STATS.latency.end * EASE_OUT_CUBIC(t1)));
          setStat2(Math.round(STATS.books.end * EASE_OUT_CUBIC(t2)));
          setStat3(+(STATS.uptime.end * EASE_OUT_CUBIC(t3)).toFixed(1));
          if (t1 < 1 || t2 < 1 || t3 < 1) requestAnimationFrame(run);
        };
        requestAnimationFrame(run);
      },
      { threshold: 0.2, rootMargin: "0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
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

            <div className="mt-10">
              <p className="text-[10px] font-medium tracking-widest uppercase text-white/70 mb-4">
                WHO IT&apos;S FOR
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-[10px] border border-[#2a2a2a] bg-[#1a1a1a] p-5 transition-all duration-200 hover:border-[#444] hover:-translate-y-0.5">
                  <svg className="mb-3 h-6 w-6 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="mb-1.5 text-base font-bold text-white">Quants &amp; Modelers</h3>
                  <p className="text-sm text-[#888] leading-relaxed" style={{ lineHeight: 1.6 }}>
                    Normalized historical and live data ready for model ingestion. Consistent schema across every book. No cleaning required.
                  </p>
                </div>
                <div className="rounded-[10px] border border-[#2a2a2a] bg-[#1a1a1a] p-5 transition-all duration-200 hover:border-[#444] hover:-translate-y-0.5">
                  <svg className="mb-3 h-6 w-6 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="mb-1.5 text-base font-bold text-white">Traders &amp; Arbers</h3>
                  <p className="text-sm text-[#888] leading-relaxed" style={{ lineHeight: 1.6 }}>
                    Sub-100ms line updates. Pre-computed EV and arbitrage signals delivered before the market moves.
                  </p>
                </div>
                <div className="rounded-[10px] border border-[#2a2a2a] bg-[#1a1a1a] p-5 transition-all duration-200 hover:border-[#444] hover:-translate-y-0.5">
                  <svg className="mb-3 h-6 w-6 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <h3 className="mb-1.5 text-base font-bold text-white">Product Teams</h3>
                  <p className="text-sm text-[#888] leading-relaxed" style={{ lineHeight: 1.6 }}>
                    One integration. Power odds comparison tools, props widgets, and prediction market feeds inside your app.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Second off-white section with big text + stat counters */}
        <section ref={statsSectionRef} className="bg-[#f5f4f0]">
          <div className="max-w-6xl mx-auto px-6 py-[60px]">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1a1a1a] leading-[1.1] max-w-3xl">
              Built for the way you work.
            </h2>
            <p className="mt-6 text-lg text-[#4a4a4a] max-w-xl">
              Normalized markets, live scores, and sub-second latency. No scraping—just one coherent API.
            </p>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 sm:divide-x sm:divide-y-0 divide-y divide-[#ddd]">
              <div className="pt-12 sm:pt-0 flex flex-col items-center text-center px-4">
                <div className="text-[56px] sm:text-[60px] font-extrabold text-[#1a1a1a] tabular-nums leading-none">
                  {stat1}<span className="text-[56px] sm:text-[60px] font-extrabold text-[#1a1a1a]">ms</span>
                </div>
                <p className="mt-1.5 text-[13px] text-[#888] uppercase tracking-[0.1em]">Average Latency</p>
              </div>
              <div className="pt-6 sm:pt-0 flex flex-col items-center text-center px-4 sm:border-l border-[#ddd]">
                <div className="text-[56px] sm:text-[60px] font-extrabold text-[#1a1a1a] tabular-nums leading-none">
                  {stat2}<span className="text-[56px] sm:text-[60px] font-extrabold text-[#1a1a1a]">+</span>
                </div>
                <p className="mt-1.5 text-[13px] text-[#888] uppercase tracking-[0.1em]">Books Normalized</p>
              </div>
              <div className="pt-6 sm:pt-0 flex flex-col items-center text-center px-4 sm:border-l border-[#ddd]">
                <div className="text-[56px] sm:text-[60px] font-extrabold text-[#1a1a1a] tabular-nums leading-none">
                  {stat3.toFixed(1)}<span className="text-[56px] sm:text-[60px] font-extrabold text-[#1a1a1a]">%</span>
                </div>
                <p className="mt-1.5 text-[13px] text-[#888] uppercase tracking-[0.1em]">Uptime SLA</p>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURE_TILES.map((tile, i) => (
                <div
                  key={i}
                  className="rounded-[10px] border border-[#e8e8e4] bg-white p-6 transition-[border-color,box-shadow] duration-200 hover:border-[#1a1a1a] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
                >
                  <span className="mb-2.5 block text-[20px] leading-none" aria-hidden>{tile.icon}</span>
                  <h3 className="mb-1 text-[15px] font-bold text-[#1a1a1a]">{tile.title}</h3>
                  <p className="text-[14px] text-[#777] leading-relaxed" style={{ lineHeight: 1.55 }}>{tile.body}</p>
                </div>
              ))}
            </div>

            <h3 className="mt-12 mb-4 text-xl font-bold text-[#1a1a1a]">The API, at a glance.</h3>
            <div className="rounded-xl border border-[#222] bg-[#111] py-2">
              {API_ENDPOINTS.map((ep, i) => (
                <div
                  key={i}
                  className={`group flex h-12 items-center px-5 transition-colors ${i % 2 === 1 ? "bg-[#141414]" : "bg-transparent"} hover:!bg-[#1a1a1a]`}
                >
                  <span
                    className={`rounded px-2 py-[3px] font-mono text-[11px] font-bold ${
                      ep.method === "WSS"
                        ? "bg-[#1a1a2e] text-[#93c5fd]"
                        : "bg-[#1a2e1a] text-[#86efac]"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="ml-3 font-mono text-[13px] text-[#ccc]">{ep.path}</span>
                  <span className="ml-auto text-[13px] text-[#555] transition-colors group-hover:text-[#888]">{ep.desc}</span>
                </div>
              ))}
              <div className="mt-2 px-5 pb-1 text-right">
                <a href="/docs" className="text-[13px] text-[#b5c400] no-underline hover:underline">View full API reference →</a>
              </div>
            </div>
          </div>
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
              {/* Card 1: Sportsbooks */}
              <div className="min-h-[220px] border border-white/10 rounded-xl px-5 pt-5 pb-6">
                <div className="text-xs uppercase tracking-wide text-white/60">Sportsbooks</div>
                <div className="mt-2 text-lg font-semibold">100+</div>
                <p className="mt-4 text-[12px] text-[#9ca3af]" style={{ lineHeight: 1.8 }}>
                  DraftKings · FanDuel · BetMGM · Pinnacle · Caesars · PointsBet · BetRivers · WynnBET · Unibet · Hard Rock ·{" "}
                  <span className="text-[#d4dd7a]">+90 more</span>
                </p>
              </div>

              {/* Card 2: Markets */}
              <div className="min-h-[220px] border border-white/10 rounded-xl px-5 pt-5 pb-6">
                <div className="text-xs uppercase tracking-wide text-white/60">Markets</div>
                <div className="mt-2 text-lg font-semibold">Props · Futures · Live</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "Moneyline",
                    "Spread",
                    "Total",
                    "Player Props",
                    "Team Props",
                    "Futures",
                    "Live In-Play",
                    "Alternate Lines",
                    "Game Props",
                    "Parlays",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#2a2a2a] bg-[#1e1e1e] px-2.5 py-1 text-[11px] text-[#777]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card 3: Prediction */}
              <div className="min-h-[220px] border border-white/10 rounded-xl px-5 pt-5 pb-6">
                <div className="text-xs uppercase tracking-wide text-white/60">Prediction</div>
                <div className="mt-2 text-lg font-semibold">Kalshi · Polymarket</div>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-[13px] text-[#888] mb-1.5">Chiefs win Super Bowl: 67.4%</p>
                    <div className="h-1 bg-[#2a2a2a] rounded">
                      <div className="h-1 w-[67.4%] rounded bg-[#e8ff47]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] text-[#888] mb-1.5">Fed rate cut by June: 42.1%</p>
                    <div className="h-1 bg-[#2a2a2a] rounded">
                      <div className="h-1 w-[42.1%] rounded bg-[#e8ff47]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-10 text-[10px] font-medium tracking-widest uppercase text-[#555] mb-3">
              SPORTS COVERED
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2.5">
              {[
                { icon: "🏈", label: "NFL" },
                { icon: "🏀", label: "NBA" },
                { icon: "⚾", label: "MLB" },
                { icon: "🏒", label: "NHL" },
                { icon: "🏈", label: "NCAAF" },
                { icon: "🏀", label: "NCAAB" },
                { icon: "⚽", label: "Soccer" },
                { icon: "🎾", label: "Tennis" },
                { icon: "⛳", label: "Golf" },
                { icon: "🥊", label: "MMA" },
                { icon: "🏇", label: "Horse Racing" },
                { icon: "🎮", label: "Esports" },
              ].map((sport) => (
                <span
                  key={sport.label}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3.5 py-2 text-[13px] text-[#777] transition-colors hover:border-[#444] hover:text-[#aaa]"
                >
                  <span className="text-base leading-none" style={{ fontSize: "16px" }} aria-hidden>{sport.icon}</span>
                  {sport.label}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[12px] italic text-[#444]">+ More leagues added quarterly</p>

            <p className="mt-10 text-[10px] font-medium tracking-widest uppercase text-[#555] mb-3">
              SAMPLE RESPONSE — LIVE GAME
            </p>
            <div className="relative rounded-xl border border-[#222] bg-[#0f0f0f] overflow-hidden">
              <button
                type="button"
                onClick={copyLiveSample}
                className="absolute top-3 left-3 z-10 p-1.5 rounded-md text-[#555] hover:text-[#888] hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Copy code"
              >
                {copiedLiveSample ? (
                  <span className="text-xs font-medium text-[#86efac]">Copied</span>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">LIVE</span>
              </div>
              <pre className="p-4 pt-10 pr-24 pb-4 text-[13px] leading-relaxed font-mono overflow-x-auto" style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace" }}>
                <code>
                  <span className="text-[#888]">{"{"}</span>{"\n"}
                  <span className="text-[#7dd3fc]">  &quot;game_id&quot;</span><span className="text-[#888]">:    </span><span className="text-[#86efac]">&quot;nba_lal_bos_20260309&quot;</span><span className="text-[#888]">,</span>{"\n"}
                  <span className="text-[#7dd3fc]">  &quot;sport&quot;</span><span className="text-[#888]">:      </span><span className="text-[#86efac]">&quot;nba&quot;</span><span className="text-[#888]">,</span>{"\n"}
                  <span className="text-[#7dd3fc]">  &quot;status&quot;</span><span className="text-[#888]">:     </span><span className="text-[#86efac]">&quot;live&quot;</span><span className="text-[#888]">,</span>{"\n"}
                  <span className="text-[#7dd3fc]">  &quot;quarter&quot;</span><span className="text-[#888]">:    </span><span className="text-[#fbbf24]">3</span><span className="text-[#888]">,</span>{"\n"}
                  <span className="text-[#7dd3fc]">  &quot;time&quot;</span><span className="text-[#888]">:       </span><span className="text-[#86efac]">&quot;8:42&quot;</span><span className="text-[#888]">,</span>{"\n"}
                  <span className="text-[#7dd3fc]">  &quot;moneyline&quot;</span><span className="text-[#888]">: </span><span className="text-[#888]">{"{"}</span>{"\n"}
                  <span className="text-[#7dd3fc]">    &quot;draftkings&quot;</span><span className="text-[#888]">: </span><span className="text-[#fbbf24]">-108</span><span className="text-[#888]">,</span>{"\n"}
                  <span className="text-[#7dd3fc]">    &quot;fanduel&quot;</span><span className="text-[#888]">:    </span><span className="text-[#fbbf24]">-112</span><span className="text-[#888]">,</span>{"\n"}
                  <span className="text-[#7dd3fc]">    &quot;betmgm&quot;</span><span className="text-[#888]">:     </span><span className="text-[#fbbf24]">-110</span><span className="text-[#888]">,</span>{"\n"}
                  <span className="text-[#7dd3fc]">    &quot;pinnacle&quot;</span><span className="text-[#888]">:   </span><span className="text-[#fbbf24]">-106</span>{"\n"}
                  <span className="text-[#888]">  {"}"}</span><span className="text-[#888]">,</span>{"\n"}
                  <span className="text-[#7dd3fc]">  &quot;best_line&quot;</span><span className="text-[#888]">:  </span><span className="text-[#86efac]">&quot;pinnacle&quot;</span><span className="text-[#888]">,</span>{"\n"}
                  <span className="text-[#7dd3fc]">  &quot;ev&quot;</span><span className="text-[#888]">:         </span><span className="text-[#fbbf24]">+4.7</span><span className="text-[#888]">,</span>{"\n"}
                  <span className="text-[#7dd3fc]">  &quot;arbitrage&quot;</span><span className="text-[#888]">:  </span><span className="text-[#fbbf24]">false</span><span className="text-[#888]">,</span>{"\n"}
                  <span className="text-[#7dd3fc]">  &quot;updated_ms&quot;</span><span className="text-[#888]">: </span><span className="text-[#fbbf24]">84</span>{"\n"}
                  <span className="text-[#888]">{"}"}</span>
                  <span className={`inline-block w-2 align-bottom ${cursorVisible ? "opacity-100" : "opacity-0"} transition-opacity duration-100`} style={{ color: "#86efac" }}>|</span>
                </code>
              </pre>
            </div>
            <p className="mt-3 text-center text-[12px] text-[#555]">Updated every 84ms · Normalized schema across all books</p>
          </div>
        </section>

        {/* Integration: Up and running in 5 lines */}
        <section className="bg-[#f5f4f0] py-[100px]">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1a1a1a]">
              Up and running in 5 lines.
            </h2>
            <p className="mt-4 text-lg text-[#4a4a4a] max-w-2xl">
              Your first live odds response in minutes. No scraping. No normalization. Just data.
            </p>

            <div className="mt-10">
              <div className="flex flex-wrap gap-2 mb-0 rounded-t-xl border border-b-0 border-[#222] bg-[#1a1a1a] px-3 pt-3 pb-0">
                {(["python", "javascript", "curl"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setIntegrateTab(tab)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer capitalize ${
                      integrateTab === tab
                        ? "bg-[#333] text-white"
                        : "text-[#888] hover:text-white"
                    }`}
                  >
                    {tab === "curl" ? "cURL" : tab === "javascript" ? "JavaScript" : "Python"}
                  </button>
                ))}
              </div>
              <div className="relative rounded-b-xl border border-[#222] bg-[#0f0f0f] overflow-hidden">
                <button
                  type="button"
                  onClick={copyIntegrate}
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-md text-[#555] hover:text-[#888] hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Copy code"
                >
                  {copiedIntegrate ? (
                    <span className="text-xs font-medium text-[#86efac]">Copied</span>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <pre className="p-4 pr-12 pt-10 text-[13px] leading-relaxed font-mono overflow-x-auto min-h-[140px]" style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace" }}>
                  <code>
                    {integrateTab === "python" && (
                      <>
                        <span className="text-[#7dd3fc]">import</span> moneyline{"\n\n"}
                        client = moneyline.<span className="text-[#7dd3fc]">Client</span>(<span className="text-[#86efac]">&quot;<span className="text-[#fbbf24]">YOUR_API_KEY</span>&quot;</span>){"\n"}
                        odds = client.odds.get(sport=<span className="text-[#86efac]">&quot;nba&quot;</span>, markets=[<span className="text-[#86efac]">&quot;moneyline&quot;</span>, <span className="text-[#86efac]">&quot;ev&quot;</span>]){"\n\n"}
                        <span className="text-[#7dd3fc]">print</span>(odds[<span className="text-[#fbbf24]">0</span>].ev)  <span className="text-[#555]"># → +4.7</span>
                      </>
                    )}
                    {integrateTab === "javascript" && (
                      <>
                        <span className="text-[#7dd3fc]">import</span> MoneyLine <span className="text-[#7dd3fc]">from</span> <span className="text-[#86efac]">&apos;@moneyline/sdk&apos;</span>;{"\n\n"}
                        <span className="text-[#7dd3fc]">const</span> client = <span className="text-[#7dd3fc]">new</span> MoneyLine(&#123; apiKey: <span className="text-[#86efac]">&apos;<span className="text-[#fbbf24]">YOUR_API_KEY</span>&apos;</span> &#125;);{"\n"}
                        <span className="text-[#7dd3fc]">const</span> odds = <span className="text-[#7dd3fc]">await</span> client.odds.get(&#123; sport: <span className="text-[#86efac]">&apos;nba&apos;</span>, markets: [<span className="text-[#86efac]">&apos;moneyline&apos;</span>, <span className="text-[#86efac]">&apos;ev&apos;</span>] &#125;);{"\n\n"}
                        console.log(odds[<span className="text-[#fbbf24]">0</span>].ev); <span className="text-[#555]">// → +4.7</span>
                      </>
                    )}
                    {integrateTab === "curl" && (
                      <>
                        curl <span className="text-[#86efac]">https://api.moneyline.io/v1/odds</span>{"\n"}
                        {"  "}-H <span className="text-[#86efac]">&quot;Authorization: Bearer <span className="text-[#fbbf24]">YOUR_API_KEY</span>&quot;</span>{"\n"}
                        {"  "}-G{"\n"}
                        {"  "}--data-urlencode <span className="text-[#86efac]">&quot;sport=nba&quot;</span>{"\n"}
                        {"  "}--data-urlencode <span className="text-[#86efac]">&quot;markets=moneyline,ev&quot;</span>
                      </>
                    )}
                  </code>
                </pre>
              </div>

              <button
                type="button"
                onClick={() => setResponseExpanded((e) => !e)}
                className="mt-2 flex w-full items-center justify-between rounded-lg border border-[#2a2a2a] bg-[#111] px-4 py-3 text-left text-sm text-[#888] transition-colors hover:bg-[#1a1a1a] cursor-pointer"
              >
                <span>{responseExpanded ? "▼" : "→"} Response</span>
              </button>
              {responseExpanded && (
                <div className="mt-2 rounded-xl border border-[#222] bg-[#0f0f0f] p-4 overflow-x-auto">
                  <pre className="font-mono text-[12px] leading-relaxed text-[#ccc]" style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace" }}>
                    <code>
                      <span className="text-[#888]">{"{"}</span>{"\n"}
                      <span className="text-[#7dd3fc]">  &quot;game_id&quot;</span><span className="text-[#888]">: </span><span className="text-[#86efac]">&quot;nba_lal_bos_20260309&quot;</span><span className="text-[#888]">,</span>{"\n"}
                      <span className="text-[#7dd3fc]">  &quot;moneyline&quot;</span><span className="text-[#888]">: </span><span className="text-[#888]">{"{"}</span> <span className="text-[#7dd3fc]">&quot;draftkings&quot;</span><span className="text-[#888]">: </span><span className="text-[#fbbf24]">-108</span><span className="text-[#888]">, </span><span className="text-[#7dd3fc]">&quot;fanduel&quot;</span><span className="text-[#888]">: </span><span className="text-[#fbbf24]">-112</span> <span className="text-[#888]">{"}"}</span><span className="text-[#888]">,</span>{"\n"}
                      <span className="text-[#7dd3fc]">  &quot;ev&quot;</span><span className="text-[#888]">: </span><span className="text-[#fbbf24]">4.7</span><span className="text-[#888]">,</span>{"\n"}
                      <span className="text-[#7dd3fc]">  &quot;updated_ms&quot;</span><span className="text-[#888]">: </span><span className="text-[#fbbf24]">84</span>{"\n"}
                      <span className="text-[#888]">{"}"}</span>
                    </code>
                  </pre>
                </div>
              )}

              <div className="mt-8 flex flex-col items-center text-center">
                <a href="/get-started" className="inline-flex items-center justify-center rounded-full bg-[#1a1a1a] text-white px-6 py-3.5 text-base font-semibold hover:opacity-90 transition-opacity no-underline">
                  Get your free API key →
                </a>
                <p className="mt-4 text-[12px] text-[#666]">
                  No credit card required · Free tier available · Full docs at docs.moneyline.io
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="bg-[#fafafa] py-[100px]">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111827]">
              Simple, transparent pricing.
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[#4b5563] max-w-2xl">
              Start building today. Scale when you're ready.
            </p>

            {/* Hero offer */}
            <div className="mt-8 flex justify-center">
              <div className="inline-flex flex-col items-center text-center gap-2 rounded-full bg-[#e8ff47] px-8 py-4 shadow-sm">
                <span className="text-xl sm:text-2xl font-extrabold text-[#111827]">
                  2 months free.
                </span>
                <span className="text-xs sm:text-sm font-medium text-[#111827]">
                  On any plan. No credit card required to start.
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#6b7280] text-center max-w-xl mx-auto">
              Pick the plan that fits. Your first 2 months are on us on every paid tier — then billing starts automatically.
            </p>

            {/* Tier cards */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Starter */}
              <div className="rounded-[12px] border border-[#e0e0e0] bg-white p-8 flex flex-col h-full">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                  Starter
                </h3>
                <p className="mt-2 text-2xl font-bold text-[#111827]">$0 <span className="text-sm font-normal text-[#6b7280]">/ month</span></p>
                <p className="mt-2 text-sm text-[#6b7280]">
                  For builders and experimenters
                </p>
                <ul className="mt-5 text-[14px] text-[#4b5563]">
                  {[
                    "1,000 requests/day",
                    "10 sportsbooks covered",
                    "REST API access",
                    "Community support",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 leading-7">
                      <span className="mt-[2px] text-[#22c55e]">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col gap-2">
                  <a
                    href="/get-started"
                    className="inline-flex items-center justify-center rounded-full bg-[#111827] text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity no-underline"
                  >
                    Start for free →
                  </a>
                  <p className="text-[12px] text-[#6b7280]">
                    No time limit on the free tier.
                  </p>
                </div>
              </div>

              {/* Pro - highlighted */}
              <div className="relative rounded-[12px] border border-[#1f2937] bg-[#111] text-white p-8 pt-9 flex flex-col h-full shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
                <div className="absolute -top-3 left-6">
                  <span className="rounded-full bg-[#e8ff47] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
                    Most popular
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">
                      Pro
                    </h3>
                    <p className="mt-2 text-3xl font-bold text-white">
                      $99 <span className="text-sm font-normal text-[#9ca3af]">/ month</span>
                    </p>
                    <p className="mt-1 text-[12px] text-[#9ca3af]">
                      After your first 2 free months.
                    </p>
                  </div>
                  <span className="rounded bg-[#e8ff47] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
                    2 months free
                  </span>
                </div>
                <p className="mt-3 text-sm text-[#d1d5db]">
                  For serious quants and traders
                </p>
                <ul className="mt-5 text-[14px] text-[#e5e7eb]">
                  {[
                    "Unlimited requests",
                    "100+ sportsbooks normalized",
                    "WebSocket real-time streaming",
                    "Pre-computed EV + arbitrage signals",
                    "Player props across all books",
                    "Email support",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 leading-7">
                      <span className="mt-[2px] text-[#22c55e]">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col gap-2">
                  <a
                    href="/get-started"
                    className="inline-flex items-center justify-center rounded-full bg-[#e8ff47] text-black px-5 py-2.5 text-sm font-semibold hover:bg-[#d6ec3e] transition-colors no-underline"
                  >
                    Claim 2 free months →
                  </a>
                </div>
              </div>

              {/* Enterprise */}
              <div className="rounded-[12px] border border-[#e0e0e0] bg-white p-8 flex flex-col h-full">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                  Enterprise
                </h3>
                <p className="mt-2 text-2xl font-bold text-[#111827]">
                  Custom
                </p>
                <p className="mt-2 text-sm text-[#6b7280]">
                  For funds, media platforms, and trading firms
                </p>
                <ul className="mt-5 text-[14px] text-[#4b5563]">
                  {[
                    "Everything in Pro",
                    "SLA uptime guarantee",
                    "Dedicated account support",
                    "Custom data feeds",
                    "White-glove onboarding",
                    "2 months free on annual contracts",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 leading-7">
                      <span className="mt-[2px] text-[#22c55e]">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col gap-2">
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full bg-[#111827] text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity no-underline"
                  >
                    Contact us →
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[13px] text-[#888]">
                2 free months applied automatically at signup. Cancel anytime. No hidden fees.
              </p>
              <a
                href="/pricing"
                className="mt-2 inline-block text-[13px] text-[#b5c400] hover:underline"
              >
                See full pricing details →
              </a>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
            <p className="text-xs font-medium tracking-widest uppercase text-[#555] mb-8">
              WHAT DEVELOPERS SAY
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: "We replaced three separate scraping jobs with one MoneyLine API call. Our data pipeline went from a daily maintenance headache to something we never think about.",
                  attribution: "Quant Developer, Sports Trading Fund",
                },
                {
                  quote: "The EV and arbitrage signals are pre-computed and accurate. That's hours of work we're not doing anymore. Worth every dollar.",
                  attribution: "Lead Engineer, DFS Platform",
                },
                {
                  quote: "Finally an API with a normalized schema. I've worked with four other providers and spent more time cleaning data than building models. Not with MoneyLine.",
                  attribution: "Independent Trader & Developer",
                },
              ].map((t, i) => (
                <div key={i} className="rounded-[10px] border border-[#eee] bg-[#f9f9f7] p-7">
                  <span className="block text-[48px] leading-none text-[#ddd] font-serif -mt-2 mb-1" aria-hidden>&ldquo;</span>
                  <p className="text-[15px] text-[#333] leading-relaxed italic" style={{ lineHeight: 1.7 }}>
                    {t.quote}
                  </p>
                  <p className="mt-4 text-[13px] font-semibold text-[#888] not-italic">
                    — {t.attribution}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="bg-[#0f0f0f] py-[120px]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-white leading-[1.1]">
              The sharpest data in sports betting.
            </h2>
            <p className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#e8ff47] leading-[1.1]">
              One API key away.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/get-started" className="inline-flex items-center justify-center rounded-full bg-[#1a1a1a] text-white px-8 py-4 text-lg font-semibold hover:opacity-90 transition-opacity no-underline border border-[#2a2a2a]">
                Get API Key →
              </a>
              <a href="/docs" className="text-[#888] hover:text-white transition-colors no-underline text-base font-medium">
                Read the docs →
              </a>
            </div>
            <p className="mt-8 text-[13px] text-[#555]">
              84ms latency · 100+ books · 99.9% uptime
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
