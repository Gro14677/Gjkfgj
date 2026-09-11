(function () {
  "use strict";
  var GRID = 18;
  var CELL = 20;
  var canvas = document.getElementById("board");
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = GRID * CELL * dpr;
  canvas.height = GRID * CELL * dpr;
  ctx.scale(dpr, dpr);

  var css = getComputedStyle(document.documentElement);
  function token(name) { return css.getPropertyValue(name).trim(); }

  var overlay = document.getElementById("overlay");
  var overlayTitle = document.getElementById("overlayTitle");
  var overlayText = document.getElementById("overlayText");
  var overlayBtn = document.getElementById("overlayBtn");
  var statLength = document.getElementById("statLength");
  var statBest = document.getElementById("statBest");
  var pauseBtn = document.getElementById("pauseBtn");
  var restartBtn = document.getElementById("restartBtn");

  var best = 3;
  try {
    var saved = localStorage.getItem("terrarium-snake-best");
    if (saved) best = Math.max(3, parseInt(saved, 10) || 3);
  } catch (e) {}

  var state;

  function freshState() {
    return {
      snake: [{ x: 9, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 9 }],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: 13, y: 9 },
      tickMs: 130,
      acc: 0,
      last: 0,
      running: false,
      phase: "idle", // idle | playing | paused | over
      soilRows: 3
    };
  }

  function placeFood() {
    var occupied = {};
    state.snake.forEach(function (s) { occupied[s.x + "," + s.y] = true; });
    var x, y;
    do {
      x = Math.floor(Math.random() * GRID);
      y = Math.floor(Math.random() * GRID);
    } while (occupied[x + "," + y]);
    state.food = { x: x, y: y };
  }

  function setPhase(phase, title, text, btnLabel) {
    state.phase = phase;
    if (phase === "playing") {
      overlay.hidden = true;
    } else {
      overlay.hidden = false;
      overlayTitle.textContent = title;
      overlayText.textContent = text;
      overlayBtn.textContent = btnLabel;
    }
    pauseBtn.textContent = phase === "paused" ? "Продолжить" : "Пауза";
  }

  function start() {
    setPhase("playing");
    if (!state.running) {
      state.running = true;
      state.last = performance.now();
      requestAnimationFrame(loop);
    }
  }

  function togglePause() {
    if (state.phase === "playing") {
      setPhase("paused", "Отдыхает", "Террариум замирает, пока ты отвернулся.", "Продолжить");
    } else if (state.phase === "paused") {
      start();
    }
  }

  function restart() {
    state = freshState();
    updateStats();
    setPhase("idle", "Нажми, чтобы разбудить", "Стрелки, WASD или свайп по стеклу.", "Начать");
    draw();
  }

  function updateStats() {
    statLength.textContent = String(state.snake.length);
    statBest.textContent = String(best);
  }

  function setDir(dx, dy) {
    if (state.phase !== "playing") return;
    var d = state.dir;
    if (dx === -d.x && dy === -d.y) return; // нельзя развернуться на 180°
    state.nextDir = { x: dx, y: dy };
  }

  document.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === " ") { e.preventDefault(); togglePause(); return; }
    var map = {
      ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
      W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0]
    };
    if (map[k]) {
      e.preventDefault();
      if (state.phase === "idle") start();
      setDir(map[k][0], map[k][1]);
    }
  });

  document.querySelectorAll(".dpad button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var parts = btn.getAttribute("data-dir").split(",").map(Number);
      if (state.phase === "idle") start();
      setDir(parts[0], parts[1]);
    });
  });

  overlayBtn.addEventListener("click", function () {
    if (state.phase === "idle" || state.phase === "paused") start();
    else if (state.phase === "over") restart();
  });
  pauseBtn.addEventListener("click", togglePause);
  restartBtn.addEventListener("click", restart);

  var touchStart = null;
  canvas.addEventListener("touchstart", function (e) {
    var t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
    if (state.phase === "idle") start();
  }, { passive: true });
  canvas.addEventListener("touchend", function (e) {
    if (!touchStart) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStart.x;
    var dy = t.clientY - touchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 16) setDir(dx > 0 ? 1 : -1, 0);
    } else {
      if (Math.abs(dy) > 16) setDir(0, dy > 0 ? 1 : -1);
    }
    touchStart = null;
  }, { passive: true });

  function step() {
    state.dir = state.nextDir;
    var head = state.snake[0];
    var nx = head.x + state.dir.x;
    var ny = head.y + state.dir.y;

    if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) return gameOver();
    for (var i = 0; i < state.snake.length; i++) {
      if (state.snake[i].x === nx && state.snake[i].y === ny) return gameOver();
    }

    state.snake.unshift({ x: nx, y: ny });
    if (nx === state.food.x && ny === state.food.y) {
      if (best < state.snake.length) {
        best = state.snake.length;
        try { localStorage.setItem("terrarium-snake-best", String(best)); } catch (e) {}
      }
      if (state.snake.length % 5 === 0) {
        state.tickMs = Math.max(70, state.tickMs - 6);
      }
      placeFood();
    } else {
      state.snake.pop();
    }
    updateStats();
  }

  function gameOver() {
    setPhase("over", "Обратно в почву", "Итоговая длина " + state.snake.length + " · рекорд " + best + ".", "Расти заново");
  }

  function loop(now) {
    if (state.phase !== "playing") { state.running = false; return; }
    var dt = now - state.last;
    state.last = now;
    state.acc += dt;
    while (state.acc >= state.tickMs) {
      state.acc -= state.tickMs;
      step();
      if (state.phase !== "playing") break;
    }
    draw();
    requestAnimationFrame(loop);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw() {
    var W = GRID * CELL, H = GRID * CELL;
    ctx.clearRect(0, 0, W, H);

    // капли росы на стекле
    ctx.fillStyle = token("--dew");
    for (var gx = 0; gx < GRID; gx++) {
      for (var gy = 0; gy < GRID - state.soilRows; gy++) {
        ctx.beginPath();
        ctx.arc(gx * CELL + CELL / 2, gy * CELL + CELL / 2, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // почва
    var soilY = (GRID - state.soilRows) * CELL;
    var soilGrad = ctx.createLinearGradient(0, soilY, 0, H);
    soilGrad.addColorStop(0, token("--soil"));
    soilGrad.addColorStop(1, token("--soil-dark"));
    ctx.fillStyle = soilGrad;
    ctx.fillRect(0, soilY, W, H - soilY);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (var p = 0; p < 22; p++) {
      var px = (p * 53.7) % W;
      var py = soilY + ((p * 31.3) % (H - soilY));
      ctx.beginPath();
      ctx.arc(px, py, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // ягода
    var fx = state.food.x * CELL + CELL / 2;
    var fy = state.food.y * CELL + CELL / 2;
    ctx.fillStyle = token("--berry-leaf");
    ctx.fillRect(fx - 1, fy - CELL / 2 + 2, 2, 5);
    ctx.beginPath();
    ctx.arc(fx, fy + 1, CELL * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = token("--berry");
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fx - 2.5, fy - 1.5, CELL * 0.09, 0, Math.PI * 2);
    ctx.fillStyle = token("--berry-shine");
    ctx.fill();

    // змей
    for (var i = state.snake.length - 1; i >= 0; i--) {
      var seg = state.snake[i];
      var sx = seg.x * CELL, sy = seg.y * CELL;
      var isHead = i === 0;
      ctx.fillStyle = isHead ? token("--moss") : (i % 2 === 0 ? token("--moss") : token("--moss-dark"));
      roundRect(sx + 2, sy + 2, CELL - 4, CELL - 4, isHead ? 7 : 5);
      ctx.fill();
      if (!isHead) {
        ctx.fillStyle = token("--moss-belly");
        roundRect(sx + CELL / 2 - 2.5, sy + CELL / 2 - 2.5, 5, 5, 2);
        ctx.fill();
      }
    }

    // глаза на голове
    if (state.snake.length) {
      var h = state.snake[0];
      var hx = h.x * CELL, hy = h.y * CELL;
      var d = state.dir;
      var ex1 = hx + CELL / 2 + d.y * 5 - d.x * 2 + d.x * 5;
      var ey1 = hy + CELL / 2 - d.x * 5 - d.y * 2 + d.y * 5;
      var ex2 = hx + CELL / 2 - d.y * 5 - d.x * 2 + d.x * 5;
      var ey2 = hy + CELL / 2 + d.x * 5 - d.y * 2 + d.y * 5;
      ctx.fillStyle = token("--bg");
      ctx.beginPath(); ctx.arc(ex1, ey1, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex2, ey2, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  restart();
})();
