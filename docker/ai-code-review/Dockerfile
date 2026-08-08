FROM public.ecr.aws/ubuntu/ubuntu:24.04_stable@sha256:8c10ecc59261c77dd866fa8587f1b9cbf172ad8f1253f0af96eaae0fa390c132

# Every CLI is pinned and checksum-verified: a moving tag lets an upstream
# compromise into a job holding a pull-requests: write token.

# https://nodejs.org/en/download/releases/
ENV NODEJS_VERSION="v24.12.0"

# https://downloads.cursor.com/lab/ — no published checksum, so this is the
# sha256 of the tarball at pin time.
ENV CURSOR_CLI_VERSION="2026.08.04-aaa8809"
ENV CURSOR_CHECKSUM="e282068dcb5cdd668b8ce2e3456c58be13bb64a834e1ad49f8534b5cd7aa2fe5"

# https://github.com/anthropics/claude-code/releases — `stable` channel;
# checksum from the release's SHASUMS256.txt.
ENV CLAUDE_CODE_VERSION="2.1.220"
ENV CLAUDE_CODE_CHECKSUM="e69e7f72d784c243bcc377a578ad9ff8e65ae14da672fbbf9f2ba7bf47eca7ec"

# https://github.com/openai/codex/releases — tags carry a `rust-v` prefix; musl build is static.
ENV CODEX_VERSION="0.147.0"
ENV CODEX_CHECKSUM="0246e2e773834e07f0fb5249ed6ebad12e4591e608f8c7bb97dd6a9690544c36"

ENV DEBIAN_FRONTEND=noninteractive

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
# hadolint ignore=DL3008
RUN apt-get update && \
  apt-get --no-install-recommends install -y \
  curl git jq bash tar ca-certificates xz-utils procps python3 && \
  update-ca-certificates && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# Install Node.js and npm
RUN curl --silent --show-error --location --output "node-${NODEJS_VERSION}-linux-x64.tar.xz" "https://nodejs.org/dist/${NODEJS_VERSION}/node-${NODEJS_VERSION}-linux-x64.tar.xz" && \
  curl --silent --show-error --location --output SHASUMS256.txt "https://nodejs.org/dist/${NODEJS_VERSION}/SHASUMS256.txt" && \
  grep "node-${NODEJS_VERSION}-linux-x64.tar.xz" SHASUMS256.txt | sha256sum --check --strict && \
  tar -xJf "node-${NODEJS_VERSION}-linux-x64.tar.xz" -C /usr/local --strip-components=1 && \
  rm -f "node-${NODEJS_VERSION}-linux-x64.tar.xz" SHASUMS256.txt

# Install Cursor CLI
RUN curl --silent --show-error --location --output cursor.tar.gz "https://downloads.cursor.com/lab/${CURSOR_CLI_VERSION}/linux/x64/agent-cli-package.tar.gz" && \
  echo "${CURSOR_CHECKSUM}  cursor.tar.gz" | sha256sum --check --strict && \
  DEST_DIR="$HOME/.local/share/cursor-agent/versions/${CURSOR_CLI_VERSION}" && \
  mkdir -p "${DEST_DIR}" && \
  tar --strip-components=1 -xzf cursor.tar.gz -C "${DEST_DIR}" && \
  mkdir -p "${HOME}/.local/bin" && \
  ln -sf "${DEST_DIR}/cursor-agent" "${HOME}/.local/bin/cursor-agent" && \
  ln -sf "${DEST_DIR}/cursor-agent" /usr/local/bin/cursor-agent && \
  rm -f cursor.tar.gz && \
  mkdir -p /root/.cursor

COPY cursor/cursor-config.json /root/.cursor/cli-config.json

# Install Claude Code
RUN curl --silent --show-error --location \
  --output "claude-linux-x64.tar.gz" \
  "https://github.com/anthropics/claude-code/releases/download/v${CLAUDE_CODE_VERSION}/claude-linux-x64.tar.gz" && \
  echo "${CLAUDE_CODE_CHECKSUM}  claude-linux-x64.tar.gz" | sha256sum --check --strict && \
  tar -xzf "claude-linux-x64.tar.gz" -C /usr/local/bin/ && \
  chmod 755 /usr/local/bin/claude && \
  rm -f "claude-linux-x64.tar.gz" && \
  claude --version

# Install Codex CLI. The archive holds one file named for its target triple, renamed on extract.
RUN curl --silent --show-error --location \
  --output "codex.tar.gz" \
  "https://github.com/openai/codex/releases/download/rust-v${CODEX_VERSION}/codex-x86_64-unknown-linux-musl.tar.gz" && \
  echo "${CODEX_CHECKSUM}  codex.tar.gz" | sha256sum --check --strict && \
  tar -xzf "codex.tar.gz" -C /tmp && \
  mv /tmp/codex-x86_64-unknown-linux-musl /usr/local/bin/codex && \
  chmod 755 /usr/local/bin/codex && \
  rm -f "codex.tar.gz" && \
  codex --version

COPY codex/config.toml /root/.codex/config.toml

# Codex reads config/auth via CODEX_HOME, not $HOME, so the baked config stays
# reachable whatever HOME a container job sets.
ENV CODEX_HOME="/root/.codex"

COPY src/ /scripts/
COPY .agents/ /scripts/.agents/
COPY shared/ /scripts/shared/
COPY AGENTS.md /scripts/AGENTS.md

# Shipped in the image so the release workflow needs no knowledge of it and a
# pulled image can be verified without a workflow.
COPY --chmod=755 smoke-test.sh /smoke-test.sh

ENV PATH="/root/.local/bin:${PATH}"
