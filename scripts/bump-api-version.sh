#!/bin/bash

set -e

cd packages/api;

V=$(pnpm version $1 | head -n 1)
VERSION=${V//[$'\t\r\n v']}
echo $VERSION"-----------------";

PACKAGE_NAME='@yank-note/runtime-api'

cd ../../;

pnpm update -r "$PACKAGE_NAME";

cd packages/create-extension/template-typescript;
cat package.json | sed -e 's/"'${PACKAGE_NAME//\//\\/}'": ".*"/"'${PACKAGE_NAME//\//\\/}'": "^'$VERSION'"/' > package.json.new \
    && rm package.json && mv package.json.new package.json;
git add -u && git commit -m "chore: bump $PACKAGE_NAME to $VERSION";
