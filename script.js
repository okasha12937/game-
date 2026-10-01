const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const healthText = document.getElementById("health");
const scoreText = document.getElementById("score");
const waveText = document.getElementById("wave");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const finalScore = document.getElementById("finalScore");

let gameRunning = false;

let score = 0;
let health = 100;
let wave = 1;

let bullets = [];
let enemies = [];
let particles = [];

let keys = {};

let mouse = {
    x: 0,
    y: 0,
    down: false
};

let lastTime = 0;
let enemySpawnTimer = 0;

let player = {
    x: 0,
    y: 0,
    radius: 20,
    speed: 320,
    angle: 0
};


// =============================
// CANVAS
// =============================

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();


// =============================
// KEYBOARD
// =============================

window.addEventListener("keydown", function(e) {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", function(e) {
    keys[e.key.toLowerCase()] = false;
});


// =============================
// MOUSE
// =============================

canvas.addEventListener("mousemove", function(e) {
    const rect = canvas.getBoundingClientRect();

    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener("mousedown", function(e) {
    if (e.button === 0) {
        mouse.down = true;
        shoot();
    }
});

canvas.addEventListener("mouseup", function(e) {
    if (e.button === 0) {
        mouse.down = false;
    }
});


// =============================
// START GAME
// =============================

startButton.addEventListener("click", startGame);

restartButton.addEventListener("click", startGame);


function startGame() {

    score = 0;
    health = 100;
    wave = 1;

    bullets = [];
    enemies = [];
    particles = [];

    player.x = canvas.width / 2;
    player.y = canvas.height / 2;

    healthText.textContent = health;
    scoreText.textContent = score;
    waveText.textContent = wave;

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    gameRunning = true;

    lastTime = performance.now();

    requestAnimationFrame(gameLoop);
}


// =============================
// PLAYER MOVEMENT
// =============================

function updatePlayer(deltaTime) {

    let dx = 0;
    let dy = 0;

    if (keys["w"] || keys["arrowup"]) {
        dy -= 1;
    }

    if (keys["s"] || keys["arrowdown"]) {
        dy += 1;
    }

    if (keys["a"] || keys["arrowleft"]) {
        dx -= 1;
    }

    if (keys["d"] || keys["arrowright"]) {
        dx += 1;
    }

    if (dx !== 0 || dy !== 0) {

        const length = Math.sqrt(dx * dx + dy * dy);

        dx /= length;
        dy /= length;

        player.x += dx * player.speed * deltaTime;
        player.y += dy * player.speed * deltaTime;
    }

    // Keep player inside screen

    player.x = Math.max(
        player.radius,
        Math.min(canvas.width - player.radius, player.x)
    );

    player.y = Math.max(
        player.radius,
        Math.min(canvas.height - player.radius, player.y)
    );

    // Aim at mouse

    player.angle = Math.atan2(
        mouse.y - player.y,
        mouse.x - player.x
    );
}


// =============================
// SHOOTING
// =============================

let lastShot = 0;

function shoot() {

    const now = performance.now();

    // Fire rate
    if (now - lastShot < 130) {
        return;
    }

    lastShot = now;

    const bulletSpeed = 800;

    bullets.push({
        x: player.x,
        y: player.y,

        dx: Math.cos(player.angle),
        dy: Math.sin(player.angle),

        speed: bulletSpeed,

        radius: 5,

        life: 1
    });
}


// =============================
// BULLETS
// =============================

function updateBullets(deltaTime) {

    for (let i = bullets.length - 1; i >= 0; i--) {

        const bullet = bullets[i];

        bullet.x += bullet.dx * bullet.speed * deltaTime;
        bullet.y += bullet.dy * bullet.speed * deltaTime;

        bullet.life -= deltaTime;

        if (
            bullet.x < 0 ||
            bullet.x > canvas.width ||
            bullet.y < 0 ||
            bullet.y > canvas.height ||
            bullet.life <= 0
        ) {
            bullets.splice(i, 1);
        }
    }
}


// =============================
// ENEMIES
// =============================

function spawnEnemy() {

    let x;
    let y;

    const side = Math.floor(Math.random() * 4);

    if (side === 0) {
        x = Math.random() * canvas.width;
        y = -40;
    }

    else if (side === 1) {
        x = canvas.width + 40;
        y = Math.random() * canvas.height;
    }

    else if (side === 2) {
        x = Math.random() * canvas.width;
        y = canvas.height + 40;
    }

    else {
        x = -40;
        y = Math.random() * canvas.height;
    }

    const enemySize = 18 + Math.random() * 12;

    enemies.push({

        x: x,
        y: y,

        radius: enemySize,

        speed: 70 + wave * 8 + Math.random() * 40,

        health: 1,

        rotation: Math.random() * Math.PI * 2
    });
}


function updateEnemies(deltaTime) {

    enemySpawnTimer -= deltaTime;

    if (enemySpawnTimer <= 0) {

        spawnEnemy();

        enemySpawnTimer = Math.max(
            0.25,
            1.2 - wave * 0.06
        );
    }

    for (let i = enemies.length - 1; i >= 0; i--) {

        const enemy = enemies[i];

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {

            enemy.x += (dx / distance) *
                enemy.speed *
                deltaTime;

            enemy.y += (dy / distance) *
                enemy.speed *
                deltaTime;
        }

        enemy.rotation += deltaTime * 2;

        // Enemy hits player

        if (distance < player.radius + enemy.radius) {

            health -= 20;

            health = Math.max(0, health);

            healthText.textContent = health;

            createExplosion(
                enemy.x,
                enemy.y,
                15
            );

            enemies.splice(i, 1);

            if (health <= 0) {
                endGame();
            }
        }
    }
}


// =============================
// COLLISIONS
// =============================

function checkBulletCollisions() {

    for (let i = bullets.length - 1; i >= 0; i--) {

        const bullet = bullets[i];

        for (let j = enemies.length - 1; j >= 0; j--) {

            const enemy = enemies[j];

            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;

            const distance = Math.sqrt(
                dx * dx + dy * dy
            );

            if (
                distance <
                bullet.radius + enemy.radius
            ) {

                enemy.health--;

                bullets.splice(i, 1);

                if (enemy.health <= 0) {

                    score += 10;

                    scoreText.textContent = score;

                    createExplosion(
                        enemy.x,
                        enemy.y,
                        25
                    );

                    enemies.splice(j, 1);

                    // Increase wave

                    if (score % 100 === 0) {

                        wave++;

                        waveText.textContent = wave;
                    }
                }

                break;
            }
        }
    }
}


// =============================
// PARTICLES
// =============================

function createExplosion(x, y, amount) {

    for (let i = 0; i < amount; i++) {

        const angle =
            Math.random() *
            Math.PI *
            2;

        const speed =
            Math.random() *
            200 +
            50;

        particles.push({

            x: x,
            y: y,

            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,

            size: Math.random() * 4 + 1,

            life: 0.5 + Math.random() * 0.5
        });
    }
}


function updateParticles(deltaTime) {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p = particles[i];

        p.x += p.dx * deltaTime;
        p.y += p.dy * deltaTime;

        p.life -= deltaTime;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}


// =============================
// DRAW BACKGROUND
// =============================

function drawBackground() {

    ctx.fillStyle = "#050a10";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Grid

    ctx.strokeStyle =
        "rgba(0,255,255,0.06)";

    ctx.lineWidth = 1;

    const gridSize = 50;

    for (
        let x = 0;
        x < canvas.width;
        x += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);

        ctx.stroke();
    }

    for (
        let y = 0;
        y < canvas.height;
        y += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);

        ctx.stroke();
    }
}


// =============================
// DRAW PLAYER
// =============================

function drawPlayer() {

    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );

    ctx.rotate(player.angle);

    // Glow

    ctx.shadowBlur = 25;
    ctx.shadowColor = "#00ffff";

    // Player body

    ctx.fillStyle = "#00ffff";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Gun

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        10,
        -5,
        28,
        10
    );

    // Center

    ctx.fillStyle = "#061018";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        8,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}


// =============================
// DRAW BULLETS
// =============================

function drawBullets() {

    for (const bullet of bullets) {

        ctx.save();

        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ffff00";

        ctx.fillStyle = "#ffff00";

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}


// =============================
// DRAW ENEMIES
// =============================

function drawEnemies() {

    for (const enemy of enemies) {

        ctx.save();

        ctx.translate(
            enemy.x,
            enemy.y
        );

        ctx.rotate(enemy.rotation);

        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff0055";

        ctx.fillStyle = "#ff1744";

        // Enemy diamond

        ctx.beginPath();

        ctx.moveTo(0, -enemy.radius);

        ctx.lineTo(
            enemy.radius,
            0
        );

        ctx.lineTo(
            0,
            enemy.radius
        );

        ctx.lineTo(
            -enemy.radius,
            0
        );

        ctx.closePath();

        ctx.fill();

        // Enemy center

        ctx.fillStyle = "#30000c";

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            6,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}


// =============================
// DRAW PARTICLES
// =============================

function drawParticles() {

    for (const p of particles) {

        ctx.save();

        ctx.globalAlpha =
            Math.max(0, p.life);

        ctx.fillStyle = "#00ffff";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}


// =============================
// GAME LOOP
// =============================

function gameLoop(currentTime) {

    if (!gameRunning) {
        return;
    }

    const deltaTime =
        Math.min(
            (currentTime - lastTime) / 1000,
            0.05
        );

    lastTime = currentTime;

    updatePlayer(deltaTime);

    if (mouse.down) {
        shoot();
    }

    updateBullets(deltaTime);

    updateEnemies(deltaTime);

    updateParticles(deltaTime);

    checkBulletCollisions();

    // Draw

    drawBackground();

    drawParticles();

    drawBullets();

    drawEnemies();

    drawPlayer();

    requestAnimationFrame(gameLoop);
}


// =============================
// GAME OVER
// =============================

function endGame() {

    gameRunning = false;

    finalScore.textContent = score;

    gameOverScreen.classList.remove("hidden");
}