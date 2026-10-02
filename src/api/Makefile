.PHONY: lock install build format_diff format test validate ci run backup hash-password

API_IMAGE_NAME := personal-website-api
PROJECT_ROOT := $(abspath $(CURDIR)/../..)
API_DIR := $(PROJECT_ROOT)/src/api
API_DOCKERFILE := $(API_DIR)/dockerfiles/base.Dockerfile
BUILD_CONTEXT := $(PROJECT_ROOT)
BACKUP_DIR ?= $(API_DIR)/.backups

lock:
	uv lock

install: lock
	uv sync --all-packages --group dev

build:
	docker build -t $(API_IMAGE_NAME) -f $(API_DOCKERFILE) $(BUILD_CONTEXT)

format_diff:
	$(PROJECT_ROOT)/scripts/format-py.sh --diff --dir $(API_DIR)

format:
	$(PROJECT_ROOT)/scripts/format-py.sh --dir $(API_DIR)

test:
	uv run -- pytest

validate: install format_diff test
	uv run --frozen ruff check src tests
	uv run --frozen -- pyright src tests

ci: validate build
	echo "CI checks passed"

# Runs the API on :8000 outside Tilt, with the settings in .env (copy .env.example).
run:
	set -a && . $(API_DIR)/.env && set +a && cd $(API_DIR) && uv run python src/main.py

# Online backup of the database and the resume PDF in STORAGE_DATA_DIR (read from .env) into BACKUP_DIR.
backup:
	set -a && . $(API_DIR)/.env && set +a && cd $(API_DIR) && uv run python src/cli.py backup $(BACKUP_DIR)

hash-password:
	cd $(API_DIR) && uv run python src/cli.py hash-password
