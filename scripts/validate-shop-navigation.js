const fs = require('fs');

const source = fs.readFileSync('index.html', 'utf8');
const shopStart = source.indexOf('<div id="shop-menu"');
const shopEnd = source.indexOf('</div>', shopStart);
const characterStart = source.indexOf('<div id="character-menu"');
const characterEnd = source.indexOf('<!-- Game Over / Victory Menu -->');
const characterBack = source.indexOf('onclick="closeCharacterSelect()"');

if (shopStart < 0 || shopEnd < 0) throw new Error('Shop overlay is missing or malformed');
if (shopStart < characterStart || shopStart < characterBack) {
  throw new Error('Shop overlay is nested inside Character Select');
}
for (const required of [
  '<button class="btn btn-secondary" onclick="openShop()">SHOP</button>',
  '<button class="btn btn-secondary" onclick="closeShop()">BACK</button>',
  'function openShop()',
  'function closeShop()',
  "document.getElementById('shop-menu').style.display = 'block';",
  "document.getElementById('shop-menu').style.display = 'none';",
  "document.getElementById('main-menu').style.display = 'none';",
  "document.getElementById('main-menu').style.display = 'block';",
  "const GAME_VERSION = 'v2.2.1'"
]) {
  if (!source.includes(required)) throw new Error(`Missing shop navigation wiring: ${required}`);
}
if (source.indexOf('<div id="shop-menu"') > source.indexOf('<!-- Game Over / Victory Menu -->')) {
  throw new Error('Shop overlay appears after the game-over menu boundary');
}
if (!source.includes('id="shop-grid"') ||
    !source.includes('id="shop-coin-display"') ||
    !source.includes("document.getElementById('shop-grid')") ||
    !source.includes("'shop-coin-display'")) {
  throw new Error('Shop render selectors are missing');
}

console.log('Shop navigation checks passed: top-level overlay, visible main-menu button, open/close transitions, and render selectors.');
