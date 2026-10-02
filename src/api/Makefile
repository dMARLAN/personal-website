.PHONY: lock install build format_diff format test validate ci

API_IMAGE_NAME := personal-website-api
PROJECT_ROOT := $(abspath $(CURDIR)/../..)
API_DIR := $(PROJECT_ROOT)/src/api
API_DOCKERFILE := $(API_DIR)/dockerfiles/base.Dockerfile
BUILD_CONTEXT := $(PROJECT_ROOT)

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
