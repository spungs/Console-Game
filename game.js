const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 화면 크기 설정
canvas.width = 600;
canvas.height = 500;

// Supabase 클라이언트 초기화
const SUPABASE_URL = 'https://shueysnmlgmczilyushe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodWV5c25tbGdtY3ppbHl1c2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzMxODMsImV4cCI6MjA2NzcwOTE4M30.mQMPZoIf5r5aeXTFCjucyhiLlHdIM6nYy3TJTlvMAo0';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 게임 상태
let level = 1;
let gameOver = false;
let gameTime = 0;
let startTime = Date.now();

// 플레이어 설정
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    speed: 5,
    color: 'blue',
    health: 100
};

// 키보드 입력 상태
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// 적, 투사체 배열
const enemies = [];
const projectiles = [];

// 적 생성 관련
let spawnInterval = 1000; // 초기 생성 간격 (ms)
let lastSpawnTime = 0;

// 적 클래스
class Enemy {
    constructor(x, y, size, speed, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.color = color;
    }

    update() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

// 투사체 클래스
class Projectile {
    constructor(x, y, size, speed, color, target) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.color = color;
        const angle = Math.atan2(target.y - y, target.x - x);
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 적 생성 함수
function spawnEnemy() {
    const size = Math.random() * 20 + 10; // 10-30
    const speed = Math.random() * 1 + 2.0 + (level - 1) * 0.1;
    const color = 'red';

    let x, y;
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - size : canvas.width + size;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 - size : canvas.height + size;
    }

    enemies.push(new Enemy(x, y, size, speed, color));
}

// 자동 공격 함수
function autoAttack() {
    if (enemies.length > 0) {
        const target = enemies.reduce((prev, curr) => {
            const prevDist = Math.hypot(player.x - prev.x, player.y - prev.y);
            const currDist = Math.hypot(player.x - curr.x, player.y - curr.y);
            return prevDist < currDist ? prev : curr;
        });

        projectiles.push(new Projectile(player.x, player.y, 5, 8, 'green', target));
    }
}

// 충돌 감지 함수
function detectCollisions() {
    // 투사체와 적 충돌
    for (let i = projectiles.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (projectiles[i] && enemies[j]) {
                const dist = Math.hypot(projectiles[i].x - enemies[j].x, projectiles[i].y - enemies[j].y);
                if (dist - enemies[j].size - projectiles[i].size < 1) {
                    enemies.splice(j, 1);
                    projectiles.splice(i, 1);
                }
            }
        }
    }

    // 플레이어와 적 충돌
    for (let i = enemies.length - 1; i >= 0; i--) {
        const dist = Math.hypot(player.x - enemies[i].x, player.y - enemies[i].y);
        if (dist - enemies[i].size - player.size < 1) {
            if (!gameOver) {
                gameOver = true;
                saveRanking();
            }
        }
    }
}

// 키보드 이벤트 리스너
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

function updatePlayerPosition() {
    if (keys.w && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys.s && player.y < canvas.height - player.size) {
        player.y += player.speed;
    }
    if (keys.a && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.d && player.x < canvas.width - player.size) {
        player.x += player.speed;
    }
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);
}

function drawUI() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Difficulty: ${level}`, 10, 30);
    ctx.fillText(`Time: ${gameTime}s`, 10, 60);
}

function updateGameStatus() {
    if (gameOver) return;
    gameTime = Math.floor((Date.now() - startTime) / 1000);
    level = Math.floor(gameTime / 10) + 1;
    spawnInterval = Math.max(200, 500 - (level - 1) * 50);
}

async function saveRanking() {
    const playerName = prompt('게임 오버! 랭킹에 등록할 이름을 입력하세요:', 'Player');
    if (playerName) {
        const { error } = await supabaseClient
            .from('rankings')
            .insert({ player_name: playerName, survival_time: gameTime });
        if (error) {
            console.error('랭킹 저장 실패:', error);
        } else {
            getRankings();
        }
    }
}

async function getRankings() {
    const { data, error } = await supabaseClient
        .from('rankings')
        .select('player_name, survival_time')
        .order('survival_time', { ascending: false })
        .limit(10);

    if (error) {
        console.error('랭킹 불러오기 실패:', error);
        return;
    }

    const rankingList = document.getElementById('ranking-list');
    rankingList.innerHTML = ''; // Clear previous list
    data.forEach((rank, index) => {
        const li = document.createElement('li');
        li.textContent = `#${index + 1} ${rank.player_name} - ${rank.survival_time}s`;
        rankingList.appendChild(li);
    });
}

function gameLoop() {
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.font = '20px Arial';
        ctx.fillText(`Time Survived: ${gameTime}s`, canvas.width / 2, canvas.height / 2 + 40);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateGameStatus();
    updatePlayerPosition();
    drawPlayer();

    if (Date.now() - lastSpawnTime > spawnInterval) {
        spawnEnemy();
        lastSpawnTime = Date.now();
    }

    enemies.forEach(enemy => {
        enemy.update();
        enemy.draw();
    });

    projectiles.forEach(projectile => {
        projectile.update();
        projectile.draw();
    });

    detectCollisions();
    drawUI();

    requestAnimationFrame(gameLoop);
}

// 초기 랭킹 로드 및 게임 시작
getRankings();
setInterval(autoAttack, 400);
gameLoop();
