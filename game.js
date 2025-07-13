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

// 국가 선택 관련 변수
let selectedCountryCode = null;

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
        joystickOff: 'Joystick Off',
        rankingSearchPlaceholder: 'Search nickname',
        countryLabel: 'Country:',
        countrySearchPlaceholder: 'Search country...',
        pleaseSelectCountry: 'Please select a country.'
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
        joystickOff: '조이스틱 꺼짐',
        rankingSearchPlaceholder: '닉네임 검색',
        countryLabel: '국가:',
        countrySearchPlaceholder: '국가 검색...',
        pleaseSelectCountry: '국가를 선택해주세요.'
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

let bestTime = 0.0; // 최고 기록 저장 (소수점 포함)


function updatePlayerPosition() {
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
    const searchBtn = document.getElementById('ranking-search-btn');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            rankingSearch = searchInput.value.trim();
            rankingPage = 1;
            getRankings();
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
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
            
            // 국가 정보 표시
            let countryInfo = '';
            if (rank.country_code) {
                const country = findCountryByCode(rank.country_code);
                if (country) {
                    countryInfo = `${country.flag}`;
                }
            }
            
            // '순위 국기 닉네임 시간' 순서로 표시
            li.innerHTML = `#${rank.rank} ${countryInfo} ${rank.player_name} <span style='font-weight:bold;'>${survivalTime.toFixed(3)}s</span>` +
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

    // 랭킹 검색 placeholder
    const searchInput = document.getElementById('ranking-search');
    if (searchInput) {
        searchInput.placeholder = t.rankingSearchPlaceholder;
    }
    
    // 국가 선택 관련 텍스트 업데이트
    const countrySelectLabel = document.getElementById('countrySelectLabel');
    const countrySearchInput = document.getElementById('countrySearchInput');
    if (countrySelectLabel) {
        countrySelectLabel.textContent = t.countryLabel;
    }
    if (countrySearchInput) {
        countrySearchInput.placeholder = t.countrySearchPlaceholder;
    }
    
    // 국가 목록 다시 로드 (언어 변경 시)
    loadCountryOptions();
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

    // 국가 선택 초기화
    initializeCountrySelect();

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

    if (!selectedCountryCode) {
        alert(t.pleaseSelectCountry);
        return;
    }

    try {
        // console.log('모달에서 랭킹 저장 시도:', playerName, finalGameTime, selectedCountryCode);
        const { data, error } = await supabaseClient
            .from('rankings')
            .insert({ 
                player_name: playerName, 
                survival_time: parseFloat(finalGameTime),
                country_code: selectedCountryCode
            });
        
        if (error) {
            console.error('랭킹 저장 실패:', error);
            alert(t.rankingSaveFailed + ' ' + error.message);
        } else {
            // console.log('랭킹 저장 성공:', data);
            // 선택한 국가를 로컬스토리지에 저장
            localStorage.setItem('selectedCountry', selectedCountryCode);
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

let countryChoices = null;

function loadCountryOptions() {
    const countrySelect = document.getElementById('countrySelect');
    if (!countrySelect) return;
    countrySelect.innerHTML = '';
    const sortedCountries = getSortedCountries(currentLanguage);
    sortedCountries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.code;
        option.textContent = `${country.flag} ${getCountryName(country, currentLanguage)}`;
        countrySelect.appendChild(option);
    });
}

function initializeCountrySelect() {
    const countrySelect = document.getElementById('countrySelect');
    const countrySelectLabel = document.getElementById('countrySelectLabel');
    if (!countrySelect || !countrySelectLabel) {
        console.error('국가 선택 요소를 찾을 수 없습니다!');
        return;
    }
    const t = texts[currentLanguage];
    countrySelectLabel.textContent = t.countryLabel;
    loadCountryOptions();
    // Choices 인스턴스 생성(이미 있으면 destroy)
    if (countryChoices) {
        countryChoices.destroy();
    }
    countryChoices = new Choices(countrySelect, {
        searchEnabled: true,
        shouldSort: true,
        itemSelectText: '',
        placeholder: true,
        placeholderValue: t.countryLabel,
        searchPlaceholderValue: t.countrySearchPlaceholder,
        allowHTML: false
    });
    // 선택 이벤트 동기화
    countrySelect.removeEventListener('change', countrySelect._choicesChangeHandler);
    countrySelect._choicesChangeHandler = function() {
        selectedCountryCode = this.value;
        localStorage.setItem('selectedCountry', selectedCountryCode);
    };
    countrySelect.addEventListener('change', countrySelect._choicesChangeHandler);
    // 이전에 선택한 국가가 있으면 선택
    const savedCountry = localStorage.getItem('selectedCountry');
    if (savedCountry) {
        selectedCountryCode = savedCountry;
        countrySelect.value = savedCountry;
        countryChoices.setChoiceByValue(savedCountry);
    }
}

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
    initializeCountrySelect(); // 국가 선택 초기화
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
