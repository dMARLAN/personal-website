.PHONY: \
	install install-api install-frontend \
	format format-api format-frontend \
	format_diff format_diff-api format_diff-frontend \
	validate validate-api validate-frontend \
	ci ci-api ci-frontend \
	bootstrap system-deps local-cluster tilt-up tilt-down tilt-reset


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

bootstrap:
	./scripts/bootstrap.sh

system-deps:
	HOMEBREW_NO_INSTALL_CLEANUP=1 brew bundle

local-cluster: system-deps
	ctlptl apply -f k8s/ctlptl.yaml

tilt-up: local-cluster
	tilt up

tilt-down: local-cluster
	tilt down

tilt-reset: tilt-down tilt-up
