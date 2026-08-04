# GNS — GenLayer Naming Service

Readable names for the intelligent contract economy. GNS lets wallets, contracts, AI agents, apps, and project teams register `.gen` names on GenLayer, attach profile records, create subnames, and use GenLayer's validator network for AI-assisted identity and dispute review.

GNS is a GenLayer-native naming registry. Simple registry actions such as registration, renewal, and record updates are deterministic. Subjective trust decisions such as name review, report review, and project verification go through comparative AI consensus via the Equivalence Principle. Identity verification is handled by the separate [TrustSeal](https://github.com/lobinni/TrustSeal) contract — GNS reads proof-health data from it to display verification badges on name profiles.

## What it does

Connect a wallet, search for a `.gen` name, and register it with GEN on Studionet. Once registered the owner can attach records such as website, X, GitHub, Discord, email, contract address, agent endpoint, and description. Anyone can resolve the name to its owner, primary address, profile records, AI trust status, and subnames.

- Human-readable `.gen` names for wallets, contracts, agents, projects, and apps
- Paid registration and renewal with GEN (default 5 GEN per year)
- Reverse lookup from wallet address to primary `.gen` name
- Profile records for identity, social links, contracts, and agent endpoints
- TrustSeal proof-health badges on name profiles (read-only integration)
- Validator-agreed URL evidence with stored SHA-256 response hashes
- Subnames such as `swap.nova.gen` and `bot.nova.gen`
- Suspicious-name reports for phishing, impersonation, brand misuse, and squatting
- Comparative AI trust layer for name review, report review, and project verification
- Admin protocol controls for price, treasury, withdrawals, flags, and report status
- No backend database — all state lives in GenLayer contracts

## How it works

**For name owners:**

1. Search for an available `.gen` name.
2. Register it for 1–5 years by paying the quoted GEN amount.
3. Set profile records (website, X, GitHub, Discord, email, contract, agent, description).
4. Set the name as the primary reverse record for the connected wallet.
5. Create subnames for payments, agents, apps, or contracts.
6. Transfer names or subnames when ownership changes.
7. Request AI-assisted project verification when the name represents a real project.

**For resolvers and users:**

1. Resolve a `.gen` name to its owner, primary address, records, status, and AI trust state.
2. Reverse-resolve a wallet address to its primary `.gen` name.
3. Inspect public profile data, subnames, and TrustSeal verification badges.
4. Report suspicious names with a reason, evidence URL, and comment.
5. Read AI review results once comparative consensus has stored a review.

**For protocol operators:**

1. Connect the admin wallet on `/ops-gns`.
2. Inspect treasury, contract balance, revenue, withdrawals, total names, and total reports.
3. Update registration price, treasury address, or withdraw accumulated GEN.
4. Flag or unflag names. Update report status. Transfer admin role.

## Registry lifecycle

| Stage    | What happens |
|----------|-------------|
| Search   | User checks whether a `.gen` name is available. |
| Register | Owner pays GEN and receives the name for 1–5 years. |
| Configure| Owner sets records, primary address, reverse name, and subnames. |
| Resolve  | Anyone reads name data from the contract. |
| Report   | A user submits a suspicious-name report with evidence. |
| Review   | GenLayer comparative AI consensus reviews names, reports, or project claims. |
| Renew    | Owner extends expiration by paying the quoted renewal amount. |
| Transfer | Owner moves a name or subname to a new address. |

## GenLayer consensus functions

| Function | What GenLayer does |
|----------|-------------------|
| `verify_name_url(name, evidence_type, url)` | Validators fetch an HTTPS URL with `gl.nondet.web.get`, agree with `strict_eq`, and store byte count and SHA-256 evidence hash. |
| `ai_review_name(name, claim, evidence_url, extra_context)` | Validators independently review identity, impersonation, phishing, and verification risk using `prompt_comparative`. |
| `ai_review_report(report_id)` | Validators review a suspicious-name report and recommend `reviewed`, `flagged`, or `dismissed` using `prompt_comparative`. |
| `ai_verify_project_claim(name, project_name, website, x, github, explanation)` | Validators review whether the `.gen` name legitimately represents the claimed project using `prompt_comparative`. |
| `ai_suggest_names(base_label, purpose)` | Advisory name suggestions only using `prompt_non_comparative`. Does not mutate ownership, verification, reports, or funds. |

## TrustSeal integration

GNS reads identity data from the [TrustSeal](https://github.com/lobinni/TrustSeal) contract deployed at `0x11937A11f341Fc956c397A81D42d2F3Bff1a379c`. When viewing a `.gen` name profile, GNS calls `get_identity(owner_address)` on TrustSeal to check whether the name owner has active proof-health links for their X, GitHub, or Discord accounts. The proof badges are displayed read-only — the full TrustSeal verification flow (request, complete, reverify, revoke) is handled by the standalone TrustSeal frontend.

## Contracts

| Field | Value |
|-------|-------|
| Network | GenLayer Studionet |
| Chain ID | `61999` |
| RPC | `https://studio.genlayer.com/api` |
| Explorer | `https://explorer-studio.genlayer.com/` |
| GNS Registry | [`0x6442D7C472e676Ee697e60a8AE729A33827dcddc`](https://explorer-studio.genlayer.com/address/0x6442D7C472e676Ee697e60a8AE729A33827dcddc) |
| GNS version | `1.3.0` |
| GNS source | `contracts/GNSRegistry.py` |
| TrustSeal | [`0x11937A11f341Fc956c397A81D42d2F3Bff1a379c`](https://explorer-studio.genlayer.com/address/0x11937A11f341Fc956c397A81D42d2F3Bff1a379c) |
| TrustSeal source | [lobinni/TrustSeal](https://github.com/lobinni/TrustSeal) |
| Default price | `5 GEN / year` |

## Deterministic contract functions

| Function | Purpose |
|----------|---------|
| `register(label, years, primary_address)` | Payable registration for a root `.gen` name. |
| `renew(name, years)` | Payable renewal for an existing name. |
| `transfer(name, new_owner)` | Transfer a root name to a new owner. |
| `set_primary_address(name, address)` | Update the address a name resolves to. |
| `set_primary_name(name)` | Set reverse lookup for the sender wallet. |
| `set_records(name, records_json)` | Update profile/project/agent records. |
| `clear_record(name, key)` | Clear one record key. |
| `create_subname(parent, sub_label, primary_address)` | Create a subname under an owned root name. |
| `transfer_subname(subname, new_owner)` | Transfer a subname to another owner. |
| `report_name(name, reason, evidence_url, comment)` | Submit a suspicious-name report. |
| `verify_name_url(name, evidence_type, url)` | Owner-only HTTPS evidence fetch and hash storage. |
| `admin_set_price_per_year(price_wei)` | Admin updates yearly registration price. |
| `admin_set_treasury(address)` | Admin updates withdrawal treasury. |
| `admin_withdraw(amount_wei)` | Admin withdraws accrued GEN to treasury. |
| `admin_flag_name(name, reason)` | Admin flags a registered name. |
| `admin_unflag_name(name)` | Admin clears a flag. |
| `admin_set_report_status(report_id, status)` | Admin updates report status. |
| `admin_transfer_admin(new_admin)` | Admin transfers admin role. |

## Tech stack

| Layer | Tech |
|-------|------|
| Intelligent contract | GenLayer Python · `gl.eq_principle.prompt_comparative` · `gl.eq_principle.prompt_non_comparative` · `gl.nondet.web.get` · `gl.eq_principle.strict_eq` · payable writes |
| Identity verification | Read-only from [TrustSeal](https://github.com/lobinni/TrustSeal) contract (`get_identity`) |
| Frontend | React 19 · Vite · TypeScript · Tailwind CSS v4 |
| Web3 | `genlayer-js` 1.1.7 |
| Wallet | Injected wallet (MetaMask) |
| Routing | React Router v7 · client-side SPA |
| Storage | None — all state lives in GenLayer contracts |

## Repository structure

```
contracts/
  GNSRegistry.py              GenLayer naming registry (deployed)
  trust_seal.py               TrustSeal reference stub (source: lobinni/TrustSeal)

tests/
  test_gns_registry.py        GNS contract tests (gltest, 22 deterministic + 2 AI)
  test_trustseal_integration.py  TrustSeal read-only integration tests (16 deterministic + 1 AI)

src/
  App.tsx                     Router and layout
  main.tsx                    Entry point
  index.css                   Tailwind theme

  pages/
    HomePage.tsx              Landing page with search
    SearchPage.tsx            Name availability and AI suggestions
    RegisterPage.tsx          Registration flow with pricing
    NameProfilePage.tsx       Public profile with records and TrustSeal badges
    DashboardPage.tsx         All names owned by connected wallet
    ManagePage.tsx            Records, renew, transfer, set primary
    SubnamesPage.tsx          Subname creation and management
    ResolvePage.tsx           Forward and reverse lookup
    DisputesPage.tsx          Report submission and recent reports
    OpsGnsPage.tsx            Admin protocol controls
    AboutPage.tsx             FAQ and contract information

  components/
    Navbar.tsx  Footer.tsx  Badge.tsx  ThemeToggle.tsx
    NameSearchBar.tsx  NameStatusCard.tsx  DashboardNameCard.tsx
    ConnectWalletButton.tsx  AiResultCard.tsx
    AddressText.tsx  CopyButton.tsx
    ui/Card.tsx  ui/Button.tsx  ui/Input.tsx  ui/Textarea.tsx

  lib/
    genlayer/client.ts        GenLayer SDK wrapper (read + write)
    gns/contract.ts           Typed GNS contract surface
    trustseal/client.ts       Read-only TrustSeal client (get_identity only)
    wallet/WalletProvider.tsx  Injected wallet context
    theme/ThemeProvider.tsx    Dark / light mode
    types.ts                  Shared type definitions
    utils.ts                  Name validation and formatting

vercel.json                   Vercel deploy config with SPA rewrites
vite.config.ts                Dev config (singlefile for sandbox)
vite.config.vercel.ts         Production config for Vercel
```

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Running contract tests

```bash
# Deterministic tests (no AI, no web fetch)
gltest tests/test_gns_registry.py
gltest tests/test_trustseal_integration.py

# Include AI consensus tests (requires GenLayer Studio with validators)
GNS_RUN_AI=1 gltest tests/
```

## Deploy to Vercel

1. Push to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Vercel reads `vercel.json` automatically:
   - **Build**: `npx vite build --config vite.config.vercel.ts`
   - **Output**: `dist`
   - **Framework**: Vite
4. No environment variables needed. No database needed.
5. Click Deploy.

The frontend is a static SPA. Vercel serves the files and rewrites all routes to `index.html` for client-side routing. All data reads and writes go directly to GenLayer contracts via `genlayer-js`.

## Important notes

- `.gen` names are protocol-level names for the GenLayer ecosystem. They are not public DNS domains.
- AI review is an assistive trust layer. It can flag, verify, or recommend, but protocol operators can still perform human review through admin controls.
- TrustSeal proof badges on GNS profiles are read-only. The verification flow lives at [lobinni/TrustSeal](https://github.com/lobinni/TrustSeal).
- Do not fund test wallets with mainnet assets.
- Do not use GNS to impersonate real people, protocols, or support accounts.

## Disclaimer

GNS provides decentralized naming, profile records, and AI-assisted identity review for the GenLayer ecosystem. It is not public DNS, legal identity verification, trademark adjudication, or a regulated trust service.
