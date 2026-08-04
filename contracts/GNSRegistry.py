# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json
import typing


ROOT_SUFFIX = ".gen"
SECONDS_PER_YEAR = 31536000
GEN_DECIMALS = 1000000000000000000
DEFAULT_PRICE_PER_YEAR_WEI = 5 * GEN_DECIMALS
CONTRACT_VERSION = "1.3.0"


class GNSRegistry(gl.Contract):
    admin: str
    treasury: str

    names: TreeMap[str, str]
    owner_names: TreeMap[str, str]
    reverse_records: TreeMap[str, str]
    parent_subnames: TreeMap[str, str]
    reports: TreeMap[str, str]
    ai_reviews: TreeMap[str, str]
    web_evidence: TreeMap[str, str]

    name_counter: u256
    report_counter: u256
    review_counter: u256
    evidence_counter: u256

    price_per_year_wei: u256
    total_protocol_revenue: u256
    total_withdrawn: u256

    def __init__(self) -> None:
        self.admin = str(gl.message.sender_address).lower()
        self.treasury = str(gl.message.sender_address).lower()
        self.name_counter = u256(0)
        self.report_counter = u256(0)
        self.review_counter = u256(0)
        self.evidence_counter = u256(0)
        self.price_per_year_wei = u256(DEFAULT_PRICE_PER_YEAR_WEI)
        self.total_protocol_revenue = u256(0)
        self.total_withdrawn = u256(0)

    # ── helpers ──────────────────────────────────────────────────────────────

    def _sender(self) -> str:
        return str(gl.message.sender_address).lower()

    def _now_ts(self) -> u256:
        import time
        return u256(int(time.time()))

    def _jdump(self, obj: typing.Any) -> str:
        return json.dumps(obj, separators=(",", ":"))

    def _ok(self, msg: str, data: typing.Any) -> str:
        return self._jdump({"success": True, "message": msg, "data": data})

    def _empty_records(self) -> dict[str, str]:
        return {
            "avatar": "", "website": "", "x": "", "github": "",
            "discord": "", "email": "", "contract": "", "agent": "",
            "description": "",
        }

    def _allowed_key(self, k: str) -> bool:
        return k in (
            "avatar", "website", "x", "github", "discord",
            "email", "contract", "agent", "description",
        )

    def _norm(self, raw: str) -> str:
        s = raw.strip().lower()
        return s if s.endswith(ROOT_SUFFIX) else s + ROOT_SUFFIX

    def _label(self, raw: str) -> str:
        s = raw.strip().lower()
        return s[:-len(ROOT_SUFFIX)] if s.endswith(ROOT_SUFFIX) else s

    def _valid_root(self, lab: str) -> bool:
        if not lab or len(lab) < 3 or len(lab) > 32:
            return False
        if lab == "gen" or "." in lab:
            return False
        if lab[0] == "-" or lab[-1] == "-":
            return False
        ok = "abcdefghijklmnopqrstuvwxyz0123456789-"
        for c in lab:
            if c not in ok:
                return False
        return True

    def _valid_sub(self, lab: str) -> bool:
        if not lab or len(lab) < 2 or len(lab) > 32:
            return False
        if "." in lab or lab[0] == "-" or lab[-1] == "-":
            return False
        ok = "abcdefghijklmnopqrstuvwxyz0123456789-"
        for c in lab:
            if c not in ok:
                return False
        return True

    def _exists(self, fn: str) -> bool:
        return self.names.get(fn, "") != ""

    def _load(self, fn: str) -> typing.Any:
        raw = self.names.get(fn, "")
        return json.loads(raw) if raw else None

    def _save(self, fn: str, obj: typing.Any) -> None:
        self.names[fn] = self._jdump(obj)

    def _expired(self, obj: typing.Any) -> bool:
        return u256(obj.get("expires_at", 0)) < self._now_ts()

    def _clean_addr(self, addr: str, label: str) -> str:
        c = str(addr).strip().lower()
        if not c or not c.startswith("0x") or len(c) != 42:
            raise Exception(label + " must be a valid 0x address")
        return c

    def _owner_list(self, owner: str) -> list[str]:
        raw = self.owner_names.get(owner.lower(), "[]")
        return json.loads(raw)

    def _save_owner_list(self, owner: str, arr: list[str]) -> None:
        self.owner_names[owner.lower()] = self._jdump(arr)

    def _add_owner(self, owner: str, fn: str) -> None:
        arr = self._owner_list(owner)
        if fn not in arr:
            arr.append(fn)
        self._save_owner_list(owner, arr)

    def _rm_owner(self, owner: str, fn: str) -> None:
        arr = self._owner_list(owner)
        self._save_owner_list(owner, [x for x in arr if x != fn])

    def _sub_list(self, parent: str) -> list[str]:
        raw = self.parent_subnames.get(parent, "[]")
        return json.loads(raw)

    def _add_sub(self, parent: str, sub: str) -> None:
        arr = self._sub_list(parent)
        if sub not in arr:
            arr.append(sub)
        self.parent_subnames[parent] = self._jdump(arr)

    def _empty_ai(self) -> dict[str, typing.Any]:
        return {"risk": "unreviewed", "verified": False, "last_review_id": ""}

    def _require_admin(self) -> None:
        if self._sender() != self.admin:
            raise Exception("Only admin")

    # ── VIEW ─────────────────────────────────────────────────────────────────

    @gl.public.view
    def contract_version(self) -> str:
        return CONTRACT_VERSION

    @gl.public.view
    def get_admin(self) -> str:
        return self.admin

    @gl.public.view
    def get_treasury(self) -> str:
        return self.treasury

    @gl.public.view
    def get_price_per_year(self) -> str:
        return str(int(self.price_per_year_wei))

    @gl.public.view
    def get_contract_balance(self) -> str:
        return str(int(self.balance))

    @gl.public.view
    def get_total_protocol_revenue(self) -> str:
        return str(int(self.total_protocol_revenue))

    @gl.public.view
    def get_total_withdrawn(self) -> str:
        return str(int(self.total_withdrawn))

    @gl.public.view
    def get_total_names(self) -> str:
        return str(int(self.name_counter))

    @gl.public.view
    def get_total_reports(self) -> str:
        return str(int(self.report_counter))

    @gl.public.view
    def get_total_reviews(self) -> str:
        return str(int(self.review_counter))

    @gl.public.view
    def get_total_evidence(self) -> str:
        return str(int(self.evidence_counter))

    @gl.public.view
    def quote_registration(self, years: str) -> str:
        y = int(years)
        if y < 1 or y > 5:
            raise Exception("Years must be 1-5")
        return str(int(self.price_per_year_wei) * y)

    @gl.public.view
    def quote_renewal(self, years: str) -> str:
        y = int(years)
        if y < 1 or y > 5:
            raise Exception("Years must be 1-5")
        return str(int(self.price_per_year_wei) * y)

    @gl.public.view
    def is_available(self, name: str) -> str:
        fn = self._norm(name)
        lab = self._label(fn)
        if not self._valid_root(lab):
            return self._jdump(False)
        if not self._exists(fn):
            return self._jdump(True)
        obj = self._load(fn)
        if obj and self._expired(obj):
            return self._jdump(True)
        return self._jdump(False)

    @gl.public.view
    def resolve(self, name: str) -> str:
        fn = self._norm(name)
        obj = self._load(fn)
        if obj is None:
            return self._jdump({"full_name": fn, "status": "not_found"})
        if self._expired(obj):
            obj["status"] = "expired"
        elif obj.get("flagged", False):
            obj["status"] = "flagged"
        else:
            obj["status"] = "active"
        return self._jdump(obj)

    @gl.public.view
    def resolve_address(self, name: str) -> str:
        fn = self._norm(name)
        obj = self._load(fn)
        if obj is None or self._expired(obj):
            return ""
        return obj.get("primary_address", "")

    @gl.public.view
    def reverse_lookup(self, address: str) -> str:
        return self.reverse_records.get(address.strip().lower(), "")

    @gl.public.view
    def get_records(self, name: str) -> str:
        obj = self._load(self._norm(name))
        if obj is None:
            return self._jdump({})
        return self._jdump(obj.get("records", {}))

    @gl.public.view
    def get_names_by_owner(self, owner: str) -> str:
        return self._jdump(self._owner_list(owner))

    @gl.public.view
    def get_subnames(self, parent_name: str) -> str:
        return self._jdump(self._sub_list(self._norm(parent_name)))

    @gl.public.view
    def get_report(self, report_id: str) -> str:
        raw = self.reports.get(report_id, "")
        if raw == "":
            return self._jdump({"id": report_id, "status": "not_found"})
        return raw

    @gl.public.view
    def get_ai_review(self, review_id: str) -> str:
        raw = self.ai_reviews.get(review_id, "")
        if raw == "":
            return self._jdump({"id": review_id, "status": "not_found"})
        return raw

    @gl.public.view
    def get_ai_status(self, name: str) -> str:
        obj = self._load(self._norm(name))
        if obj is None:
            return self._jdump(self._empty_ai())
        return self._jdump(obj.get("ai_status", self._empty_ai()))

    @gl.public.view
    def get_web_evidence(self, evidence_id: str) -> str:
        raw = self.web_evidence.get(evidence_id, "")
        if raw == "":
            return self._jdump({"id": evidence_id, "status": "not_found"})
        return raw

    @gl.public.view
    def get_name_status(self, name: str) -> str:
        obj = self._load(self._norm(name))
        if obj is None:
            return "not_found"
        if self._expired(obj):
            return "expired"
        if obj.get("flagged", False):
            return "flagged"
        return "active"

    # ── WRITE: registration ──────────────────────────────────────────────────

    @gl.public.write.payable
    def register(self, label: str, years: str, primary_address: str) -> str:
        sender = self._sender()
        lab = label.strip().lower()
        y = int(years)

        if not self._valid_root(lab):
            raise Exception("Invalid label: 3-32 chars, a-z 0-9 hyphen")
        if y < 1 or y > 5:
            raise Exception("Years must be 1-5")

        pa = self._clean_addr(primary_address, "Primary address")
        fn = lab + ROOT_SUFFIX

        avail_raw = self.is_available(fn)
        if avail_raw == self._jdump(False):
            raise Exception(fn + " is not available")

        required = int(self.price_per_year_wei) * y
        paid = int(gl.message.value)
        if paid < required:
            raise Exception("Insufficient payment")

        now = self._now_ts()
        exp = u256(int(now) + y * SECONDS_PER_YEAR)

        self.name_counter = u256(int(self.name_counter) + 1)

        obj = {
            "label": lab,
            "full_name": fn,
            "parent": "",
            "is_subname": False,
            "owner": sender,
            "primary_address": pa,
            "created_at": int(now),
            "expires_at": int(exp),
            "records": self._empty_records(),
            "ai_status": self._empty_ai(),
            "flagged": False,
            "flag_reason": "",
        }

        self._save(fn, obj)
        self._add_owner(sender, fn)
        self.total_protocol_revenue = u256(int(self.total_protocol_revenue) + paid)

        return self._ok("Registered " + fn, {"name": fn, "owner": sender, "expires_at": int(exp)})

    @gl.public.write.payable
    def renew(self, name: str, years: str) -> str:
        fn = self._norm(name)
        y = int(years)
        if y < 1 or y > 5:
            raise Exception("Years must be 1-5")

        obj = self._load(fn)
        if obj is None:
            raise Exception(fn + " does not exist")

        required = int(self.price_per_year_wei) * y
        paid = int(gl.message.value)
        if paid < required:
            raise Exception("Insufficient payment")

        cur_exp = int(obj.get("expires_at", 0))
        now = int(self._now_ts())
        base = max(cur_exp, now)
        new_exp = base + y * SECONDS_PER_YEAR

        obj["expires_at"] = new_exp
        self._save(fn, obj)
        self.total_protocol_revenue = u256(int(self.total_protocol_revenue) + paid)

        return self._ok("Renewed " + fn, {"name": fn, "new_expires_at": new_exp})

    # ── WRITE: ownership & records ───────────────────────────────────────────

    @gl.public.write
    def transfer(self, name: str, new_owner: str) -> str:
        sender = self._sender()
        fn = self._norm(name)
        no = self._clean_addr(new_owner, "New owner")

        obj = self._load(fn)
        if obj is None:
            raise Exception(fn + " does not exist")
        if obj.get("owner", "").lower() != sender:
            raise Exception("Only the owner can transfer")
        if obj.get("is_subname", False):
            raise Exception("Use transfer_subname for subnames")

        old = obj["owner"]
        obj["owner"] = no
        obj["primary_address"] = no
        self._save(fn, obj)
        self._rm_owner(old, fn)
        self._add_owner(no, fn)

        rk = old.strip().lower()
        if self.reverse_records.get(rk, "") == fn:
            self.reverse_records[rk] = ""

        return self._ok("Transferred " + fn, {"name": fn, "from": old, "to": no})

    @gl.public.write
    def set_primary_address(self, name: str, address: str) -> str:
        sender = self._sender()
        fn = self._norm(name)
        addr = self._clean_addr(address, "Address")

        obj = self._load(fn)
        if obj is None:
            raise Exception(fn + " does not exist")
        if obj.get("owner", "").lower() != sender:
            raise Exception("Only the owner")

        obj["primary_address"] = addr
        self._save(fn, obj)
        return self._ok("Primary address set", {"name": fn, "primary_address": addr})

    @gl.public.write
    def set_primary_name(self, name: str) -> str:
        sender = self._sender()
        fn = self._norm(name)

        obj = self._load(fn)
        if obj is None:
            raise Exception(fn + " does not exist")
        if obj.get("owner", "").lower() != sender:
            raise Exception("Only the owner")
        if self._expired(obj):
            raise Exception(fn + " is expired")

        self.reverse_records[sender] = fn
        return self._ok("Primary name set", {"address": sender, "primary_name": fn})

    @gl.public.write
    def set_records(self, name: str, records_json: str) -> str:
        sender = self._sender()
        fn = self._norm(name)

        obj = self._load(fn)
        if obj is None:
            raise Exception(fn + " does not exist")
        if obj.get("owner", "").lower() != sender:
            raise Exception("Only the owner")

        new_rec = json.loads(records_json)
        cur = obj.get("records", self._empty_records())

        for k, v in new_rec.items():
            if self._allowed_key(k):
                sv = str(v)
                if len(sv) > 500:
                    raise Exception("Record " + k + " exceeds 500 chars")
                cur[k] = sv

        obj["records"] = cur
        self._save(fn, obj)
        return self._ok("Records updated", {"name": fn})

    @gl.public.write
    def clear_record(self, name: str, key: str) -> str:
        sender = self._sender()
        fn = self._norm(name)

        obj = self._load(fn)
        if obj is None:
            raise Exception(fn + " does not exist")
        if obj.get("owner", "").lower() != sender:
            raise Exception("Only the owner")
        if not self._allowed_key(key):
            raise Exception("Invalid record key")

        rec = obj.get("records", self._empty_records())
        rec[key] = ""
        obj["records"] = rec
        self._save(fn, obj)
        return self._ok("Record cleared", {"name": fn, "key": key})

    # ── WRITE: subnames ──────────────────────────────────────────────────────

    @gl.public.write
    def create_subname(self, parent: str, sub_label: str, primary_address: str) -> str:
        sender = self._sender()
        pn = self._norm(parent)
        sl = sub_label.strip().lower()
        pa = self._clean_addr(primary_address, "Primary address")

        if not self._valid_sub(sl):
            raise Exception("Invalid sublabel: 2-32 chars, a-z 0-9 hyphen")

        pobj = self._load(pn)
        if pobj is None:
            raise Exception("Parent " + pn + " does not exist")
        if pobj.get("owner", "").lower() != sender:
            raise Exception("Only the parent owner")
        if pobj.get("is_subname", False):
            raise Exception("Cannot nest subnames")
        if self._expired(pobj):
            raise Exception("Parent is expired")

        sn = sl + "." + pn
        if self._exists(sn):
            raise Exception(sn + " already exists")

        self.name_counter = u256(int(self.name_counter) + 1)
        now = self._now_ts()

        sobj = {
            "label": sl,
            "full_name": sn,
            "parent": pn,
            "is_subname": True,
            "owner": sender,
            "primary_address": pa,
            "created_at": int(now),
            "expires_at": pobj.get("expires_at", 0),
            "records": self._empty_records(),
            "ai_status": self._empty_ai(),
            "flagged": False,
            "flag_reason": "",
        }

        self._save(sn, sobj)
        self._add_owner(sender, sn)
        self._add_sub(pn, sn)
        return self._ok("Subname created", {"subname": sn, "parent": pn})

    @gl.public.write
    def transfer_subname(self, subname: str, new_owner: str) -> str:
        sender = self._sender()
        fn = self._norm(subname)
        no = self._clean_addr(new_owner, "New owner")

        obj = self._load(fn)
        if obj is None:
            raise Exception(fn + " does not exist")
        if not obj.get("is_subname", False):
            raise Exception("Use transfer for root names")
        if obj.get("owner", "").lower() != sender:
            raise Exception("Only the owner")

        old = obj["owner"]
        obj["owner"] = no
        obj["primary_address"] = no
        self._save(fn, obj)
        self._rm_owner(old, fn)
        self._add_owner(no, fn)
        return self._ok("Subname transferred", {"subname": fn, "from": old, "to": no})

    # ── WRITE: reports ───────────────────────────────────────────────────────

    @gl.public.write
    def report_name(self, name: str, reason: str, evidence_url: str, comment: str) -> str:
        sender = self._sender()
        fn = self._norm(name)

        if len(reason) > 80:
            raise Exception("Reason max 80 chars")
        if len(evidence_url) > 300:
            raise Exception("Evidence URL max 300 chars")
        if len(comment) > 700:
            raise Exception("Comment max 700 chars")

        self.report_counter = u256(int(self.report_counter) + 1)
        rid = str(int(self.report_counter))

        report = {
            "id": rid,
            "name": fn,
            "name_exists": self._exists(fn),
            "reporter": sender,
            "reason": reason,
            "evidence_url": evidence_url,
            "comment": comment,
            "status": "open",
            "created_at": int(self._now_ts()),
            "ai_review_id": "",
        }
        self.reports[rid] = self._jdump(report)
        return self._ok("Report submitted", {"report_id": rid, "name": fn})

    # ── WRITE: web evidence ──────────────────────────────────────────────────

    @gl.public.write
    def verify_name_url(self, name: str, evidence_type: str, url: str) -> str:
        sender = self._sender()
        fn = self._norm(name)

        obj = self._load(fn)
        if obj is None:
            raise Exception(fn + " does not exist")
        if obj.get("owner", "").lower() != sender:
            raise Exception("Only the owner")
        if len(url) > 500:
            raise Exception("URL max 500 chars")

        def fetch_url() -> str:
            resp = gl.nondet.web.get(url)
            return resp.body.decode("utf-8")

        content = gl.eq_principle.strict_eq(fetch_url)

        import hashlib
        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
        content_len = len(content.encode("utf-8"))

        self.evidence_counter = u256(int(self.evidence_counter) + 1)
        eid = str(int(self.evidence_counter))

        ev = {
            "id": eid,
            "name": fn,
            "evidence_type": evidence_type,
            "url": url,
            "content_length": content_len,
            "content_hash": content_hash,
            "verified_at": int(self._now_ts()),
            "verified_by": sender,
        }
        self.web_evidence[eid] = self._jdump(ev)
        return self._ok("URL verified", {"evidence_id": eid, "content_hash": content_hash})

    # ── WRITE: AI review (Equivalence Principle) ─────────────────────────────
    #
    # prompt_comparative: get_input returns the context string the leader LLM
    # works from.  The leader produces a response; each validator independently
    # generates its own response and an LLM judges whether the two responses
    # agree on substance.  Neither get_input nor the framework call exec_prompt
    # — the EP layer handles that internally.

    @gl.public.write
    def ai_review_name(self, name: str, claim: str, evidence_url: str, extra_context: str) -> str:
        sender = self._sender()
        fn = self._norm(name)

        obj = self._load(fn)
        if obj is None:
            raise Exception(fn + " does not exist")

        def get_input() -> str:
            return (
                "Review this .gen name registration for risk.\n"
                "Name: " + fn + "\n"
                "Claim: " + claim + "\n"
                "Evidence URL: " + evidence_url + "\n"
                "Extra context: " + extra_context
            )

        result_str = gl.eq_principle.prompt_comparative(
            get_input,
            "Evaluate impersonation risk, phishing indicators, brand misuse, "
            "and legitimacy of the claim. Return strict JSON with fields: "
            "risk (low|medium|high|critical), verdict (string), verified (bool), "
            "summary (string), reasons (array of strings), recommended_action (string).",
        )

        try:
            result = json.loads(result_str)
        except Exception:
            result = {"risk": "unreviewed", "verdict": "parse_error",
                      "verified": False, "summary": str(result_str), "reasons": []}

        self.review_counter = u256(int(self.review_counter) + 1)
        rid = str(int(self.review_counter))

        review = {
            "id": rid, "name": fn, "type": "name_review",
            "consensus_method": "prompt_comparative",
            "requested_by": sender, "claim": claim,
            "evidence_url": evidence_url, "extra_context": extra_context,
            "result": result, "created_at": int(self._now_ts()),
        }
        self.ai_reviews[rid] = self._jdump(review)

        ai_st = {
            "risk": result.get("risk", "unreviewed"),
            "verified": result.get("verified", False),
            "last_review_id": rid,
        }
        obj["ai_status"] = ai_st
        self._save(fn, obj)
        return self._ok("AI review done", {"review_id": rid, "result": result})

    @gl.public.write
    def ai_review_report(self, report_id: str) -> str:
        sender = self._sender()
        raw = self.reports.get(report_id, "")
        if raw == "":
            raise Exception("Report " + report_id + " not found")

        report = json.loads(raw)

        def get_input() -> str:
            return (
                "Review this suspicious .gen name report.\n"
                "Reported name: " + str(report.get("name", "")) + "\n"
                "Reason: " + str(report.get("reason", "")) + "\n"
                "Evidence URL: " + str(report.get("evidence_url", "")) + "\n"
                "Reporter comment: " + str(report.get("comment", ""))
            )

        result_str = gl.eq_principle.prompt_comparative(
            get_input,
            "Evaluate the validity of this report. Recommend one of: reviewed, "
            "flagged, or dismissed. Return strict JSON with fields: "
            "risk (string), verdict (string), verified (bool), summary (string), "
            "reasons (array of strings), recommended_report_status (string).",
        )

        try:
            result = json.loads(result_str)
        except Exception:
            result = {"risk": "unreviewed", "verdict": "parse_error",
                      "verified": False, "summary": str(result_str), "reasons": []}

        self.review_counter = u256(int(self.review_counter) + 1)
        rid = str(int(self.review_counter))

        review = {
            "id": rid, "report_id": report_id, "type": "report_review",
            "consensus_method": "prompt_comparative",
            "requested_by": sender, "result": result,
            "created_at": int(self._now_ts()),
        }
        self.ai_reviews[rid] = self._jdump(review)

        report["ai_review_id"] = rid
        self.reports[report_id] = self._jdump(report)
        return self._ok("Report reviewed", {"review_id": rid, "result": result})

    @gl.public.write
    def ai_verify_project_claim(self, name: str, project_name: str,
                                 website: str, x: str, github: str,
                                 explanation: str) -> str:
        sender = self._sender()
        fn = self._norm(name)

        obj = self._load(fn)
        if obj is None:
            raise Exception(fn + " does not exist")
        if obj.get("owner", "").lower() != sender:
            raise Exception("Only the owner")

        def get_input() -> str:
            return (
                "Verify this project identity claim for a .gen name.\n"
                "Name: " + fn + "\n"
                "Project name: " + project_name + "\n"
                "Official website: " + website + "\n"
                "Official X/Twitter: " + x + "\n"
                "Official GitHub: " + github + "\n"
                "Owner explanation: " + explanation
            )

        result_str = gl.eq_principle.prompt_comparative(
            get_input,
            "Determine if this .gen name legitimately represents the claimed "
            "project. Return strict JSON with fields: "
            "risk (string), verdict (verified|partially_verified|not_verified), "
            "verified (bool), summary (string), reasons (array of strings), "
            "recommended_action (string).",
        )

        try:
            result = json.loads(result_str)
        except Exception:
            result = {"risk": "unreviewed", "verdict": "parse_error",
                      "verified": False, "summary": str(result_str), "reasons": []}

        self.review_counter = u256(int(self.review_counter) + 1)
        rid = str(int(self.review_counter))

        review = {
            "id": rid, "name": fn, "type": "project_verification",
            "consensus_method": "prompt_comparative",
            "requested_by": sender, "project_name": project_name,
            "official_website": website, "official_x": x,
            "official_github": github, "explanation": explanation,
            "result": result, "created_at": int(self._now_ts()),
        }
        self.ai_reviews[rid] = self._jdump(review)

        ai_st = {
            "risk": result.get("risk", "unreviewed"),
            "verified": result.get("verified", False),
            "last_review_id": rid,
        }
        obj["ai_status"] = ai_st
        self._save(fn, obj)
        return self._ok("Project verified", {"review_id": rid, "result": result})

    @gl.public.write
    def ai_suggest_names(self, base_label: str, purpose: str) -> str:
        sender = self._sender()

        def get_input() -> str:
            return (
                "Base label: " + base_label + "\n"
                "Purpose: " + purpose + "\n"
                "Existing suffix: .gen"
            )

        result_str = gl.eq_principle.prompt_non_comparative(
            get_input,
            task="Suggest 5 creative, brandable .gen name alternatives. "
                 "Return strict JSON: {\"suggestions\":[{\"name\":\"example.gen\",\"reason\":\"short reason\"}]}",
            criteria="The response must be valid JSON with a suggestions array. "
                     "Each item must have a name ending in .gen and a reason string. "
                     "Names must be 3-32 lowercase alphanumeric or hyphen characters before the .gen suffix.",
        )

        try:
            result = json.loads(result_str)
        except Exception:
            result = {"suggestions": []}

        self.review_counter = u256(int(self.review_counter) + 1)
        rid = str(int(self.review_counter))

        review = {
            "id": rid, "type": "name_suggestions",
            "consensus_method": "prompt_non_comparative",
            "requested_by": sender, "base_label": base_label,
            "purpose": purpose, "result": result,
            "created_at": int(self._now_ts()),
        }
        self.ai_reviews[rid] = self._jdump(review)
        return self._ok("Suggestions generated", {
            "review_id": rid,
            "suggestions": result.get("suggestions", []),
        })

    # ── ADMIN ────────────────────────────────────────────────────────────────

    @gl.public.write
    def admin_set_price_per_year(self, price_wei: str) -> str:
        self._require_admin()
        p = int(price_wei)
        if p < 0:
            raise Exception("Price must be non-negative")
        self.price_per_year_wei = u256(p)
        return self._ok("Price updated", {"new_price_wei": str(p)})

    @gl.public.write
    def admin_set_treasury(self, address: str) -> str:
        self._require_admin()
        addr = self._clean_addr(address, "Treasury")
        self.treasury = addr
        return self._ok("Treasury updated", {"new_treasury": addr})

    @gl.public.write
    def admin_withdraw(self, amount_wei: str) -> str:
        self._require_admin()
        amt = int(amount_wei)
        bal = int(self.balance)
        if amt <= 0:
            raise Exception("Amount must be positive")
        if amt > bal:
            raise Exception("Insufficient balance")

        gl.transfer(Address(self.treasury), u256(amt))
        self.total_withdrawn = u256(int(self.total_withdrawn) + amt)
        return self._ok("Withdrawn", {"amount": str(amt), "treasury": self.treasury})

    @gl.public.write
    def admin_flag_name(self, name: str, reason: str) -> str:
        self._require_admin()
        fn = self._norm(name)
        obj = self._load(fn)
        if obj is None:
            raise Exception(fn + " does not exist")
        obj["flagged"] = True
        obj["flag_reason"] = reason
        self._save(fn, obj)
        return self._ok("Flagged", {"name": fn, "reason": reason})

    @gl.public.write
    def admin_unflag_name(self, name: str) -> str:
        self._require_admin()
        fn = self._norm(name)
        obj = self._load(fn)
        if obj is None:
            raise Exception(fn + " does not exist")
        obj["flagged"] = False
        obj["flag_reason"] = ""
        self._save(fn, obj)
        return self._ok("Unflagged", {"name": fn})

    @gl.public.write
    def admin_set_report_status(self, report_id: str, status: str) -> str:
        self._require_admin()
        if status not in ("open", "reviewed", "flagged", "dismissed"):
            raise Exception("Invalid status")
        raw = self.reports.get(report_id, "")
        if raw == "":
            raise Exception("Report not found")
        report = json.loads(raw)
        report["status"] = status
        self.reports[report_id] = self._jdump(report)
        return self._ok("Report status updated", {"report_id": report_id, "status": status})

    @gl.public.write
    def admin_transfer_admin(self, new_admin: str) -> str:
        self._require_admin()
        addr = self._clean_addr(new_admin, "New admin")
        old = self.admin
        self.admin = addr
        return self._ok("Admin transferred", {"old": old, "new": addr})
