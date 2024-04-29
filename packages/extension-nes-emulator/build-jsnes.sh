export SKIP_PREFLIGHT_CHECK=true
export PUBLIC_URL="./"
cd jsnes-web;
# replace git://github.com/bfirsh/jsnes.git => 1.2.1
sed -i '' 's/git:\/\/github.com\/bfirsh\/jsnes.git/1.2.1/g' package.json;
sed -i '' 's/BrowserRouter/HashRouter/g' src/App.js;
sed -i '' 's/config.ROMS\[slug\];/config.ROMS[slug] || {name: "", description: "", url: decodeURIComponent(slug)};/g' src/RunPage.js;
sed -i '' 's/className="nav-link"/style={{display: "none"}}/g' src/RunPage.js;
sed -i '' 's/\.\.\/img/.\/img/g' src/ControlsModal.js
yarn;
yarn build;
cp -r build/* ../emulator/;
git reset --hard
