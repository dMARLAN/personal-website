#!/usr/bin/env bash
set -euo pipefail

: <<'DOCSTRING'
Backs up the API's data volume from the running pod in the current kube context: an online SQLite backup of
site.db (the same API as the sqlite3 shell's `.backup`, safe while the API serves) plus resume.pdf.
Usage: scripts/backup-api-data.sh [OUT_DIR]   (default: ./backups; NAMESPACE overrides personal-website)
DOCSTRING

namespace="${NAMESPACE:-personal-website}"
out_dir="${1:-backups}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
pod_dir="/data/backups/${stamp}"

pod="$(kubectl -n "${namespace}" get pods -l app=personal-website-api -o jsonpath='{.items[0].metadata.name}')"

kubectl -n "${namespace}" exec "${pod}" -- uv run --no-sync python cli.py backup "${pod_dir}"
mkdir -p "${out_dir}"
kubectl -n "${namespace}" cp "${pod}:${pod_dir}" "${out_dir}/${stamp}"
kubectl -n "${namespace}" exec "${pod}" -- rm -rf "${pod_dir}"

echo "Backup written to ${out_dir}/${stamp}"
