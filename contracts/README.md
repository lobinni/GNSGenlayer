# GNS Contracts

## GNSRegistry.py

The GenLayer Naming Service registry contract. Source of truth for `.gen` names.

| Field | Value |
|-------|-------|
| Network | GenLayer Studionet |
| Chain ID | 61999 |
| Address | `0x6442D7C472e676Ee697e60a8AE729A33827dcddc` |
| Version | 1.3.0 |
| Price | 5 GEN / year |

### View functions

| Method | Purpose |
|--------|---------|
| `contract_version` | Contract version string |
| `get_admin` / `get_treasury` | Admin and treasury addresses |
| `get_price_per_year` / `quote_registration` / `quote_renewal` | Pricing |
| `get_contract_balance` / `get_total_protocol_revenue` / `get_total_withdrawn` | Financials |
| `get_total_names` / `get_total_reports` / `get_total_reviews` / `get_total_evidence` | Counters |
| `is_available` | Check name availability |
| `resolve` / `resolve_address` / `reverse_lookup` | Name resolution |
| `get_records` / `get_names_by_owner` / `get_subnames` | Records and subnames |
| `get_report` / `get_ai_review` / `get_ai_status` / `get_web_evidence` | Reports and AI |
| `get_name_status` | Name status (active / expired / flagged / not_found) |

### Write functions

| Method | Purpose |
|--------|---------|
| `register(label, years, primary_address)` | Payable registration |
| `renew(name, years)` | Payable renewal |
| `transfer(name, new_owner)` | Transfer root name |
| `set_primary_address(name, address)` | Update resolver address |
| `set_primary_name(name)` | Set reverse record |
| `set_records(name, records_json)` | Update profile records |
| `clear_record(name, key)` | Clear single record |
| `create_subname(parent, sub_label, primary_address)` | Create subname |
| `transfer_subname(subname, new_owner)` | Transfer subname |
| `report_name(name, reason, evidence_url, comment)` | Submit report |
| `verify_name_url(name, evidence_type, url)` | Fetch and hash URL evidence |

### AI functions (Equivalence Principle)

| Method | EP mode | Purpose |
|--------|---------|---------|
| `ai_review_name` | `prompt_comparative` | Review name for impersonation / phishing risk |
| `ai_review_report` | `prompt_comparative` | Review a suspicious-name report |
| `ai_verify_project_claim` | `prompt_comparative` | Verify project identity claim |
| `ai_suggest_names` | `prompt_non_comparative` | Advisory name suggestions (does not mutate state) |

### Admin functions

| Method | Purpose |
|--------|---------|
| `admin_set_price_per_year` | Update price |
| `admin_set_treasury` | Update treasury address |
| `admin_withdraw` | Withdraw GEN to treasury |
| `admin_flag_name` / `admin_unflag_name` | Flag / unflag names |
| `admin_set_report_status` | Update report status |
| `admin_transfer_admin` | Transfer admin role |

---

## trust_seal.py

Reference stub for the TrustSeal identity verification contract.

The canonical contract source lives at **[lobinni/TrustSeal](https://github.com/lobinni/TrustSeal)**.

GNS only calls `get_identity(address)` from TrustSeal to display proof-health badges on `.gen` name profile pages. The full verification workflow (request, complete, reverify, revoke) is handled by the standalone TrustSeal application.

| Field | Value |
|-------|-------|
| Network | GenLayer Studionet |
| Address | `0x11937A11f341Fc956c397A81D42d2F3Bff1a379c` |
| Source | [lobinni/TrustSeal](https://github.com/lobinni/TrustSeal) |

### GNS reads from TrustSeal

| Method | What GNS uses it for |
|--------|---------------------|
| `get_identity(address)` | Show proof-health badges (ACTIVE / STALE / FLAGGED) on name profiles |

The full TrustSeal API (request_verification, complete_verification, reverify_platform, revoke_platform, flag_identity, unflag_identity, etc.) is documented in the [TrustSeal repository](https://github.com/lobinni/TrustSeal).
