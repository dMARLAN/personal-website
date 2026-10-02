.PHONY: install format_diff format validate ci build e2e

PROJECT_ROOT := $(abspath $(CURDIR)/../..)
FRONTEND_DIR := $(PROJECT_ROOT)/src/frontend

install:
	npm install

format_diff:
	$(PROJECT_ROOT)/scripts/format-ts.sh --diff --dir $(FRONTEND_DIR)/src
	$(PROJECT_ROOT)/scripts/format-ts.sh --diff --dir $(FRONTEND_DIR)/e2e

format:
	$(PROJECT_ROOT)/scripts/format-ts.sh --dir $(FRONTEND_DIR)/src
	$(PROJECT_ROOT)/scripts/format-ts.sh --dir $(FRONTEND_DIR)/e2e

build:
	npm run build

validate: install format_diff
	npm run lint
	npm run typecheck
	npm run test

# Browser tests against a production build (Playwright + axe). Kept out of validate, which stays fast.
e2e: install
	npx playwright install chromium
	npx playwright test

ci: validate build
	echo "CI checks passed"
