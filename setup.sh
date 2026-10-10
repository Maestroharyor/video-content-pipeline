#!/usr/bin/env bash
# One-shot setup for macOS and Linux. Safe to re-run.
#   ./setup.sh            install what is missing, npm install, shared assets, skill links, health check
#   ./setup.sh --check    only report
# Windows: run setup.ps1 in PowerShell instead.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
CHECK=0; [[ "${1:-}" == "--check" ]] && CHECK=1
have() { command -v "$1" >/dev/null 2>&1; }
log() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
need_node() { have node && node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>22||(a===22&&b>=12)?0:1)'; }
OS="$(uname -s)"
[[ $CHECK == 1 ]] && { log "check only"; node scripts/setup.js --check; exit $?; }

case "$OS" in
  Darwin)
    if ! have brew; then
      log "installing Homebrew"
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
      eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv)"
    fi
    need_node   || { log "installing node";        brew install node; }
    have ffmpeg || { log "installing ffmpeg";      brew install ffmpeg; }
    have whisper-cli || { log "installing whisper-cpp"; brew install whisper-cpp; }
    ;;
  Linux)
    if have apt-get; then PM="sudo apt-get install -y"; sudo apt-get update -qq
    elif have dnf; then PM="sudo dnf install -y"
    elif have pacman; then PM="sudo pacman -S --noconfirm"
    else echo "no apt/dnf/pacman found: install ffmpeg, cmake, git, curl, unzip, a C++ compiler and node >= 22.12 yourself, then re-run"; exit 1; fi
    have ffmpeg || { log "installing ffmpeg"; $PM ffmpeg; }
    for t in curl unzip git cmake; do have $t || { log "installing $t"; $PM $t; }; done
    have g++ || have clang++ || { log "installing a C++ compiler"; $PM build-essential 2>/dev/null || $PM gcc-c++ 2>/dev/null || $PM base-devel; }
    if ! need_node; then
      log "installing node 22 with nvm"
      export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
      [[ -s "$NVM_DIR/nvm.sh" ]] || curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
      # shellcheck disable=SC1091
      . "$NVM_DIR/nvm.sh"; nvm install 22 >/dev/null; nvm use 22 >/dev/null
    fi
    if ! have whisper-cli; then
      log "building whisper.cpp (no distro package) into ~/.local"
      SRC="$HOME/.local/src/whisper.cpp"; mkdir -p "$HOME/.local/src" "$HOME/.local/bin"
      [[ -d "$SRC" ]] || git clone --depth 1 https://github.com/ggml-org/whisper.cpp "$SRC"
      cmake -S "$SRC" -B "$SRC/build" -DCMAKE_BUILD_TYPE=Release >/dev/null
      cmake --build "$SRC/build" -j"$(nproc)" --config Release --target whisper-cli >/dev/null
      cp "$SRC/build/bin/whisper-cli" "$HOME/.local/bin/"
      export PATH="$HOME/.local/bin:$PATH"
      grep -q '.local/bin' "$HOME/.profile" 2>/dev/null || echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.profile"
    fi
    ;;
  MINGW*|MSYS*|CYGWIN*) echo "On Windows run:  powershell -ExecutionPolicy Bypass -File setup.ps1"; exit 1 ;;
  *) echo "unsupported OS $OS"; exit 1 ;;
esac

need_node || { echo "node >= 22.12 is required (found $(node -v 2>/dev/null || echo none)); open a new shell and re-run"; exit 1; }
log "npm install (also downloads Chrome for Testing once)"
npm install --no-fund --no-audit
log "shared assets + skill links + health check"
node scripts/setup.js --no-install
