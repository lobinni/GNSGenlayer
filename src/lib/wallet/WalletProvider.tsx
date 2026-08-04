import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type WalletState = {
  address: string | null;
  chainId: number | null;
  connecting: boolean;
  hasInjected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToGenLayer: () => Promise<void>;
};

export const EXPECTED_CHAIN_ID = 61999;

const WalletContext = createContext<WalletState | null>(null);

type EthLike = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (args: unknown) => void) => void;
  removeListener?: (event: string, handler: (args: unknown) => void) => void;
};

function getEthereum(): EthLike | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: EthLike }).ethereum;
  return eth || null;
}

function parseChainId(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed) return null;
    try {
      return Number(trimmed.startsWith("0x") ? BigInt(trimmed) : BigInt(trimmed));
    } catch {
      return null;
    }
  }
  return null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [hasInjected, setHasInjected] = useState(false);

  useEffect(() => {
    const eth = getEthereum();
    setHasInjected(Boolean(eth));
    if (!eth) return;

    const saved = typeof window !== "undefined" ? window.localStorage.getItem("gns:address") : null;
    if (saved) setAddress(saved);

    eth.request({ method: "eth_chainId" }).then((cid) => {
      setChainId(parseChainId(cid));
    }).catch(() => {});

    const accountsHandler = (accounts: unknown) => {
      const list = Array.isArray(accounts) ? (accounts as string[]) : [];
      const a = list[0] || null;
      setAddress(a);
      if (a) window.localStorage.setItem("gns:address", a);
      else window.localStorage.removeItem("gns:address");
    };

    const chainHandler = (cid: unknown) => setChainId(parseChainId(cid));

    eth.on?.("accountsChanged", accountsHandler as (args: unknown) => void);
    eth.on?.("chainChanged", chainHandler as (args: unknown) => void);

    return () => {
      eth.removeListener?.("accountsChanged", accountsHandler as (args: unknown) => void);
      eth.removeListener?.("chainChanged", chainHandler as (args: unknown) => void);
    };
  }, []);

  const connect = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) {
      alert("No injected wallet detected. Install a wallet like MetaMask.");
      return;
    }
    setConnecting(true);
    try {
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      const a = accounts?.[0] || null;
      setAddress(a);
      if (a) window.localStorage.setItem("gns:address", a);
    } catch (e) {
      console.error(e);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    if (typeof window !== "undefined") window.localStorage.removeItem("gns:address");
  }, []);

  const switchToGenLayer = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) return;
    const hex = "0x" + EXPECTED_CHAIN_ID.toString(16);
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
    } catch (err) {
      const code = (err as { code?: number })?.code;
      if (code === 4902) {
        try {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: hex,
                chainName: "GenLayer Studionet",
                nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
                rpcUrls: ["https://studio.genlayer.com/api"],
                blockExplorerUrls: ["https://explorer-studio.genlayer.com/"],
              },
            ],
          });
        } catch (e) {
          console.warn("Failed to add Studionet to wallet", e);
        }
      } else {
        console.warn("Failed to switch network", err);
      }
    }
  }, []);

  const value = useMemo<WalletState>(
    () => ({ address, chainId, connecting, hasInjected, connect, disconnect, switchToGenLayer }),
    [address, chainId, connecting, hasInjected, connect, disconnect, switchToGenLayer]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
