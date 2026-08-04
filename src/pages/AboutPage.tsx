import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/Badge";

const FAQ = [
  {
    icon: "🌐",
    q: "What is GNS?",
    a: "GNS is the GenLayer Naming Service, a protocol-level naming layer for the GenLayer ecosystem. It maps human-readable .gen names to wallets, contracts, AI agents, and project records.",
  },
  {
    icon: "📛",
    q: "What is a .gen name?",
    a: "A .gen name is a readable handle registered on the GNS contract. Examples include papito.gen and bountylens.gen.",
  },
  {
    icon: "📝",
    q: "What can I attach to a name?",
    a: "Avatar, website, X, GitHub, Discord, email, contract address, AI agent endpoint, and a short description.",
  },
  {
    icon: "📁",
    q: "What are subnames?",
    a: "Subnames are scoped names beneath your root, like pay.papito.gen. They share the parent's expiry.",
  },
  {
    icon: "🔄",
    q: "What is reverse lookup?",
    a: "Given an address, GNS returns its primary .gen name so apps can show your name instead of a hex address.",
  },
  {
    icon: "🤖",
    q: "What is an AI agent identity?",
    a: "A subname dedicated to an AI agent endpoint, so other services can verify which agent they are talking to.",
  },
  {
    icon: "⏰",
    q: "What happens when a name expires?",
    a: "Expired names become available again. Renew before expiry to keep your records intact.",
  },
  {
    icon: "🌍",
    q: "Is .gen a real DNS domain?",
    a: "No. GNS names are protocol-level names for the GenLayer ecosystem. They are not public DNS domains unless later connected to DNS or browser infrastructure.",
  },
];

const FEATURES = [
  { icon: "💳", title: "Paid Registration", desc: "Register names with GEN tokens on Studionet" },
  { icon: "🔗", title: "Reverse Lookup", desc: "Resolve addresses to their primary .gen name" },
  { icon: "📋", title: "Profile Records", desc: "Store social links, contracts, and agent endpoints" },
  { icon: "🔏", title: "TrustSeal Verification", desc: "On-chain identity proofs for X, GitHub, and Discord with proof health" },
  { icon: "📁", title: "Subnames", desc: "Create agent.you.gen, pay.you.gen, etc." },
  { icon: "🛡️", title: "AI Trust Layer", desc: "AI-assisted review for name verification" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <Badge tone="gradient" icon={<span>📚</span>}>Documentation</Badge>
        <h1 className="mt-4 text-4xl font-bold text-ink dark:text-white">About GNS</h1>
        <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
          Readable names for the intelligent contract economy. Register .gen names for wallets, contracts, AI agents, and apps on GenLayer.
        </p>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-2xl font-bold text-ink dark:text-white mb-6 text-center">Key Features</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} hover className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 mb-3 text-2xl">
                {f.icon}
              </div>
              <h3 className="font-bold text-ink dark:text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-2xl font-bold text-ink dark:text-white mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {FAQ.map((f) => (
            <Card key={f.q}>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-xl">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-ink dark:text-white">{f.q}</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{f.a}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Contract Info */}
      <Card variant="gradient" padding="lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
            📜
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-ink dark:text-white">Contract Information</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5">
                <p className="text-muted text-xs">Network</p>
                <p className="font-mono font-semibold text-ink dark:text-white">GenLayer Studionet</p>
              </div>
              <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5">
                <p className="text-muted text-xs">Chain ID</p>
                <p className="font-mono font-semibold text-ink dark:text-white">61999</p>
              </div>
              <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 sm:col-span-2">
                <p className="text-muted text-xs">GNS Contract</p>
                <p className="font-mono text-xs font-semibold text-primary break-all">0x6442D7C472e676Ee697e60a8AE729A33827dcddc</p>
              </div>
              <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 sm:col-span-2">
                <p className="text-muted text-xs">TrustSeal Contract</p>
                <p className="font-mono text-xs font-semibold text-primary break-all">0x11937A11f341Fc956c397A81D42d2F3Bff1a379c</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Limitations */}
      <Card padding="lg" className="border-warning/30 bg-warning/5">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center text-xl">
            ⚠️
          </div>
          <div>
            <h3 className="font-bold text-ink dark:text-white">Important Limitations</h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              GNS names are protocol-level names for the GenLayer ecosystem. They are not public DNS domains unless later connected to DNS or browser infrastructure. The AI protection layer (impersonation detection, dispute review, project verification) is architected in the contract but provides advisory signals only.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
