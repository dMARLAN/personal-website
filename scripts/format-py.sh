#!/bin/bash
set -e

: <<'DOCSTRING'
This script formats and lints the codebase using ruff.
If the --diff flag is passed, it will only check for formatting issues.
If the --diff flag is not passed, it will format the codebase in place and apply safe lint fixes.
Line length and target version come from the root pyproject.toml.
DOCSTRING

script_dir="$(dirname "${0}")/.."
diff="false"
for arg in "${@}"; do
  if [ "${arg}" = "--diff" ]; then
    shift
    diff="true"
  elif [ "${arg}" = "--dir" ]; then
    shift # Move to the next argument
    if [ $# -eq 0 ]; then
      echo "Error: --dir requires a value"
      exit 1
    fi
    script_dir="${1}"
  fi
done

cd "${script_dir}"

run_formatter_diff() {
  if ! uv run -- ruff format --diff .; then
    echo "Formatting issues have been found, please run \`make format\` to fix them."
    exit 1
  fi
  echo "No formatting issues found."
}

run_formatter_inplace() {
  uv run -- ruff check --fix .
  uv run -- ruff format .
}

if [ "${diff}" = "true" ]; then
  run_formatter_diff
else
  run_formatter_inplace
fi
