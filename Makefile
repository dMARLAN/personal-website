.PHONY: \
	install install-api install-frontend \
	format format-api format-frontend \
	format_diff format_diff-api format_diff-frontend \
	validate validate-api validate-frontend \
	ci ci-api ci-frontend e2e \
	bootstrap system-deps local-cluster tilt-up tilt-down tilt-reset \
	dcs-assets

DCS_ROOT ?= /mnt/f/Program Files/Eagle Dynamics/DCS World


install-api:
	cd src/api && make install

install-frontend:
	cd src/frontend && make install

install: \
  install-api \
  install-frontend

format-api:
	cd src/api && make format

format-frontend:
	cd src/frontend && make format

format: \
  format-api \
  format-frontend

format_diff-api:
	cd src/api && make format_diff

format_diff-frontend:
	cd src/frontend && make format_diff

format_diff: \
  format_diff-api \
  format_diff-frontend

validate-api:
	cd src/api && make validate

validate-frontend:
	cd src/frontend && make validate

validate: \
  validate-api \
  validate-frontend

ci-api:
	cd src/api && make ci

ci-frontend:
	cd src/frontend && make ci

ci: \
  ci-api \
  ci-frontend

# Frontend browser tests (Playwright + axe). Not part of validate or ci.
e2e:
	cd src/frontend && make e2e

bootstrap:
	./scripts/bootstrap.sh

system-deps:
	@if command -v brew >/dev/null; then \
		HOMEBREW_NO_INSTALL_CLEANUP=1 brew bundle; \
	else \
		for tool in kind tilt ctlptl kubectl docker; do \
			command -v $$tool >/dev/null || { echo "Missing $$tool: install it or run 'make bootstrap'"; exit 1; }; \
		done; \
	fi

local-cluster: system-deps
	ctlptl apply -f k8s/ctlptl.yaml

tilt-up: local-cluster
	tilt up

tilt-down: local-cluster
	tilt down

tilt-reset: tilt-down tilt-up

# Regenerates the stroke font and symbols from a local DCS install. CI never runs this.
dcs-assets:
	DCS_ROOT="$(DCS_ROOT)" uv run --no-project scripts/extract_dcs_assets.py
