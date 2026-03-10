import { useEffect, useRef, useState } from "react";

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
  { method: "GET", path: "/v1/arbitrage", desc: "Live arb opportunities" },
  { method: "GET", path: "/v1/ev/{sport}", desc: "Pre-computed EV by market" },
  { method: "GET", path: "/v1/odds/{sport}", desc: "Live odds across all books" },
  { method: "GET", path: "/v1/props/{sport}", desc: "Player props across books" },
  { method: "GET", path: "/v1/scores/{sport}", desc: "Live scores and results" },
  { method: "WSS", path: "/v1/stream", desc: "Real-time line movement feed" },
  { method: "GET", path: "/v1/prediction", desc: "Kalshi + Polymarket feeds" },
] as const;

const HERO_SNIPPETS_BY_ENDPOINT = [
  `GET /v1/arbitrage?sport=nba

// Response
{
  "meta": { "arbs_returned": 3, "live_arbs": 1, "pregame_arbs": 2, "generated_at": "2026-03-09T19:45:32Z", "latency_ms": 28, "stale_warning": false },
  "arbs": [
    {
      "arb_id": "arb_nba_lal_bos_ml_dk_fd_20260309_194532",
      "arb_type": "two_way",
      "game": { "game_id": "nba_lal_bos_20260309", "sport": "nba", "home_team": "Boston Celtics", "away_team": "Los Angeles Lakers", "start_time": "2026-03-09T23:30:00Z", "status": "pregame" },
      "market": { "type": "moneyline", "description": "Celtics/Lakers Moneyline" },
      "legs": [
        { "leg_num": 1, "book": "draftkings", "side": "home", "price": 112, "stake_pct": 47.2, "stake_on_100": 47.20, "payout_on_100": 100.08, "age_seconds": 4 },
        { "leg_num": 2, "book": "fanduel", "side": "away", "price": -105, "stake_pct": 52.8, "stake_on_100": 52.80, "payout_on_100": 100.44, "age_seconds": 4 }
      ],
      "profit": { "profit_pct": 2.14, "profit_on_100": 2.14, "total_payout_on_100": 102.14 },
      "timing": { "discovered_at": "2026-03-09T19:45:28Z", "age_seconds": 4, "estimated_life_sec": 90, "urgency": "high" },
      "alerts": []
    }
  ]
}`,
  `GET /v1/ev/nba?market_types=moneyline,spread&min_ev=1.0

// Response
{
  "meta": { "sport": "nba", "sharp_ref": "pinnacle", "min_ev_filter": 1.0, "opps_returned": 5, "generated_at": "2026-03-09T19:45:00Z", "latency_ms": 52 },
  "opportunities": [
    {
      "opp_id": "ev_nba_lal_bos_ml_home_dk_20260309",
      "game": { "game_id": "nba_lal_bos_20260309", "home_team": "Boston Celtics", "away_team": "Los Angeles Lakers", "start_time": "2026-03-09T23:30:00Z", "status": "pregame", "sport": "nba" },
      "market": { "type": "moneyline", "side": "home", "line": null, "description": "Celtics ML" },
      "target_book": { "book": "draftkings", "price": 105, "implied_prob": 0.4878 },
      "sharp_reference": { "book": "pinnacle", "price": -108, "no_vig_prob": 0.5194, "hold_pct": 2.4 },
      "ev": { "ev_pct": 4.7, "ev_per_100": 4.70, "kelly_fraction": 0.047, "half_kelly": 0.024, "clv_expected": "positive" },
      "line_context": { "open_price_target_book": 102, "current_move": -3, "direction": "unfavorable", "minutes_at_current": 8, "sharp_action_on_side": true },
      "quality_score": 78,
      "alerts": [],
      "discovered_at": "2026-03-09T19:42:00Z",
      "expires_approx": "2026-03-09T19:55:00Z"
    }
  ]
}`,
  `GET /v1/odds/nba?markets=moneyline,spread,total&books=all

// Response — 84ms
{
  "meta": { "sport": "nba", "status_filter": "all", "games_returned": 8, "books_tracked": 12, "generated_at": "2026-03-09T19:45:00Z", "latency_ms": 84, "next_page": null },
  "games": [
    {
      "game_id": "nba_lal_bos_20260309_1930",
      "sport": "nba",
      "league": "NBA",
      "status": "live",
      "start_time": "2026-03-09T23:30:00Z",
      "home_team": { "id": "nba_bos", "name": "Boston Celtics", "abbreviation": "BOS", "score": 102 },
      "away_team": { "id": "nba_lal", "name": "Los Angeles Lakers", "abbreviation": "LAL", "score": 98 },
      "markets": {
        "moneyline": {
          "home": { "books": { "draftkings": { "price": -108, "implied_prob": 0.5194, "open": -102, "updated_at": "2026-03-09T19:44:55Z" }, "pinnacle": { "price": -106, "implied_prob": 0.5146, "open": -104, "updated_at": "2026-03-09T19:44:58Z" } }, "best_price": -106, "best_book": "pinnacle", "no_vig_prob": 0.5146, "ev_vs_best": 0.48, "consensus_price": -107 },
          "away": { "books": { "draftkings": { "price": 105 }, "pinnacle": { "price": 103 } }, "best_price": 105, "best_book": "draftkings", "no_vig_prob": 0.4854, "ev_vs_best": -0.32 }
        },
        "spread": { "home": { "best_line": -3.5, "best_price": -108, "best_book": "pinnacle", "line_move": -0.5 }, "away": { "best_line": 3.5, "best_price": -110, "best_book": "fanduel" } },
        "total": { "over": { "best_line": 224.5, "best_price": -110, "best_book": "draftkings" }, "under": { "best_line": 224.5, "best_price": -110 }, "line_move": 1.5 }
      },
      "market_signals": { "sharp_action_detected": true, "reverse_line_movement": false, "line_frozen": false, "public_bet_pct_home": 0.62, "sharp_side": "home" },
      "last_updated": "2026-03-09T19:44:58Z",
      "last_updated_ms": 1710027898000
    }
  ]
}`,
  `GET /v1/props/nba?player_id=lebron&prop_type=points

// Response
{
  "meta": { "sport": "nba", "games_covered": 1, "players_covered": 1, "props_returned": 3, "generated_at": "2026-03-09T19:45:00Z", "latency_ms": 67 },
  "props": [
    {
      "prop_id": "prop_nba_lebron_points_20260309",
      "player": { "player_id": "nba_lebron", "name": "LeBron James", "position": "SF", "team": "Los Angeles Lakers", "team_abbr": "LAL", "injury_status": "active", "injury_detail": null },
      "game": { "game_id": "nba_lal_bos_20260309", "opponent": "Boston Celtics", "opp_abbr": "BOS", "home_away": "away", "start_time": "2026-03-09T23:30:00Z", "status": "pregame" },
      "prop": { "type": "points", "label": "Points", "stat_group": "scoring" },
      "books": { "draftkings": { "over": { "line": 24.5, "price": -115, "updated_at": "2026-03-09T19:44:00Z" }, "under": { "line": 24.5, "price": -105, "updated_at": "2026-03-09T19:44:00Z" } }, "fanduel": { "over": { "line": 24.5, "price": -112 }, "under": { "line": 24.5, "price": -108 } } },
      "best": { "over": { "line": 24.5, "price": -112, "book": "fanduel" }, "under": { "line": 24.5, "price": -105, "book": "draftkings" } },
      "sharp_ref": { "book": "pinnacle", "no_vig_over": 0.518, "no_vig_under": 0.482, "hold_pct": 2.2 },
      "ev": { "over": { "ev_pct": 2.1, "best_book": "fanduel" }, "under": { "ev_pct": null, "best_book": null } },
      "historical": { "sample_size": 45, "sample_period": "last_20_games", "avg_result": 25.2, "over_hit_rate": 0.62, "line_vs_avg": -0.7, "trend": "up", "vs_opponent_avg": 26.1, "vs_opponent_games": 12 },
      "context": { "game_total": 224.5, "game_total_direction": "high", "team_pace_rank": 8, "opp_rank_vs_position": 14, "projected_minutes": 34.0 },
      "alerts": []
    }
  ]
}`,
  `GET /v1/scores/nba?status=live,final&include_odds=true

// Response
{
  "meta": { "sport": "nba", "date": "2026-03-09", "games_returned": 4, "live_games": 2, "final_games": 1, "generated_at": "2026-03-09T19:45:00Z", "latency_ms": 31 },
  "games": [
    {
      "game_id": "nba_lal_bos_20260309",
      "sport": "nba",
      "league": "NBA",
      "status": "live",
      "start_time": "2026-03-09T23:30:00Z",
      "venue": "TD Garden, Boston, MA",
      "home_team": { "id": "nba_bos", "name": "Boston Celtics", "abbreviation": "BOS", "score": 102, "q1": 28, "q2": 24, "q3": 26, "q4": 24, "ot": null, "record": "42-18" },
      "away_team": { "id": "nba_lal", "name": "Los Angeles Lakers", "abbreviation": "LAL", "score": 98, "q1": 24, "q2": 26, "q3": 22, "q4": 26, "ot": null, "record": "38-22" },
      "game_state": { "period": "Q4", "period_number": 4, "clock": "2:34", "clock_running": true, "is_overtime": false, "possession": "LAL", "down_and_distance": null, "field_position": null, "inning": null, "inning_half": null, "outs": null, "runners_on": null },
      "scoring_events": [
        { "event_id": "evt_1", "time": "8:42 Q3", "event_type": "basket", "team": "LAL", "player": "LeBron James", "description": "LeBron James 3-pointer", "score_after": "LAL 78, BOS 74", "timestamp": "2026-03-09T19:42:00Z" }
      ],
      "live_odds": { "moneyline": { "home_price": -108, "away_price": 105, "best_book": "pinnacle", "updated_ms": 1710027898000 }, "spread": { "home_line": -3.5, "home_price": -110, "best_book": "draftkings" }, "total": { "line": 224.5, "over_price": -110, "best_book": "draftkings" } },
      "result": null
    }
  ]
}`,
  `WSS /v1/stream

// Message (line_move event)
{
  "type": "line_move",
  "seq": 18472,
  "timestamp": "2026-03-09T19:45:00.123Z",
  "ts_ms": 1710027900123,
  "game_id": "nba_lal_bos_20260309",
  "sport": "nba",
  "teams": "LAL @ BOS",
  "status": "live",
  "book": "draftkings",
  "market": "moneyline",
  "side": "home",
  "player": null,
  "prev_price": -108,
  "new_price": -113,
  "move_size": 5,
  "direction": "home_favored",
  "prev_line": null,
  "new_line": null,
  "market_context": { "sharp_consensus": -106, "market_avg": -109, "ev_impact": -0.8 }
}`,
  `GET /v1/prediction?category=sports&linked_game_id=nba_lal_bos_20260309

// Response
{
  "meta": { "sources": ["polymarket", "kalshi"], "markets_returned": 4, "sports_markets": 3, "linked_to_sb": 2, "generated_at": "2026-03-09T19:45:00Z", "latency_ms": 120 },
  "markets": [
    {
      "market_id": "pred_poly_nba_lal_bos_winner_20260309",
      "source": "polymarket",
      "source_market_id": "0xabc123",
      "source_url": "https://polymarket.com/event/lakers-celtics-march-9",
      "category": "sports",
      "sport": "nba",
      "linked_game_id": "nba_lal_bos_20260309",
      "title": "Will the LA Lakers win vs. Boston Celtics on March 9?",
      "description": "Resolves YES if Lakers win.",
      "resolution_date": "2026-03-10",
      "resolution_rule": "Resolves YES if Lakers final score > Celtics.",
      "status": "open",
      "resolved_value": null,
      "outcomes": { "yes": { "price": 0.452, "prob": 0.452, "bid": 0.448, "ask": 0.456, "spread": 0.008, "price_24h_ago": 0.438, "price_change_24h": 1.4 }, "no": { "price": 0.548, "prob": 0.548, "bid": 0.544, "ask": 0.552, "spread": 0.008 } },
      "volume": { "volume_24h": 12500, "volume_total": 89000, "open_interest": 42000, "num_traders": 340 },
      "sportsbook_comparison": { "linked_game_id": "nba_lal_bos_20260309", "sb_side": "away", "sb_no_vig_prob": 0.4854, "sb_consensus_prob": 0.482, "prob_delta": -0.0334, "delta_direction": "sb_higher", "cross_market_ev": 7.4, "interpretation": "Prediction market pricing Lakers cheaper than sportsbooks — potential buy signal on YES." },
      "trend": { "direction_7d": "up", "high_7d": 0.47, "low_7d": 0.41, "volatility_7d": 0.02, "momentum": "stable" },
      "alerts": ["large_prob_delta_vs_sb"]
    }
  ]
}`,
];

const LIVE_SAMPLE_RAW = `{
  "meta": {
    "sport": "nba",
    "status_filter": "live",
    "games_returned": 1,
    "books_tracked": 12,
    "generated_at": "2026-03-09T19:45:00Z",
    "latency_ms": 84,
    "next_page": null
  },
  "games": [
    {
      "game_id": "nba_lal_bos_20260309_1930",
      "sport": "nba",
      "league": "NBA",
      "status": "live",
      "start_time": "2026-03-09T23:30:00Z",
      "home_team": { "id": "nba_bos", "name": "Boston Celtics", "abbreviation": "BOS", "score": 102 },
      "away_team": { "id": "nba_lal", "name": "Los Angeles Lakers", "abbreviation": "LAL", "score": 98 },
      "markets": {
        "moneyline": {
          "home": {
            "books": {
              "draftkings": { "price": -108, "implied_prob": 0.5194, "open": -102, "updated_at": "2026-03-09T19:44:55Z" },
              "pinnacle": { "price": -106, "implied_prob": 0.5146, "open": -104, "updated_at": "2026-03-09T19:44:58Z" }
            },
            "best_price": -106,
            "best_book": "pinnacle",
            "no_vig_prob": 0.5146,
            "ev_vs_best": 0.48,
            "consensus_price": -107
          },
          "away": {
            "books": { "draftkings": { "price": 105 }, "pinnacle": { "price": 103 } },
            "best_price": 105,
            "best_book": "draftkings",
            "no_vig_prob": 0.4854,
            "ev_vs_best": -0.32
          }
        },
        "spread": {
          "home": { "best_line": -3.5, "best_price": -108, "best_book": "pinnacle", "line_move": -0.5 },
          "away": { "best_line": 3.5, "best_price": -110, "best_book": "fanduel" }
        },
        "total": {
          "over": { "best_line": 224.5, "best_price": -110, "best_book": "draftkings" },
          "under": { "best_line": 224.5, "best_price": -110 },
          "line_move": 1.5
        }
      },
      "market_signals": {
        "sharp_action_detected": true,
        "reverse_line_movement": false,
        "line_frozen": false,
        "public_bet_pct_home": 0.62,
        "public_money_pct_home": 0.58,
        "sharp_side": "home"
      },
      "last_updated": "2026-03-09T19:44:58Z",
      "last_updated_ms": 1710027898000
    }
  ]
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

function highlightSnippetBody(body: string) {
  const tokens = body.split(/(".*?"|\btrue\b|\bfalse\b|\bnull\b|\b\d+\.\d+\b|\b\d+\b)/g);
  return tokens.map((token, idx) => {
    if (!token) return null;
    let className = "text-[#9ca3af]";

    if (token.startsWith("//")) {
      className = "text-[#6b7280]";
    } else if (token.startsWith('"') && token.endsWith('"')) {
      className = "text-[#fb923c]"; // strings / field names
    } else if (/^\d+(\.\d+)?$/.test(token.trim())) {
      className = "text-[#facc15]"; // numbers
    } else if (/^(true|false|null)$/.test(token.trim())) {
      className = "text-[#38bdf8]"; // booleans / null
    } else if (token === "{" || token === "}" || token === "[" || token === "]") {
      className = "text-[#6b7280]";
    }

    return (
      <span key={idx} className={className}>
        {token}
      </span>
    );
  });
}

function HomePage() {
  const [slashVisible, setSlashVisible] = useState(true);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [heroEndpointIndex, setHeroEndpointIndex] = useState(0);
  const [copiedLiveSample, setCopiedLiveSample] = useState(false);
  const [integrateTab, setIntegrateTab] = useState<"python" | "javascript" | "curl">("python");
  const [responseExpanded, setResponseExpanded] = useState(false);
  const [copiedIntegrate, setCopiedIntegrate] = useState(false);
  const [stat1, setStat1] = useState(0);
  const [stat2, setStat2] = useState(0);
  const [stat3, setStat3] = useState(0);
  const [glanceEndpointIndex, setGlanceEndpointIndex] = useState(0);
  const [glanceArbIndex, setGlanceArbIndex] = useState<0 | 1 | 2>(0);
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
    await navigator.clipboard.writeText(HERO_SNIPPETS_BY_ENDPOINT[heroEndpointIndex]);
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
            className={`inline-block min-w-[0.5em] px-[0.2em] text-center transition-opacity duration-150 ${
              slashVisible ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden
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
          <a href="/pricing" className="hover:opacity-70 transition-opacity">
            Pricing
          </a>
          <button className="group rounded-full bg-[#1a1a1a] text-white px-4 py-2 text-sm font-medium cursor-pointer border-2 border-transparent transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-[#e8ff47]/25 hover:border-[#e8ff47]/70 hover:text-[#1a1a1a]">
            Try API
            <span className="ml-1.5 inline-block transition-transform duration-200 ease-out group-hover:translate-x-[3px]" aria-hidden>→</span>
          </button>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero: headline top-aligned with right column subtext */}
        <section className="max-w-6xl mx-auto px-6 pt-4 pb-12 lg:pb-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <h1 className="mt-0 pt-0 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1a1a1a] leading-[1.1] -mt-2">
                Sports betting data that puts <span className="underline decoration-2 underline-offset-2">edges</span> at the frontier.
              </h1>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
                <a href="/get-started" className="inline-flex items-center justify-center rounded-full bg-[#1a1a1a] text-white px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity no-underline">
                  Get API Key
                </a>
                <a href="/docs" className="inline-flex items-center justify-center rounded-full border-2 border-[#1a1a1a] text-[#1a1a1a] bg-transparent px-5 py-2.5 text-sm font-medium hover:bg-[#1a1a1a]/5 transition-colors no-underline">
                  Explore Docs
                </a>
              </div>
              <p className="mt-4 text-xs text-[#4a4a4a]/90">
                Trusted by DFS operators, Sportsbooks, Sports data analytics platforms, and Quant funds.
              </p>
            </div>
            <div className="pt-1">
              <p className="mt-0 text-lg text-[#4a4a4a] leading-relaxed lg:pb-1">
                MoneyLine Sports data delivers normalized odds, props, EV and arbitrage signals, and prediction market feeds in one API—for quants, traders, and product teams.
              </p>
              {/* Endpoint selector */}
              <div className="mt-6 overflow-x-auto pb-2 -mx-1 px-1">
                <div className="flex gap-2 min-w-max">
                  {API_ENDPOINTS.map((ep, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setHeroEndpointIndex(i)}
                      className={`flex-shrink-0 rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer ${
                        heroEndpointIndex === i
                          ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                          : "border-[#e0e0e0] bg-white text-[#333] hover:border-[#999]"
                      }`}
                    >
                      <span className={`block font-mono text-[10px] font-bold uppercase ${heroEndpointIndex === i ? "text-[#86efac]" : "text-[#666]"}`}>{ep.method}</span>
                      <span className="block font-mono text-[11px] mt-0.5">{ep.path}</span>
                      <span className="block text-[10px] text-[#888] mt-1 max-w-[140px]">{ep.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* API code snippet */}
              <div className="mt-3 relative rounded-xl bg-[#0f0f0f] border border-[#222] shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
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
                <pre className="p-4 pr-12 pt-10 text-[12px] leading-relaxed font-mono overflow-x-auto max-h-[320px] overflow-y-auto" style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace" }}>
                  <code className="text-[#bbb] whitespace-pre-wrap break-words block">
                    {(() => {
                      const raw = HERO_SNIPPETS_BY_ENDPOINT[heroEndpointIndex];
                      const firstLineEnd = raw.indexOf("\n");
                      const firstLine = firstLineEnd >= 0 ? raw.slice(0, firstLineEnd) : raw;
                      const rest = firstLineEnd >= 0 ? raw.slice(firstLineEnd + 1) : "";
                      const isWss = firstLine.startsWith("WSS ");
                      const method = isWss ? "WSS" : firstLine.split(" ")[0] ?? "GET";
                      const path = firstLine.slice(method.length).trim();
                      return (
                        <>
                          {isWss ? <span className="text-[#93c5fd]">WSS</span> : <span className="text-[#7dd3fc]">GET</span>}
                          {" "}
                          <span className="text-[#86efac]">{path}</span>
                          {"\n"}
                          {highlightSnippetBody(rest)}
                          <span className={`inline-block w-2 align-bottom ${cursorVisible ? "opacity-100" : "opacity-0"} transition-opacity duration-100`} style={{ color: "#86efac" }}>|</span>
                        </>
                      );
                    })()}
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
            <p className="mb-4 text-[14px] text-[#666]">Click an endpoint to see an example of what you could build — e.g. a sports analytics dashboard.</p>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-1/2 rounded-xl border border-[#222] bg-[#111] py-2 overflow-hidden">
                {API_ENDPOINTS.map((ep, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setGlanceEndpointIndex(i)}
                    className={`group flex w-full h-12 items-center px-5 text-left transition-colors ${i % 2 === 1 ? "bg-[#141414]" : "bg-transparent"} hover:!bg-[#1a1a1a] ${glanceEndpointIndex === i ? "!bg-[#1e2a1e] ring-inset ring-1 ring-[#86efac]/40" : ""}`}
                  >
                    <span
                      className={`rounded px-2 py-[3px] font-mono text-[11px] font-bold shrink-0 ${
                        ep.method === "WSS"
                          ? "bg-[#1a1a2e] text-[#93c5fd]"
                          : "bg-[#1a2e1a] text-[#86efac]"
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="ml-3 font-mono text-[13px] text-[#ccc] truncate">{ep.path}</span>
                    <span className={`ml-auto text-[13px] shrink-0 transition-colors ${glanceEndpointIndex === i ? "text-[#86efac]" : "text-[#555] group-hover:text-[#888]"}`}>{ep.desc}</span>
                  </button>
                ))}
                <div className="mt-2 px-5 pb-1 text-right">
                  <a href="/docs" className="text-[13px] text-[#b5c400] no-underline hover:underline">View full API reference →</a>
                </div>
              </div>
              <div className="w-full lg:w-1/2 flex flex-col">
                <div className="rounded-xl border border-[#e8e8e4] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden flex-1 min-h-[380px] flex flex-col">
                  <div className="px-4 py-2.5 border-b border-[#eee] bg-[#fafafa] text-[12px] font-medium text-[#555] flex items-center justify-between shrink-0">
                    <span>Example: Sports analytics app</span>
                    <span className="font-mono text-[10px] text-[#888] font-normal">Powered by full API response</span>
                  </div>
                  <div className="p-4 text-[13px] text-[#333] overflow-y-auto flex-1 min-h-0">
                    {glanceEndpointIndex === 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] text-[#666] bg-[#f5f5f5] rounded-lg px-2.5 py-1.5">
                          <span>meta: arbs_returned 3</span>
                          <span>live_arbs 1 · pregame_arbs 2</span>
                          <span>latency_ms 28</span>
                          <span className="text-[#0d9488]">stale_warning false</span>
                        </div>
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b border-[#e0e0e0]">
                              <th className="pb-1.5 text-[10px] uppercase text-[#777] font-medium">Game · Market</th>
                              <th className="pb-1.5 text-[10px] uppercase text-[#777] font-medium">Legs (book · side · price)</th>
                              <th className="pb-1.5 text-right text-[10px] uppercase text-[#777] font-medium">Stake %</th>
                              <th className="pb-1.5 text-right text-[10px] uppercase text-[#777] font-medium">Profit</th>
                              <th className="pb-1.5 text-[10px] uppercase text-[#777] font-medium">Timing</th>
                            </tr>
                          </thead>
                          <tbody className="text-[#333]">
                            <tr
                              className={`border-b border-[#f0f0f0] cursor-pointer ${glanceArbIndex === 0 ? "bg-[#ecfdf5]" : "hover:bg-[#f5f5f5]"}`}
                              onClick={() => setGlanceArbIndex(0)}
                            >
                              <td className="py-1.5">LAL @ BOS · ML</td>
                              <td className="text-[10px]">DK home +112 · FD away −105</td>
                              <td className="text-right">47.2 / 52.8</td>
                              <td className="text-right text-[#0d9488] font-medium">9.0% · $9.00/100</td>
                              <td><span className="text-[#ea580c]">high</span> · age 4s</td>
                            </tr>
                            <tr
                              className={`border-b border-[#f0f0f0] cursor-pointer ${glanceArbIndex === 1 ? "bg-[#ecfdf5]" : "hover:bg-[#f5f5f5]"}`}
                              onClick={() => setGlanceArbIndex(1)}
                            >
                              <td className="py-1.5">KC @ BUF · ML</td>
                              <td className="text-[10px]">Pinnacle +108 · BetMGM −106</td>
                              <td className="text-right">48.1 / 51.9</td>
                              <td className="text-right text-[#0d9488] font-medium">8.3% · $8.30/100</td>
                              <td><span className="text-[#ca8a04]">moderate</span> · est_life ~2m</td>
                            </tr>
                            <tr
                              className={`border-b border-[#f0f0f0] cursor-pointer ${glanceArbIndex === 2 ? "bg-[#ecfdf5]" : "hover:bg-[#f5f5f5]"}`}
                              onClick={() => setGlanceArbIndex(2)}
                            >
                              <td className="py-1.5">NYY @ BOS · Total</td>
                              <td className="text-[10px]">FD over · Caesars under</td>
                              <td className="text-right">—</td>
                              <td className="text-right text-[#0d9488] font-medium">7.5% · $7.50/100</td>
                              <td><span className="text-[#16a34a]">stable</span> · limits checked</td>
                            </tr>
                          </tbody>
                        </table>
                        <p className="text-[10px] text-[#666]">
                          Click a row to preview an example bet. profit.total_payout_on_100 · legs[].stake_on_100, payout_on_100, age_seconds · timing.urgency, estimated_life_sec
                        </p>
                        {(() => {
                          const opportunities = [
                            {
                              label: "LAL @ BOS · DK home +112 / FD away −105",
                              profitPct: 9.0,
                              profitPer100: 9.0,
                              profitOn1000: 90,
                              stakeSplit: "DK $472 · FD $528",
                              urgency: "high (age 4s, est_life ~90s)",
                            },
                            {
                              label: "KC @ BUF · Pinnacle +108 / BetMGM −106",
                              profitPct: 8.3,
                              profitPer100: 8.3,
                              profitOn1000: 83,
                              stakeSplit: "Pin $481 · MGM $519",
                              urgency: "moderate (est_life ~2m)",
                            },
                            {
                              label: "NYY @ BOS total · FD over / Caesars under",
                              profitPct: 7.5,
                              profitPer100: 7.5,
                              profitOn1000: 75,
                              stakeSplit: "FD $500 · Caesars $500",
                              urgency: "stable (low_limit_warning false)",
                            },
                          ] as const;
                          const selected = opportunities[glanceArbIndex] ?? opportunities[0];
                          return (
                            <div className="mt-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3.5 py-3">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="text-[11px] font-semibold text-[#111]">
                                  Example bet: <span className="font-mono">$1,000</span> across both legs
                                </div>
                                <div className="text-[10px] text-[#0d9488] font-medium">
                                  Guaranteed profit:{" "}
                                  <span className="font-mono">
                                    ${selected.profitOn1000.toFixed(0)}
                                  </span>{" "}
                                  (<span className="font-mono">{selected.profitPct.toFixed(1)}%</span> ROI)
                                </div>
                              </div>
                              <p className="mt-1.5 text-[11px] text-[#374151]">{selected.label}</p>
                              <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-[#4b5563]">
                                <div className="rounded-md bg-white border border-[#e5e7eb] px-2 py-1.5">
                                  <div className="text-[10px] uppercase text-[#9ca3af] mb-0.5">Stake split</div>
                                  <div>{selected.stakeSplit}</div>
                                </div>
                                <div className="rounded-md bg-white border border-[#e5e7eb] px-2 py-1.5">
                                  <div className="text-[10px] uppercase text-[#9ca3af] mb-0.5">Per $100</div>
                                  <div>
                                    Profit{" "}
                                    <span className="font-mono">
                                      ${selected.profitPer100.toFixed(2)}
                                    </span>{" "}
                                    ({selected.profitPct.toFixed(1)}%)
                                  </div>
                                </div>
                              </div>
                              <div className="mt-1.5 text-[10px] text-[#6b7280]">
                                Timing: {selected.urgency}. Limits and regional availability from{" "}
                                <code className="font-mono text-[10px]">limits.estimated_max</code> and{" "}
                                <code className="font-mono text-[10px]">alerts</code>.
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {glanceEndpointIndex === 1 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] text-[#666] bg-[#f5f5f5] rounded-lg px-2.5 py-1.5">
                          <span>meta: sharp_ref pinnacle</span>
                          <span>min_ev_filter 1.0 · opps_returned 5</span>
                          <span>latency_ms 52</span>
                        </div>
                        <div className="space-y-2 text-[11px]">
                          {[
                            { game: "Celtics ML", book: "DK +105", ev: "+4.7%", per100: "$4.70", kelly: "½ Kelly 2.4%", sharp: "Pinnacle −108", noVig: "0.5194", q: 78, dir: "unfavorable", mins: 8, sharpSide: true, clv: "positive" },
                            { game: "Chiefs -3.5", book: "FD −108", ev: "+2.2%", per100: "$2.20", kelly: "½ Kelly 1.1%", sharp: "Pinnacle −110", noVig: "0.524", q: 62, dir: "stable", mins: 12, sharpSide: true, clv: "neutral" },
                            { game: "Yankees ML", book: "BetMGM +100", ev: "−0.8%", per100: "—", kelly: "—", sharp: "—", noVig: "—", q: 38, dir: "unfavorable", mins: 2, sharpSide: false, clv: "negative" },
                          ].map((row, i) => (
                            <div key={i} className="border border-[#eee] rounded-lg p-2 space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-medium">{row.game} · {row.book}</span>
                                <span className={row.ev.startsWith("+") ? "text-[#0d9488] font-medium" : "text-[#b91c1c]"}>{row.ev} · {row.per100}</span>
                              </div>
                              <div className="text-[10px] text-[#666] flex flex-wrap gap-x-3 gap-y-0.5">
                                <span>sharp_ref {row.sharp} (no_vig {row.noVig})</span>
                                <span>quality_score {row.q}</span>
                                <span>line_context: {row.dir} · {row.mins}m at current</span>
                                <span>sharp_action_on_side {row.sharpSide ? "✓" : "✗"}</span>
                                <span>clv_expected {row.clv}</span>
                                <span>{row.kelly}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-[#666]">ev_pct, ev_per_100, kelly_fraction, half_kelly · line_context.direction, minutes_at_current · expires_approx</p>
                      </div>
                    )}
                    {glanceEndpointIndex === 2 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] text-[#666] bg-[#f5f5f5] rounded-lg px-2.5 py-1.5">
                          <span>meta: games_returned 8 · books_tracked 12</span>
                          <span>latency_ms 84</span>
                        </div>
                        <div className="font-medium text-[#1a1a1a]">LAL 98 @ BOS 102 · Live</div>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div className="border border-[#eee] rounded p-2">
                            <div className="text-[10px] uppercase text-[#777] mb-0.5">Moneyline (home)</div>
                            <table className="w-full text-[10px]"><tbody>
                              <tr><td>Pinnacle</td><td className="text-right">−106</td><td className="text-right text-[#0d9488]">ev_vs_best +0.48%</td></tr>
                              <tr><td>DraftKings</td><td className="text-right">−108</td><td className="text-right text-[#0d9488]">+0.48%</td></tr>
                              <tr><td>FanDuel</td><td className="text-right">−112</td><td className="text-right text-[#b91c1c]">−0.32%</td></tr>
                            </tbody></table>
                            <div className="mt-0.5 text-[10px] text-[#666]">best_book pinnacle · no_vig_prob 0.5146</div>
                          </div>
                          <div className="border border-[#eee] rounded p-2">
                            <div className="text-[10px] uppercase text-[#777] mb-0.5">Spread</div>
                            <div>home best_line −3.5 · best_price −108 · line_move −0.5</div>
                            <div>away +3.5 · FD −110</div>
                          </div>
                          <div className="border border-[#eee] rounded p-2">
                            <div className="text-[10px] uppercase text-[#777] mb-0.5">Total</div>
                            <div>over/under 224.5 · line_move +1.5</div>
                            <div>best_book draftkings</div>
                          </div>
                        </div>
                        <div className="text-[10px] text-[#666] bg-[#f9fafb] rounded px-2 py-1">
                          market_signals: sharp_action_detected ✓ · reverse_line_movement ✗ · sharp_side home · public_bet_pct_home 62% · public_money_pct_home 58%
                        </div>
                      </div>
                    )}
                    {glanceEndpointIndex === 3 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] text-[#666] bg-[#f5f5f5] rounded-lg px-2.5 py-1.5">
                          <span>meta: props_returned 3 · games_covered 1 · players_covered 1</span>
                          <span>latency_ms 67</span>
                        </div>
                        <div className="font-medium text-[#1a1a1a]">LeBron James (LAL) · vs BOS · injury_status active</div>
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b border-[#e0e0e0]">
                              <th className="pb-1.5 text-[10px] uppercase text-[#777] font-medium">Prop</th>
                              <th className="pb-1.5 text-[10px] uppercase text-[#777] font-medium">Line</th>
                              <th className="pb-1.5 text-[10px] uppercase text-[#777] font-medium">Books (over/under price)</th>
                              <th className="pb-1.5 text-right text-[10px] uppercase text-[#777] font-medium">EV</th>
                              <th className="pb-1.5 text-[10px] uppercase text-[#777] font-medium">Historical</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-[#f0f0f0]"><td className="py-1.5">Points</td><td>24.5</td><td className="text-[10px]">DK −115/−105 · FD −112/−108</td><td className="text-right text-[#0d9488]">over +2.1%</td><td>avg 25.2 · hit 62% · line_vs_avg −0.7 · trend up</td></tr>
                            <tr className="border-b border-[#f0f0f0]"><td className="py-1.5">Rebounds</td><td>7.5</td><td className="text-[10px]">DK · FD</td><td className="text-right">—</td><td>58% · 20g</td></tr>
                            <tr className="border-b border-[#f0f0f0]"><td className="py-1.5">Assists</td><td>6.5</td><td className="text-[10px]">DK · FD</td><td className="text-right text-[#0d9488]">over +1.2%</td><td>64% · vs_opponent_avg 6.8</td></tr>
                          </tbody>
                        </table>
                        <div className="text-[10px] text-[#666]">sharp_ref: Pinnacle no_vig_over/under, hold_pct · context: game_total 224.5, opp_rank_vs_position 14, projected_minutes 34</div>
                      </div>
                    )}
                    {glanceEndpointIndex === 4 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] text-[#666] bg-[#f5f5f5] rounded-lg px-2.5 py-1.5">
                          <span>meta: games_returned 4 · live_games 2 · final_games 1</span>
                          <span>date 2026-03-09 · latency_ms 31 · include_odds true</span>
                        </div>
                        <div className="rounded-lg bg-[#f5f5f5] p-3 border border-[#eee]">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">LAL</span>
                            <span className="text-xl font-bold tabular-nums">98</span>
                            <span className="text-[#777] text-[11px]">Q4 · 2:34 · possession LAL</span>
                            <span className="text-xl font-bold tabular-nums">102</span>
                            <span className="font-medium">BOS</span>
                          </div>
                          <div className="text-[10px] text-[#666] mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5">
                            <span>home_team: q1 28, q2 24, q3 26, q4 24 · record 38-22</span>
                            <span>away_team: q1 24, q2 26, q3 22, q4 26 · record 42-18</span>
                          </div>
                          <div className="text-[10px] text-[#666] mt-1">game_state: period Q4 · clock_running true · venue TD Garden</div>
                          <div className="mt-2 pt-2 border-t border-[#e5e5e5]">
                            <div className="text-[10px] uppercase text-[#777] mb-0.5">scoring_events (last)</div>
                            <div className="text-[10px]">8:42 Q3 · LeBron James 3-pointer · LAL 78, BOS 74</div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-[#e5e5e5] text-[10px]">
                            live_odds: moneyline home −108 / away 105 · spread −3.5 · total 224.5 · best_book pinnacle
                          </div>
                        </div>
                      </div>
                    )}
                    {glanceEndpointIndex === 5 && (
                      <div className="space-y-3">
                        <div className="text-[10px] text-[#666] bg-[#f5f5f5] rounded-lg px-2.5 py-1.5">WSS events: seq · type · ts_ms · (subscribe filters: sports, event_types, min_move_size)</div>
                        <div className="space-y-2 font-mono text-[10px]">
                          <div className="border border-[#eee] rounded p-2">
                            <span className="text-[#9333ea] font-semibold">line_move</span>
                            <span className="text-[#666]"> · seq 18472 · LAL @ BOS · draftkings · moneyline home</span>
                            <div className="mt-0.5">prev_price −108 → new_price −113 · move_size 5 · direction home_favored</div>
                            <div className="text-[#666]">market_context: sharp_consensus −106 · market_avg −109 · ev_impact −0.8</div>
                          </div>
                          <div className="border border-[#eee] rounded p-2">
                            <span className="text-[#9333ea] font-semibold">steam_move</span>
                            <span className="text-[#666]"> · nfl_kc_buf · spread · side home</span>
                            <div className="mt-0.5">books_moved [pinnacle, dk, fd, betmgm] · window_seconds 12 · leading_book pinnacle · confidence high</div>
                            <div>consensus_before −110 → consensus_after −115 · signal sharp_action</div>
                          </div>
                          <div className="border border-[#eee] rounded p-2">
                            <span className="text-[#9333ea] font-semibold">arb_alert</span>
                            <span className="text-[#666]"> · arb_id … · nba_den_phx · profit_pct 1.9 · urgency high</span>
                            <div className="mt-0.5">legs: DK home +108 · FD away −107</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {glanceEndpointIndex === 6 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] text-[#666] bg-[#f5f5f5] rounded-lg px-2.5 py-1.5">
                          <span>meta: sources polymarket, kalshi · markets_returned 4 · linked_to_sb 2</span>
                          <span>latency_ms 120</span>
                        </div>
                        <div className="border border-[#eee] rounded-lg p-2.5 space-y-2">
                          <div className="font-medium text-[#1a1a1a]">Lakers win vs Celtics · Polymarket · linked_game_id nba_lal_bos_20260309</div>
                          <div className="flex gap-4 text-[11px]">
                            <div className="flex-1">
                              <div className="text-[10px] uppercase text-[#777] mb-0.5">outcomes</div>
                              <div>YES price 0.452 · prob 0.452 · bid 0.448 · ask 0.456 · spread 0.008</div>
                              <div>NO price 0.548 · prob 0.548</div>
                              <div className="mt-0.5">price_24h_ago 0.438 · price_change_24h +1.4</div>
                            </div>
                            <div className="flex-1">
                              <div className="text-[10px] uppercase text-[#777] mb-0.5">volume</div>
                              <div>volume_24h $12.5k · volume_total $89k · open_interest $42k</div>
                            </div>
                          </div>
                          <div className="text-[10px] bg-[#ecfdf5] text-[#065f46] rounded px-2 py-1">
                            sportsbook_comparison: sb_no_vig_prob 0.485 · prob_delta −0.033 · delta_direction sb_higher · cross_market_ev +7.4% · interpretation: &quot;Prediction market pricing Lakers cheaper — potential buy YES&quot;
                          </div>
                          <div className="text-[10px] text-[#666]">trend: direction_7d up · high_7d 0.47 · low_7d 0.41 · momentum stable · alerts [large_prob_delta_vs_sb]</div>
                        </div>
                        <div className="border border-[#eee] rounded-lg p-2 text-[11px]">
                          <div className="font-medium">Chiefs win Super Bowl · Kalshi</div>
                          <div>YES 67% · volume_24h $8.2k · open_interest $31k · resolution_rule, resolution_date in response</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
              <pre className="p-4 pt-10 pr-24 pb-4 text-[11px] leading-relaxed font-mono overflow-x-auto max-h-[280px] overflow-y-auto whitespace-pre-wrap break-words" style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace" }}>
                <code className="text-[#bbb]">
                  {LIVE_SAMPLE_RAW}
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
                <div className="mt-2 rounded-xl border border-[#222] bg-[#0f0f0f] p-4 overflow-x-auto max-h-[280px] overflow-y-auto">
                  <pre className="font-mono text-[11px] leading-relaxed text-[#ccc] whitespace-pre-wrap break-words" style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace" }}>
                    <code>{`{
  "meta": { "sport": "nba", "games_returned": 1, "books_tracked": 12, "latency_ms": 84 },
  "games": [{
    "game_id": "nba_lal_bos_20260309_1930",
    "status": "live",
    "home_team": { "name": "Boston Celtics", "abbreviation": "BOS", "score": 102 },
    "away_team": { "name": "Los Angeles Lakers", "abbreviation": "LAL", "score": 98 },
    "markets": {
      "moneyline": {
        "home": { "best_price": -106, "best_book": "pinnacle", "no_vig_prob": 0.5146, "ev_vs_best": 0.48, "books": { "draftkings": { "price": -108, "implied_prob": 0.5194 }, "pinnacle": { "price": -106 } } },
        "away": { "best_price": 105, "best_book": "draftkings", "no_vig_prob": 0.4854 }
      },
      "spread": { "home": { "best_line": -3.5, "best_price": -108 }, "away": { "best_line": 3.5 } },
      "total": { "over": { "best_line": 224.5 }, "under": { "best_line": 224.5 }, "line_move": 1.5 }
    },
    "market_signals": { "sharp_action_detected": true, "reverse_line_movement": false, "sharp_side": "home", "public_bet_pct_home": 0.62 }
  }]
}`}</code>
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

            <p className="mt-3 text-xs text-[#6b7280] text-center max-w-xl mx-auto">
              Pick the plan that fits. Your first 2 months on Pro are on us — then billing starts automatically.
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
                      $79 <span className="text-sm font-normal text-[#9ca3af]">/ month</span>
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

function AuthPage() {
  const [mode, setMode] = useState<"signup" | "login">("signup");

  const isSignup = mode === "signup";

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      <header className="border-b border-slate-800 bg-[#020617]/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <a href="/" className="flex items-center gap-1.5 font-bold text-white no-underline">
            <span>Money</span>
            <span className="inline-block min-w-[0.5em] text-center">\\</span>
            <span>Line</span>
          </a>
          <div className="flex items-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                isSignup
                  ? "border-transparent text-slate-300 hover:border-slate-600 hover:bg-slate-900/60"
                  : "border-slate-500 bg-slate-900/80 text-white"
              }`}
            >
              Log in
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-10 lg:py-16 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-emerald-300">
              Get your API key
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              You&apos;re one step away from getting your API key.
            </h1>
            <p className="text-sm sm:text-[15px] text-slate-300 max-w-md">
              Create an account to start pulling normalized odds, props, EV and arbitrage signals, scores, and prediction
              markets from 100+ sportsbooks. No credit card required to get started.
            </p>
            <ul className="mt-4 space-y-1.5 text-[13px] text-slate-300">
              <li>• 1,000 free requests on the Starter tier</li>
              <li>• Upgrade to Pro when you&apos;re ready — first 2 months free</li>
              <li>• Designed for quants, traders, and product teams</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-[0_18px_45px_rgba(0,0,0,0.65)] p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {isSignup ? "Create your MoneyLine account" : "Log in"}
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  {isSignup
                    ? "We’ll generate an API key for you as soon as you finish signup."
                    : "Use your existing credentials to access your dashboard and keys."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMode(isSignup ? "login" : "signup")}
                className="hidden sm:inline-flex items-center rounded-full border border-slate-700 text-slate-200 px-3 py-1.5 text-[11px] font-medium hover:bg-slate-800/80 transition-colors"
              >
                {isSignup ? "Have an account? Log in" : "New here? Create account"}
              </button>
            </div>

            <form className="space-y-4">
              {isSignup && (
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-slate-200">Full name</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 focus:border-transparent"
                    placeholder="Ada Lovelace"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-slate-200">Work email</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 focus:border-transparent"
                  placeholder="you@fund-or-company.com"
                />
              </div>
              {isSignup && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-medium text-slate-200">Organization</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 focus:border-transparent"
                      placeholder="Acme Trading Fund"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-medium text-slate-200">Role</label>
                    <select className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/70 focus:border-transparent">
                      <option>Quant / Researcher</option>
                      <option>Engineer</option>
                      <option>Trader</option>
                      <option>Product / Founder</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-slate-200">Password</label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 focus:border-transparent"
                  placeholder={isSignup ? "Create a strong password" : "Enter your password"}
                />
              </div>
              {isSignup && (
                <label className="mt-1.5 flex items-start gap-2 text-[11px] text-slate-400">
                  <input type="checkbox" className="mt-[2px] h-3.5 w-3.5 rounded border-slate-600 bg-slate-950" />
                  <span>
                    I agree to the{" "}
                    <a href="#" className="underline decoration-slate-500 hover:text-emerald-300">
                      Terms
                    </a>{" "}
                    and{" "}
                    <a href="#" className="underline decoration-slate-500 hover:text-emerald-300">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              )}

              <button
                type="button"
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-emerald-400 text-[#022c22] px-4 py-2.5 text-sm font-semibold no-underline hover:bg-emerald-300 transition-colors"
              >
                {isSignup ? "Create account & get API key →" : "Log in →"}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
              <span>Secure by design · You can rotate or revoke keys anytime.</span>
              <button
                type="button"
                onClick={() => setMode(isSignup ? "login" : "signup")}
                className="sm:hidden underline decoration-slate-500 hover:text-emerald-300"
              >
                {isSignup ? "Log in" : "Create account"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [pathname, setPathname] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      const href = a?.getAttribute("href");
      if (!a || a.target === "_blank" || !href) return;
      if (!href.startsWith("/") || href.startsWith("//")) return;
      e.preventDefault();
      window.history.pushState({}, "", href);
      setPathname(new URL(href, window.location.origin).pathname);
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  if (pathname.startsWith("/get-started")) {
    return <AuthPage />;
  }
  if (pathname.startsWith("/docs")) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white">
        <header className="border-b border-white/10 bg-[#020617]/80 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
            <a href="/" className="flex items-center gap-1.5 font-bold text-white no-underline">
              <span>Money</span>
              <span className="inline-block min-w-[0.5em] text-center">\\</span>
              <span>Line</span>
              <span className="ml-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-[2px] text-[10px] font-mono uppercase tracking-[0.16em] text-emerald-200">
                API Docs
              </span>
            </a>
            <div className="hidden md:flex items-center gap-6 text-sm">
              <a href="/#api" className="text-white/70 hover:text-white transition-colors no-underline">
                API overview
              </a>
              <a href="/pricing" className="text-white/70 hover:text-white transition-colors no-underline">
                Pricing
              </a>
              <a
                href="/get-started"
                className="inline-flex items-center rounded-full bg-emerald-400 text-[#022c22] px-4 py-2 text-sm font-semibold no-underline hover:bg-emerald-300 transition-colors"
              >
                Get API key
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10 lg:py-14">
          <div className="grid lg:grid-cols-[260px,minmax(0,1fr)] gap-10">
            {/* Sidebar nav */}
            <aside className="space-y-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">
                  Getting started
                </p>
                <nav className="space-y-1 text-[13px]">
                  <a href="#introduction" className="block px-2 py-1.5 rounded-md bg-white/5 text-white no-underline">
                    Introduction
                  </a>
                  <a href="#auth" className="block px-2 py-1.5 rounded-md text-slate-300 hover:bg-white/5 no-underline">
                    Authentication
                  </a>
                  <a href="#errors" className="block px-2 py-1.5 rounded-md text-slate-300 hover:bg-white/5 no-underline">
                    Errors & rate limits
                  </a>
                </nav>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">
                  REST endpoints
                </p>
                <nav className="space-y-1 text-[13px]">
                  <a href="#odds" className="block px-2 py-1.5 rounded-md text-slate-300 hover:bg-white/5 no-underline">
                    GET /v1/odds/{`{sport}`}
                  </a>
                  <a href="#ev" className="block px-2 py-1.5 rounded-md text-slate-300 hover:bg-white/5 no-underline">
                    GET /v1/ev/{`{sport}`}
                  </a>
                  <a href="#arbitrage" className="block px-2 py-1.5 rounded-md text-slate-300 hover:bg-white/5 no-underline">
                    GET /v1/arbitrage
                  </a>
                  <a href="#props" className="block px-2 py-1.5 rounded-md text-slate-300 hover:bg-white/5 no-underline">
                    GET /v1/props/{`{sport}`}
                  </a>
                  <a href="#scores" className="block px-2 py-1.5 rounded-md text-slate-300 hover:bg-white/5 no-underline">
                    GET /v1/scores/{`{sport}`}
                  </a>
                  <a href="#prediction" className="block px-2 py-1.5 rounded-md text-slate-300 hover:bg-white/5 no-underline">
                    GET /v1/prediction
                  </a>
                </nav>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-2">
                  Streaming
                </p>
                <nav className="space-y-1 text-[13px]">
                  <a href="#stream" className="block px-2 py-1.5 rounded-md text-slate-300 hover:bg-white/5 no-underline">
                    WSS /v1/stream
                  </a>
                </nav>
              </div>
            </aside>

            {/* Main docs content */}
            <section className="space-y-12">
              <section id="introduction" className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  MoneyLine API
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  Build sports trading systems in minutes.
                </h1>
                <p className="text-sm sm:text-[15px] text-slate-300 max-w-2xl">
                  MoneyLine normalizes odds, props, EV and arbitrage signals, scores, and prediction markets into a single schema
                  across 100+ sportsbooks. This page covers the core REST endpoints and WebSocket stream you'll use to power
                  dashboards, models, and production trading systems.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <a
                    href="/get-started"
                    className="inline-flex items-center rounded-full bg-emerald-400 text-[#022c22] px-4 py-2 text-sm font-semibold no-underline hover:bg-emerald-300 transition-colors"
                  >
                    Get API key
                  </a>
                  <a
                    href="/"
                    className="inline-flex items-center rounded-full border border-slate-700 text-slate-100 px-4 py-2 text-sm font-medium no-underline hover:bg-white/5 transition-colors"
                  >
                    Back to marketing site
                  </a>
                </div>
              </section>

              <section id="auth" className="space-y-3">
                <h2 className="text-xl font-semibold text-white">Authentication</h2>
                <p className="text-sm text-slate-300">
                  All requests are authenticated with a **Bearer** API key. You can create and manage keys in your MoneyLine
                  dashboard. Keys are scoped to your account and environment.
                </p>
                <pre className="mt-2 rounded-lg bg-black/60 border border-slate-800 p-4 text-[12px] font-mono text-slate-100 overflow-x-auto">
{`curl https://api.moneyline.io/v1/odds \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -G --data-urlencode "sport=nba"`}
                </pre>
                <p className="text-[12px] text-slate-400">
                  Send your key in the <code className="font-mono text-[11px]">Authorization</code> header. Do not send keys in query strings
                  or client-side code that ships to browsers.
                </p>
              </section>

              {/* Endpoint sections would continue here – odds, ev, arbitrage, props, scores, stream, prediction – each with
                  query parameters and a shortened version of the robust example responses already on the homepage. */}
            </section>
          </div>
        </main>
      </div>
    );
  }
  if (pathname.startsWith("/pricing")) {
    // Reuse the pricing teaser section as the main content for now.
    return (
      <div className="min-h-screen bg-[#fafafa] text-[#111827]">
        <main className="relative z-10">
          <section className="bg-[#fafafa] py-[100px]">
            <div className="max-w-6xl mx-auto px-6">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#111827]">
                Simple, transparent pricing.
              </h1>
              <p className="mt-3 text-base sm:text-lg text-[#4b5563] max-w-2xl">
                Start building today. Scale when you're ready.
              </p>

              <p className="mt-3 text-xs text-[#6b7280] text-center max-w-xl mx-auto">
                Pick the plan that fits. Your first 2 months on Pro are on us — then billing starts automatically.
              </p>

              {/* Tier cards reused from homepage */}
              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Starter */}
                <div className="rounded-[12px] border border-[#e0e0e0] bg-white p-8 flex flex-col h-full">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                    Starter
                  </h2>
                  <p className="mt-2 text-2xl font-bold text-[#111827]">
                    $0 <span className="text-sm font-normal text-[#6b7280]">/ month</span>
                  </p>
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

                {/* Pro */}
                <div className="relative rounded-[12px] border border-[#1f2937] bg-[#111] text-white p-8 pt-9 flex flex-col h-full shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
                  <div className="absolute -top-3 left-6">
                    <span className="rounded-full bg-[#e8ff47] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
                      Most popular
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">
                        Pro
                      </h2>
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
                  <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                    Enterprise
                  </h2>
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
        </main>
      </div>
    );
  }

  return <HomePage />;
}

export default App;
