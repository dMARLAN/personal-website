#!/usr/bin/env bash
set -euo pipefail

setup_homebrew_linux() {
    local brew_shellenv='eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"'

    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"

    if [[ -f "${HOME}/.bashrc" ]] && ! grep -q "linuxbrew" "${HOME}/.bashrc"; then
        echo "" >> "${HOME}/.bashrc"
        echo "${brew_shellenv}" >> "${HOME}/.bashrc"
        echo "Added Homebrew to ~/.bashrc"
    fi

    if [[ -f "${HOME}/.zshrc" ]] && ! grep -q "linuxbrew" "${HOME}/.zshrc"; then
        echo "" >> "${HOME}/.zshrc"
        echo "${brew_shellenv}" >> "${HOME}/.zshrc"
        echo "Added Homebrew to ~/.zshrc"
    fi
}

if ! command -v brew &>/dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    if [[ "$(uname)" == "Linux" ]]; then
        setup_homebrew_linux
    fi
fi

echo "Installing system dependencies..."
brew bundle

echo "Installing Python dependencies..."
uv sync

echo "Bootstrap complete!"
