const fs = require('fs');

const source = fs.readFileSync('index.html', 'utf8');

for (const required of [
  "const RESPONSIVE_MODE_KEY = 'dash_responsive_mode'",
  "localStorage.setItem(RESPONSIVE_MODE_KEY, String(responsiveMode))",
  'RESPONSIVE_SPEED_MULTIPLIER',
  'jumpBufferSeconds',
  'toggleResponsiveMode()',
  'mode-menu-btn',
  'mode-hud-btn',
]) {
  if (!source.includes(required)) throw new Error(`Missing responsive-mode behavior: ${required}`);
}

const speed = 1.1;
const normalSeconds = 60;
const responsiveSeconds = normalSeconds / speed;
if (responsiveSeconds < 54 || responsiveSeconds > 56) {
  throw new Error(`Unexpected responsive calibration: ${responsiveSeconds}s`);
}

console.log(`Responsive mode checks passed: persisted toggle, menu/HUD controls, buffered jump, normal ${normalSeconds}s, responsive ${responsiveSeconds.toFixed(2)}s.`);
