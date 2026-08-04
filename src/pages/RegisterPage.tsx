import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { isAvailable, registerName, quoteRegistration, weiToGen } from "@/lib/gns/contract";
import { isValidLabel, normaliseName, stripGenSuffix } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

const DURATIONS = [1, 2, 3, 5];

export default function RegisterPage() {
  const { name: paramName } = useParams<{ name: string }>();
  const label = stripGenSuffix(decodeURIComponent(paramName || ""));
  const fullName = normaliseName(label);
  const { address } = useWallet();

  const [checking, setChecking] = useState(true);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [years, setYears] = useState(1);
  const [primary, setPrimary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [quoteWei, setQuoteWei] = useState<bigint | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    if (address && !primary) setPrimary(address);
  }, [address, primary]);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    isAvailable(fullName)
      .then((v) => { if (!cancelled) setAvailable(v); })
      .catch(() => { if (!cancelled) setAvailable(null); })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [fullName]);

  useEffect(() => {
    let cancelled = false;
    setQuoteError(null);
    quoteRegistration(years)
      .then((v) => { if (!cancelled) setQuoteWei(v); })
      .catch((e) => {
        if (!cancelled) {
          setQuoteWei(null);
          setQuoteError(e instanceof Error ? e.message : String(e));
        }
      });
    return () => { cancelled = true; };
  }, [years]);

  const onRegister = async () => {
    if (!address) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await registerName(label, years, primary || address);
      setStatus({ ok: res.success, message: res.message });
    } catch (e) {
      setStatus({ ok: false, message: e instanceof Error ? e.message : "Registration failed." });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isValidLabel(label)) {
    return (
      <div className="mx-auto max-w-xl animate-fade-in">
        <Card padding="lg" className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-error/10 mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-xl font-bold text-ink dark:text-white">Invalid Name</h2>
          <p className="mt-2 text-muted">"{label}" is not a valid .gen label.</p>
          <Link to="/search" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to search</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <Badge tone="primary" icon={<span>✍️</span>}>Register</Badge>
        <h1 className="mt-4 text-3xl font-bold text-ink dark:text-white">Claim {fullName}</h1>
        <p className="mt-2 text-muted">Secure your .gen identity on GenLayer</p>
      </div>

      {checking ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="mt-4 text-sm text-muted">Checking availability...</p>
        </div>
      ) : available === false ? (
        <Card padding="lg" className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-warning/10 mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-xl font-bold text-ink dark:text-white">{fullName} is not available</h2>
          <p className="mt-2 text-muted">This name has already been registered.</p>
          <Link to={`/name/${encodeURIComponent(fullName)}`} className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
            View profile <span>→</span>
          </Link>
        </Card>
      ) : (
        <>
          <Card>
            <div className="space-y-6">
              {/* Step 1: Name */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-primary mb-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">1</span>
                  Name
                </div>
                <p className="font-mono text-2xl font-bold text-ink dark:text-white">{fullName}</p>
              </div>

              {/* Step 2: Duration */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted mb-3">
                  <span className="w-6 h-6 rounded-full bg-section text-ink flex items-center justify-center text-xs dark:bg-white/10 dark:text-white">2</span>
                  Registration Period
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {DURATIONS.map((y) => (
                    <button
                      key={y}
                      onClick={() => setYears(y)}
                      className={`rounded-xl border-2 px-4 py-3 text-center font-semibold transition-all ${
                        years === y
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 bg-white/80 text-ink hover:border-primary/30 dark:bg-white/5 dark:border-white/10 dark:text-white"
                      }`}
                    >
                      {y} year{y > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Primary Address */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted mb-3">
                  <span className="w-6 h-6 rounded-full bg-section text-ink flex items-center justify-center text-xs dark:bg-white/10 dark:text-white">3</span>
                  Primary Address
                </div>
                <Input
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  placeholder="0x..."
                  hint="The address this name will resolve to"
                />
              </div>

              {/* Step 4: Summary */}
              <div className="p-4 rounded-xl bg-section dark:bg-white/5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted mb-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">4</span>
                  Summary
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Name</span>
                    <span className="font-mono font-semibold text-ink dark:text-white">{fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Duration</span>
                    <span className="font-semibold text-ink dark:text-white">{years} year{years > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border/40 dark:border-white/10">
                    <span className="text-muted">Total Cost</span>
                    <span className="font-bold text-lg text-primary">
                      {quoteWei !== null
                        ? `${weiToGen(quoteWei)} GEN`
                        : quoteError
                        ? "Unavailable"
                        : "Loading..."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              {!address ? (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted">Connect your wallet to register</p>
                  <ConnectWalletButton />
                </div>
              ) : (
                <Button 
                  onClick={onRegister} 
                  loading={submitting} 
                  disabled={quoteWei === null}
                  size="lg"
                  variant="gradient"
                  className="w-full"
                >
                  🚀 Register {fullName}
                </Button>
              )}

              {status && (
                <div className={`p-4 rounded-xl ${status.ok ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
                  <p className="text-sm font-medium">{status.message}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Success State */}
          {status?.ok && (
            <Card padding="lg" variant="gradient" className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-success/10 mb-4">
                <span className="text-4xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold text-ink dark:text-white">Congratulations!</h2>
              <p className="mt-2 text-muted">{fullName} is now yours!</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to={`/manage/${encodeURIComponent(fullName)}`}>
                  <Button variant="primary">⚙️ Manage</Button>
                </Link>
                <Link to={`/name/${encodeURIComponent(fullName)}`}>
                  <Button variant="secondary">👁️ View Profile</Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="ghost">📊 Dashboard</Button>
                </Link>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
