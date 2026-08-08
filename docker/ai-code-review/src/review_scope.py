#!/usr/bin/env python3
"""Pull request scope: changed files, diff hunks, and pre-computed patches.

Two independent sources agree on the file list before anything is reviewed:
`git diff` against the merge base, and GitHub's pull request files API. A path
has to appear in both. Git alone drifts when the checkout is not what we think
it is; the API alone cannot give us hunks. Where they disagree the path is
dropped and the divergence logged, because a reviewer pointed at a file that is
not really in the pull request produces findings nobody can act on.
"""

import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass, field

_HUNK = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@")
_LOG = "[review]"

# The files API stops at this many entries. Past it the list is truncated, and
# intersecting against a truncated list would silently drop real files.
_API_FILE_CAP = 3000

# Mirrors git's --diff-filter=ACMR: everything except a deletion. There is
# nothing left to review in a file that is gone.
_REVIEWABLE_STATUS = frozenset({"added", "modified", "renamed", "copied", "changed"})


@dataclass
class ReviewScope:
    base: str
    commit: str
    files: list[str]
    hunks: dict[str, list[tuple[int, int]]] = field(default_factory=dict)
    changed_lines: int = 0

    # --- construction -------------------------------------------------------

    @classmethod
    def from_ci(cls, exclude: Callable[[str], bool]) -> "ReviewScope":
        """Build scope from the current Actions environment using git and the GitHub API."""
        base, commit = _resolve_refs()
        _ensure_refs(base, commit)

        git_files = _git_names(base, commit)
        api_files = _github_pr_paths()
        files = _intersect(git_files, api_files)
        files = [f for f in files if not exclude(f)]

        return cls(
            base=base,
            commit=commit,
            files=files,
            hunks=_git_hunks(base, commit, files),
            changed_lines=_git_line_count(base, commit),
        )

    @classmethod
    def from_manifest(cls, manifest: dict) -> "ReviewScope | None":
        """Reconstruct scope from a previously serialised manifest; returns None if refs are absent."""
        refs = manifest.get("refs") or {}
        base = refs.get("base") or ""
        commit = refs.get("commit") or ""
        if not base or not commit:
            return None

        raw_hunks = manifest.get("hunks") or {}
        return cls(
            base=base,
            commit=commit,
            files=list(manifest.get("changed_files") or []),
            hunks={
                path: [(r[0], r[1]) for r in ranges]
                for path, ranges in raw_hunks.items()
            },
            changed_lines=refs.get("changed_lines", 0),
        )

    def to_manifest_fields(self) -> dict:
        """Serialise scope metadata for embedding in the review manifest."""
        return {
            "refs": {
                "base": self.base,
                "commit": self.commit,
                "changed_lines": self.changed_lines,
            },
            "changed_files": self.files,
            "hunks": {
                path: [[s, e] for s, e in ranges] for path, ranges in self.hunks.items()
            },
        }

    # --- prompts & filtering ------------------------------------------------

    def patches_markdown(self, paths: list[str], max_chars: int = 120_000) -> str:
        """Render unified diffs for the given paths as a markdown block, truncating at max_chars."""
        if not paths:
            return ""

        header = (
            "## Pull request diffs (pre-computed)\n\n"
            "Review **only** the changed lines below. "
            "Do not run git or open other files.\n\n"
            f"Range: `{self.base}` → `{self.commit}`\n"
        )
        parts = [header]
        char_count = len(header)

        for path in paths:
            patch = _git_patch(self.base, self.commit, path)
            block = (
                f"### `{path}`\n\n```diff\n{patch}\n```\n"
                if patch
                else f"### `{path}`\n\n_(no hunks in range)_\n"
            )
            if char_count + len(block) > max_chars:
                parts.append(f"\n_(Truncated — {max_chars} char limit.)_\n")
                break
            parts.append(block)
            char_count += len(block)

        return "\n".join(parts)

    def allows_finding(self, path: str, line: int, tolerance: int = 2) -> bool:
        """Return True if a finding at (path, line) falls within the changed hunks."""
        if path not in self.files:
            return False
        ranges = self.hunks.get(path)
        if not ranges or not line:
            return True
        return any(s - tolerance <= line <= e + tolerance for s, e in ranges)


# --- git ----------------------------------------------------------------------


def _git(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    """Run a git command and return the CompletedProcess."""
    return subprocess.run(["git", *args], capture_output=True, text=True, check=check)


def _event() -> dict:
    """Read the Actions event payload, or an empty dict outside Actions."""
    path = os.environ.get("GITHUB_EVENT_PATH", "")
    if not path or not os.path.isfile(path):
        return {}
    try:
        with open(path, encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError) as err:
        print(f"{_LOG} WARN: could not read event payload ({err})", file=sys.stderr)
        return {}


def _resolve_refs() -> tuple[str, str]:
    """Determine the merge base and head commit for the pull request.

    GITHUB_SHA is the merge commit Actions synthesises for a pull_request
    event, not the branch tip, so head comes from the payload. base.sha is the
    target branch as it stood when the pull request opened, which is only the
    merge base if nothing has landed on the target since — so the merge base is
    computed rather than assumed. That also matches the three-dot range the
    files API reports, which the two lists have to agree on.
    """
    pull_request = _event().get("pull_request") or {}
    commit = (
        (pull_request.get("head") or {}).get("sha", "")
        or os.environ.get("GITHUB_SHA", "").strip()
        or _git("rev-parse", "HEAD").stdout.strip()
    )

    base_tip = (pull_request.get("base") or {}).get("sha", "")
    if not base_tip:
        target = os.environ.get("GITHUB_BASE_REF", "").strip() or "main"
        _git("fetch", "origin", target, "--quiet", check=False)
        base_tip = f"origin/{target}"

    merge_base = _git("merge-base", base_tip, commit, check=False)
    if merge_base.returncode != 0:
        print(
            f"{_LOG} ERROR: no merge base between {base_tip} and {commit} — "
            "check out with fetch-depth: 0",
            file=sys.stderr,
        )
        sys.exit(1)

    return merge_base.stdout.strip(), commit


def _ensure_refs(base: str, commit: str) -> None:
    """Abort if base is not an ancestor of commit."""
    if _git("merge-base", "--is-ancestor", base, commit, check=False).returncode != 0:
        print(f"{_LOG} ERROR: diff base is not an ancestor of commit", file=sys.stderr)
        sys.exit(1)


def _git_names(base: str, commit: str) -> list[str]:
    """Return the list of files added, copied, modified, or renamed between base and commit."""
    result = _git("diff", "--name-only", "--diff-filter=ACMR", base, commit)
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def _git_line_count(base: str, commit: str) -> int:
    """Return the total number of added + deleted lines between base and commit."""
    result = _git("diff", "--numstat", base, commit, check=False)
    if result.returncode != 0:
        return 0
    total = 0
    for line in result.stdout.splitlines():
        parts = line.split("\t")
        if len(parts) >= 2:
            try:
                total += int(parts[0]) + int(parts[1])
            except ValueError:
                # Binary files report "-" for both counts.
                pass
    return total


def _git_patch(base: str, commit: str, path: str) -> str:
    """Return the unified diff for a single file, or an empty string on failure."""
    result = _git("diff", "-U3", base, commit, "--", path, check=False)
    return result.stdout.strip() if result.returncode == 0 else ""


def _parse_hunks(patch: str) -> list[tuple[int, int]]:
    """Parse a unified diff and return (start, end) line ranges for each hunk."""
    ranges = []
    for line in patch.splitlines():
        match = _HUNK.match(line)
        if not match:
            continue
        start, count = int(match.group(1)), int(match.group(2) or "1")
        if count:
            ranges.append((start, start + count - 1))
    return ranges


def _git_hunks(
    base: str, commit: str, files: list[str]
) -> dict[str, list[tuple[int, int]]]:
    """Return a per-file mapping of changed line ranges for all files with non-empty diffs."""
    return {
        path: ranges
        for path in files
        if (ranges := _parse_hunks(_git_patch(base, commit, path)))
    }


# --- GitHub API ---------------------------------------------------------------


def _github_pr_paths() -> list[str] | None:
    """Fetch changed file paths from the pull request files API; None if unavailable.

    Returns None rather than a partial list whenever the answer cannot be
    trusted — no token, a failed request, or a pull request large enough to hit
    the API's own cap. The caller treats None as "do not cross-check", which
    keeps every git-derived file in scope instead of quietly dropping the tail.
    """
    event = _event()
    number = (event.get("pull_request") or {}).get("number") or os.environ.get(
        "PR_NUMBER", ""
    )
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    api_url = os.environ.get("GITHUB_API_URL", "https://api.github.com").rstrip("/")
    token = os.environ.get("GITHUB_TOKEN", "")
    if not all([number, repo, token]):
        print(
            f"{_LOG} WARN: no pull request context or token — skipping API cross-check",
            file=sys.stderr,
        )
        return None

    paths: list[str] = []
    seen: set[str] = set()
    for page in range(1, _API_FILE_CAP // 100 + 1):
        url = f"{api_url}/repos/{repo}/pulls/{number}/files?per_page=100&page={page}"
        request = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                batch = json.loads(response.read().decode())
        except (urllib.error.URLError, json.JSONDecodeError, TimeoutError) as err:
            print(
                f"{_LOG} WARN: pull request files API failed ({err})", file=sys.stderr
            )
            return None

        if not isinstance(batch, list):
            print(f"{_LOG} WARN: unexpected files API payload", file=sys.stderr)
            return None

        for entry in batch:
            if entry.get("status") not in _REVIEWABLE_STATUS:
                continue
            path = (entry.get("filename") or "").strip()
            if path and path not in seen:
                seen.add(path)
                paths.append(path)

        if len(batch) < 100:
            return paths

    print(
        f"{_LOG} WARN: pull request exceeds the {_API_FILE_CAP}-file API cap — "
        "skipping cross-check",
        file=sys.stderr,
    )
    return None


def _intersect(git_files: list[str], api_files: list[str] | None) -> list[str]:
    """Return only files present in both git diff and the API response, warning on divergence."""
    if api_files is None:
        return git_files

    api_set = set(api_files)
    only_git = sorted(set(git_files) - api_set)
    only_api = sorted(api_set - set(git_files))
    if only_git:
        sample = ", ".join(only_git[:5])
        print(
            f"{_LOG} WARN: excluding {len(only_git)} git-only path(s): {sample}",
            file=sys.stderr,
        )
    if only_api:
        sample = ", ".join(only_api[:5])
        print(
            f"{_LOG} WARN: excluding {len(only_api)} API-only path(s): {sample}",
            file=sys.stderr,
        )

    return [f for f in git_files if f in api_set]
