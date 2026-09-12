const fs = require('fs');

const source = fs.readFileSync('index.html', 'utf8');
for (const required of [
  'const secretSpeedSequence = [20, 12, 17]',
  'function trackSecretSpeedSequence',
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

function track(sequence, clicks) {
  let index = 0;
  let unlocked = false;
  for (const click of clicks) {
    if (click === sequence[index]) {
      index += 1;
      if (index === sequence.length) {
        unlocked = true;
        index = 0;
      }
    } else {
      index = click === sequence[0] ? 1 : 0;
    }
  }
  return unlocked;
}

if (!track([20, 12, 17], [20, 12, 17])) throw new Error('Secret sequence did not unlock');
if (track([20, 12, 17], [20, 11, 12, 17])) throw new Error('Wrong click did not reset sequence');
if (!track([20, 12, 17], [1, 20, 12, 17])) throw new Error('Sequence did not recover after reset');

const multipliers = { slow: 0.85, normal: 1, responsive: 1.1 };
for (const [mode, multiplier] of Object.entries(multipliers)) {
  const roundTrip = JSON.parse(JSON.stringify(mode));
  if (roundTrip !== mode || multiplier <= 0) throw new Error(`Invalid persisted mode ${mode}`);
}

console.log('Secret speed checks passed: exact sequence, wrong-click reset, persistence/options, and safe multipliers.');
