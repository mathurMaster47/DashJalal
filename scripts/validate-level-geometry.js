const fs = require('fs');
const vm = require('vm');

const GROUND_Y = 560;
const VISUAL_CLEARANCE = 8;
const context = { window: {} };
vm.createContext(context);
const signatures = new Set();
const names = new Set();
const baselineLengths = [3413, 4142, 3605, 4988, 3877, 3104, 3775, 3778, 5345, 3734, 3969, 4084, 5595, 4024, 4581, 3812, 4425, 4702, 6377, 6650];
const baselineObstacleCounts = [9, 12, 9, 15, 10, 6, 8, 13, 16, 10, 10, 11, 18, 9, 11, 13, 13, 12, 22, 24];

function hasHorizontalConflict(spike, platform) {
  return spike.x - VISUAL_CLEARANCE < platform.x + platform.w &&
    spike.x + spike.w + VISUAL_CLEARANCE > platform.x;
}

for (let levelNumber = 1; levelNumber <= 20; levelNumber += 1) {
  const file = `levels/level-${String(levelNumber).padStart(2, '0')}.js`;
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  const level = context.window.LEVELS[levelNumber];
  if (!level) throw new Error(`${file}: missing level data`);
  if (!level.name || names.has(level.name)) throw new Error(`${file}: duplicate authored identity`);
  names.add(level.name);
  if (level.routePasses < 4) throw new Error(`${file}: route is not extended`);
  const routeStart = 900 + levelNumber * 35;
  const baselineRoute = baselineLengths[levelNumber - 1] - routeStart;
  if (level.length - routeStart < baselineRoute * 4) throw new Error(`${file}: route length is less than 4x baseline`);
  const signature = level.obstacles
    .map((obstacle) => `${obstacle.type}:${obstacle.y || 0}:${obstacle.w || 0}:${obstacle.h || 0}`)
    .join('|');
  if (signatures.has(signature)) throw new Error(`${file}: duplicate layout signature`);
  signatures.add(signature);

  const platforms = level.obstacles
    .filter((obstacle) => obstacle.type === 'platform')
    .map((platform) => ({ ...platform, y: GROUND_Y + platform.y, h: 20 }));
  const spikes = level.obstacles
    .filter((obstacle) => obstacle.type === 'spike')
    .map((spike) => ({ ...spike, y: GROUND_Y - spike.h }));
  const conflicts = [];
  if (!platforms.length) throw new Error(`${file}: authored layout has no platform surfaces`);
  if (!spikes.length) throw new Error(`${file}: authored layout has no spike challenge`);
  if (level.obstacles.length < baselineObstacleCounts[levelNumber - 1] * 3) throw new Error(`${file}: obstacle density did not scale`);
  const lastObstacle = Math.max(...level.obstacles.map((obstacle) => obstacle.x + (obstacle.w || 42)));
  if (lastObstacle < level.length - 700) throw new Error(`${file}: empty tail after final obstacle`);

  for (const spike of spikes) {
    for (const platform of platforms) {
      if (hasHorizontalConflict(spike, platform)) {
        conflicts.push({ spike, platform });
      }
    }
  }

  if (conflicts.length) {
    throw new Error(`${file}: ${conflicts.length} spike/platform visual conflict(s)`);
  }
  console.log(`${file}: ${platforms.length} platform segments, ${spikes.length} spikes, clear`);
}
