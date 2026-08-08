#!/usr/bin/env python3
"""LLM backend invocation — one place for CLI commands and subprocess hygiene.

Three backends, one review each. Which one runs is a workflow input; the image
carries all of them so switching model is a config change, not a rebuild.
"""

import os
import subprocess
from pathlib import Path

BACKENDS = ("claude", "codex", "cursor")

# Dropped from every agent subprocess. The agent is reading a diff written by
# whoever opened the pull request, and a diff is an untrusted input — anything
# it could talk the agent into doing, it can only do with a credential the
# agent can see. The job needs GITHUB_TOKEN to post the review; the agent does
# not, so the agent never gets it.
_JOB_SECRETS = (
    "GITHUB_TOKEN",
    "GH_TOKEN",
    "ACTIONS_RUNTIME_TOKEN",
    "ACTIONS_ID_TOKEN_REQUEST_TOKEN",
    "ACTIONS_ID_TOKEN_REQUEST_URL",
    "ACTIONS_RESULTS_URL",
    "ACTIONS_CACHE_URL",
    "SUPABASE_ACCESS_TOKEN",
    "SUPABASE_PROJECT_REF",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NPM_TOKEN",
)

# Model credentials, kept only for the backend that needs them. Running codex
# does not require handing it an Anthropic key.
_BACKEND_SECRETS = {
    "claude": ("ANTHROPIC_API_KEY",),
    "cursor": ("CURSOR_API_KEY",),
    "codex": ("CODEX_API_KEY", "OPENAI_API_KEY"),
}

_DEFAULT_MODEL = {
    "claude": "claude-sonnet-4-5",
    "codex": "gpt-5.5-codex",
    "cursor": "",
}


def model_for(backend: str) -> str:
    """The model this run should use: the explicit override, else the backend default."""
    return os.environ.get("REVIEW_MODEL", "").strip() or _DEFAULT_MODEL[backend]


def sanitized_env(backend: str) -> dict[str, str]:
    """Agent subprocess environment: job credentials out, this backend's model credentials in."""
    env = dict(os.environ)
    for key in _JOB_SECRETS:
        env.pop(key, None)
    for other, keys in _BACKEND_SECRETS.items():
        if other != backend:
            for key in keys:
                env.pop(key, None)
    return env


def command(backend: str) -> tuple[list[str], bool]:
    """Return (argv, prompt_on_stdin) for one backend.

    claude is the odd one out: it reads its context from CLAUDE.md in the
    working directory rather than from stdin, so build_prompt writes the
    assembled prompt there and the argv carries only the instruction to read it.
    """
    model = model_for(backend)

    if backend == "claude":
        return [
            "claude",
            "--model",
            model,
            # Write is the only tool the job needs: everything the agent should
            # look at is already in the prompt, and Bash would hand a diff a
            # way to run commands.
            "--allowedTools",
            "Write",
            "--disallowedTools",
            "Bash,WebFetch,WebSearch,Task",
            "-p",
            "Review CLAUDE.md and write code_review_report.json.",
        ], False

    if backend == "codex":
        cmd = [
            "codex",
            "exec",
            # The working directory is a scratch dir, not a checkout.
            "--skip-git-repo-check",
            "--ephemeral",
            # Enough to write the report, not enough to touch the repo.
            "--sandbox",
            "workspace-write",
        ]
        if model:
            cmd += ["-m", model]
        # `-` makes codex read the prompt from stdin rather than argv, which
        # keeps a 100k-char prompt off the command line.
        cmd.append("-")
        return cmd, True

    if backend == "cursor":
        cmd = ["cursor-agent", "-pf", "--output-format", "text"]
        if model:
            cmd += ["--model", model]
        return cmd, True

    raise ValueError(f"unknown backend {backend!r}")


def invoke(
    backend: str,
    *,
    prompt: str,
    cwd: Path,
    timeout: int,
) -> subprocess.CompletedProcess:
    """Run one LLM CLI call in cwd. Raises subprocess.TimeoutExpired past timeout."""
    argv, prompt_on_stdin = command(backend)
    return subprocess.run(
        argv,
        input=prompt if prompt_on_stdin else None,
        text=True,
        check=False,
        timeout=timeout,
        cwd=cwd,
        env=sanitized_env(backend),
    )
