const fs = require('fs');
const vm = require('vm');

const context = { window: {} };
vm.createContext(context);
let levelCount = 0;

for (let levelNumber = 1; levelNumber <= 20; levelNumber += 1) {
  const file = `levels/level-${String(levelNumber).padStart(2, '0')}.js`;
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  const level = context.window.LEVELS[levelNumber];
  const checkpoints = Array.isArray(level.checkpoints)
    ? level.checkpoints
    : [level.length * 0.25, level.length * 0.5, level.length * 0.75];
  if (!level || checkpoints.length !== 3) throw new Error(`${file}: expected 3 checkpoints`);
  const expected = [0.25, 0.5, 0.75].map((fraction) => level.length * fraction);
  checkpoints.forEach((position, index) => {
    if (Math.abs(position - expected[index]) > 0.001) {
      throw new Error(`${file}: checkpoint ${index + 1} is not at exactly ${index + 1}00%`);
    }
    if (position <= 0 || position >= level.length) throw new Error(`${file}: checkpoint outside route`);
    if (index > 0 && position <= checkpoints[index - 1]) throw new Error(`${file}: checkpoints out of order`);
      let spawn = position;
      const obstacles = level.obstacles || [];
      while (obstacles.some((object) => {
        const width = object.w || 42;
        return object.x < spawn + 110 && object.x + width > spawn - 70;
      })) {
        spawn += 140;
      }
      if (spawn >= level.length - 120) throw new Error(`${file}: checkpoint ${index + 1} buffer reaches level end`);
      const nextObstacle = obstacles
        .map((object) => object.x)
        .filter((x) => x > spawn)
        .sort((a, b) => a - b)[0];
      if (nextObstacle && nextObstacle - spawn > 900) {
        throw new Error(`${file}: checkpoint ${index + 1} next challenge is too far away`);
      }
    });
  levelCount += 1;
}

const source = fs.readFileSync('index.html', 'utf8');
for (const required of [
  "const GAME_VERSION = 'v2.9.1'",
  'let checkpointPositions = []',
  'let checkpointSpawnPositions = []',
  'let latestCheckpointIndex = -1',
  'checkpointPositions = [0.25, 0.5, 0.75].map',
  'function retryCheckpoint()',
  'function resetLevelAttempt()',
  'const resumeX = checkpointPositions[latestCheckpointIndex]',
  'player.x = checkpointSpawnPositions[latestCheckpointIndex] || resumeX',
  'checkpointSpawnPositions[latestCheckpointIndex]',
  'player.y = GROUND_Y - PLAYER_SIZE',
  'let checkpointProtectionSeconds = 0',
  'const CHECKPOINT_PROTECTION_SECONDS = 3',
  'checkpointProtectionSeconds = CHECKPOINT_PROTECTION_SECONDS',
  'checkpointProtectionSeconds = Math.max(0, checkpointProtectionSeconds - deltaSeconds)',
  'if (checkpointProtectionSeconds > 0) return',
  'PROTECTED',
  'Math.floor(checkpointProtectionSeconds * 10) % 2',
  'progress-display',
  'id="reset-level-btn"',
  'latestCheckpointIndex = i',
  'RUN coins held',
  'for (const coinId of pendingCoinIds)'
]) {
  if (!source.includes(required)) throw new Error(`Missing checkpoint behavior: ${required}`);
}
if (!source.includes('while (levelObjects.some((object) =>')) {
  throw new Error('Checkpoint spawn safety buffer is missing');
}
if (!source.includes('object.x < spawn + 110') || !source.includes('object.x + width > spawn - 70')) {
  throw new Error('Checkpoint obstacle buffer is too narrow or absent');
}
const retryFunction = source.slice(source.indexOf('function retryCheckpoint'), source.indexOf('function resetLevelAttempt'));
if (!retryFunction.includes('checkpointPositions[latestCheckpointIndex]') ||
    !retryFunction.includes('player.x = checkpointSpawnPositions[latestCheckpointIndex] || resumeX') ||
    !retryFunction.includes('player.y = GROUND_Y - PLAYER_SIZE')) {
  throw new Error('Checkpoint retry does not restore checkpoint position and safe grounded state');
}
const updateFunction = source.slice(source.indexOf('function update('), source.indexOf('function draw('));
if (!updateFunction.includes('checkpointProtectionSeconds = Math.max(0, checkpointProtectionSeconds - deltaSeconds)')) {
  throw new Error('Checkpoint protection timer is not decremented during gameplay updates');
}
if (source.slice(source.indexOf('function triggerVictory'), source.indexOf('function update(')).includes('checkpointProtectionSeconds = Math.max(0, checkpointProtectionSeconds - deltaSeconds)')) {
  throw new Error('Checkpoint protection timer must not be decremented by victory handling');
}
const startFunction = source.slice(source.indexOf('function startLevel'), source.indexOf('function retryLevel'));
if (!startFunction.includes('checkpointProtectionSeconds = 0')) {
  throw new Error('Normal level starts must clear checkpoint protection');
}
const resetFunction = source.slice(source.indexOf('function resetLevelAttempt'), source.indexOf('function handleMenuAction'));
if (!resetFunction.includes('checkpointProtectionSeconds = 0')) {
  throw new Error('Reset level must clear checkpoint protection');
}
if (!source.includes("gameState = 'DEAD'") || !source.includes("gameState = 'GAMEOVER'")) {
  throw new Error('Ordinary death must transition through DEAD to GAMEOVER');
}
if (!source.includes("gameState === 'GAMEOVER' && e.type !== 'mousedown'")) {
  throw new Error('Global mousedown handler can override checkpoint retry');
}
if (!source.includes('function resetLevelAttempt()') ||
    !source.includes('function retryLevel()') ||
    !source.includes('pendingCoinIds = [];')) {
  throw new Error('Full level reset path is missing');
}
if (source.includes('pendingCoinIds = [];') &&
    source.indexOf('pendingCoinIds = [];') > source.indexOf('function triggerDeath') &&
    source.indexOf('pendingCoinIds = [];') < source.indexOf('function triggerVictory')) {
  throw new Error('Death path clears pending coins before victory');
}
console.log(`Checkpoint checks passed: ${levelCount} levels x 3 exact 25/50/75% markers, ordered detection, retry/reset controls, and pending coin semantics.`);
