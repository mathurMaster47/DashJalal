const fs = require('fs');
const vm = require('vm');

const GROUND_Y = 560;
const VISUAL_CLEARANCE = 8;
const context = { window: {} };
vm.createContext(context);

function hasHorizontalConflict(spike, platform) {
  return spike.x - VISUAL_CLEARANCE < platform.x + platform.w &&
    spike.x + spike.w + VISUAL_CLEARANCE > platform.x;
}

for (let levelNumber = 1; levelNumber <= 20; levelNumber += 1) {
  const file = `levels/level-${String(levelNumber).padStart(2, '0')}.js`;
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  const level = context.window.LEVELS[levelNumber];
  if (!level) throw new Error(`${file}: missing level data`);

  const platforms = level.obstacles
    .filter((obstacle) => obstacle.type === 'platform')
    .map((platform) => ({ ...platform, y: GROUND_Y + platform.y, h: 20 }));
  const spikes = level.obstacles
    .filter((obstacle) => obstacle.type === 'spike')
    .map((spike) => ({ ...spike, y: GROUND_Y - spike.h }));
  const conflicts = [];

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
