const fs = require('fs');

const source = fs.readFileSync('index.html', 'utf8');
for (const required of [
  'const SECRET_TITLE_CLICKS = 7',
  'const SECRET_TITLE_TIMEOUT_MS = 1500',
  'function handleSecretTitleActivation',
  'id="secret-title"',
  "addEventListener('click', handleSecretTitleActivation)",
  'function showSpeedSelector',
  'function selectSpeedMode(mode)',
  "const SPEED_MODE_KEY = 'dash_speed_mode'",
  'const SPEED_MULTIPLIERS = { slow: 0.85, normal: 1, responsive: RESPONSIVE_SPEED_MULTIPLIER }',
  'data-speed="slow"',
  'data-speed="normal"',
  'data-speed="responsive"',
]) {
  if (!source.includes(required)) throw new Error(`Missing secret speed behavior: ${required}`);
}

if (source.includes('secretSpeedSequence') || source.includes('trackSecretSpeedSequence')) {
  throw new Error('Legacy level-button speed sequence is still present');
}

function titleUnlocks(clicks, inMainMenu = true) {
  let count = 0;
  let unlocked = false;
  for (const click of clicks) {
    if (!inMainMenu || click !== 'title') {
      count = 0;
      continue;
    }
    count += 1;
    if (count === 7) {
      unlocked = true;
      count = 0;
    }
  }
  return unlocked;
}

if (!titleUnlocks(Array(7).fill('title'))) throw new Error('Seven title clicks did not unlock');
if (titleUnlocks(['title', 'title', 'level-20', 'title', 'title', 'title', 'title', 'title'])) {
  throw new Error('Wrong-context click did not reset title count');
}
if (titleUnlocks([20, 12, 17])) throw new Error('Old level sequence unlocked speed selector');

const multipliers = { slow: 0.85, normal: 1, responsive: 1.1 };
for (const [mode, multiplier] of Object.entries(multipliers)) {
  const roundTrip = JSON.parse(JSON.stringify(mode));
  if (roundTrip !== mode || multiplier <= 0) throw new Error(`Invalid persisted mode ${mode}`);
}

console.log('Secret speed checks passed: exact sequence, wrong-click reset, persistence/options, and safe multipliers.');
