import { Link } from "react-router-dom";
import { NameSearchBar } from "@/components/NameSearchBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/Badge";

const EXAMPLES = ["vitalik.gen", "defi-hub.gen", "skynet.gen", "swap.nova.gen"];

const FEATURES = [
  { icon: "👤", title: "For Humans", desc: "A single readable identity across all your wallets, socials, and on-chain profiles." },
  { icon: "📜", title: "For Contracts", desc: "Assign a memorable, resolvable name to any intelligent contract you deploy." },
  { icon: "🤖", title: "For AI Agents", desc: "Give autonomous agents provable identities like bot.yourname.gen." },
  { icon: "📱", title: "For Apps", desc: "Brand your GenLayer dApp with a clean, trustworthy .gen handle." },
];

const STEPS = [
  { n: "01", icon: "🔍", t: "Search", d: "Find an available .gen name that represents your identity or project." },
  { n: "02", icon: "✍️", t: "Register", d: "Claim it on GenLayer with your wallet — pay with GEN tokens." },
  { n: "03", icon: "🔗", t: "Resolve", d: "Anyone can resolve your name to wallet addresses, records, and more." },
];

function Row({ k, v, icon }: { k: string; v: string; icon: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/10 last:border-none">
      <dt className="text-white/60 flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        {k}
      </dt>
      <dd className="font-mono text-white text-sm">{v}</dd>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-24 animate-fade-in">
      {/* Hero */}
      <section className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Badge tone="gradient" icon={<span>⚡</span>}>GenLayer Native Protocol</Badge>

          <h1 className="mt-6 text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-6xl dark:text-white">
            Your identity layer for{" "}
            <span className="gradient-text">GenLayer</span>
          </h1>

          <p className="mt-6 text-lg text-muted leading-relaxed max-w-xl">
            Register readable <span className="font-semibold text-primary">.gen</span> names for wallets, contracts, AI agents, projects, and apps built on GenLayer.
          </p>

          <div className="mt-10">
            <NameSearchBar />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-sm text-muted mr-2">Try:</span>
            {EXAMPLES.map((e) => (
              <Link
                key={e}
                to={`/search?name=${encodeURIComponent(e.replace(".gen", ""))}`}
                className="rounded-full border border-border/60 bg-white/80 px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 hover:border-primary/30 transition-all dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                {e}
              </Link>
            ))}
          </div>
        </div>

        {/* Preview Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-accent/20 rounded-3xl blur-3xl" />
          <Card padding="lg" className="relative bg-gradient-to-br from-inkLight to-ink border-white/10 dark:from-ink dark:to-inkLight">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl">
                  🌐
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">nova.gen</h3>
                  <p className="text-xs text-white/50">Verified Identity</p>
                </div>
              </div>
              <Badge tone="green" dot>Active</Badge>
            </div>
            <dl className="space-y-1 text-sm">
              <Row icon="👤" k="Owner" v="0xA3…F7c" />
              <Row icon="📍" k="Primary" v="0xA3…F7c" />
              <Row icon="🐦" k="X" v="@nova_build" />
              <Row icon="🌐" k="Website" v="nova.build" />
              <Row icon="🤖" k="Agent" v="swap.nova.gen" />
            </dl>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/40">Expires: Mar 2027</span>
              <span className="text-xs text-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                TrustSeal Verified
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="text-center mb-12">
          <Badge tone="primary">Features</Badge>
          <h2 className="mt-4 text-3xl font-bold text-ink dark:text-white">Why GNS?</h2>
          <p className="mt-2 text-muted">One name. Many records. Built for humans and agents.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title} hover className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mb-4 text-2xl">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-ink dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <div className="text-center mb-12">
          <Badge tone="info">Getting Started</Badge>
          <h2 className="mt-4 text-3xl font-bold text-ink dark:text-white">How it works</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <Card key={s.n} variant="gradient" className="relative overflow-hidden">
              <span className="absolute -top-4 -right-4 text-8xl font-bold text-primary/5 dark:text-primary/10">
                {s.n}
              </span>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-xl mb-4">
                  {s.icon}
                </div>
                <h3 className="text-xl font-bold text-ink dark:text-white">{s.t}</h3>
                <p className="mt-2 text-sm text-muted">{s.d}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { v: "5 GEN", l: "Per Year", icon: "🏷️" },
            { v: "61999", l: "Chain ID", icon: "⛓️" },
            { v: "∞", l: "Subnames", icon: "📁" },
            { v: "AI", l: "Trust Layer", icon: "🛡️" },
          ].map((s) => (
            <Card key={s.l} hover className="text-center">
              <span className="text-2xl">{s.icon}</span>
              <p className="mt-2 text-3xl font-bold gradient-text">{s.v}</p>
              <p className="mt-1 text-sm text-muted">{s.l}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* AI CTA */}
      <section>
        <Card padding="lg" variant="gradient" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-2 items-center">
            <div>
              <Badge tone="gradient" icon={<span>🤖</span>}>AI-Powered</Badge>
              <h2 className="mt-4 text-3xl font-bold text-ink dark:text-white">
                AI Protection Layer
              </h2>
              <p className="mt-4 text-muted leading-relaxed">
                Impersonation detection, dispute review, and brand protection — powered by GenLayer Equivalence-Principle prompts. The AI review layer provides trust signals for every .gen name.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/about">
                  <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primaryDark text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl transition-all">
                    Learn More
                  </button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/20 to-accent/20 flex items-center justify-center animate-pulse-glow">
                <span className="text-7xl">🛡️</span>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
