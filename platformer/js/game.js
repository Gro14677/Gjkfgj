(function () {
  "use strict";

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var W = canvas.width, H = canvas.height;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var cssW = canvas.width, cssH = canvas.height;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  ctx.scale(dpr, dpr);

  var css = getComputedStyle(document.documentElement);
  function token(name) { return css.getPropertyValue(name).trim(); }

  var overlay = document.getElementById("overlay");
  var overlayTitle = document.getElementById("overlayTitle");
  var overlayText = document.getElementById("overlayText");
  var overlayBtn = document.getElementById("overlayBtn");
  var hudAcorns = document.getElementById("hudAcorns");
  var hudTotal = document.getElementById("hudTotal");
  var hudDeaths = document.getElementById("hudDeaths");
  var hudTime = document.getElementById("hudTime");

  // ---------- constants ----------
  var GROUND_Y = 460;
  var LEVEL_W = 2600;
  var PLATFORM_H = 22;
  var GRAVITY = 1700;
  var MAX_FALL = 700;
  var MOVE_SPEED = 210;
  var JUMP_VELOCITY = -620;

  // ---------- level data ----------
  var grounds = [
    { x0: 0, x1: 360 },
    { x0: 450, x1: 760 },
    { x0: 850, x1: 1250 },
    { x0: 1340, x1: 1750 },
    { x0: 1840, x1: 2600 }
  ];

  var platformDefs = [
    { x: 120, y: 380, w: 90 }, { x: 230, y: 300, w: 90 },
    { x: 520, y: 390, w: 100 }, { x: 640, y: 310, w: 90 },
    { x: 900, y: 380, w: 110 }, { x: 1020, y: 300, w: 100 }, { x: 1140, y: 220, w: 100 },
    { x: 1420, y: 380, w: 100 }, { x: 1560, y: 300, w: 100 },
    { x: 2000, y: 380, w: 110 }, { x: 2150, y: 300, w: 100 }, { x: 2300, y: 380, w: 100 }
  ];

  var enemyDefs = [
    { x: 470, min: 470, max: 650, surfaceY: GROUND_Y, w: 26, h: 22, speed: 55 },
    { x: 950, min: 950, max: 1150, surfaceY: GROUND_Y, w: 26, h: 22, speed: 65 },
    { x: 1400, min: 1400, max: 1600, surfaceY: GROUND_Y, w: 26, h: 22, speed: 60 },
    { x: 1020, min: 1020, max: 1090, surfaceY: 300, w: 24, h: 20, speed: 40 }
  ];

  var acornDefs = [
    { x: 150, y: 420 }, { x: 500, y: 420 }, { x: 700, y: 420 }, { x: 900, y: 420 },
    { x: 1180, y: 420 }, { x: 1450, y: 420 }, { x: 1700, y: 420 }, { x: 1900, y: 420 },
    { x: 2200, y: 420 }, { x: 2450, y: 420 },
    { x: 150, y: 360 }, { x: 260, y: 280 },
    { x: 555, y: 370 }, { x: 675, y: 290 },
    { x: 935, y: 360 }, { x: 1055, y: 280 }, { x: 1175, y: 200 },
    { x: 1455, y: 360 }, { x: 1595, y: 280 },
    { x: 2035, y: 360 }, { x: 2185, y: 280 }, { x: 2335, y: 360 }
  ];

  var flagX = 2555;

  var solids = grounds.map(function (g) {
    return { x: g.x0, y: GROUND_Y, w: g.x1 - g.x0, h: cssH - GROUND_Y };
  }).concat(platformDefs.map(function (p) {
    return { x: p.x, y: p.y, w: p.w, h: PLATFORM_H };
  }));

  var player, enemies, acorns, phase, elapsed, startTime, deaths, collected;
  var input = { left: false, right: false, jumpHeld: false };
  var best = null;
  try {
    var savedBest = localStorage.getItem("canopy-runner-best");
    if (savedBest) best = parseFloat(savedBest);
  } catch (e) {}

  function resetWorld() {
    player = { x: 40, y: GROUND_Y - 44, w: 34, h: 44, vx: 0, vy: 0, onGround: false, facing: 1 };
    enemies = enemyDefs.map(function (d) {
      return { x: d.x, min: d.min, max: d.max, y: d.surfaceY - d.h, w: d.w, h: d.h, speed: d.speed, dir: 1, dead: false };
    });
    acorns = acornDefs.map(function (a) { return { x: a.x, y: a.y, collected: false }; });
    deaths = 0;
    collected = 0;
    elapsed = 0;
    hudTotal.textContent = String(acorns.length);
  }

  function respawnPlayer() {
    player.x = 40; player.y = GROUND_Y - 44; player.vx = 0; player.vy = 0;
  }

  function setPhase(p) { phase = p; }

  function showOverlay(title, text, btn) {
    overlay.hidden = false;
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlayBtn.textContent = btn;
  }

  function startRun() {
    resetWorld();
    setPhase("playing");
    overlay.hidden = true;
    startTime = performance.now();
  }

  overlayBtn.addEventListener("click", function () {
    startRun();
  });

  function triggerJump() {
    if (phase === "idle" || phase === "win") { startRun(); return; }
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
    }
  }

  var leftKeys = { ArrowLeft: 1, a: 1, A: 1 };
  var rightKeys = { ArrowRight: 1, d: 1, D: 1 };
  var jumpKeys = { ArrowUp: 1, w: 1, W: 1, " ": 1 };

  document.addEventListener("keydown", function (e) {
    if (e.key === "r" || e.key === "R") { startRun(); return; }
    if (leftKeys[e.key]) { input.left = true; e.preventDefault(); }
    if (rightKeys[e.key]) { input.right = true; e.preventDefault(); }
    if (jumpKeys[e.key]) {
      e.preventDefault();
      if (!input.jumpHeld) triggerJump();
      input.jumpHeld = true;
    }
  });
  document.addEventListener("keyup", function (e) {
    if (leftKeys[e.key]) input.left = false;
    if (rightKeys[e.key]) input.right = false;
    if (jumpKeys[e.key]) {
      input.jumpHeld = false;
      if (player.vy < 0) player.vy *= 0.45;
    }
  });

  function bindHold(id, onDown, onUp) {
    var el = document.getElementById(id);
    el.addEventListener("pointerdown", function (e) { e.preventDefault(); onDown(); });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) {
      el.addEventListener(ev, function () { onUp(); });
    });
  }
  bindHold("btnLeft", function () { input.left = true; }, function () { input.left = false; });
  bindHold("btnRight", function () { input.right = true; }, function () { input.right = false; });
  bindHold("btnJump", function () {
    triggerJump(); input.jumpHeld = true;
  }, function () {
    input.jumpHeld = false;
    if (player.vy < 0) player.vy *= 0.45;
  });

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function moveAndCollide(dt) {
    player.x += player.vx * dt;
    for (var i = 0; i < solids.length; i++) {
      var r = solids[i];
      if (aabb(player, r)) {
        if (player.vx > 0) player.x = r.x - player.w;
        else if (player.vx < 0) player.x = r.x + r.w;
        player.vx = 0;
      }
    }
    player.x = Math.max(0, Math.min(LEVEL_W - player.w, player.x));

    var wasFalling = player.vy > 0;
    player.y += player.vy * dt;
    player.onGround = false;
    for (var j = 0; j < solids.length; j++) {
      var rr = solids[j];
      if (aabb(player, rr)) {
        if (player.vy > 0) { player.y = rr.y - player.h; player.vy = 0; player.onGround = true; }
        else if (player.vy < 0) { player.y = rr.y + rr.h; player.vy = 0; }
      }
    }
    return wasFalling;
  }

  function update(dt) {
    elapsed += dt;

    player.vx = (input.right ? MOVE_SPEED : 0) - (input.left ? MOVE_SPEED : 0);
    if (player.vx > 0) player.facing = 1;
    else if (player.vx < 0) player.facing = -1;

    player.vy += GRAVITY * dt;
    if (player.vy > MAX_FALL) player.vy = MAX_FALL;

    var wasFalling = moveAndCollide(dt);

    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (en.dead) continue;
      en.x += en.dir * en.speed * dt;
      if (en.x < en.min) { en.x = en.min; en.dir = 1; }
      if (en.x + en.w > en.max) { en.x = en.max - en.w; en.dir = -1; }

      if (aabb(player, en)) {
        if (wasFalling && (player.y + player.h - en.y) < 16) {
          en.dead = true;
          player.vy = JUMP_VELOCITY * 0.55;
        } else {
          deaths++;
          respawnPlayer();
        }
      }
    }

    for (var k = 0; k < acorns.length; k++) {
      var ac = acorns[k];
      if (ac.collected) continue;
      var dx = (player.x + player.w / 2) - ac.x;
      var dy = (player.y + player.h / 2) - ac.y;
      if (dx * dx + dy * dy < 26 * 26) { ac.collected = true; collected++; }
    }

    if (player.y > cssH + 60) {
      deaths++;
      respawnPlayer();
    }

    if (player.x + player.w > flagX && player.x < flagX + 30) {
      setPhase("win");
      var t = elapsed;
      if (best === null || t < best) {
        best = t;
        try { localStorage.setItem("canopy-runner-best", String(best)); } catch (e) {}
      }
      showOverlay(
        "Роща позади",
        "Время " + t.toFixed(1) + "с · жёлудей " + collected + "/" + acorns.length + " · лучшее " + best.toFixed(1) + "с",
        "Ещё раз"
      );
    }
  }

  function roundRectPath(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawSky() {
    var g = ctx.createLinearGradient(0, 0, 0, cssH);
    g.addColorStop(0, token("--sky-top"));
    g.addColorStop(1, token("--sky-bottom"));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cssW, cssH);
  }

  function drawParallaxHills(camX) {
    var tile = 480, offset = -((camX * 0.25) % tile);
    ctx.fillStyle = token("--canopy-dark");
    for (var x = offset - tile; x < cssW + tile; x += tile) {
      ctx.beginPath();
      ctx.ellipse(x + 120, 420, 220, 90, 0, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + 360, 440, 180, 70, 0, Math.PI, 0);
      ctx.fill();
    }
  }

  function drawParallaxTrees(camX) {
    var tile = 220, offset = -((camX * 0.55) % tile);
    for (var x = offset - tile; x < cssW + tile; x += tile) {
      ctx.fillStyle = token("--bark-dark");
      ctx.fillRect(x + 100, 300, 10, 160);
      ctx.fillStyle = token("--canopy");
      ctx.beginPath();
      ctx.ellipse(x + 105, 290, 60, 46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = token("--canopy-light");
      ctx.beginPath();
      ctx.ellipse(x + 85, 275, 30, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGrounds() {
    for (var i = 0; i < grounds.length; i++) {
      var g = grounds[i];
      var grad = ctx.createLinearGradient(0, GROUND_Y, 0, cssH);
      grad.addColorStop(0, token("--ground"));
      grad.addColorStop(1, token("--ground-dark"));
      ctx.fillStyle = grad;
      ctx.fillRect(g.x0, GROUND_Y, g.x1 - g.x0, cssH - GROUND_Y);
      ctx.fillStyle = token("--canopy-light");
      for (var tx = g.x0 + 6; tx < g.x1; tx += 18) {
        ctx.beginPath();
        ctx.moveTo(tx, GROUND_Y);
        ctx.lineTo(tx + 4, GROUND_Y - 7);
        ctx.lineTo(tx + 8, GROUND_Y);
        ctx.fill();
      }
    }
  }

  function drawPlatforms() {
    for (var i = 0; i < platformDefs.length; i++) {
      var p = platformDefs[i];
      ctx.fillStyle = token("--bark-dark");
      roundRectPath(p.x, p.y + 6, p.w, PLATFORM_H - 4, 5);
      ctx.fill();
      ctx.fillStyle = token("--bark");
      roundRectPath(p.x, p.y, p.w, PLATFORM_H, 5);
      ctx.fill();
      ctx.fillStyle = token("--canopy-light");
      ctx.fillRect(p.x + 2, p.y, p.w - 4, 3);
    }
  }

  function drawAcorn(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.fillStyle = token("--accent");
    ctx.beginPath();
    ctx.ellipse(0, 3, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = token("--bark");
    ctx.beginPath();
    ctx.ellipse(0, -4, 7.5, 5, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = token("--bark-dark");
    ctx.fillRect(-1, -9, 2, 4);
    ctx.restore();
  }

  function drawFlag() {
    var baseY = GROUND_Y;
    ctx.fillStyle = token("--bark-dark");
    ctx.fillRect(flagX - 3, baseY - 100, 6, 100);
    var glow = ctx.createRadialGradient(flagX, baseY - 105, 4, flagX, baseY - 105, 46);
    glow.addColorStop(0, token("--lantern"));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(flagX, baseY - 105, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = token("--lantern");
    roundRectPath(flagX - 11, baseY - 122, 22, 26, 5);
    ctx.fill();
    ctx.fillStyle = token("--bark-dark");
    ctx.fillRect(flagX - 11, baseY - 100, 22, 4);
  }

  function drawEnemy(e) {
    if (e.dead) return;
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h);
    for (var s = -1; s <= 1; s++) {
      ctx.strokeStyle = token("--danger");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s * (e.w * 0.28), -4);
      ctx.lineTo(s * (e.w * 0.28) + s * 5, 4);
      ctx.stroke();
    }
    ctx.translate(0, -e.h / 2);
    ctx.fillStyle = token("--danger");
    ctx.beginPath();
    ctx.ellipse(0, 0, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = token("--danger");
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-4, -e.h / 2); ctx.quadraticCurveTo(-10, -e.h / 2 - 8, -12, -e.h / 2 - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -e.h / 2); ctx.quadraticCurveTo(10, -e.h / 2 - 8, 12, -e.h / 2 - 10); ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-3.5, -1, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3.5, -1, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#221833";
    ctx.beginPath(); ctx.arc(-3, -1, 1.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -1, 1.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawPlayer(time) {
    var p = player;
    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    if (p.facing < 0) ctx.scale(-1, 1);

    var moving = p.onGround && Math.abs(p.vx) > 5;
    var legAngle = moving ? Math.sin(time * 0.015) * 0.6 : (p.onGround ? 0 : 0.35);

    function leg(sign) {
      ctx.save();
      ctx.translate(sign * 6, 10);
      ctx.rotate(sign > 0 ? legAngle : -legAngle);
      ctx.fillStyle = token("--fox-dark");
      roundRectPath(-3, 0, 6, 15, 3);
      ctx.fill();
      ctx.restore();
    }
    leg(-1); leg(1);

    // tail
    ctx.save();
    ctx.translate(-14, -2);
    ctx.rotate(-0.35);
    ctx.fillStyle = token("--fox");
    ctx.beginPath(); ctx.ellipse(0, 0, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = token("--fox-cream");
    ctx.beginPath(); ctx.ellipse(-11, -1, 4, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // body
    ctx.fillStyle = token("--fox");
    ctx.beginPath(); ctx.ellipse(0, 2, 15, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = token("--fox-cream");
    ctx.beginPath(); ctx.ellipse(1, 9, 9, 7, 0, 0, Math.PI * 2); ctx.fill();

    // head
    ctx.fillStyle = token("--fox");
    ctx.beginPath(); ctx.arc(14, -10, 11, 0, Math.PI * 2); ctx.fill();

    // ears
    ctx.fillStyle = token("--fox");
    ctx.beginPath(); ctx.moveTo(7, -18); ctx.lineTo(3, -30); ctx.lineTo(13, -21); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(19, -19); ctx.lineTo(24, -31); ctx.lineTo(27, -20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = token("--fox-cream");
    ctx.beginPath(); ctx.moveTo(8, -19); ctx.lineTo(6.5, -26); ctx.lineTo(11.5, -21); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(20, -20); ctx.lineTo(23, -27); ctx.lineTo(25, -20.5); ctx.closePath(); ctx.fill();

    // snout + face
    ctx.fillStyle = token("--fox-cream");
    ctx.beginPath(); ctx.ellipse(23, -7, 6.5, 4.2, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2a1c10";
    ctx.beginPath(); ctx.arc(28.5, -7.5, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(16.5, -13, 1.7, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  function draw(time) {
    var camX = Math.max(0, Math.min(LEVEL_W - cssW, player.x + player.w / 2 - cssW / 2));
    drawSky();
    drawParallaxHills(camX);
    drawParallaxTrees(camX);
    ctx.save();
    ctx.translate(-camX, 0);
    drawGrounds();
    drawPlatforms();
    drawFlag();
    for (var i = 0; i < acorns.length; i++) if (!acorns[i].collected) drawAcorn(acorns[i]);
    for (var j = 0; j < enemies.length; j++) drawEnemy(enemies[j]);
    drawPlayer(time);
    ctx.restore();
  }

  function updateHud() {
    hudAcorns.textContent = String(collected);
    hudDeaths.textContent = String(deaths);
    hudTime.textContent = elapsed.toFixed(1);
  }

  var last = 0;
  function tick(now) {
    var dt = Math.min((now - last) / 1000, 0.025);
    last = now;
    if (phase === "playing") update(dt);
    draw(now);
    updateHud();
    requestAnimationFrame(tick);
  }

  resetWorld();
  setPhase("idle");
  showOverlay("Лис проснулся в чаще", "Собери жёлуди, обходи жуков, добеги до фонаря на краю рощи.", "Бежать");
  requestAnimationFrame(function (t) { last = t; requestAnimationFrame(tick); });
})();
