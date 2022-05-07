#!/bin/bash

set -e

cd packages/api;

V=$(pnpm version $1 | tail -n 1)
VERSION=${V//[$'\t\r\n v']}
echo $VERSION;

cd ../../;

pnpm update -r yank-note-api;

cd packages/create-extension/template-typescript;
cat package.json | sed -e 's/"yank-note-api": ".*"/"yank-note-api": "^'$VERSION'"/' > package.json.new \
    && rm package.json && mv package.json.new package.json;
