const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 화면 크기 설정
canvas.width = 600;
canvas.height = 500;

// Supabase 클라이언트 초기화
const SUPABASE_URL = 'https://shueysnmlgmczilyushe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodWV5c25tbGdtY3ppbHl1c2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzMxODMsImV4cCI6MjA2NzcwOTE4M30.mQMPZoIf5r5aeXTFCjucyhiLlHdIM6nYy3TJTlvMAo0';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 언어 설정
let currentLanguage = 'en'; // 'en' 또는 'ko'

// 언어별 텍스트
const texts = {
    en: {
        gameTitle: 'Dodge Master',
        challengeMessage: 'Beat the best record!',
        rankingTitle: 'Ranking',
        testGameOver: 'Give Up',
        gameOver: 'Game Over!',
        newRecord: '🎉 New Record! 🎉',
        survivalTime: 'Survival Time:',
        enterName: 'Enter your name for ranking:',
        playerNamePlaceholder: 'Player Name',
        saveRanking: 'Save Ranking',
        newRecordSave: 'Save New Record!',
        close: 'Close',
        congratulations: 'Congratulations! New best record! Save to ranking:',
        tryHarder: 'Try harder! Enter your name for ranking:',
        pleaseEnterName: 'Please enter your name.',
        rankingSaveFailed: 'Failed to save ranking:',
        rankingSaveError: 'Error occurred while saving ranking:',
        pressToRetry: 'Press Enter or Space to retry',
        seconds: 's',
        difficulty: 'Difficulty:',
        time: 'Time:',
        challengeTemplate: 'Try to exceed the record of <span style="color:green">{time}</span> seconds.',
        giveUpBtn: 'Give Up'
    },
    ko: {
        gameTitle: '닷지 마스터',
        challengeMessage: '최고 기록을 달성해보세요!',
        rankingTitle: '랭킹',
        testGameOver: '포기하기',
        gameOver: '게임 오버!',
        newRecord: '🎉 신기록 달성! 🎉',
        survivalTime: '생존 시간:',
        enterName: '랭킹에 등록할 이름을 입력하세요:',
        playerNamePlaceholder: '플레이어 이름',
        saveRanking: '랭킹 등록',
        newRecordSave: '신기록 등록!',
        close: '닫기',
        congratulations: '축하합니다! 새로운 최고 기록입니다! 랭킹에 등록하세요:',
        tryHarder: '좀 더 분발하세요! 랭킹에 등록할 이름을 입력하세요:',
        pleaseEnterName: '플레이어 이름을 입력해주세요.',
        rankingSaveFailed: '랭킹 저장에 실패했습니다:',
        rankingSaveError: '랭킹 저장 중 오류가 발생했습니다:',
        pressToRetry: 'Enter 또는 Space를 눌러 재시작',
        seconds: '초',
        difficulty: '난이도:',
        time: '시간:',
        challengeTemplate: '최고 기록 <span style="color:green">{time}</span>초를 넘겨보세요!',
        giveUpBtn: '포기하기'
    }
};

// 게임 상태
let level = 1;
let gameOver = false;
let gameTime = 0;
let startTime = Date.now();
let finalGameTime = 0; // 최종 게임 시간 (정지된 시간)
let isNewRecord = false; // 신기록 여부

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
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
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
    const speed = Math.random() * 1 + 2.5 + (level - 1) * 0.1;
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
    const hitboxPadding = 5; // 이 값을 조절하여 충돌 민감도를 변경하세요. (클수록 판정이 둔감해집니다)
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (
            player.x + hitboxPadding < enemy.x + enemy.size &&
            player.x + player.size - hitboxPadding > enemy.x &&
            player.y + hitboxPadding < enemy.y + enemy.size &&
            player.y + player.size - hitboxPadding > enemy.y
        ) {
            if (!gameOver) {
                console.log('게임 오버! 충돌 감지됨');
                gameOver = true;
                finalGameTime = gameTime; // 현재 시간을 최종 시간으로 저장
                checkNewRecord();
                showGameOverModal();
            }
        }
    }
}

// 키보드 이벤트 리스너
window.addEventListener('keydown', (e) => {
    if (gameOver) {
        if (e.key === 'Enter' || e.key === ' ') {
            resetGame();
        }
    } else {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = true;
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// 자동 플레이 모드
let autoPlayEnabled = false; // true로 바꾸면 자동 회피, false로 바꾸면 수동 조작
let bestTime = 0.0; // 최고 기록 저장 (소수점 포함)

// 고급 자동 회피 시스템
class AdvancedAutoPlayer {
    constructor() {
        this.safetyMargin = 30; // 안전 마진
        this.predictionTime = 0.5; // 미래 예측 시간 (초)
        this.avoidanceRadius = 120; // 회피 반경
        this.maxSpeed = 5; // 최대 속도
    }

    // 적의 미래 위치 예측
    predictEnemyPosition(enemy, timeAhead) {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        const futureX = enemy.x + Math.cos(angle) * enemy.speed * timeAhead * 60; // 60fps 기준
        const futureY = enemy.y + Math.sin(angle) * enemy.speed * timeAhead * 60;
        return { x: futureX, y: futureY };
    }

    // 특정 위치의 위험도 계산
    calculateDangerAt(x, y) {
        let totalDanger = 0;
        
        enemies.forEach(enemy => {
            const dist = Math.hypot(x - enemy.x, y - enemy.y);
            if (dist < this.avoidanceRadius) {
                // 거리가 가까울수록 위험도 증가
                const danger = Math.max(0, (this.avoidanceRadius - dist) / this.avoidanceRadius);
                totalDanger += danger * danger; // 제곱으로 더 급격한 위험도 증가
            }
        });

        return totalDanger;
    }

    // 8방향 중 가장 안전한 방향 찾기
    findSafestDirection() {
        const directions = [
            { x: 0, y: -1 },   // 위
            { x: 1, y: -1 },   // 우상
            { x: 1, y: 0 },    // 우
            { x: 1, y: 1 },    // 우하
            { x: 0, y: 1 },    // 아래
            { x: -1, y: 1 },   // 좌하
            { x: -1, y: 0 },   // 좌
            { x: -1, y: -1 }   // 좌상
        ];

        let bestDirection = { x: 0, y: 0 };
        let lowestDanger = Infinity;

        directions.forEach(dir => {
            const testX = player.x + dir.x * this.maxSpeed;
            const testY = player.y + dir.y * this.maxSpeed;
            
            // 화면 경계 체크
            if (testX < 0 || testX > canvas.width - player.size || 
                testY < 0 || testY > canvas.height - player.size) {
                return;
            }

            const danger = this.calculateDangerAt(testX, testY);
            if (danger < lowestDanger) {
                lowestDanger = danger;
                bestDirection = dir;
            }
        });

        return bestDirection;
    }

    // 긴급 회피 (가장 가까운 적으로부터 도망)
    emergencyEscape() {
        if (enemies.length === 0) return { x: 0, y: 0 };

        // 가장 가까운 적 찾기
        let closestEnemy = enemies[0];
        let closestDist = Math.hypot(player.x - closestEnemy.x, player.y - closestEnemy.y);

        enemies.forEach(enemy => {
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
            }
        });

        // 가장 가까운 적으로부터 반대 방향으로 이동
        const escapeX = player.x - closestEnemy.x;
        const escapeY = player.y - closestEnemy.y;
        const magnitude = Math.hypot(escapeX, escapeY);

        if (magnitude > 0) {
            return {
                x: (escapeX / magnitude) * this.maxSpeed,
                y: (escapeY / magnitude) * this.maxSpeed
            };
        }

        return { x: 0, y: 0 };
    }

    // 스마트 회피 결정
    getMoveDirection() {
        // 긴급 상황 체크 (매우 가까운 적이 있는 경우)
        const emergencyThreshold = 40;
        let hasEmergency = false;
        
        enemies.forEach(enemy => {
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist < emergencyThreshold) {
                hasEmergency = true;
            }
        });

        if (hasEmergency) {
            return this.emergencyEscape();
        }

        // 일반적인 상황에서는 가장 안전한 방향으로 이동
        const safestDir = this.findSafestDirection();
        
        // 현재 위치의 위험도가 낮으면 제자리에 머무름
        const currentDanger = this.calculateDangerAt(player.x, player.y);
        if (currentDanger < 0.1) {
            return { x: 0, y: 0 };
        }

        // 미래 예측을 통한 추가 회피
        const futureDanger = this.calculateFutureDanger();
        if (futureDanger > currentDanger * 1.5) {
            // 미래에 더 위험해질 것 같으면 더 적극적으로 회피
            return {
                x: safestDir.x * this.maxSpeed * 1.2,
                y: safestDir.y * this.maxSpeed * 1.2
            };
        }

        return {
            x: safestDir.x * this.maxSpeed,
            y: safestDir.y * this.maxSpeed
        };
    }

    // 미래 위험도 계산
    calculateFutureDanger() {
        let totalFutureDanger = 0;
        
        enemies.forEach(enemy => {
            const futurePos = this.predictEnemyPosition(enemy, this.predictionTime);
            const dist = Math.hypot(player.x - futurePos.x, player.y - futurePos.y);
            if (dist < this.avoidanceRadius) {
                const danger = Math.max(0, (this.avoidanceRadius - dist) / this.avoidanceRadius);
                totalFutureDanger += danger * danger;
            }
        });

        return totalFutureDanger;
    }
}

const autoPlayer = new AdvancedAutoPlayer();

function updatePlayerPosition() {
    if (autoPlayEnabled) {
        const move = autoPlayer.getMoveDirection();
        player.x += move.x;
        player.y += move.y;
    } else {
        // 기존 키보드 입력에 따른 이동
        if (keys.ArrowUp && player.y > 0) {
            player.y -= player.speed;
        }
        if (keys.ArrowDown && player.y < canvas.height - player.size) {
            player.y += player.speed;
        }
        if (keys.ArrowLeft && player.x > 0) {
            player.x -= player.speed;
        }
        if (keys.ArrowRight && player.x < canvas.width - player.size) {
            player.x += player.speed;
        }
    }

    // 화면 밖으로 나가지 않도록 처리
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.size) player.x = canvas.width - player.size;
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.size) player.y = canvas.height - player.size;
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);
}

function drawUI() {
    // 시간 텍스트를 캔버스에 그리지 않음
    // 대신 별도의 DOM 요소로 표시
}

// 타이머 갱신 함수
function updateTimerBox() {
    const t = texts[currentLanguage];
    let timerBox = document.getElementById('timer-box');
    if (!timerBox) return;
    timerBox.textContent = `${t.time} ${gameTime.toFixed(3)}${t.seconds}`;
}

function updateGameStatus() {
    if (gameOver) return;
    gameTime = (Date.now() - startTime) / 1000; // 밀리초 단위까지 포함
    level = Math.floor(gameTime / 10) + 1;
    spawnInterval = Math.max(200, 400 - (level - 1) * 50);
}

async function saveRanking() {
    console.log('saveRanking 함수 호출됨, gameTime:', gameTime);
    
    try {
        const playerName = prompt('게임 오버! 랭킹에 등록할 이름을 입력하세요:', 'Player');
        console.log('입력된 플레이어 이름:', playerName);
        
        if (playerName && playerName.trim() !== '') {
            console.log('Supabase에 저장 시도 중...');
            const { data, error } = await supabaseClient
                .from('rankings')
                .insert({ 
                    player_name: playerName.trim(), 
                    survival_time: parseFloat(gameTime) 
                });
            
            if (error) {
                console.error('랭킹 저장 실패:', error);
                alert('랭킹 저장에 실패했습니다: ' + error.message);
            } else {
                console.log('랭킹 저장 성공:', data);
                await getRankings();
            }
        } else {
            console.log('플레이어 이름이 입력되지 않았습니다.');
        }
    } catch (err) {
        console.error('saveRanking 함수에서 예외 발생:', err);
        alert('랭킹 저장 중 오류가 발생했습니다: ' + err.message);
    }
}

async function getRankings() {
    try {
        console.log('getRankings 함수 호출됨');
        const { data, error } = await supabaseClient
            .from('rankings')
            .select('player_name, survival_time')
            .order('survival_time', { ascending: false })
            .limit(10);

        if (error) {
            console.error('랭킹 불러오기 실패:', error);
            return;
        }

        console.log('랭킹 데이터 로드됨:', data);

        const rankingList = document.getElementById('ranking-list');
        if (!rankingList) {
            console.error('ranking-list 요소를 찾을 수 없습니다.');
            return;
        }
        
        rankingList.innerHTML = ''; // Clear previous list
        
        // 최고 기록 업데이트
        if (data && data.length > 0) {
            bestTime = parseFloat(data[0].survival_time);
            console.log('최고 기록 업데이트:', bestTime);
            updateChallengeMessage();
        }
        
        data.forEach((rank, index) => {
            const li = document.createElement('li');
            const survivalTime = parseFloat(rank.survival_time);
            li.textContent = `#${index + 1} ${rank.player_name} - ${survivalTime.toFixed(3)}s`;
            rankingList.appendChild(li);
        });
    } catch (err) {
        console.error('getRankings 함수에서 예외 발생:', err);
    }
}

// 언어 변경
function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'ko' : 'en';
    updateAllTexts();
}

// 모든 텍스트 업데이트
function updateAllTexts() {
    const t = texts[currentLanguage];
    
    // 헤더 텍스트
    document.getElementById('gameTitle').textContent = t.gameTitle;
    document.getElementById('languageToggle').textContent = currentLanguage === 'en' ? '한국어' : 'English';
    
    // 랭킹 제목
    document.getElementById('rankingTitle').textContent = t.rankingTitle;
    
    // 테스트 버튼
    document.getElementById('giveup-btn').textContent = t.giveUpBtn;
    
    // 도전 메시지 업데이트
    updateChallengeMessage();
}

// 신기록 체크
function checkNewRecord() {
    isNewRecord = finalGameTime > bestTime;
    console.log('신기록 여부:', isNewRecord, '현재 기록:', finalGameTime, '최고 기록:', bestTime);
}

// 게임 오버 모달 표시
function showGameOverModal() {
    const modal = document.getElementById('gameOverModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalTime = document.getElementById('modalTime');
    const modalMessage = document.getElementById('modalMessage');
    const finalTimeSpan = document.getElementById('finalTime');
    const playerNameInput = document.getElementById('playerNameInput');
    const saveRankingBtn = document.getElementById('saveRankingBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');

    const t = texts[currentLanguage];

    // 최종 시간 표시
    finalTimeSpan.textContent = finalGameTime.toFixed(3);
    modalTime.innerHTML = `${t.survivalTime} <span id="finalTime">${finalGameTime.toFixed(3)}</span>${t.seconds}`;

    if (isNewRecord) {
        // 신기록인 경우
        modalTitle.textContent = t.newRecord;
        modalTitle.className = 'new-record';
        modalMessage.textContent = t.congratulations;
        modalMessage.className = 'new-record';
        saveRankingBtn.textContent = t.newRecordSave;
        saveRankingBtn.style.backgroundColor = '#e74c3c';
    } else {
        // 신기록이 아닌 경우
        modalTitle.textContent = t.gameOver;
        modalTitle.className = '';
        modalMessage.textContent = t.tryHarder;
        modalMessage.className = 'encouragement';
        saveRankingBtn.textContent = t.saveRanking;
        saveRankingBtn.style.backgroundColor = '#27ae60';
    }

    // 모달 버튼 텍스트
    closeModalBtn.textContent = t.close;
    playerNameInput.placeholder = t.playerNamePlaceholder;

    // 입력 필드 초기화
    playerNameInput.value = '';
    playerNameInput.focus();

    // 모달 표시
    modal.style.display = 'block';

    // Enter 키로 저장, Esc 키로 닫기
    playerNameInput.onkeydown = function(e) {
        if (e.key === 'Enter') {
            saveRankingFromModal();
        } else if (e.key === 'Escape') {
            closeGameOverModal();
        }
    };
}

// 모달에서 랭킹 저장
async function saveRankingFromModal() {
    const playerNameInput = document.getElementById('playerNameInput');
    const playerName = playerNameInput.value.trim();
    const t = texts[currentLanguage];

    if (!playerName) {
        alert(t.pleaseEnterName);
        playerNameInput.focus();
        return;
    }

    try {
        console.log('모달에서 랭킹 저장 시도:', playerName, finalGameTime);
        const { data, error } = await supabaseClient
            .from('rankings')
            .insert({ 
                player_name: playerName, 
                survival_time: parseFloat(finalGameTime) 
            });
        
        if (error) {
            console.error('랭킹 저장 실패:', error);
            alert(t.rankingSaveFailed + ' ' + error.message);
        } else {
            console.log('랭킹 저장 성공:', data);
            closeGameOverModal();
            await getRankings();
        }
    } catch (err) {
        console.error('랭킹 저장 중 오류:', err);
        alert(t.rankingSaveError + ' ' + err.message);
    }
}

// 게임 오버 모달 닫기
function closeGameOverModal() {
    const modal = document.getElementById('gameOverModal');
    modal.style.display = 'none';
}

// 도전 메시지 업데이트
function updateChallengeMessage() {
    const challengeElement = document.getElementById('challenge-message');
    const t = texts[currentLanguage];
    if (challengeElement && typeof bestTime === 'number' && !isNaN(bestTime)) {
        const timeStr = bestTime.toFixed(3);
        challengeElement.innerHTML = t.challengeTemplate.replace('{time}', timeStr);
    } else if (challengeElement) {
        challengeElement.textContent = t.challengeMessage;
    }
}

function gameLoop() {
    if (gameOver) {
        const t = texts[currentLanguage];
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(t.gameOver.toUpperCase(), canvas.width / 2, canvas.height / 2);
        ctx.font = '20px Arial';
        const displayTime = finalGameTime > 0 ? finalGameTime.toFixed(3) : gameTime.toFixed(3);
        ctx.fillText(`${t.survivalTime} ${displayTime}${t.seconds}`, canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText(t.pressToRetry, canvas.width / 2, canvas.height / 2 + 80);
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
    // drawUI(); // 시간 텍스트 제거
    updateTimerBox(); // 타이머 박스 갱신

    requestAnimationFrame(gameLoop);
}

function resetGame() {
    gameOver = false;
    level = 1;
    gameTime = 0;
    finalGameTime = 0;
    isNewRecord = false;
    startTime = Date.now();
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = 100;
    enemies.length = 0;
    projectiles.length = 0;
    spawnInterval = 1000;
    lastSpawnTime = 0;

    // 키 상태 초기화
    for (let key in keys) {
        keys[key] = false;
    }

    getRankings();
    gameLoop();
}

// Give Up 버튼 함수
function onGiveUp() {
    if (!gameOver) {
        console.log('Give Up 버튼으로 게임 오버 실행');
        gameOver = true;
        finalGameTime = gameTime; // 현재 시간을 최종 시간으로 저장
        checkNewRecord();
        showGameOverModal();
    }
}

// 초기 랭킹 로드 및 게임 시작
async function initializeGame() {
    updateAllTexts(); // 초기 텍스트 설정
    await getRankings();
    setInterval(autoAttack, 400);
    gameLoop();
}

initializeGame();
