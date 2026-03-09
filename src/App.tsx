import { useEffect, useState } from "react";

function App() {
  const [slashVisible, setSlashVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlashVisible((v) => !v);
    }, 550);
    return () => clearInterval(interval);
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
          <button className="rounded-full bg-[#1a1a1a] text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer border-0">
            Try API
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
            <p className="text-lg text-[#4a4a4a] leading-relaxed lg:pb-1">
              MoneyLine Sportsdata delivers normalized odds, props, EV and arbitrage signals, and prediction market feeds in one API—for quants, traders, and product teams.
            </p>
          </div>
        </section>

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
