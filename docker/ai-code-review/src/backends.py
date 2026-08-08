#!/usr/bin/env python3
"""LLM backend invocation — CLI commands and subprocess hygiene in one place."""

import os
import subprocess
from pathlib import Path

BACKENDS = ("claude", "codex", "cursor")

# Dropped from every agent subprocess: the diff is untrusted input, and anything
# it could talk the agent into doing needs a credential the agent can see. The
# job needs GITHUB_TOKEN to post; the agent does not, so it never gets it.
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

# Model credentials, kept only for the backend that needs them.
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
    """Agent env: job credentials out, this backend's model credentials in."""
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

    claude reads its context from CLAUDE.md in the working directory rather than
    stdin, so build_prompt writes it there and the argv only points at it.
    """
    model = model_for(backend)

    if backend == "claude":
        return [
            "claude",
            "--model",
            model,
            # Write is all it needs; Bash would hand a diff a way to run commands.
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
            # Working dir is a scratch dir, not a checkout.
            "--skip-git-repo-check",
            "--ephemeral",
            # Enough to write the report, not to touch the repo.
            "--sandbox",
            "workspace-write",
        ]
        if model:
            cmd += ["-m", model]
        # `-` reads the prompt from stdin, keeping a 100k-char prompt off argv.
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
