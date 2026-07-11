#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/packages/api"
CREATE_EXTENSION_DIR="$ROOT_DIR/packages/create-extension"
TEMPLATE_PACKAGE="$CREATE_EXTENSION_DIR/template-typescript/package.json"
PACKAGE_NAME='@yank-note/runtime-api'
VERSION="${1:-}"

if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 <version>" >&2
  exit 1
fi

VERSION="${VERSION#v}"
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([+-][0-9A-Za-z.-]+)?$ ]]; then
  echo "Invalid version: $VERSION" >&2
  exit 1
fi

cd "$ROOT_DIR"
if git rev-parse -q --verify "refs/tags/api-$VERSION" >/dev/null; then
  echo "Tag api-$VERSION already exists." >&2
  exit 1
fi

cd "$API_DIR"
pnpm version "$VERSION"

ACTUAL_VERSION="$(node -p "require('./package.json').version")"
if [[ "$ACTUAL_VERSION" != "$VERSION" ]]; then
  echo "Expected API version $VERSION, got $ACTUAL_VERSION." >&2
  exit 1
fi

cd "$ROOT_DIR"
pnpm update -r "$PACKAGE_NAME"

node - "$TEMPLATE_PACKAGE" "$PACKAGE_NAME" "$VERSION" <<'NODE'
const fs = require('fs')
const [file, packageName, version] = process.argv.slice(2)
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'))
const dependencyGroup = ['dependencies', 'devDependencies', 'peerDependencies']
  .find(group => pkg[group] && packageName in pkg[group])

if (!dependencyGroup) {
  throw new Error(`${packageName} is not declared in ${file}`)
}

pkg[dependencyGroup][packageName] = `^${version}`
pkg.engines['yank-note'] = `>=${version}`
fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n')
NODE

git add -u
if ! git diff --cached --quiet; then
  git commit -m "chore: bump $PACKAGE_NAME to $VERSION"
fi

publish_package () {
  local dir="$1"
  local args=(--access public)
  if [[ "${PUBLISH_DRY_RUN:-0}" == "1" ]]; then
    args+=(--dry-run)
  fi
  (cd "$dir" && pnpm publish "${args[@]}")
}

publish_package "$API_DIR"

cd "$CREATE_EXTENSION_DIR"
pnpm version minor
publish_package "$CREATE_EXTENSION_DIR"
