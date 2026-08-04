# TrustSeal integration tests from GNS perspective
# Tests the read-only interface GNS uses to show proof badges on .gen profiles.
# The full TrustSeal test suite lives at https://github.com/lobinni/TrustSeal
#
# Run:  gltest tests/test_trustseal_integration.py

import json, os, pytest
from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded

ADDR_A = "0x" + "a1" * 20


@pytest.fixture
def c():
    factory = get_contract_factory("trust_seal", contracts_dir="contracts")
    return factory.deploy()


# ── get_identity (the only method GNS calls) ────────────────────────────────

def test_get_identity_empty(c):
    """GNS calls get_identity to show proof badges. Empty = no badges."""
    result = c.get_identity(args=[ADDR_A]).call()
    if isinstance(result, str):
        result = json.loads(result)
    assert result["found"] is False


def test_get_stats(c):
    """GNS About page shows contract stats."""
    result = c.get_stats().call()
    if isinstance(result, str):
        result = json.loads(result)
    assert result["total_verifications"] == 0
    assert result["total_identities"] == 0
    assert "twitter" in result["supported_platforms"]
    assert "github" in result["supported_platforms"]
    assert "discord" in result["supported_platforms"]


def test_lookup_by_platform_empty(c):
    result = c.lookup_by_platform(args=["github", "nobody"]).call()
    if isinstance(result, str):
        result = json.loads(result)
    assert result["found"] is False


def test_is_platform_taken_false(c):
    result = c.is_platform_taken(args=["github", "nobody"]).call()
    assert result is False or result == "false" or str(result).lower() == "false"


def test_get_audit_log_empty(c):
    result = c.get_audit_log(args=[ADDR_A]).call()
    if isinstance(result, str):
        result = json.loads(result)
    assert result == []


def test_get_pending_empty(c):
    result = c.get_pending_verification(args=[ADDR_A]).call()
    if isinstance(result, str):
        result = json.loads(result)
    assert result["found"] is False


# ── request_verification (deterministic, no AI) ─────────────────────────────

def test_request_verification_creates_pending(c):
    r = c.request_verification(
        args=["github", "testuser", "https://github.com/testuser"]
    ).transact()
    assert tx_execution_succeeded(r)


def test_request_bad_platform_fails(c):
    with pytest.raises(Exception):
        c.request_verification(
            args=["tiktok", "user", "https://tiktok.com/user"]
        ).transact()


def test_request_empty_username_fails(c):
    with pytest.raises(Exception):
        c.request_verification(
            args=["github", "", "https://github.com/"]
        ).transact()


def test_request_empty_url_fails(c):
    with pytest.raises(Exception):
        c.request_verification(
            args=["github", "testuser", ""]
        ).transact()


def test_cancel_pending(c):
    c.request_verification(
        args=["github", "testuser", "https://github.com/testuser"]
    ).transact()
    r = c.cancel_pending_verification().transact()
    assert tx_execution_succeeded(r)


def test_cancel_no_pending_fails(c):
    with pytest.raises(Exception):
        c.cancel_pending_verification().transact()


def test_complete_no_pending_fails(c):
    with pytest.raises(Exception):
        c.complete_verification(args=[""]).transact()


def test_revoke_no_link_fails(c):
    with pytest.raises(Exception):
        c.revoke_platform(args=["github", "nobody"]).transact()


# ── admin ────────────────────────────────────────────────────────────────────

def test_set_discord_url(c):
    r = c.set_discord_attestation_base_url(
        args=["https://worker.example.com"]
    ).transact()
    assert tx_execution_succeeded(r)
    stats = c.get_stats().call()
    if isinstance(stats, str):
        stats = json.loads(stats)
    assert stats["discord_attestation_base_url"] == "https://worker.example.com"


def test_set_discord_url_bad_proto(c):
    with pytest.raises(Exception):
        c.set_discord_attestation_base_url(args=["ftp://bad.com"]).transact()


def test_transfer_admin(c):
    new = "0x" + "bb" * 20
    r = c.transfer_admin(args=[new]).transact()
    assert tx_execution_succeeded(r)
    stats = c.get_stats().call()
    if isinstance(stats, str):
        stats = json.loads(stats)
    assert stats["admin"] == new.lower()


# ── AI flow (opt-in) ────────────────────────────────────────────────────────

@pytest.mark.skipif(os.environ.get("GNS_RUN_AI") != "1", reason="GNS_RUN_AI!=1")
def test_full_verify_flow(c):
    """Full request → complete → check identity."""
    c.request_verification(
        args=["github", "testdev", "https://github.com/testdev"]
    ).transact()
    r = c.complete_verification(args=[""]).transact()
    assert tx_execution_succeeded(r)
    stats = c.get_stats().call()
    if isinstance(stats, str):
        stats = json.loads(stats)
    assert stats["total_verifications"] >= 1
