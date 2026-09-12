const fs = require('fs');
const vm = require('vm');

const GROUND_Y = 560;
const PLAYER_SIZE = 44;
const GRAVITY = 0.95;
const SPRING_BOOST = -15.5 * 1.35;
const VISUAL_CLEARANCE = 8;
const SPRING_CORRIDOR_START = 220;
const SPRING_CORRIDOR_END = 520;
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
  if (level.routePasses < 6) throw new Error(`${file}: route is not extended`);
  const expectedDuration = level.length / (level.speed * 60);
  if (expectedDuration < 58 || expectedDuration > 62) throw new Error(`${file}: expected duration ${expectedDuration.toFixed(2)}s is outside 58-62s`);
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
  const pads = level.obstacles.filter((obstacle) => obstacle.type === 'pad');
  const conflicts = [];
  if (!platforms.length) throw new Error(`${file}: authored layout has no platform surfaces`);
  if (!spikes.length) throw new Error(`${file}: authored layout has no spike challenge`);
  for (const pad of pads) {
    const flightFrames = Math.ceil((-2 * SPRING_BOOST) / GRAVITY);
    const expectedLandingX = pad.x + (level.speed * flightFrames);
    const corridorStart = pad.x + SPRING_CORRIDOR_START;
    const corridorEnd = pad.x + SPRING_CORRIDOR_END;
    const corridorSpikes = spikes.filter((spike) =>
      spike.x < corridorEnd && spike.x + spike.w > corridorStart
    );
    if (corridorSpikes.length) {
      throw new Error(`${file}: spring at x=${pad.x} launches into ${corridorSpikes.length} spike(s)`);
    }
    if (corridorEnd >= level.length - PLAYER_SIZE) {
      throw new Error(`${file}: spring at x=${pad.x} has no safe landing terrain before level end`);
    }
    if (expectedLandingX < corridorStart || expectedLandingX > corridorEnd) {
      throw new Error(`${file}: spring at x=${pad.x} expected landing x=${expectedLandingX.toFixed(0)} is outside its safe corridor`);
    }
  }
  const minimumPlatformWidth = Math.min(...platforms.map((platform) => platform.w));
  const averagePlatformWidth = platforms.reduce((sum, platform) => sum + platform.w, 0) / platforms.length;
  if (minimumPlatformWidth < 80) throw new Error(`${file}: platform segment is too small (${minimumPlatformWidth}px)`);
  if (averagePlatformWidth < 125) throw new Error(`${file}: average platform footprint is too small (${averagePlatformWidth.toFixed(1)}px)`);
  if (level.obstacles.length < baselineObstacleCounts[levelNumber - 1] * 3) throw new Error(`${file}: obstacle density did not scale`);
  const lastObstacle = Math.max(...level.obstacles.map((obstacle) => obstacle.x + (obstacle.w || 42)));
  if (lastObstacle < level.length - 700) throw new Error(`${file}: empty tail after final obstacle`);
  if (lastObstacle > level.length + 50) throw new Error(`${file}: obstacle extends beyond level end`);
  const ordered = level.obstacles.slice().sort((a, b) => a.x - b.x);
  const largestGap = ordered.reduce((largest, obstacle, index) => index
    ? Math.max(largest, obstacle.x - (ordered[index - 1].x + (ordered[index - 1].w || 42)))
    : 0, 0);
  if (largestGap > 900) throw new Error(`${file}: playable route gap ${largestGap}px is too large`);

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
  console.log(`${file}: ${platforms.length} platform segments, ${spikes.length} spikes, ${pads.length} springs, clear`);
}
