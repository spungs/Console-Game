const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 캔버스 크기 반응형 조정
function resizeCanvas() {
    const canvas = document.getElementById('gameCanvas');
    if (window.innerWidth <= 768) {
        // 모바일: 컨테이너 너비에 맞춰 조정
        const maxWidth = Math.min(400, window.innerWidth - 40);
        canvas.width = maxWidth; // 실제 픽셀 크기
        canvas.height = maxWidth * 5 / 6;
        canvas.style.width = maxWidth + 'px';
        canvas.style.height = (maxWidth * 5 / 6) + 'px';
    } else {
        // 데스크톱: 원래 크기
        canvas.width = 600;
        canvas.height = 500;
        canvas.style.width = '600px';
        canvas.style.height = '500px';
    }
}

// 화면 크기 변경 시 캔버스 재조정
window.addEventListener('resize', resizeCanvas);

// Supabase 클라이언트 초기화
const SUPABASE_URL = 'https://shueysnmlgmczilyushe.supabase.co'
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
        pressToRetry: 'Press Enter or Space or Retry button to retry',
        retry: 'Retry',
        seconds: 's',
        difficulty: 'Difficulty:',
        time: 'Time:',
        challengeTemplate: 'Try to exceed the record of <span style="color:green">{time}</span> seconds.',
        giveUpBtn: 'Give Up',
        joystickOn: 'Joystick On',
        joystickOff: 'Joystick Off'
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
        pressToRetry: 'Enter 또는 Space 또는 다시하기 버튼을 눌러 재시작',
        retry: '다시하기',
        seconds: '초',
        difficulty: '난이도:',
        time: '시간:',
        challengeTemplate: '최고 기록 <span style="color:green">{time}</span>초를 넘겨보세요!',
        giveUpBtn: '포기하기',
        joystickOn: '조이스틱 켜짐',
        joystickOff: '조이스틱 꺼짐'
    }
};

// 게임 상태
let level = 1;
let gameOver = false;
let gameTime = 0;
let startTime = Date.now();
let finalGameTime = 0; // 최종 게임 시간 (정지된 시간)
let isNewRecord = false; // 신기록 여부
let isPaused = false; // 게임 일시정지 상태
let pauseStartTime = 0; // 일시정지 시작 시간
let totalPauseTime = 0; // 총 일시정지 시간

// 페이지 가시성 변경 감지
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 탭이 비활성화되면 게임 일시정지
        if (!gameOver && !isPaused) {
            isPaused = true;
            pauseStartTime = Date.now();
            // console.log('게임 일시정지: 탭 비활성화');
        }
    } else {
        // 탭이 다시 활성화되면 게임 재개
        if (!gameOver && isPaused) {
            isPaused = false;
            totalPauseTime += Date.now() - pauseStartTime;
            // console.log('게임 재개: 탭 활성화');
        }
    }
});

function getSpeed(baseSpeed = 5) {
    // 기준: 데스크톱 600px 기준
    return baseSpeed * (canvas.width / 300);
}

function getUIScale() {
    return canvas.width / 600;
}

// 플레이어 설정
let player = {
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
        const scale = getUIScale();
        ctx.fillRect(this.x, this.y, this.size * scale, this.size * scale);
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
    const size = (Math.random() * 10 + 10) * getUIScale(); // 10-20 비율 보정
    const speed = (Math.random() * 1 + 2.5 + (level - 1) * 0.1) * (canvas.width / 600);
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
                // console.log('게임 오버! 충돌 감지됨');
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
    // 게임 오버 모달이 켜져있는지 확인
    const modal = document.getElementById('gameOverModal');
    const isModalOpen = modal && modal.style.display === 'block';
    
    if (gameOver && !isModalOpen) {
        // 게임 오버 상태이고 모달이 닫혀있을 때만 Enter/Space 키 동작
        if (e.key === 'Enter' || e.key === ' ') {
            resetGame();
        }
    } else if (!gameOver) {
        // 게임 진행 중일 때만 방향키 동작
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = true;
        }
    }
    // 모달이 켜져있을 때는 Enter/Space 키 이벤트 무시
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
});

// 모바일 터치 컨트롤 초기화
function initMobileControls() {
    const joystick = document.getElementById('joystick');
    if (!joystick) {
        console.warn('조이스틱 요소를 찾을 수 없습니다.');
        return;
    }

    // 필수 요소들이 있는지 확인
    const stick = joystick.querySelector('.joystick-stick');
    const pressure = joystick.querySelector('.joystick-pressure');
    
    if (!stick) {
        console.warn('조이스틱 스틱 요소를 찾을 수 없습니다.');
        return;
    }

    let isJoystickActive = false;
    let joystickCenter = { x: 0, y: 0 };
    let joystickRadius = 0;
    let currentDirection = { x: 0, y: 0, magnitude: 0 };
    let deadZone = 0.15; // 데드존 (중앙 영역)

    // 조이스틱 초기화
    function initJoystick() {
        const rect = joystick.getBoundingClientRect();
        joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        joystickRadius = rect.width / 2;
        // console.log('조이스틱 중심 재계산:', joystickCenter, '반지름:', joystickRadius);
    }

    // 개선된 조이스틱 방향 계산 (360도 아날로그 입력)
    function calculateDirection(touchX, touchY) {
        const deltaX = touchX - joystickCenter.x;
        const deltaY = touchY - joystickCenter.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // 데드존 체크
        if (distance < joystickRadius * deadZone) {
            return { x: 0, y: 0, magnitude: 0 };
        }

        // 방향 계산
        const angle = Math.atan2(deltaY, deltaX);
        const normalizedDistance = Math.min(distance / joystickRadius, 1);
        
        return {
            x: Math.cos(angle) * normalizedDistance,
            y: Math.sin(angle) * normalizedDistance,
            magnitude: normalizedDistance
        };
    }

    // 개선된 조이스틱 스틱 위치 업데이트
    function updateJoystickStick(direction) {
        const stick = joystick.querySelector('.joystick-stick');
        const pressure = joystick.querySelector('.joystick-pressure');
        
        // null 체크 추가
        if (!stick) {
            console.warn('조이스틱 스틱 요소를 찾을 수 없습니다.');
            return;
        }
        
        const maxOffset = joystickRadius * 0.35; // 스틱 최대 이동 거리
        
        // 스틱 위치 업데이트
        const offsetX = direction.x * maxOffset;
        const offsetY = direction.y * maxOffset;
        
        stick.style.left = `${50 + (offsetX / joystickRadius) * 50}%`;
        stick.style.top = `${50 + (offsetY / joystickRadius) * 50}%`;
        stick.style.transform = `translate(-50%, -50%)`;
        
        // 압력 표시 업데이트 (null 체크 추가)
        if (pressure) {
            if (direction.magnitude > 0) {
                pressure.style.opacity = direction.magnitude * 0.3;
                pressure.style.transform = `scale(${1 + direction.magnitude * 0.2})`;
            } else {
                pressure.style.opacity = 0;
                pressure.style.transform = 'scale(1)';
            }
        }
    }

    // 개선된 키 입력 상태 업데이트 (아날로그 입력 지원)
    function updateKeys(direction) {
        // 기존 키 상태 초기화
        keys.ArrowUp = false;
        keys.ArrowDown = false;
        keys.ArrowLeft = false;
        keys.ArrowRight = false;

        // 데드존 체크
        if (direction.magnitude < deadZone) {
            return;
        }

        // 방향에 따른 키 설정 (더 정밀한 입력)
        const threshold = 0.3;
        if (direction.y < -threshold) keys.ArrowUp = true;
        if (direction.y > threshold) keys.ArrowDown = true;
        if (direction.x < -threshold) keys.ArrowLeft = true;
        if (direction.x > threshold) keys.ArrowRight = true;
    }

    // 개선된 조이스틱 클래스 업데이트 (8방향 + 대각선)
    function updateJoystickClass(direction) {
        joystick.className = 'joystick-container';
        
        if (direction.magnitude < deadZone) return;
        
        // 8방향 감지
        const angle = Math.atan2(direction.y, direction.x) * 180 / Math.PI;
        const normalizedAngle = (angle + 360) % 360;
        
        // 방향별 클래스 추가
        if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) {
            joystick.classList.add('right');
        } else if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) {
            joystick.classList.add('up-right');
        } else if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) {
            joystick.classList.add('up');
        } else if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) {
            joystick.classList.add('up-left');
        } else if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) {
            joystick.classList.add('left');
        } else if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) {
            joystick.classList.add('down-left');
        } else if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) {
            joystick.classList.add('down');
        } else if (normalizedAngle >= 292.5 && normalizedAngle < 337.5) {
            joystick.classList.add('down-right');
        }
    }

    // 개선된 터치 이벤트
    function handleTouchStart(e) {
        e.preventDefault();
        isJoystickActive = true;
        joystick.classList.add('pressed');
        initJoystick(); // 터치 시작할 때마다 중심 재계산
        handleTouchMove(e);
    }

    function handleTouchMove(e) {
        if (!isJoystickActive) return;
        e.preventDefault();
        
        const touch = e.touches[0] || e.changedTouches[0];
        const direction = calculateDirection(touch.clientX, touch.clientY);
        currentDirection = direction;
        
        updateJoystickStick(direction);
        updateKeys(direction);
        updateJoystickClass(direction);
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        isJoystickActive = false;
        joystick.classList.remove('pressed');
        
        // 조이스틱 중앙으로 리셋
        const stick = joystick.querySelector('.joystick-stick');
        const pressure = joystick.querySelector('.joystick-pressure');
        
        if (stick) {
            stick.style.left = '50%';
            stick.style.top = '50%';
            stick.style.transform = 'translate(-50%, -50%)';
        }
        
        if (pressure) {
            pressure.style.opacity = '0';
            pressure.style.transform = 'scale(1)';
        }
        
        // 키 상태 초기화
        currentDirection = { x: 0, y: 0, magnitude: 0 };
        updateKeys(currentDirection);
        updateJoystickClass(currentDirection);
    }

    // 개선된 마우스 이벤트 (데스크톱 테스트용)
    function handleMouseDown(e) {
        e.preventDefault();
        isJoystickActive = true;
        joystick.classList.add('pressed');
        handleMouseMove(e);
    }

    function handleMouseMove(e) {
        if (!isJoystickActive) return;
        e.preventDefault();
        
        const direction = calculateDirection(e.clientX, e.clientY);
        currentDirection = direction;
        
        updateJoystickStick(direction);
        updateKeys(direction);
        updateJoystickClass(direction);
    }

    function handleMouseUp(e) {
        e.preventDefault();
        isJoystickActive = false;
        joystick.classList.remove('pressed');
        
        // 조이스틱 중앙으로 리셋
        const stick = joystick.querySelector('.joystick-stick');
        const pressure = joystick.querySelector('.joystick-pressure');
        
        if (stick) {
            stick.style.left = '50%';
            stick.style.top = '50%';
            stick.style.transform = 'translate(-50%, -50%)';
        }
        
        if (pressure) {
            pressure.style.opacity = '0';
            pressure.style.transform = 'scale(1)';
        }
        
        // 키 상태 초기화
        currentDirection = { x: 0, y: 0, magnitude: 0 };
        updateKeys(currentDirection);
        updateJoystickClass(currentDirection);
    }

    // 이벤트 리스너 등록
    joystick.addEventListener('touchstart', handleTouchStart, { passive: false });
    joystick.addEventListener('touchmove', handleTouchMove, { passive: false });
    joystick.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    joystick.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // 초기화
    initJoystick();
    window.addEventListener('resize', initJoystick);
}

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
    const scale = getUIScale();
    ctx.fillRect(player.x, player.y, player.size * scale, player.size * scale);
}

function drawUI() {
    ctx.font = `${16 * getUIScale()}px Arial`;
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
    
    // 일시정지 시간을 제외한 실제 게임 시간 계산
    const currentTime = Date.now();
    const actualPlayTime = currentTime - startTime - totalPauseTime;
    gameTime = actualPlayTime / 1000; // 밀리초 단위까지 포함
    
    level = Math.floor(gameTime / 10) + 1;
    spawnInterval = Math.max(200, 400 - (level - 1) * 50);
}

async function saveRanking() {
    // console.log('saveRanking 함수 호출됨, gameTime:', gameTime);
    
    try {
        const playerName = prompt('게임 오버! 랭킹에 등록할 이름을 입력하세요:', 'Player');
        // console.log('입력된 플레이어 이름:', playerName);
        
        if (playerName && playerName.trim() !== '') {
            // console.log('Supabase에 저장 시도 중...');
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
                // console.log('랭킹 저장 성공:', data);
                await getRankings();
            }
        } else {
            // console.log('플레이어 이름이 입력되지 않았습니다.');
        }
    } catch (err) {
        // console.error('saveRanking 함수에서 예외 발생:', err);
        console.error('랭킹 저장 중 예외 발생:', err);
        alert('랭킹 저장 중 오류가 발생했습니다: ' + err.message);
    }
}

// 랭킹 페이지네이션 및 검색 상태
let rankingPage = 1;
let rankingPageSize = 10;
let rankingTotal = 0;
let rankingSearch = '';

// 페이지네이션 컨트롤 생성
function renderRankingPagination() {
    const pagination = document.getElementById('ranking-pagination');
    if (!pagination) return;
    pagination.innerHTML = '';
    const totalPages = Math.ceil(rankingTotal / rankingPageSize);
    if (totalPages <= 1) return;
    
    // 이전 버튼
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '이전';
    prevBtn.disabled = rankingPage === 1;
    prevBtn.onclick = () => { rankingPage--; getRankings(); };
    pagination.appendChild(prevBtn);
    
    // 페이지 번호
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        if (i === rankingPage) {
            pageBtn.style.fontWeight = 'bold';
            pageBtn.style.background = '#eee';
        }
        pageBtn.onclick = () => { rankingPage = i; getRankings(); };
        pagination.appendChild(pageBtn);
    }
    // 다음 버튼
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '다음';
    nextBtn.disabled = rankingPage === totalPages;
    nextBtn.onclick = () => { rankingPage++; getRankings(); };
    pagination.appendChild(nextBtn);
}

// 검색 입력 이벤트 등록
window.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('ranking-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            rankingSearch = e.target.value.trim();
            rankingPage = 1;
            getRankings();
        });
    }
});

// 랭킹 불러오기 (SQL 함수 getrankbyplayername 사용, total_count 활용)
async function getBestRecord() {
    try {
        const { data, error } = await supabaseClient.rpc('getrankbyplayername', {
            search: '',
            page: 1,
            page_size: 1
        });
        if (error) {
            console.error('최고기록 불러오기 실패:', error);
            return;
        }
        if (data && data.length > 0) {
            bestTime = parseFloat(data[0].survival_time);
            updateChallengeMessage();
        }
    } catch (err) {
        console.error('최고기록 로드 중 예외 발생:', err);
    }
}

async function getRankings() {
    try {
        const { data, error } = await supabaseClient.rpc('getrankbyplayername', {
            search: rankingSearch || '',
            page: rankingPage,
            page_size: rankingPageSize
        });
        if (error) {
            console.error('랭킹 불러오기 실패:', error);
            return;
        }
        const rankingList = document.getElementById('ranking-list');
        if (!rankingList) {
            console.error('랭킹 리스트 요소를 찾을 수 없습니다.');
            return;
        }
        rankingList.innerHTML = '';
        // total_count로 전체 개수 갱신
        if (data && data.length > 0 && data[0].total_count !== undefined) {
            rankingTotal = data[0].total_count;
        } else {
            rankingTotal = 0;
        }
        data.forEach((rank, index) => {
            const li = document.createElement('li');
            const survivalTime = parseFloat(rank.survival_time);
            let dateStr = '';
            if (rank.created_at) {
                const d = new Date(rank.created_at);
                const yyyy = d.getUTCFullYear();
                const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
                const dd = String(d.getUTCDate()).padStart(2, '0');
                const hh = String(d.getUTCHours()).padStart(2, '0');
                const min = String(d.getUTCMinutes()).padStart(2, '0');
                const ss = String(d.getUTCSeconds()).padStart(2, '0');
                dateStr = `(UTC)${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
            }
            li.innerHTML = `#${rank.rank} ${rank.player_name} - ${survivalTime.toFixed(3)}s` +
                (dateStr ? `<br><span style='font-size:0.95em;color:#888;'>${dateStr}</span>` : '');
            rankingList.appendChild(li);
        });
        renderRankingPagination();
    } catch (err) {
        console.error('랭킹 데이터 로드 중 예외 발생:', err);
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
    
    // 게임 버튼들
    document.getElementById('giveup-btn').textContent = t.giveUpBtn;
    document.getElementById('retry-btn').textContent = t.retry;
    
    // 조이스틱 토글 라벨 업데이트
    const joystickLabel = document.getElementById('joystick-toggle-label');
    if (joystickLabel) {
        joystickLabel.textContent = joystickVisible ? t.joystickOn : t.joystickOff;
    }
    
    // 도전 메시지 업데이트
    updateChallengeMessage();
}

// 신기록 체크
function checkNewRecord() {
    isNewRecord = finalGameTime > bestTime;
    // console.log('신기록 여부:', isNewRecord, '현재 기록:', finalGameTime, '최고 기록:', bestTime);
}

// 게임 오버 모달 표시
function showGameOverModal() {
    // console.log('showGameOverModal 함수 호출됨');
    const modal = document.getElementById('gameOverModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalTime = document.getElementById('modalTime');
    const modalMessage = document.getElementById('modalMessage');
    const finalTimeSpan = document.getElementById('finalTime');
    const playerNameInput = document.getElementById('playerNameInput');
    const saveRankingBtn = document.getElementById('saveRankingBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');

    // 모달 요소들이 제대로 찾아지는지 확인
    if (!modal) {
        console.error('gameOverModal 요소를 찾을 수 없습니다!');
        return;
    }
    if (!modalTitle) console.error('modalTitle 요소를 찾을 수 없습니다!');
    if (!modalTime) console.error('modalTime 요소를 찾을 수 없습니다!');
    if (!modalMessage) console.error('modalMessage 요소를 찾을 수 없습니다!');
    if (!finalTimeSpan) console.error('finalTime 요소를 찾을 수 없습니다!');
    if (!playerNameInput) console.error('playerNameInput 요소를 찾을 수 없습니다!');
    if (!saveRankingBtn) console.error('saveRankingBtn 요소를 찾을 수 없습니다!');
    if (!closeModalBtn) console.error('closeModalBtn 요소를 찾을 수 없습니다!');

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
    // console.log('모달을 표시합니다...');
    modal.style.display = 'block';
    // console.log('모달 표시 완료. display:', modal.style.display);

    // Enter 키로만 저장 (ESC 키 이벤트 제거)
    playerNameInput.onkeydown = function(e) {
        if (e.key === 'Enter') {
            saveRankingFromModal();
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
        // console.log('모달에서 랭킹 저장 시도:', playerName, finalGameTime);
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
            // console.log('랭킹 저장 성공:', data);
            closeGameOverModal();
            await getBestRecord(); // 최고기록 먼저 업데이트
            await getRankings();
        }
    } catch (err) {
        console.error('랭킹 저장 중 오류:', err);
        alert(t.rankingSaveError + ' ' + err.message);
    }
}

let intervalId = null; // autoAttack setInterval ID

// 게임 재시작
function retryGame() {
    resetGame();
}

// 게임 오버 상태에서 Enter/Space 키 이벤트 제거 (모달이 켜져있을 때는 동작하지 않음)

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
        // 게임 오버 시 캔버스에 게임 오버 화면 표시
        const t = texts[currentLanguage];
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = `${60 * getUIScale()}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(t.gameOver.toUpperCase(), canvas.width / 2, canvas.height / 2);
        ctx.font = `${30 * getUIScale()}px Arial`;
        const displayTime = finalGameTime > 0 ? finalGameTime.toFixed(3) : gameTime.toFixed(3);
        ctx.fillText(`${t.survivalTime} ${displayTime}${t.seconds}`, canvas.width / 2, canvas.height / 2 + 40 * getUIScale());
        ctx.font = `${20 * getUIScale()}px Arial`;
        ctx.fillText(t.pressToRetry, canvas.width / 2, canvas.height / 2 + 80 * getUIScale());
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }

    // 일시정지 상태가 아닐 때만 게임 업데이트
    if (!isPaused) {
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
        updateTimerBox();
    } else {
        // 일시정지 상태일 때는 일시정지 메시지 표시
        const t = texts[currentLanguage];
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Paused', canvas.width / 2, canvas.height / 2);
        ctx.font = '16px Arial';
        ctx.fillText('Switch back to this tab to continue', canvas.width / 2, canvas.height / 2 + 40);
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

function resetGame() {
    // 기존 루프와 타이머 정리
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    if (intervalId) {
        clearInterval(intervalId);
    }
    // 캔버스 크기 조정
    resizeCanvas();

    // 이제 진짜 초기화
    gameOver = false;
    level = 1;
    gameTime = 0;
    finalGameTime = 0;
    isNewRecord = false;
    isPaused = false;
    pauseStartTime = 0;
    totalPauseTime = 0;
    startTime = Date.now();
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = 100;
    player.size = 20;
    player.speed = 5;
    enemies.length = 0;
    projectiles.length = 0;
    spawnInterval = 1000;
    lastSpawnTime = 0;
    for (let key in keys) { keys[key] = false; }
    // player.size는 resizeCanvas() 후에 재설정되어야 하므로 위에서 처리됨
    updateAllTexts();
    getBestRecord(); // 최고기록 먼저 로드
    getRankings();
    spawnEnemy(); // 적 1마리 즉시 생성
    intervalId = setInterval(autoAttack, 400);
    gameLoop();
}

// Give Up 버튼 함수
function onGiveUp() {
    if (!gameOver) {
        // console.log('Give Up 버튼으로 게임 오버 실행');
        gameOver = true;
        finalGameTime = gameTime; // 현재 시간을 최종 시간으로 저장
        checkNewRecord();
        showGameOverModal();
    }
}

// 초기 랭킹 로드 및 게임 시작
async function initializeGame() {
    resizeCanvas(); // 반응형 크기 적용
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    updateAllTexts(); // 초기 텍스트 설정
    initMobileControls(); // 모바일 컨트롤 초기화
    await getBestRecord(); // 최고기록 먼저 로드
    await getRankings();
    // autoAttack 중복 방지
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(autoAttack, 400);
    gameLoop();
}

// 조이스틱 토글 상태
let joystickVisible = true;

function toggleJoystick() {
    joystickVisible = !joystickVisible;
    const joystick = document.getElementById('mobile-controls');
    const btn = document.getElementById('joystick-toggle-btn');
    if (joystick) {
        joystick.style.display = joystickVisible ? 'block' : 'none';
    }
    if (btn) {
        btn.textContent = joystickVisible ? '조이스틱 끄기' : '조이스틱 켜기';
    }
}

// 토글 스위치로 조이스틱 on/off
function toggleJoystickSwitch() {
    const checked = document.getElementById('joystick-toggle-switch').checked;
    joystickVisible = checked;
    const joystick = document.getElementById('mobile-controls');
    const label = document.getElementById('joystick-toggle-label');
    if (joystick) {
        joystick.style.display = checked ? 'block' : 'none';
    }
    if (label) {
        const t = texts[currentLanguage];
        label.textContent = checked ? t.joystickOn : t.joystickOff;
    }
}

// 페이지 로드시 조이스틱 토글 버튼 상태 동기화
window.addEventListener('DOMContentLoaded', () => {
    const joystick = document.getElementById('mobile-controls');
    const btn = document.getElementById('joystick-toggle-btn');
    if (joystick) {
        joystick.style.display = joystickVisible ? 'block' : 'none';
    }
    if (btn) {
        btn.textContent = joystickVisible ? '조이스틱 끄기' : '조이스틱 켜기';
    }
});

// 페이지 로드시 토글 스위치 상태 동기화
window.addEventListener('DOMContentLoaded', () => {
    const joystick = document.getElementById('mobile-controls');
    const toggle = document.getElementById('joystick-toggle-switch');
    const label = document.getElementById('joystick-toggle-label');
    if (joystick) {
        joystick.style.display = joystickVisible ? 'block' : 'none';
    }
    if (toggle) {
        toggle.checked = joystickVisible;
    }
    if (label) {
        const t = texts[currentLanguage];
        label.textContent = joystickVisible ? t.joystickOn : t.joystickOff;
    }
});

initializeGame();
