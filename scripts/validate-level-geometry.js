const fs = require('fs');
const vm = require('vm');

const GROUND_Y = 560;
const context = { window: {} };
vm.createContext(context);

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
    a.y < b.y + b.h && a.y + a.h > b.y;
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
      if (overlaps(spike, platform)) conflicts.push({ spike, platform });
    }
  }

  if (conflicts.length) {
    throw new Error(`${file}: ${conflicts.length} spike/platform overlap(s)`);
  }
  console.log(`${file}: ${platforms.length} platforms, ${spikes.length} spikes, no overlaps`);
}
