const fs = require('fs');

const LEVELS = [
  ['Tutorial single jumps', [['spike', 1], ['platform', -24, 150], ['spike', 1], ['pad'], ['spike', 2], ['spike', 1]]],
  ['Alternating stairs', [['stair', 3, 34], ['spike', 2], ['stair', 3, -34], ['spike', 1]]],
  ['High low route', [['platform', -110, 210], ['ground', 2], ['platform', -24, 120], ['spike', 3], ['platform', -150, 180]]],
  ['Zigzag ascent', [['stair', 5, 30], ['spike', 1], ['stair', 5, -30], ['spike', 2]]],
  ['Pad chain', [['pad'], ['pad'], ['spike', 2], ['pad'], ['platform', -80, 160], ['spike', 1]]],
  ['Platform gauntlet', [['platform', -40, 110], ['platform', -80, 110], ['platform', -120, 110], ['spike', 2]]],
  ['Low ceiling hops', [['platform', -70, 260], ['spike', 1], ['platform', -70, 100], ['spike', 2], ['platform', -70, 180]]],
  ['Wide gap route', [['ground', 3], ['platform', -100, 250], ['spike', 3], ['platform', -30, 90], ['ground', 2]]],
  ['Sawtooth climb', [['stair', 4, 44], ['stair', 4, -44], ['spike', 3], ['stair', 4, 44]]],
  ['Twin lane split', [['platform', -120, 140], ['platform', -24, 140], ['spike', 2], ['platform', -160, 180], ['ground', 3]]],
  ['Precision islands', [['platform', -60, 78], ['spike', 1], ['platform', -100, 78], ['spike', 1], ['platform', -140, 78], ['spike', 2]]],
  ['Rhythm triplets', [['spike', 1], ['platform', -42, 180], ['spike', 2], ['pad'], ['spike', 1], ['spike', 3], ['pad']]],
  ['Reverse staircase', [['stair', 6, -28], ['ground', 2], ['stair', 6, 28], ['spike', 2]]],
  ['Floating bridge', [['platform', -130, 320], ['platform', -130, 320], ['spike', 3], ['platform', -130, 180]]],
  ['Pad and peak', [['pad'], ['stair', 3, 48], ['spike', 2], ['pad'], ['stair', 3, -48]]],
  ['Dense precision', [['spike', 4], ['platform', -50, 92], ['spike', 2], ['platform', -100, 92], ['spike', 3]]],
  ['Mixed routes', [['ground', 2], ['stair', 3, 36], ['pad'], ['platform', -150, 130], ['spike', 3]]],
  ['Crossing zigzags', [['stair', 4, 52], ['platform', -25, 100], ['stair', 4, -52], ['spike', 2]]],
  ['Endurance climb', [['stair', 7, 26], ['spike', 3], ['pad'], ['stair', 7, -26], ['spike', 2]]],
  ['Final challenge', [['spike', 4], ['pad'], ['stair', 6, 42], ['spike', 3], ['platform', -170, 100], ['pad'], ['stair', 5, -42]]],
];

const CLEARANCE = 8;
const GROUND_Y = 560;
const themes = Array.from({ length: 20 }, (_, index) => index);

function addSpike(obstacles, x, count, gap) {
  for (let index = 0; index < count; index += 1) {
    obstacles.push({ type: 'spike', x: x + index * gap, w: 42, h: 48 });
  }
  return x + count * gap + 150;
}

function addPlatform(obstacles, x, y, width) {
  obstacles.push({ type: 'platform', x, y, w: width, h: 20 });
  return x + width + 90;
}

function buildLevel(number) {
  const [name, recipe] = LEVELS[number - 1];
  const obstacles = [];
  const speed = Number((7.7 + number * 0.19).toFixed(2));
  const targetLength = Math.round(speed * 60 * 60);
  let x = 900 + number * 35;
  let pass = 0;
  while (x < targetLength - 900 && pass < 30) {
    const direction = pass % 2 === 0 ? 1 : -1;
    recipe.forEach((section, sectionIndex) => {
    const [kind, value, widthOrRise] = section;
    const variation = pass + sectionIndex;
    if (kind === 'spike' || kind === 'ground') {
      const count = Math.min(5, (value || 1) + (pass >= 3 && kind === 'spike' && variation % 3 === 0 ? 1 : 0));
      x = addSpike(obstacles, x, count, kind === 'ground' ? 54 : 48 - Math.min(8, pass * 2));
    } else if (kind === 'pad') {
      obstacles.push({ type: 'pad', x, w: 44, h: 14 });
      x += 220 + (pass % 3) * 35;
    } else if (kind === 'platform') {
      const height = Math.max(-190, Math.min(-20, value + direction * pass * 12));
      const width = Math.max(72, widthOrRise + ((pass % 3) - 1) * 18);
      x = addPlatform(obstacles, x, height, width);
      if (sectionIndex % 2 === 0) x += 90;
    } else if (kind === 'stair') {
      const steps = value;
      const rise = widthOrRise * direction + (pass % 2 === 0 ? pass * 3 : -pass * 2);
      const width = Math.max(72, 142 - number * 2 + ((pass % 3) - 1) * 12);
      for (let step = 0; step < steps; step += 1) {
        const height = Math.max(-210, Math.min(-20, -20 - step * rise));
        x = addPlatform(obstacles, x, height, width);
      }
      x += 75 + pass * 18;
    }
    x += 30 + (number % 3) * 12 + pass * 8;
    });
    x += 180 + (pass % 3) * 45;
    pass += 1;
  }

  const bounded = obstacles.filter((obstacle) => obstacle.x < targetLength - 260);
  obstacles.length = 0;
  obstacles.push(...bounded);
  let lastEnd = Math.max(...obstacles.map((obstacle) => obstacle.x + (obstacle.w || 42)));
  while (lastEnd < targetLength - 900) {
    const fillerX = Math.min(lastEnd + 260, targetLength - 520);
    obstacles.push({ type: 'spike', x: fillerX, w: 42, h: 48 });
    lastEnd = fillerX + 42;
  }
  x = addSpike(obstacles, targetLength - 260, 2 + (number % 3), 48);
  const length = targetLength;

  // Remove the platform span under each spike plus visual clearance.
  const spikes = obstacles.filter((obstacle) => obstacle.type === 'spike');
  const split = [];
  for (const obstacle of obstacles) {
    if (obstacle.type !== 'platform') {
      split.push(obstacle);
      continue;
    }
    let spans = [[obstacle.x, obstacle.x + obstacle.w]];
    for (const spike of spikes) {
      const cutStart = spike.x - CLEARANCE;
      const cutEnd = spike.x + spike.w + CLEARANCE;
      spans = spans.flatMap(([start, end]) => {
        if (cutEnd <= start || cutStart >= end) return [[start, end]];
        return [
          ...(cutStart - start >= 48 ? [[start, cutStart]] : []),
          ...(end - cutEnd >= 48 ? [[cutEnd, end]] : []),
        ];
      });
    }
    for (const [start, end] of spans) {
      split.push({ ...obstacle, x: start, w: end - start });
    }
  }

  return {
    id: number,
    name,
    themeIndex: themes[number - 1],
    speed,
    length,
    difficulty: number,
    routePasses: pass,
    obstacles: split,
  };
}

for (let number = 1; number <= 20; number += 1) {
  const data = buildLevel(number);
  const file = `levels/level-${String(number).padStart(2, '0')}.js`;
  fs.writeFileSync(file, `(function() {\n  window.LEVELS = window.LEVELS || {};\n  window.LEVELS[${number}] = ${JSON.stringify(data)};\n})();\n`);
}
