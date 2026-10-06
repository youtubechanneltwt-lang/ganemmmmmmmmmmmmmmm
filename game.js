const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreBlue = document.getElementById("scoreBlue");
const scoreRed = document.getElementById("scoreRed");
const timerElement = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const message = document.getElementById("message");

let W, H;
let running = false;
let blueScore = 0;
let redScore = 0;
let timeLeft = 120;

const keys = {};

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
  }
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

function resize() {
  W = canvas.width = window.innerWidth * devicePixelRatio;
  H = canvas.height = window.innerHeight * devicePixelRatio;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

  W = window.innerWidth;
  H = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

/* =========================
   GAME OBJECTS
========================= */

const player = {
  x: 0,
  y: 0,
  radius: 17,
  speed: 3.5,
  vx: 0,
  vy: 0,
  color: "#27d97d",
  angle: 0
};

const opponent = {
  x: 0,
  y: 0,
  radius: 17,
  speed: 2.1,
  color: "#ff4e60",
  angle: 0
};

const ball = {
  x: 0,
  y: 0,
  radius: 8,
  vx: 0,
  vy: 0
};

/* =========================
   FIELD
========================= */

function field() {
  return {
    left: W * .12,
    right: W * .88,
    top: H * .20,
    bottom: H * .84
  };
}

function resetPositions() {
  const f = field();

  player.x = f.left + (f.right - f.left) * .28;
  player.y = (f.top + f.bottom) / 2;

  opponent.x = f.left + (f.right - f.left) * .72;
  opponent.y = (f.top + f.bottom) / 2;

  ball.x = (player.x + opponent.x) / 2;
  ball.y = (player.y + opponent.y) / 2;

  ball.vx = 0;
  ball.vy = 0;
}

/* =========================
   DRAW FIELD
========================= */

function drawField() {
  const f = field();

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#06150c");
  bg.addColorStop(1, "#102819");

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Stadium lights
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = "rgba(255,255,255,.04)";
    ctx.beginPath();
    ctx.arc(
      (i + .5) * W / 10,
      H * .08,
      35,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Field shadow
  ctx.shadowBlur = 35;
  ctx.shadowColor = "rgba(0,0,0,.8)";
  ctx.fillStyle = "#174d2b";
  ctx.fillRect(
    f.left - 8,
    f.top - 8,
    f.right - f.left + 16,
    f.bottom - f.top + 16
  );
  ctx.shadowBlur = 0;

  // Grass
  const grass = ctx.createLinearGradient(
    f.left,
    f.top,
    f.right,
    f.bottom
  );

  grass.addColorStop(0, "#16823f");
  grass.addColorStop(.5, "#1b9549");
  grass.addColorStop(1, "#126c34");

  ctx.fillStyle = grass;
  ctx.fillRect(
    f.left,
    f.top,
    f.right - f.left,
    f.bottom - f.top
  );

  // Grass stripes
  for (let x = f.left; x < f.right; x += 55) {
    ctx.fillStyle = "rgba(255,255,255,.025)";
    ctx.fillRect(
      x,
      f.top,
      27,
      f.bottom - f.top
    );
  }

  // Field lines
  ctx.strokeStyle = "rgba(255,255,255,.88)";
  ctx.lineWidth = 2;

  ctx.strokeRect(
    f.left,
    f.top,
    f.right - f.left,
    f.bottom - f.top
  );

  // Half line
  const midX = (f.left + f.right) / 2;

  ctx.beginPath();
  ctx.moveTo(midX, f.top);
  ctx.lineTo(midX, f.bottom);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(
    midX,
    (f.top + f.bottom) / 2,
    65,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    midX,
    (f.top + f.bottom) / 2,
    5,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "white";
  ctx.fill();

  // Penalty boxes
  const boxH = 190;
  const boxW = 110;
  const cy = (f.top + f.bottom) / 2;

  ctx.strokeRect(
    f.left,
    cy - boxH / 2,
    boxW,
    boxH
  );

  ctx.strokeRect(
    f.right - boxW,
    cy - boxH / 2,
    boxW,
    boxH
  );

  // Goal boxes
  const goalH = 90;
  const goalW = 45;

  ctx.strokeRect(
    f.left,
    cy - goalH / 2,
    goalW,
    goalH
  );

  ctx.strokeRect(
    f.right - goalW,
    cy - goalH / 2,
    goalW,
    goalH
  );

  // Goals
  ctx.fillStyle = "rgba(220,220,220,.35)";

  ctx.fillRect(
    f.left - 28,
    cy - 42,
    28,
    84
  );

  ctx.fillRect(
    f.right,
    cy - 42,
    28,
    84
  );

  // Penalty spots
  ctx.fillStyle = "white";

  ctx.beginPath();
  ctx.arc(f.left + 75, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(f.right - 75, cy, 3, 0, Math.PI * 2);
  ctx.fill();
}

/* =========================
   PLAYER DRAW
========================= */

function drawPlayer(p, isControlled = false) {

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.beginPath();
  ctx.ellipse(
    p.x,
    p.y + 12,
    p.radius * 1.15,
    p.radius * .45,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Glow
  if (isControlled) {
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#31f58c";
  }

  // Body
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Head
  ctx.fillStyle = "#f1c9a5";
  ctx.beginPath();
  ctx.arc(
    p.x,
    p.y - 18,
    7,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Shirt stripe
  ctx.strokeStyle = "rgba(255,255,255,.7)";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(p.x - 10, p.y);
  ctx.lineTo(p.x + 10, p.y);
  ctx.stroke();

  // Direction
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(
    p.x + Math.cos(p.angle) * 17,
    p.y + Math.sin(p.angle) * 17
  );
  ctx.stroke();
}

/* =========================
   BALL
========================= */

function drawBall() {

  ctx.shadowBlur = 10;
  ctx.shadowColor = "rgba(0,0,0,.7)";

  ctx.fillStyle = "white";

  ctx.beginPath();
  ctx.arc(
    ball.x,
    ball.y,
    ball.radius,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.fillStyle = "#111";

  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;

    ctx.beginPath();
    ctx.arc(
      ball.x + Math.cos(a) * 4,
      ball.y + Math.sin(a) * 4,
      1.8,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

/* =========================
   PLAYER MOVEMENT
========================= */

function updatePlayer() {

  let dx = 0;
  let dy = 0;

  if (keys["w"] || keys["arrowup"]) dy -= 1;
  if (keys["s"] || keys["arrowdown"]) dy += 1;
  if (keys["a"] || keys["arrowleft"]) dx -= 1;
  if (keys["d"] || keys["arrowright"]) dx += 1;

  const length = Math.hypot(dx, dy);

  if (length > 0) {

    dx /= length;
    dy /= length;

    const sprint = keys["shift"] ? 1.65 : 1;

    player.vx = dx * player.speed * sprint;
    player.vy = dy * player.speed * sprint;

    player.angle = Math.atan2(dy, dx);

  } else {

    player.vx *= .82;
    player.vy *= .82;
  }

  player.x += player.vx;
  player.y += player.vy;

  keepInside(player);
}

/* =========================
   OPPONENT AI
========================= */

function updateOpponent() {

  const dx = ball.x - opponent.x;
  const dy = ball.y - opponent.y;

  const distance = Math.hypot(dx, dy);

  if (distance > 12) {

    opponent.x += dx / distance * opponent.speed;
    opponent.y += dy / distance * opponent.speed;

    opponent.angle = Math.atan2(dy, dx);
  }

  keepInside(opponent);

  // AI kick
  if (distance < 30) {

    const f = field();

    ball.vx = -3.5;
    ball.vy = (H / 2 - ball.y) * .025;
  }
}

/* =========================
   BALL PHYSICS
========================= */

function updateBall() {

  ball.x += ball.vx;
  ball.y += ball.vy;

  ball.vx *= .985;
  ball.vy *= .985;

  const f = field();
  const cy = (f.top + f.bottom) / 2;

  // Top / bottom bounce
  if (ball.y < f.top + 8) {
    ball.y = f.top + 8;
    ball.vy *= -0.7;
  }

  if (ball.y > f.bottom - 8) {
    ball.y = f.bottom - 8;
    ball.vy *= -0.7;
  }

  // Left / right goal detection
  if (ball.x < f.left - 25) {

    if (Math.abs(ball.y - cy) < 45) {

      redScore++;
      updateScore();
      goal("RED GOAL!");

      resetPositions();

    } else {

      ball.x = f.left + 8;
      ball.vx *= -0.7;
    }
  }

  if (ball.x > f.right + 25) {

    if (Math.abs(ball.y - cy) < 45) {

      blueScore++;
      updateScore();
      goal("GOOOAL!");

      resetPositions();

    } else {

      ball.x = f.right - 8;
      ball.vx *= -0.7;
    }
  }
}

/* =========================
   BALL / PLAYER COLLISION
========================= */

function playerBallCollision() {

  const dx = ball.x - player.x;
  const dy = ball.y - player.y;

  const distance = Math.hypot(dx, dy);

  if (distance < player.radius + ball.radius + 7) {

    const angle = Math.atan2(dy, dx);

    const push = 2.2;

    ball.vx += Math.cos(angle) * push;
    ball.vy += Math.sin(angle) * push;

    ball.x = player.x +
      Math.cos(angle) *
      (player.radius + ball.radius + 2);

    ball.y = player.y +
      Math.sin(angle) *
      (player.radius + ball.radius + 2);
  }

  // Opponent
  const ox = ball.x - opponent.x;
  const oy = ball.y - opponent.y;

  const od = Math.hypot(ox, oy);

  if (od < opponent.radius + ball.radius + 4) {

    const angle = Math.atan2(oy, ox);

    ball.vx += Math.cos(angle) * 2;
    ball.vy += Math.sin(angle) * 2;
  }
}

/* =========================
   SHOOT
========================= */

function shoot() {

  const dx = ball.x - player.x;
  const dy = ball.y - player.y;

  const distance = Math.hypot(dx, dy);

  if (distance < 55) {

    let targetX = field().right + 40;
    let targetY = H / 2;

    const angle = Math.atan2(
      targetY - ball.y,
      targetX - ball.x
    );

    ball.vx = Math.cos(angle) * 8.5;
    ball.vy = Math.sin(angle) * 8.5;

    player.vx -= Math.cos(angle) * .5;
    player.vy -= Math.sin(angle) * .5;
  }
}

/* =========================
   PASS
========================= */

function passBall() {

  const dx = ball.x - player.x;
  const dy = ball.y - player.y;

  const distance = Math.hypot(dx, dy);

  if (distance < 55) {

    ball.vx = player.vx * 1.7 + 3;
    ball.vy = player.vy * 1.7;
  }
}

/* =========================
   BOUNDARY
========================= */

function keepInside(p) {

  const f = field();

  p.x = Math.max(
    f.left + 10,
    Math.min(f.right - 10, p.x)
  );

  p.y = Math.max(
    f.top + 10,
    Math.min(f.bottom - 10, p.y)
  );
}

/* =========================
   SCORE
========================= */

function updateScore() {

  scoreBlue.textContent = blueScore;
  scoreRed.textContent = redScore;
}

/* =========================
   GOAL MESSAGE
========================= */

function goal(text) {

  message.textContent = text;
  message.classList.add("show");

  setTimeout(() => {
    message.classList.remove("show");
  }, 1300);
}

/* =========================
   TIMER
========================= */

let lastSecond = Date.now();

function updateTimer() {

  if (!running) return;

  const now = Date.now();

  if (now - lastSecond >= 1000) {

    timeLeft--;
    lastSecond = now;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    timerElement.textContent =
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0");

    if (timeLeft <= 0) {
      endGame();
    }
  }
}

/* =========================
   GAME OVER
========================= */

function endGame() {

  running = false;

  let result = "DRAW!";

  if (blueScore > redScore) {
    result = "BLUE FC WINS!";
  }

  if (redScore > blueScore) {
    result = "RED FC WINS!";
  }

  message.textContent = result;
  message.classList.add("show");

  startBtn.textContent = "PLAY AGAIN";
  startBtn.style.display = "block";
}

/* =========================
   START
========================= */

function startGame() {

  blueScore = 0;
  redScore = 0;
  timeLeft = 120;

  updateScore();

  timerElement.textContent = "02:00";

  resetPositions();

  running = true;

  startBtn.style.display = "none";

  message.textContent = "KICK OFF!";
  message.classList.add("show");

  setTimeout(() => {
    message.classList.remove("show");
  }, 1000);
}

startBtn.addEventListener("click", startGame);

/* =========================
   INPUT ACTIONS
========================= */

let previousSpace = false;
let previousEnter = false;

function handleActions() {

  const space = keys[" "];
  const enter = keys["enter"];

  if (space && !previousSpace) {
    passBall();
  }

  if (enter && !previousEnter) {
    shoot();
  }

  previousSpace = space;
  previousEnter = enter;
}

/* =========================
   MAIN LOOP
========================= */

function gameLoop() {

  drawField();

  if (running) {

    updatePlayer();
    updateOpponent();
    handleActions();
    playerBallCollision();
    updateBall();
    updateTimer();
  }

  drawPlayer(player, true);
  drawPlayer(opponent, false);
  drawBall();

  requestAnimationFrame(gameLoop);
}

resetPositions();
gameLoop();
