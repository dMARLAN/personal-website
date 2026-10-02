.PHONY: install format_diff format validate ci build

PROJECT_ROOT := $(abspath $(CURDIR)/../..)
FRONTEND_DIR := $(PROJECT_ROOT)/src/frontend

install:
	npm install

format_diff:
	$(PROJECT_ROOT)/scripts/format-ts.sh --diff --dir $(FRONTEND_DIR)/src

format:
	$(PROJECT_ROOT)/scripts/format-ts.sh --dir $(FRONTEND_DIR)/src

build:
	npm run build

validate: install format_diff
	npm run lint
	npm run typecheck
	npm run test

ci: validate build
	echo "CI checks passed"
