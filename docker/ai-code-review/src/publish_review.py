#!/usr/bin/env python3
"""Post code_review_report.json to the pull request as inline review comments.

GitHub has no equivalent of GitLab's code quality report — nothing on the
platform ingests a findings file and turns it into inline comments. The Reviews
API is the closest thing: one request carrying a summary plus a comment per
finding, which lands as a real threaded comment in Files changed that the author
can reply to and resolve.

Its one hard rule is that every comment must sit on a line GitHub considers part
of the diff. run_review.py has already enforced that against git's own hunks, so
by the time findings reach here they are postable.
"""

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

_LOG = "[publish]"
_REPORT = Path("code_review_report.json")

_ICON = {"critical": "🔴", "major": "🟠", "minor": "🟡", "info": "🔵"}
_ORDER = ("critical", "major", "minor", "info")

# One request carrying hundreds of comments is both a rejected payload and an
# unreadable pull request. Anything past this is reported in the summary rather
# than dropped quietly.
_MAX_COMMENTS = int(os.environ.get("REVIEW_MAX_COMMENTS", "30"))


def _api(path: str, payload: dict) -> tuple[int, str]:
    """POST to the GitHub API and return (status, body). Never raises on HTTP error."""
    api_url = os.environ.get("GITHUB_API_URL", "https://api.github.com").rstrip("/")
    request = urllib.request.Request(
        f"{api_url}{path}",
        data=json.dumps(payload).encode(),
        method="POST",
        headers={
            "Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return response.status, response.read().decode()
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode(errors="replace")
    except (urllib.error.URLError, TimeoutError) as err:
        return 0, str(err)


def _comment_body(finding: dict) -> str:
    icon = _ICON.get(finding["severity"], "🔵")
    lines = [
        f"{icon} **{finding['severity']}** · `{finding['check_name']}`",
        "",
        finding["description"],
        "",
        finding["content"]["body"],
    ]
    if verified := finding.get("verified"):
        lines += ["", f"<sub>Verified at `{verified}`</sub>"]
    return "\n".join(lines)


def _summary(findings: list[dict], backend: str, overflow: int) -> str:
    """The review's top-level body: a count per severity and what model produced it."""
    counts = {s: sum(1 for f in findings if f["severity"] == s) for s in _ORDER}
    tally = (
        " · ".join(f"{_ICON[s]} {counts[s]} {s}" for s in _ORDER if counts[s])
        or "no findings"
    )

    lines = [f"### AI code review — {tally}", "", f"Reviewed by `{backend}`."]
    if overflow:
        lines += [
            "",
            f"⚠️ {overflow} further finding(s) were not posted as comments — "
            "see the `code-review-report` artifact for the full list.",
        ]
    if not findings:
        lines += [
            "",
            "Nothing to flag on the changed lines. This is not a substitute for "
            "human review.",
        ]
    return "\n".join(lines)


def _step_summary(text: str) -> None:
    """Mirror the review into the job summary, so a failed post still leaves a result."""
    if path := os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(path, "a", encoding="utf-8") as handle:
            handle.write(text + "\n")


def main() -> None:
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    number = os.environ.get("PR_NUMBER", "")
    commit = os.environ.get("PR_HEAD_SHA", "")
    backend = os.environ.get("REVIEW_BACKEND", "claude")

    if not _REPORT.exists():
        print(f"{_LOG} no report to publish", file=sys.stderr)
        sys.exit(1)
    findings = json.loads(_REPORT.read_text())

    if not all([repo, number, commit, os.environ.get("GITHUB_TOKEN")]):
        print(
            f"{_LOG} missing pull request context or token — writing the job "
            "summary only",
            file=sys.stderr,
        )
        _step_summary(_summary(findings, backend, 0))
        return

    posted, overflow = findings[:_MAX_COMMENTS], max(0, len(findings) - _MAX_COMMENTS)
    body = _summary(findings, backend, overflow)
    comments = [
        {
            "path": f["location"]["path"],
            "line": f["location"]["lines"]["begin"],
            "side": "RIGHT",
            "body": _comment_body(f),
        }
        for f in posted
        if f["location"]["lines"]["begin"] > 0
    ]

    _step_summary(body)

    # COMMENT, never REQUEST_CHANGES: a model that is wrong one time in five
    # should not be able to block a merge. The findings are advice, and the
    # required checks are what actually gate.
    path = f"/repos/{repo}/pulls/{number}/reviews"
    status, response = _api(
        path,
        {"commit_id": commit, "event": "COMMENT", "body": body, "comments": comments},
    )
    if 200 <= status < 300:
        print(
            f"{_LOG} posted review with {len(comments)} inline comment(s)", flush=True
        )
        return

    # A single unpostable line rejects the whole request with 422, taking every
    # other comment with it. Retrying without comments keeps the summary — and
    # the artifact still holds the detail.
    print(
        f"{_LOG} WARN: review with comments rejected (HTTP {status}): {response[:600]}",
        file=sys.stderr,
    )
    if status == 403:
        print(
            f"{_LOG} 403 usually means a fork pull request, where the token is "
            "read-only. The job summary above has the findings.",
            file=sys.stderr,
        )
        return

    status, response = _api(
        path, {"commit_id": commit, "event": "COMMENT", "body": body}
    )
    if 200 <= status < 300:
        print(f"{_LOG} posted summary-only review", flush=True)
        return

    print(
        f"{_LOG} ERROR: could not post any review (HTTP {status}): {response[:600]}",
        file=sys.stderr,
    )
    sys.exit(1)


if __name__ == "__main__":
    main()
