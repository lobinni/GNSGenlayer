# GNS Registry — contract-level tests
# Run:          gltest tests/test_gns_registry.py
# With AI:      GNS_RUN_AI=1 gltest tests/test_gns_registry.py

import json, os, pytest
from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded

PRICE_1Y = 5 * 10**18
ADDR_A = "0x" + "a1" * 20
ADDR_B = "0x" + "b2" * 20


@pytest.fixture
def c():
    factory = get_contract_factory("GNSRegistry", contracts_dir="contracts")
    return factory.deploy()


# ── views ────────────────────────────────────────────────────────────────────

def test_version(c):
    assert c.contract_version().call() == "1.3.0"

def test_admin_set(c):
    assert c.get_admin().call().startswith("0x")

def test_price(c):
    assert int(c.get_price_per_year().call()) == PRICE_1Y

def test_quote_scales(c):
    q1 = int(c.quote_registration(args=["1"]).call())
    q3 = int(c.quote_registration(args=["3"]).call())
    assert q3 == q1 * 3

def test_counters_zero(c):
    for fn in ("get_total_names", "get_total_reports", "get_total_reviews", "get_total_evidence"):
        assert getattr(c, fn)().call() == "0"

def test_available_new(c):
    assert json.loads(c.is_available(args=["brandnew.gen"]).call()) is True

def test_available_short(c):
    assert json.loads(c.is_available(args=["ab.gen"]).call()) is False

def test_resolve_missing(c):
    d = json.loads(c.resolve(args=["missing.gen"]).call())
    assert d["status"] == "not_found"


# ── register ─────────────────────────────────────────────────────────────────

def test_register(c):
    r = c.register(args=["hello", "1", ADDR_A]).transact(value=PRICE_1Y)
    assert tx_execution_succeeded(r)
    assert c.get_total_names().call() == "1"
    d = json.loads(c.resolve(args=["hello.gen"]).call())
    assert d["status"] == "active"
    assert d["full_name"] == "hello.gen"

def test_register_dup(c):
    c.register(args=["dup", "1", ADDR_A]).transact(value=PRICE_1Y)
    with pytest.raises(Exception):
        c.register(args=["dup", "1", ADDR_B]).transact(value=PRICE_1Y)

def test_register_underpay(c):
    with pytest.raises(Exception):
        c.register(args=["cheap", "1", ADDR_A]).transact(value=1)


# ── records ──────────────────────────────────────────────────────────────────

def test_records(c):
    c.register(args=["rec", "1", ADDR_A]).transact(value=PRICE_1Y)
    c.set_records(args=["rec.gen", json.dumps({"website": "https://x.com", "x": "@t"})]).transact()
    d = json.loads(c.get_records(args=["rec.gen"]).call())
    assert d["website"] == "https://x.com"
    assert d["x"] == "@t"

def test_clear_record(c):
    c.register(args=["clr", "1", ADDR_A]).transact(value=PRICE_1Y)
    c.set_records(args=["clr.gen", json.dumps({"website": "https://a.b"})]).transact()
    c.clear_record(args=["clr.gen", "website"]).transact()
    d = json.loads(c.get_records(args=["clr.gen"]).call())
    assert d["website"] == ""


# ── reverse ──────────────────────────────────────────────────────────────────

def test_reverse(c):
    c.register(args=["rev", "1", ADDR_A]).transact(value=PRICE_1Y)
    c.set_primary_name(args=["rev.gen"]).transact()
    assert c.reverse_lookup(args=[ADDR_A]).call() == "rev.gen"


# ── transfer ─────────────────────────────────────────────────────────────────

def test_transfer(c):
    c.register(args=["xfer", "1", ADDR_A]).transact(value=PRICE_1Y)
    c.transfer(args=["xfer.gen", ADDR_B]).transact()
    d = json.loads(c.resolve(args=["xfer.gen"]).call())
    assert d["owner"] == ADDR_B.lower()


# ── subnames ─────────────────────────────────────────────────────────────────

def test_subname(c):
    c.register(args=["parent", "1", ADDR_A]).transact(value=PRICE_1Y)
    c.create_subname(args=["parent.gen", "pay", ADDR_A]).transact()
    subs = json.loads(c.get_subnames(args=["parent.gen"]).call())
    assert "pay.parent.gen" in subs
    d = json.loads(c.resolve(args=["pay.parent.gen"]).call())
    assert d["is_subname"] is True


# ── renew ────────────────────────────────────────────────────────────────────

def test_renew(c):
    c.register(args=["ren", "1", ADDR_A]).transact(value=PRICE_1Y)
    old = json.loads(c.resolve(args=["ren.gen"]).call())["expires_at"]
    rp = int(c.quote_renewal(args=["2"]).call())
    c.renew(args=["ren.gen", "2"]).transact(value=rp)
    new = json.loads(c.resolve(args=["ren.gen"]).call())["expires_at"]
    assert new > old


# ── reports ──────────────────────────────────────────────────────────────────

def test_report(c):
    c.register(args=["sus", "1", ADDR_A]).transact(value=PRICE_1Y)
    c.report_name(args=["sus.gen", "Impersonation", "https://e.co", "fake"]).transact()
    assert c.get_total_reports().call() == "1"
    d = json.loads(c.get_report(args=["1"]).call())
    assert d["status"] == "open"


# ── owner list ───────────────────────────────────────────────────────────────

def test_owner_list(c):
    c.register(args=["ow1", "1", ADDR_A]).transact(value=PRICE_1Y)
    c.register(args=["ow2", "1", ADDR_A]).transact(value=PRICE_1Y)
    names = json.loads(c.get_names_by_owner(args=[ADDR_A]).call())
    assert "ow1.gen" in names and "ow2.gen" in names


# ── admin ────────────────────────────────────────────────────────────────────

def test_flag_unflag(c):
    c.register(args=["flg", "1", ADDR_A]).transact(value=PRICE_1Y)
    c.admin_flag_name(args=["flg.gen", "test"]).transact()
    assert c.get_name_status(args=["flg.gen"]).call() == "flagged"
    c.admin_unflag_name(args=["flg.gen"]).transact()
    assert c.get_name_status(args=["flg.gen"]).call() == "active"

def test_admin_report_status(c):
    c.register(args=["rpt", "1", ADDR_A]).transact(value=PRICE_1Y)
    c.report_name(args=["rpt.gen", "Phishing", "", "bad"]).transact()
    c.admin_set_report_status(args=["1", "dismissed"]).transact()
    d = json.loads(c.get_report(args=["1"]).call())
    assert d["status"] == "dismissed"

def test_admin_withdraw(c):
    c.register(args=["pay", "1", ADDR_A]).transact(value=PRICE_1Y)
    bal = int(c.get_contract_balance().call())
    assert bal > 0
    c.admin_set_treasury(args=[ADDR_B]).transact()
    c.admin_withdraw(args=[str(bal // 2)]).transact()
    assert int(c.get_total_withdrawn().call()) == bal // 2


# ── AI (opt-in) ──────────────────────────────────────────────────────────────

@pytest.mark.skipif(os.environ.get("GNS_RUN_AI") != "1", reason="GNS_RUN_AI!=1")
def test_ai_suggest(c):
    c.register(args=["ais", "1", ADDR_A]).transact(value=PRICE_1Y)
    r = c.ai_suggest_names(args=["nova", "DeFi project"]).transact()
    assert tx_execution_succeeded(r)
    assert int(c.get_total_reviews().call()) >= 1

@pytest.mark.skipif(os.environ.get("GNS_RUN_AI") != "1", reason="GNS_RUN_AI!=1")
def test_ai_review_name(c):
    c.register(args=["air", "1", ADDR_A]).transact(value=PRICE_1Y)
    r = c.ai_review_name(args=["air.gen", "My project", "", "ctx"]).transact()
    assert tx_execution_succeeded(r)
    d = json.loads(c.get_ai_status(args=["air.gen"]).call())
    assert d["last_review_id"] != ""
