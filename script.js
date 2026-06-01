"use strict";

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W        = canvas.width;
const H        = canvas.height;
const GROUND_Y = H - 42;
const PLAYER_X = 85;

const GRAVITY       = 0.58;
const JUMP_VELOCITY = -13.5;
const INITIAL_SPEED = 4;
const MAX_SPEED     = 13;

const CYCLE_FRAMES = 650;

let OBS_MIN = 80;
let OBS_MAX = 155;

let STATE = 'START';

let score      = 0;
let hiScore    = parseInt(localStorage.getItem('astro_hi') || '0');
let frameCount = 0;
let gameSpeed  = INITIAL_SPEED;

let groundOffset = 0;

let cycleTimer = 0;
let isNight    = false;
let bgBlend    = 0;

const STARS = [];
(function initStars() {
  for (let i = 0; i < 130; i++) {
    STARS.push({
      x     : Math.random() * W,
      y     : Math.random() * (GROUND_Y - 20),
      size  : Math.random() * 1.8 + 0.4,
      speed : Math.random() * 0.4 + 0.1,
      alpha : Math.random() * 0.6 + 0.3,
      twFreq: Math.random() * 0.04 + 0.01,
      twPhs : Math.random() * Math.PI * 2,
    });
  }
})();

let player;

function resetPlayer() {
  player = {
    x        : PLAYER_X,
    y        : GROUND_Y - 48,
    w        : 32,
    h        : 48,
    vy       : 0,
    onGround : true,
    shield     : false,
    shieldTimer: 0,
    slowmo     : false,
    slowmoTimer: 0,
    walkFrame: 0,
    walkTick : 0,
    flashTimer: 0,
  };
}

const ASTRO = [
  "  HHHH  ",
  " HHHHHH ",
  " HVVVVH ",
  " HVVVVH ",
  " HHHHHH ",
  " BBBBBB ",
  "BBBBBBBB",
  " BBBBBB ",
  "  BBBB  ",
  " BB  BB ",
  " BB  BB ",
  "BBB  BBB",
];

const ASTRO_STEP = [
  "  HHHH  ",
  " HHHHHH ",
  " HVVVVH ",
  " HVVVVH ",
  " HHHHHH ",
  " BBBBBB ",
  "BBBBBBBB",
  " BBBBBB ",
  "  BBBB  ",
  "  BB BB ",
  " BB  BB ",
  " BBB BB ",
];

const PX = 4;

const COL = {
  H: '#e8eeff',
  V: '#00ffee',
  B: '#3355ff',
};

function drawAstronaut() {
  const px = player.x;
  const py = player.y;
  const sprite = (player.walkFrame === 1 && player.onGround) ? ASTRO_STEP : ASTRO;

  if (player.shield) {
    const t = Date.now() * 0.003;
    const grd = ctx.createRadialGradient(px + 16, py + 24, 8, px + 16, py + 24, 32 + Math.sin(t) * 4);
    grd.addColorStop(0, 'rgba(0,255,200,0)');
    grd.addColorStop(0.5, 'rgba(0,255,200,0.08)');
    grd.addColorStop(1, 'rgba(0,255,200,0.35)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 24, 28 + Math.sin(t) * 3, 32 + Math.sin(t) * 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (!player.onGround) {
    const fy = py + 6 * PX;
    ctx.fillStyle = `hsl(${15 + Math.random() * 25}, 100%, 55%)`;
    ctx.fillRect(px - PX, fy, PX, PX * 2);
    ctx.fillStyle = '#ffff66';
    ctx.fillRect(px - PX * 2, fy + PX, PX, PX);
  }

  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const ch = sprite[r][c];
      if (ch === ' ') continue;
      let color = COL[ch] || '#ffffff';
      if (player.flashTimer > 0 && Math.floor(player.flashTimer * 15) % 2 === 0) {
        color = '#ff3344';
      }
      ctx.fillStyle = color;
      ctx.fillRect(px + c * PX, py + r * PX, PX, PX);
    }
  }
}

let obstacles = [];
let obsTimer  = 0;
let nextObsIn = 100;

const OBS_TYPES = ['rock_s', 'rock_l', 'laser_lo', 'laser_hi', 'satellite', 'mine'];

function spawnObstacle() {
  const type = OBS_TYPES[Math.floor(Math.random() * OBS_TYPES.length)];
  const obs = { type, x: W + 30, active: true, phase: Math.random() * Math.PI * 2 };

  switch (type) {
    case 'rock_s':
      obs.y = GROUND_Y - 24;  obs.w = 24; obs.h = 24;
      break;
    case 'rock_l':
      obs.y = GROUND_Y - 40;  obs.w = 40; obs.h = 40;
      break;
    case 'laser_lo':
      obs.y = GROUND_Y - 18;  obs.w = 64; obs.h = 16;
      break;
    case 'laser_hi':
      obs.y = GROUND_Y - 72;  obs.w = 64; obs.h = 12;
      break;
    case 'satellite':
      obs.w = 56; obs.h = 22;
      obs.y = GROUND_Y - 130 - Math.random() * 50;
      obs.baseY = obs.y;
      obs.vy = (Math.random() < 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.5);
      obs.minY = obs.y - 30; obs.maxY = obs.y + 30;
      break;
    case 'mine':
      obs.w = 30; obs.h = 30;
      obs.baseY = GROUND_Y - 55 - Math.random() * 65;
      obs.y = obs.baseY;
      break;
  }
  obstacles.push(obs);
}

function drawObstacle(obs) {
  const x = obs.x, y = obs.y;
  obs.phase += 0.06;

  if (obs.type === 'rock_s' || obs.type === 'rock_l') {
    const ps = obs.type === 'rock_l' ? 6 : 4;
    const shapes = {
      rock_s: [" XXX ","XXXXX","XXXXX"," XXX "],
      rock_l: ["  XXXXX  ","XXXXXXXXX","XXXXXXXXX"," XXXXXXX ","  XXXXX  "],
    };
    const sh = shapes[obs.type];
    for (let r = 0; r < sh.length; r++) {
      for (let c = 0; c < sh[r].length; c++) {
        if (sh[r][c] !== 'X') continue;
        const noise = Math.sin(r * 7.3 + c * 3.1) * 35;
        const v = 100 + noise;
        ctx.fillStyle = `rgb(${Math.floor(v)},${Math.floor(v * 0.85)},${Math.floor(v * 0.7)})`;
        ctx.fillRect(x + c * ps, y + r * ps, ps, ps);
      }
    }
  }
  else if (obs.type === 'laser_lo' || obs.type === 'laser_hi') {
    const intensity = 0.55 + Math.sin(obs.phase) * 0.45;
    ctx.save();
    ctx.shadowColor = '#ff2200';
    ctx.shadowBlur  = 14 * intensity;
    ctx.fillStyle = `rgba(255, ${Math.floor(60 * intensity)}, 0, ${0.7 + intensity * 0.3})`;
    ctx.fillRect(x, y + obs.h * 0.3, obs.w, obs.h * 0.4);
    ctx.fillStyle = `rgba(255,255,200,${intensity})`;
    ctx.fillRect(x, y + obs.h * 0.4, obs.w, obs.h * 0.2);
    ctx.fillStyle = '#ff5500';
    ctx.fillRect(x,              y, 8, obs.h);
    ctx.fillRect(x + obs.w - 8,  y, 8, obs.h);
    ctx.restore();
  }
  else if (obs.type === 'satellite') {
    const p = 4;
    ctx.fillStyle = '#2255ee';
    ctx.fillRect(x,       y + p, 10, p);
    ctx.fillRect(x + 46,  y + p, 10, p);
    const body = ["  XXX  ","XXXXXXX","  XXX  "];
    for (let r = 0; r < body.length; r++) {
      for (let c = 0; c < body[r].length; c++) {
        if (body[r][c] !== 'X') continue;
        ctx.fillStyle = r === 1 ? '#bbbbcc' : '#888899';
        ctx.fillRect(x + 10 + c * p, y + r * p, p, p);
      }
    }
    if (Math.floor(frameCount / 18) % 2 === 0) {
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(x + 26, y, 4, 4);
    }
  }
  else if (obs.type === 'mine') {
    const cx = x + 15, cy = obs.y + 15;
    ctx.save();
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur  = 8 + Math.sin(obs.phase) * 6;
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i + obs.phase * 0.4;
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 11, cy + Math.sin(angle) * 11);
      ctx.lineTo(cx + Math.cos(angle) * 18, cy + Math.sin(angle) * 18);
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 11);
    g.addColorStop(0, '#ff4466');
    g.addColorStop(1, '#880022');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,200,220,0.3)';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

let powerups   = [];
let puTimer    = 0;
const PU_EVERY = 420;

function spawnPowerup() {
  powerups.push({
    type : Math.random() < 0.5 ? 'shield' : 'slowmo',
    x    : W + 20,
    y    : GROUND_Y - 80 - Math.random() * 70,
    w    : 26, h: 26,
    phase: 0,
  });
}

function drawPowerup(pu) {
  pu.phase += 0.05;
  const cx = pu.x + 13;
  const cy = pu.y + 13 + Math.sin(pu.phase) * 5;

  ctx.save();

  if (pu.type === 'shield') {
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur  = 14;
    drawStar5(cx, cy, 13, 6, '#00ffcc');
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.shadowColor = '#ffee00';
    ctx.shadowBlur  = 14;
    ctx.strokeStyle = '#ffee00';
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - 7);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 5, cy + 1);
    ctx.stroke();
  }

  ctx.restore();
}

function drawStar5(cx, cy, outerR, innerR, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const fx = cx + Math.cos(angle) * r;
    const fy = cy + Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy);
  }
  ctx.closePath();
  ctx.fill();
}

let particles = [];

function spawnParticles(x, y, count, color, speed, gravity = 0.12) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.6;
    particles.push({
      x, y,
      vx   : Math.cos(angle) * (Math.random() * speed + 1),
      vy   : Math.sin(angle) * (Math.random() * speed + 1),
      life : 1,
      decay: Math.random() * 0.03 + 0.018,
      size : Math.random() * 4 + 2,
      color,
      gravity,
    });
  }
}

function spawnTrail() {
  if (frameCount % 3 !== 0) return;
  const color = player.shield ? '#00ffcc' : (player.slowmo ? '#ffee00' : '#ff7722');
  particles.push({
    x    : player.x + 4 + Math.random() * 4,
    y    : player.y + player.h * 0.75,
    vx   : -(gameSpeed * 0.5) - Math.random(),
    vy   : (Math.random() - 0.5) * 0.6,
    life : 1,
    decay: 0.07,
    size : Math.random() * 3 + 1,
    color,
    gravity: -0.02,
  });
}

const BG_DAY   = { r: 8,  g: 4,  b: 28 };
const BG_NIGHT = { r: 0,  g: 0,  b: 6  };

function drawBackground() {
  const r = Math.floor(BG_DAY.r + (BG_NIGHT.r - BG_DAY.r) * bgBlend);
  const g = Math.floor(BG_DAY.g + (BG_NIGHT.g - BG_DAY.g) * bgBlend);
  const b = Math.floor(BG_DAY.b + (BG_NIGHT.b - BG_DAY.b) * bgBlend);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, W, H);

  if (bgBlend < 0.6) {
    const alpha = (0.6 - bgBlend) * 0.4;
    const neb = ctx.createRadialGradient(550, 60, 10, 550, 60, 280);
    neb.addColorStop(0, `rgba(90,10,150,${alpha})`);
    neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.save();
  ctx.globalAlpha = 0.12 + (1 - bgBlend) * 0.1;
  const pGrd = ctx.createRadialGradient(690, 50, 5, 690, 50, 38);
  pGrd.addColorStop(0, '#aa55ff');
  pGrd.addColorStop(0.5, '#6600cc');
  pGrd.addColorStop(1, 'rgba(40,0,80,0)');
  ctx.fillStyle = pGrd;
  ctx.beginPath();
  ctx.arc(690, 50, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const t = Date.now() * 0.001;
  for (const s of STARS) {
    s.x -= s.speed * (STATE === 'PLAYING' ? 0.5 : 0.1);
    if (s.x < -2) s.x = W + 2;
    const tw = Math.sin(t * s.twFreq * 60 + s.twPhs);
    const alpha = Math.max(0.1, Math.min(1, s.alpha + tw * 0.25 + bgBlend * 0.2));
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }

  const gColor = isNight ? '#00ffaa' : '#5533ff';
  ctx.shadowColor = gColor;
  ctx.shadowBlur  = 8;
  ctx.fillStyle   = gColor;
  ctx.fillRect(0, GROUND_Y, W, 2);
  ctx.shadowBlur = 0;

  groundOffset = (groundOffset + (STATE === 'PLAYING' ? gameSpeed : 0)) % 24;
  ctx.fillStyle = gColor + '44';
  for (let gx = -groundOffset; gx < W; gx += 24) {
    ctx.fillRect(gx, GROUND_Y + 5, 8, 2);
  }
}

function collides(a, b) {
  const m = 7;
  return (
    a.x + m       < b.x + b.w - m &&
    a.x + a.w - m > b.x + m       &&
    a.y + m       < b.y + b.h - m &&
    a.y + a.h - m > b.y + m
  );
}

function jump() {
  if (!player.onGround) return;
  player.vy       = JUMP_VELOCITY;
  player.onGround = false;
  spawnParticles(player.x + 16, player.y + player.h, 10, '#8866ff', 2.5, 0.08);
}

document.addEventListener('keydown', e => {
  if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
  e.preventDefault();
  if (STATE === 'START')        startGame();
  else if (STATE === 'PLAYING') jump();
  else if (STATE === 'GAMEOVER') restartGame();
});

function startGame() {
  STATE      = 'PLAYING';
  score      = 0;
  frameCount = 0;
  gameSpeed  = INITIAL_SPEED;
  OBS_MIN    = 80;
  OBS_MAX    = 155;
  obstacles  = [];
  powerups   = [];
  particles  = [];
  obsTimer   = 0;
  puTimer    = 0;
  nextObsIn  = 110;
  cycleTimer = 0;
  isNight    = false;
  bgBlend    = 0;

  document.getElementById('shieldBadge').classList.remove('visible');
  document.getElementById('slowmoBadge').classList.remove('visible');
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('gameoverScreen').classList.add('hidden');

  resetPlayer();
}

function endGame() {
  STATE = 'GAMEOVER';

  spawnParticles(player.x + 16, player.y + 24, 35, '#ff4400', 5, 0.15);
  spawnParticles(player.x + 16, player.y + 24, 20, '#ffff44', 3.5, 0.1);

  const s = Math.floor(score);
  if (s > hiScore) {
    hiScore = s;
    localStorage.setItem('astro_hi', hiScore);
  }

  let lb = JSON.parse(localStorage.getItem('astro_lb') || '[]');
  lb.push(s);
  lb.sort((a, b) => b - a);
  lb = lb.slice(0, 5);
  localStorage.setItem('astro_lb', JSON.stringify(lb));

  document.getElementById('finalScoreVal').textContent = String(s).padStart(5, '0');
  document.getElementById('bestVal').textContent       = String(hiScore).padStart(5, '0');
  document.getElementById('scoreVal').textContent      = String(s).padStart(5, '0');

  const rankClasses = ['r1','r2','r3','',''];
  const medals      = ['🥇','🥈','🥉','4.','5.'];
  document.getElementById('lbEntries').innerHTML = lb.map((sc, i) =>
    `<div class="lb-entry ${rankClasses[i]}">
       <span>${medals[i]}</span>
       <span>${String(sc).padStart(5, '0')}</span>
     </div>`
  ).join('');

  setTimeout(() => {
    document.getElementById('gameoverScreen').classList.remove('hidden');
  }, 500);
}

function restartGame() {
  startGame();
}

window.restartGame = restartGame;

function update() {
  if (STATE !== 'PLAYING') return;
  frameCount++;

  const spd = player.slowmo ? gameSpeed * 0.38 : gameSpeed;

  score += spd * 0.055;
  document.getElementById('scoreVal').textContent = String(Math.floor(score)).padStart(5, '0');
  document.getElementById('bestVal').textContent  = String(Math.max(hiScore, Math.floor(score))).padStart(5, '0');

  if (frameCount % 180 === 0) {
    gameSpeed = Math.min(MAX_SPEED, gameSpeed + 0.28);
    OBS_MIN   = Math.max(42, OBS_MIN - 2);
    OBS_MAX   = Math.max(80, OBS_MAX - 3);
  }

  cycleTimer++;
  if (cycleTimer >= CYCLE_FRAMES) {
    cycleTimer = 0;
    isNight    = !isNight;
  }
  bgBlend += ((isNight ? 1 : 0) - bgBlend) * 0.008;

  if (!player.onGround) {
    player.vy += GRAVITY;
    player.y  += player.vy;
  }
  if (player.y >= GROUND_Y - player.h) {
    player.y        = GROUND_Y - player.h;
    player.vy       = 0;
    player.onGround = true;
  }

  if (player.onGround) {
    player.walkTick++;
    if (player.walkTick >= 10) {
      player.walkTick  = 0;
      player.walkFrame = 1 - player.walkFrame;
    }
  } else {
    player.walkFrame = 0;
  }

  if (player.shield) {
    player.shieldTimer--;
    if (player.shieldTimer <= 0) {
      player.shield = false;
      document.getElementById('shieldBadge').classList.remove('visible');
    }
  }
  if (player.slowmo) {
    player.slowmoTimer--;
    if (player.slowmoTimer <= 0) {
      player.slowmo = false;
      document.getElementById('slowmoBadge').classList.remove('visible');
    }
  }
  if (player.flashTimer > 0) player.flashTimer -= 0.04;

  spawnTrail();

  obsTimer++;
  if (obsTimer >= nextObsIn) {
    obsTimer  = 0;
    nextObsIn = OBS_MIN + Math.random() * (OBS_MAX - OBS_MIN);
    spawnObstacle();
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= spd;

    if (o.type === 'satellite') {
      o.y += o.vy;
      if (o.y < o.minY || o.y > o.maxY) o.vy *= -1;
    }
    if (o.type === 'mine') {
      o.phase += 0.05;
      o.y = o.baseY + Math.sin(o.phase) * 18;
    }

    if (!player.shield && collides(player, o)) {
      player.flashTimer = 1;
      endGame();
      return;
    }

    if (o.x + (o.w || 64) < -20) obstacles.splice(i, 1);
  }

  puTimer++;
  if (puTimer >= PU_EVERY) {
    puTimer = 0;
    spawnPowerup();
  }

  for (let i = powerups.length - 1; i >= 0; i--) {
    const pu = powerups[i];
    pu.x -= spd;

    if (collides(player, pu)) {
      if (pu.type === 'shield') {
        player.shield      = true;
        player.shieldTimer = 280;
        document.getElementById('shieldBadge').classList.add('visible');
        spawnParticles(pu.x + 13, pu.y + 13, 22, '#00ffcc', 4);
      } else {
        player.slowmo      = true;
        player.slowmoTimer = 210;
        document.getElementById('slowmoBadge').classList.add('visible');
        spawnParticles(pu.x + 13, pu.y + 13, 22, '#ffee00', 4);
      }
      powerups.splice(i, 1);
      continue;
    }
    if (pu.x + 26 < -20) powerups.splice(i, 1);
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x    += p.vx;
    p.y    += p.vy;
    p.vy   += p.gravity;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  drawBackground();

  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle   = p.color;
    ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  if (STATE === 'PLAYING' || STATE === 'GAMEOVER') {
    drawAstronaut();
  }

  for (const o of obstacles) drawObstacle(o);
  for (const pu of powerups)  drawPowerup(pu);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

resetPlayer();
document.getElementById('bestVal').textContent = String(hiScore).padStart(5, '0');
gameLoop();
