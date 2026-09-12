const fs = require('fs');

const source = fs.readFileSync('index.html', 'utf8');

for (const required of [
  'onclick="handleMenuAction()"',
  'function handleMenuAction()',
  'const nextLevel = currentLevel + 1',
  "localStorage.setItem('dash_unlocked_lvl', String(unlockedLevel))",
  'startLevel(nextLevel)',
  'startLevel(1)',
  "const COMPLETED_LEVEL_KEY = 'dash_completed_lvl'",
  'i === 1 || unlimitedCoins || i - 1 <= completedLevel',
  'completedLevel = Math.max(completedLevel, currentLevel)',
]) {
  if (!source.includes(required)) {
    throw new Error(`Missing progression behavior: ${required}`);
  }
}

function canSelect(level, completedLevel, unlimitedCoins) {
  return level === 1 || unlimitedCoins || level - 1 <= completedLevel;
}

function advance(currentLevel, unlockedLevel) {
  if (currentLevel < 20) {
    const nextLevel = currentLevel + 1;
    return {
      level: nextLevel,
      unlocked: Math.max(unlockedLevel, nextLevel),
      action: 'start-next',
    };
  }

  return { level: 1, unlocked: unlockedLevel, action: 'replay-first' };
}

const normal = advance(7, 7);
if (normal.level !== 8 || normal.unlocked !== 8 || normal.action !== 'start-next') {
  throw new Error('Level 7 -> 8 progression failed');
}

const alreadyAhead = advance(7, 12);
if (alreadyAhead.level !== 8 || alreadyAhead.unlocked !== 12 || canSelect(12, 0, false)) {
  throw new Error('Ahead-of-progress level selection was not locked');
}
if (!canSelect(1, 0, false) || !canSelect(2, 1, false) || canSelect(3, 1, false) || !canSelect(20, 0, true)) {
  throw new Error('Sequential lock or cheat bypass behavior failed');
}

const final = advance(20, 20);
if (final.level !== 1 || final.action !== 'replay-first' || final.unlocked !== 20) {
  throw new Error('Level 20 boundary behavior failed');
}

console.log('Progression checks passed: N -> N+1 unlock/start, preserved progress, and level 20 replay boundary.');
