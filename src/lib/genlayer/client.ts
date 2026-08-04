// GenLayer client wrapper for the GNS frontend.
// Reads use a plain GenLayer client (no account needed).
// Writes route through the injected wallet (window.ethereum) via the SDK.

export const GNS_CONTRACT_ADDRESS = "0x6442D7C472e676Ee697e60a8AE729A33827dcddc";
export const GENLAYER_RPC_URL = "https://studio.genlayer.com/api";
export const CHAIN_NAME = "studionet";
export const EXPLORER_URL = "https://explorer-studio.genlayer.com/";

export function isConfigured(): boolean {
  return GNS_CONTRACT_ADDRESS.length > 0;
}

type AnyClient = {
  readContract: (args: {
    address: string;
    functionName: string;
    args: unknown[];
    stateStatus?: string;
  }) => Promise<unknown>;
  writeContract: (args: {
    address: string;
    functionName: string;
    args: unknown[];
    value?: bigint;
  }) => Promise<unknown>;
  waitForTransactionReceipt?: (args: {
    hash: string;
    status?: string;
    retries?: number;
    interval?: number;
  }) => Promise<unknown>;
  connect?: (chainName: string) => Promise<void>;
  initializeConsensusSmartContract?: () => Promise<void>;
};

let cachedReadClient: AnyClient | null = null;
let cachedWriteClient: AnyClient | null = null;
let cachedWriteAddress: string | null = null;
let cachedWriteConnected = false;

async function loadGenlayer(): Promise<Record<string, unknown> | null> {
  try {
    const mod = (await import("genlayer-js")) as unknown as Record<string, unknown>;
    return mod;
  } catch {
    return null;
  }
}

async function loadChain(): Promise<unknown> {
  try {
    const mod = (await import("genlayer-js/chains")) as unknown as Record<string, unknown>;
    return (
      mod.studionet || mod.studio || mod.testnetAsimov || mod.localnet || mod.simulator || null
    );
  } catch {
    const root = await loadGenlayer();
    if (!root) return null;
    const chains = (root.chains || root) as Record<string, unknown>;
    return (
      chains.studionet || chains.studio || chains.testnetAsimov || chains.localnet || chains.simulator || null
    );
  }
}

export async function getReadClient(): Promise<AnyClient | null> {
  if (cachedReadClient) return cachedReadClient;
  const mod = await loadGenlayer();
  if (!mod) return null;
  const createClient = mod.createClient as
    | ((args: { chain: unknown }) => AnyClient)
    | undefined;
  if (!createClient) return null;
  try {
    const chain = await loadChain();
    cachedReadClient = createClient({ chain });
    return cachedReadClient;
  } catch (e) {
    console.error("GenLayer read client init failed", e);
    return null;
  }
}

export async function getWriteClient(address?: string): Promise<AnyClient | null> {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: unknown }).ethereum;
  if (!eth) return null;

  if (cachedWriteClient && cachedWriteAddress === (address || null)) {
    return cachedWriteClient;
  }

  const mod = await loadGenlayer();
  if (!mod) return null;
  const createClient = mod.createClient as
    | ((args: { chain: unknown; account?: unknown; provider?: unknown }) => AnyClient)
    | undefined;
  if (!createClient) return null;
  try {
    const chain = await loadChain();
    cachedWriteClient = createClient({
      chain,
      account: address,
      provider: eth,
    });
    cachedWriteAddress = address || null;
    cachedWriteConnected = false;
    return cachedWriteClient;
  } catch (e) {
    console.error("GenLayer write client init failed", e);
    return null;
  }
}

async function ensureConnected(client: AnyClient): Promise<void> {
  if (cachedWriteConnected) return;
  if (typeof client.connect === "function") {
    try {
      await client.connect(CHAIN_NAME);
      cachedWriteConnected = true;
      return;
    } catch (e) {
      console.warn("client.connect failed, attempting without explicit connect", e);
    }
  }
  if (typeof client.initializeConsensusSmartContract === "function") {
    try {
      await client.initializeConsensusSmartContract();
    } catch (e) {
      console.warn("initializeConsensusSmartContract failed", e);
    }
  }
  cachedWriteConnected = true;
}

export async function readView<T>(functionName: string, args: unknown[] = []): Promise<T> {
  if (!isConfigured()) {
    throw new Error(
      "GNS contract address is not configured."
    );
  }
  const client = await getReadClient();
  if (!client) throw new Error("GenLayer client unavailable in this environment.");
  const out = await client.readContract({
    address: GNS_CONTRACT_ADDRESS,
    functionName,
    args,
    stateStatus: "accepted",
  });
  return out as T;
}

function getConnectedAddress(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const v = window.localStorage.getItem("gns:address");
  return v || undefined;
}

export async function writeMethod(
  functionName: string,
  args: unknown[] = [],
  value?: bigint
): Promise<unknown> {
  if (!isConfigured()) {
    throw new Error(
      "GNS contract address is not configured."
    );
  }
  const address = getConnectedAddress();
  const client = await getWriteClient(address);
  if (!client) throw new Error("Connect an injected wallet to send transactions.");
  await ensureConnected(client);
  const tx = (await client.writeContract({
    address: GNS_CONTRACT_ADDRESS,
    functionName,
    args,
    ...(value !== undefined ? { value } : {}),
  })) as { hash?: string } | string;
  const hash = typeof tx === "string" ? tx : tx?.hash;
  if (hash && client.waitForTransactionReceipt) {
    try {
      await client.waitForTransactionReceipt({
        hash,
        status: "ACCEPTED",
        retries: 50,
        interval: 3000,
      });
    } catch (e) {
      console.warn("waitForTransactionReceipt timed out or failed", e);
    }
  }
  return tx;
}
