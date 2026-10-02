#!/bin/bash
set -e

: <<'DOCSTRING'
This script formats TypeScript code using the prettier formatter.
If the --diff flag is passed, it will only check for formatting issues.
If the --diff flag is not passed, it will format the codebase in place.
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
  if ! npx prettier --check "**/*.{ts,tsx}"; then
    echo "Formatting issues have been found, please run the format command to fix them."
    exit 1
  fi
  echo "No formatting issues found."
}

run_formatter_inplace() {
  npx prettier --write "**/*.{ts,tsx}"
}

if [ "${diff}" = "true" ]; then
  run_formatter_diff
else
  run_formatter_inplace
fi
