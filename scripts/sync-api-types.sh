#!/bin/bash

set -e

cd yn;
git checkout develop;
git pull;
yarn;
rm -r ../packages/api/src/types || true;

yarn tsc --esModuleInterop true --declaration true --emitDeclarationOnly true --declarationDir ../packages/api/src/types;

mkdir -p ../packages/api/src/types/third-party

mkdir -p ../packages/api/src/types/third-party/vue;
cp node_modules/@vue/*/dist/*-*.d.ts ../packages/api/src/types/third-party/vue;
cp node_modules/@vue/reactivity/dist/reactivity.d.ts ../packages/api/src/types/third-party/vue;
# cp node_modules/@vue/runtime-dom/dist/runtime-dom.d.ts ../packages/api/src/types/third-party/vue;
echo 'export * from "@vue/runtime-core";' > ../packages/api/src/types/third-party/vue/runtime-dom.d.ts;
cp node_modules/@vue/runtime-core/dist/runtime-core.d.ts ../packages/api/src/types/third-party/vue;
cp node_modules/@vue/shared/dist/shared.d.ts ../packages/api/src/types/third-party/vue;
cp node_modules/vue/dist/vue.d.ts ../packages/api/src/types/third-party/vue/index.d.ts;
cp -r node_modules/@types/lodash ../packages/api/src/types/third-party/lodash;
cp -r node_modules/@types/lodash-es ../packages/api/src/types/third-party/lodash-es;
cp -r node_modules/@types/crypto-js ../packages/api/src/types/third-party/crypto-js;
cp -r node_modules/@types/turndown ../packages/api/src/types/third-party/turndown;
cp -r node_modules/@types/markdown-it ../packages/api/src/types/third-party/markdown-it;
cp -r node_modules/@types/pako ../packages/api/src/types/third-party/pako;
cp -r node_modules/@types/mime ../packages/api/src/types/third-party/mime;
cp -r node_modules/@types/sortablejs ../packages/api/src/types/third-party/sortablejs;
cp -r node_modules/@types/dom-to-image ../packages/api/src/types/third-party/dom-to-image;
cp -r node_modules/@types/async-lock ../packages/api/src/types/third-party/async-lock;
cp -r node_modules/ripgrep-wrapper/types ../packages/api/src/types/third-party/ripgrep-wrapper;
# cp -r node_modules/@types/semver ../packages/api/src/types/third-party/semver;
mkdir -p ../packages/api/src/types/third-party/dayjs;
cp node_modules/dayjs/index.d.ts ../packages/api/src/types/third-party/dayjs/index.d.ts;
mkdir -p ../packages/api/src/types/third-party/chokidar;
cp node_modules/chokidar/types/index.d.ts ../packages/api/src/types/third-party/chokidar/index.d.ts;
mkdir -p ../packages/api/src/types/third-party/dayjs;
cp node_modules/dayjs/index.d.ts ../packages/api/src/types/third-party/dayjs/index.d.ts;
mkdir -p ../packages/api/src/types/third-party/juice;
cp node_modules/juice/juice.d.ts ../packages/api/src/types/third-party/juice/index.d.ts;
mkdir -p ../packages/api/src/types/third-party/monaco-editor;
cp node_modules/monaco-editor/esm/vs/editor/editor.api.d.ts ../packages/api/src/types/third-party/monaco-editor/index.d.ts

cd ../packages/api/src/types;
rm -r main;
rm -r renderer/__tests__;
rm -r renderer/plugins;
rm third-party/*/package.json;

find ./ -depth -name "*.d.ts" -exec sh -c 'mv "$1" "${1%.d.ts}.ts"' _ {} \;

cd ../../;
pnpm run build;
