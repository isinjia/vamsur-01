// ✅ PIXI 앱 생성 및 월드 컨테이너 설정

const CHEAT_UI_ENABLED = true; // false면 치트 UI 숨김
let cheatLevelTexts = []; // ✅ 치트 레벨 텍스트 저장용
let visibleTiles = []; // 화면에 보이는 타일들을 저장하는 배열
const SHOOTER_COOLDOWN = 120; // 원거리 몬스터 공격 쿨다운
const SHOOTER_STOP_DISTANCE = 300

// ✅ 몬스터 출현 확률 설정
// ✅ 몬스터 출현 확률 설정 (합이 1.0이 되도록 유지하세요)
const bossTypes = {
  '테네브리스': {
    texture: 'images/boss5.png', maxHP: 300, speed: 1.0, orbCount: 15, orbValue: 10
  },
  '러그만': {
    texture: 'images/boss4.png', maxHP: 250, speed: 1.2, orbCount: 12, orbValue: 10
  },
  '요르하카': {
    texture: 'images/boss3.png', maxHP: 220, speed: 1.0, orbCount: 10, orbValue: 12
  },
  '스카': {
    texture: 'images/boss2.png', maxHP: 200, speed: 1.4, orbCount: 10, orbValue: 8
  },
  '팔콘': {
    texture: 'images/boss1.png', maxHP: 180, speed: 1.6, orbCount: 8, orbValue: 6
  }
};

const WORLD_SCALE = 0.6;
let bossHpBar = null;
let bossHpBarBackground = null;
let currentBoss = null;
let bossNameText = null;
let selectedSkillName = null;
let skillSelected = false;
let skillCardDelay = 10;
let selectedSkills = {}; // 예: { '윈드 브레이크': 1, '데스 그라인더': 2 }
let levelUpCardUI = [];
let deathGrinderInterval = null;
let clawSlashInterval = null;
let isHiddenEventTriggered = false;
let healPacks = [];
let totalPauseTime = 0;

let lastWaveTime = Date.now();
const WAVE_INTERVAL = 6000; // 1분 몬스터 웨이브 소환 시간

const magnetItems = [];


const deathGrinderEvolvedBullets = [];



let evolutionSkillPendingList = []; // 등장 예정 진화 스킬 목록
const evolutionSkillConditions = [
  {
    name: "엄청난 윈드브레이크",
    base: "윈드 브레이크",
    requiredStat: "공격력" // ✅ 수정
  },
  {
    name: "압도적인 발톱꺼내기",
    base: "발톱 꺼내기",
    requiredStat: "치명타 확률"
  },
  {
    name: "우당탕탕 데스 그라인더",
    base: "데스 그라인더",
    requiredStat: "공격 속도"
  },
  {
    name: "무시무시한 파이널 피스트",
    base: "파이널 피스트",
    requiredStat: "최대 체력"
  },
  {
    name: "혼돈의 볼케이노",
    base: "어스퀘이크 볼케이노",
    requiredStat: "체력 회복"
  },
  {
    name: "예측불허 트러블 패스",
    base: "트러블 패스",
    requiredStat: "스킬 범위"
  },
  {
    name: "다뚫어 체인 피어스",
    base: "체인 피어스",
    requiredStat: "투사체 개수"
  },
  {
    name: "완전 끝내주는 디스트로네일",
    base: "디스트로네일",
    requiredStat: "스킬 쿨타임"
  },
  {
    name: "일촉즉발 지뢰",
    base: "지뢰 설치",
    requiredStat: "이동 속도"
  },
  {
    name: "짱큰 옥타곤 필드",
    base: "필드 옥타곤",
    requiredStat: "자력 증가"
  }
];

const enemyPool = [];
const bulletPool = [];

function getEnemyFromPool() {
  return enemyPool.length > 0 ? enemyPool.pop() : createNewEnemy();
}

function returnEnemyToPool(enemy) {
  enemy.visible = false;
  enemy.parent?.removeChild(enemy);
  enemyPool.push(enemy);
}

function getBulletFromPool() {
  return bulletPool.length > 0 ? bulletPool.pop() : createNewBullet();
}

function returnBulletToPool(bullet) {
  bullet.visible = false;
  bullet.parent?.removeChild(bullet);
  bulletPool.push(bullet);
}




function hasSkill(skillName) {
  return selectedSkills[skillName] && selectedSkills[skillName] > 0;
}


let pauseButton;
let isPausedManually = false;
let statusTexts = [];


let playerHpBarBg;
let playerHpBar;

let mines = []; // 설치된 지뢰 배열
let lastMineX = 0;
let lastMineY = 0;

const maxSkillLevel = 5; // ✅ 스킬 최대 레벨 상수 정의

let isBossWarningActive = false;

let joystickDir = { x: 0, y: 0 };
const isMobile = /Mobi|Android|iPhone|iPad/.test(navigator.userAgent);
const availableSkills = [
  { name: '윈드 브레이크', type: 'skill' },
  { name: '데스 그라인더', type: 'skill' },
  { name: '필드 옥타곤', type: 'skill' },
  {
    name: '어스퀘이크 볼케이노',
    type: 'skill',
    onLearn: () => startVolcanoLoop()
  },
  {
    name: '발톱 꺼내기',
    type: 'skill',
    onLearn: () => startClawSlashLoop()
  },
  {
    name: '체인 피어스',
    type: 'skill',
    onLearn: () => startChainPierceLoop()
  },
    {
      name: '파이널 피스트',
      type: 'skill',
    onLearn: () => startFinalFistLoop()
    },
    {
      name: '지뢰 설치',
      type: 'skill',
      onLearn: () => {
        installMineAt(player.x, player.y);
        lastMineX = player.x;
        lastMineY = player.y;
      }
    },
    {
      name: '디스트로네일',
      type: 'skill',
      onLearn: () => startDestroyNailLoop()
    },
    {
      name: '트러블 패스',
      type: 'skill',
      onLearn: () => startTroublePassLoop()
  }
];

PIXI.Loader.shared.add("images/claw_super.png").load();
const fastEnemies = [];
const shooters = [];
const activeVolcanoes = []; // 어스퀘이크 볼케이노 배열 추가

const PROB_SHOOTER_ENEMY = 0.1;
const PROB_FAST_ENEMY = 0.2;
// 일반 몬스터 확률은 나머지 자동 계산됨


const PLAYER_SHOOT_ENABLED = true; // ✅ 테스트 시 false로 설정

;

const TILE_UPDATE_PADDING = 2; // 가장자리 여유 버퍼

const tileSize = 341;
const tileScale = 0.4;
const scaledTileSize = tileSize * tileScale;


let TILE_VIEW_SIZE_X = Math.ceil(window.innerWidth / scaledTileSize);
let TILE_VIEW_SIZE_Y = Math.ceil(window.innerHeight / scaledTileSize);


const tilesPerRow = 3;
const tileTexture = PIXI.BaseTexture.from('images/tileset.png');

let expOrbs = [];

const BOSS_KILL_THRESHOLD = 100; // 몬스터 100마리 처치 시마다 보스 등장
let totalMonstersKilled = 0;

let bossQueue = ['팔콘', '스카', '요르하카', '러그만', '테네브리스'];
let isBossActive = false;
let bossSpawnPending = false;
let bossWarningTimer = 0;
let bossWarningText = null;
let bossWarningMark = null;

let expBarFill;
let levelDisplay;



const defaultPlayerStats = {
  maxHP: 50,
  currentHP: 50,
  moveSpeed: 4.5,
  bulletSpeed: 8,
  attackPower: 3,
  defense: 0,
  critChance: 0,
  pickupRadius: 50,  // 기본 획득 범위 50으로 수정
  magnetRadius: 150, // 기본 자력 범위 150으로 수정
  critDamage: 1.5,
  skillRange: 0,
  regenStat: 0,
  skillCooldownReduction: 0,
  projectileCount: 0
};
let playerStats = JSON.parse(JSON.stringify(defaultPlayerStats));

const INIT_BULLET_SPEED = 8;
const INIT_PLAYER_SPEED = 3;
const INIT_PLAYER_HP = 3;

const app = new PIXI.Application({
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb
});
document.body.appendChild(app.view);

levelUpButton = new PIXI.Text('강제 레벨업', {
  fontFamily: 'Arial',
  fontSize: 20,
  fill: 'white',
  stroke: 'black',
  strokeThickness: 3
});
levelUpButton.interactive = true;
levelUpButton.buttonMode = true;
levelUpButton.x = 20;
levelUpButton.y = 180;
levelUpButton.zIndex = 9999;

levelUpButton.on('pointerdown', () => {
  playerLevel += 1;
  updateUI();
  checkEvolveSkills(); // 진화 조건 체크
  showLevelUpCards();  // 카드 선택창 띄우기
});

app.stage.addChild(levelUpButton);
const gainExpButton = new PIXI.Text('경험치 +5', {
  fontFamily: 'Arial',
  fontSize: 20,
  fill: 'white',
  stroke: 'black',
  strokeThickness: 3
});
gainExpButton.interactive = true;
gainExpButton.buttonMode = true;
gainExpButton.x = 20;
gainExpButton.y = 220; // 강제 레벨업(180) 아래
gainExpButton.zIndex = 9999;

gainExpButton.on('pointerdown', () => {
  gainEXP(5); // 경험치 5 추가
});
app.stage.addChild(gainExpButton);

// ✅ 경험치 +20 버튼 추가
const gainExpButton20 = new PIXI.Text('경험치 +20', {
  fontFamily: 'Arial',
  fontSize: 20,
  fill: 'white',
  stroke: 'black',
  strokeThickness: 3
});
gainExpButton20.interactive = true;
gainExpButton20.buttonMode = true;
gainExpButton20.x = 20;
gainExpButton20.y = 260; // +5 버튼보다 아래
gainExpButton20.zIndex = 9999;

gainExpButton20.on('pointerdown', () => {
  gainEXP(20); // 경험치 20 추가
});
app.stage.addChild(gainExpButton20);




// 버튼을 붙일 UI 전용 컨테이너 만들기

const uiContainer = new PIXI.Container();

uiContainer.zIndex = 9999;
app.stage.addChild(uiContainer);
app.stage.sortableChildren = true; // zIndex 적용되도록 설정










app.stage.sortableChildren = true;

const world = new PIXI.Container();
world.sortableChildren = true;
app.stage.addChild(world);


const tileContainer = new PIXI.Container();
world.addChildAt(tileContainer, 0);

function getTileTexture(index) {
  const x = (index % tilesPerRow) * tileSize;
  const y = Math.floor(index / tilesPerRow) * tileSize;
  return new PIXI.Texture(tileTexture, new PIXI.Rectangle(x, y, tileSize, tileSize));
}

const tileGroups = {
  road: [1, 3, 6],
  pavement: [2, 4, 5, 7],
  ground: [0, 8],
};

function pick(group) {
  const tiles = tileGroups[group];
  return tiles[Math.floor(Math.random() * tiles.length)];
}

function getRandomTileIndex(x, y) {
  const seed = (x * 73856093 ^ y * 19349663) >>> 0;
  const hash = (seed % 1000) / 1000; // 0 ~ 1

  if (x % 5 === 0) return pick("road"); // 세로 도로
  if (y % 5 === 0) return pick("pavement"); // 가로 보도

  if (hash < 0.1) return pick("road");
  if (hash < 0.25) return pick("pavement");

  return pick("ground");
}

const MAP_WIDTH = 20000;
const MAP_HEIGHT = 20000;
const wallSize = 64;
const wallScale = wallSize / 1024; // 벽 이미지 크기 보정


// ===================
// [Final Fist Skill]
// ===================

const finalFistLevel = 1; // 스킬 레벨 (1~5)
const baseFinalFistCooldown = 1000; // ms
let finalFistInterval = null;


function createCheatButtons() {
  const startX = app.screen.width - 250;
  const startY = 120;
  const lineHeight = 28;
  const maxLevel = 5;

  const makeRow = (name, isSkill, index) => {
    const y = startY + index * lineHeight;

    const nameText = new PIXI.Text(name, {
      fontFamily: 'Arial', fontSize: 16, fill: 'white',
    });
    nameText.x = startX;
    nameText.y = y;

    const minus = new PIXI.Text('-', {
      fontFamily: 'Arial', fontSize: 20, fill: 'red', stroke: 'black', strokeThickness: 2,
    });
    minus.interactive = true;
    minus.buttonMode = true;
    minus.x = startX + 90;
    minus.y = y;
    minus.on('pointerdown', () => {
      if (isSkill) {
        if (selectedSkills[name]) {
          selectedSkills[name] = Math.max(0, selectedSkills[name] - 1);
        }
      } else {
        if (playerStats[name + '_level']) {
          playerStats[name + '_level'] = Math.max(0, playerStats[name + '_level'] - 1);
          if (name === "공격력") {
            playerStats.attackPower = Math.max(1, playerStats.attackPower - 1);
          }
        }
      }
    });

    const plus = new PIXI.Text('+', {
      fontFamily: 'Arial', fontSize: 20, fill: 'green', stroke: 'black', strokeThickness: 2,
    });
    plus.interactive = true;
    plus.buttonMode = true;
    plus.x = startX + 120;
    plus.y = y;
    plus.on('pointerdown', () => {
      if (isSkill) {
        const cur = selectedSkills[name] || 0;
        if (cur < maxLevel) {
          selectedSkills[name] = cur + 1;
          
          if (cur === 0) {
            const skillData = availableSkills.find(s => s.name === name);
            if (skillData?.onLearn) {
              skillData.onLearn();
              console.log(`[치트] ${name} onLearn 실행됨`);
            }
          }
        }
      } else {
        const cur = playerStats[name + '_level'] || 0;
        if (cur < maxLevel) {
          playerStats[name + '_level'] = cur + 1;
    
          switch (name) {
            case "공격력":
              playerStats.attackPower += 1;
              break;
            case "이동 속도":
              playerStats.moveSpeed += 1;
              break;
            case "공격 속도":
              playerStats.bulletSpeed += 2;
              break;
            case "체력 회복":
              playerStats.regenStat += 1;
              break;
            case "스킬 범위":
              playerStats.skillRange += 1;
              break;
            case "투사체 개수":
              playerStats.projectileCount += 1;
              break;
            case "최대 체력":
              playerStats.maxHP += 1;
              playerStats.currentHP += 1;
              break;
            case "치명타 확률":
              playerStats.critChance = Math.min(1, playerStats.critChance + 0.05);
              break;
            case "자력 범위":
              playerStats.magnetRadius += 20;
              break;
            case "스킬 쿨타임":
              playerStats.skillCooldownReduction = Math.min(0.5, (playerStats.skillCooldownReduction || 0) + 0.1);
              break;
          }

          checkEvolveSkills();
        }
      }
    });
    
    const levelText = new PIXI.Text('Lv.0', {
      fontFamily: 'Arial', fontSize: 16, fill: 'yellow',
    });
    levelText.x = startX + 160;
    levelText.y = y;

    app.stage.addChild(nameText, minus, plus, levelText);
    cheatLevelTexts.push({ name, isSkill, levelText });
  };

  cheatLevelTexts = [];

  // 스탯 10개
  const statNames = [
    "공격력",
    "이동 속도",
    "공격 속도",
    "체력 회복",
    "스킬 범위",
    "투사체 개수",
    "최대 체력",
    "치명타 확률",
    "자력 범위",
    "스킬 쿨타임"
  ];
  for (let i = 0; i < statNames.length; i++) {
    makeRow(statNames[i], false, i);
  }
  
  const skillOffset = 4;
  for (let i = 0; i < 10; i++) {
    const skillName = availableSkills[i]?.name || `스킬${i + 1}`;
    makeRow(skillName, true, 7 + i + skillOffset);
  }
}


function updateLevelText() {
  for (const obj of cheatLevelTexts) {
    const level = obj.isSkill
      ? selectedSkills[obj.name] || 0
      : playerStats[obj.name + '_level'] || 0;
    obj.levelText.text = `Lv.${level}`;
  }
}


function fadeOutAndStartGame(container, onComplete) {
  const fade = new PIXI.Graphics();
  fade.beginFill(0x000000);
  fade.drawRect(0, 0, window.innerWidth, window.innerHeight);
  fade.endFill();
  fade.alpha = 0;
  fade.zIndex = 999999;
  app.stage.addChild(fade);
  app.stage.sortChildren();

  levelUpCardUI.forEach(c => {
    if (c && app.stage.children.includes(c)) {
      app.stage.removeChild(c);
    }
  });
  levelUpCardUI = [];




  let count = 0;
  const duration = 60; // 약 1초

  app.ticker.add(function fadeOutTicker() {
    count++;
    fade.alpha = Math.min(count / duration, 1);

    if (count >= duration) {
      app.ticker.remove(fadeOutTicker);
      if (container) app.stage.removeChild(container);
      onComplete();

      

      let fadeInCount = 0;

      if (CHEAT_UI_ENABLED) {
        createCheatButtons();
      }
      

      app.ticker.add(function fadeInTicker() {
        fadeInCount++;
        fade.alpha = 1 - Math.min(fadeInCount / duration, 1);

        if (fadeInCount >= duration) {
          app.ticker.remove(fadeInTicker);
          app.stage.removeChild(fade);
          isGamePaused = true;
          showSkillSelectCards(); // ✅ 카드 생성 위치는 여기가 맞습니다!
        }
      });
    }
  });

  
}

function resetPlayerStats() {
  Object.assign(playerStats, JSON.parse(JSON.stringify(defaultPlayerStats)));
  gameScore = 0; // 게임 시작시 점수 초기화
}


function showMainMenu() {
  const menuContainer = new PIXI.Container();
  menuContainer.zIndex = 9999;

  // 기존 UI 요소들 제거
  if (playerHpBar) {
    world.removeChild(playerHpBar);
    playerHpBar = null;
  }
  if (playerHpBarBg) {
    world.removeChild(playerHpBarBg);
    playerHpBarBg = null;
  }
  if (hpText && hpText.parent) {
    app.stage.removeChild(hpText);
  }

  // 남아있는 HP바들 제거
  for (const enemy of enemies) {
    if (enemy.hpBar) {
      world.removeChild(enemy.hpBar);
      enemy.hpBar = null;
    }
  }

  // 기존 메인 메뉴 코드...
  const background = new PIXI.Graphics();
  background.beginFill(0x000000);
  background.drawRect(0, 0, window.innerWidth, window.innerHeight);
  background.endFill();
  background.zIndex = 99;
  menuContainer.addChild(background);

  // ✅ 메인 배경 이미지
  const bg = PIXI.Sprite.from('images/mainbg.png');

  bg.texture.baseTexture.on('loaded', () => {
    const imgW = bg.texture.width;
    const imgH = bg.texture.height;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const scaleX = screenW / imgW;
    const scaleY = screenH / imgH;
    const scale = Math.min(scaleX, scaleY); // 비율 유지, 여백 생김

    bg.scale.set(scale);
    bg.anchor.set(0.5);
    bg.x = screenW / 2;
    bg.y = screenH / 2;
    bg.zIndex = 100; // ✅ 추가
    menuContainer.addChild(bg); // 배경 위에 이미지
  });

  // ✅ 메뉴컨테이너를 가장 위로 올림
  app.stage.addChild(menuContainer); // 맨 마지막에 추가되도록
  app.stage.sortChildren(); // ✅ 정렬 강제 적용

  // ✅ 입력 이벤트로 게임 시작
  function startGameFromMenu() {
    // 게임 상태 초기화
    isGameOver = false;
    isGamePaused = false;
    isPausedManually = false;
    score = 0;
    totalMonstersKilled = 0;
    playerEXP = 0;
    playerLevel = 1;
    nextEXP = 10;
    selectedSkills = {};
    enemies.length = 0;
    bullets.length = 0;
    expOrbs.length = 0;
    mines.length = 0;
    activeVolcanoes.length = 0;
    deathGrinderEvolvedBullets.length = 0;
    bossQueue = ['팔콘', '스카', '요르하카', '러그만', '테네브리스']; // 보스 순서 설정
    bossWarningTimer = 0;
    isBossWarningActive = false;
    isBossActive = false;
    currentBoss = null;
    totalPauseTime = 0;
    pauseStartTime = null;
    destroyNailTickerStarted = false;

    // 기존 HP바 제거
    if (playerHpBar) {
      world.removeChild(playerHpBar);
      playerHpBar = null;
    }
    if (playerHpBarBg) {
      world.removeChild(playerHpBarBg);
      playerHpBarBg = null;
    }

    // 새로운 HP바 생성
    playerHpBarBg = new PIXI.Graphics();
    playerHpBarBg.beginFill(0x000000);
    playerHpBarBg.drawRect(0, 0, 60, 10);
    playerHpBarBg.endFill();
    playerHpBarBg.zIndex = 5;  // 배경 HP바도 zIndex 5로 설정
    world.addChild(playerHpBarBg);

    playerHpBar = new PIXI.Graphics();
    playerHpBar.beginFill(0xffff00);
    playerHpBar.drawRect(0, 0, 60, 10);
    playerHpBar.endFill();
    playerHpBar.zIndex = 5;  // HP바도 zIndex 5로 설정
    world.addChild(playerHpBar);

    // 일시정지 버튼 생성
    if (pauseButton) {
      app.stage.removeChild(pauseButton);
    }
    pauseButton = new PIXI.Text('⏸ 일시정지', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xFFFFFF,
      align: 'center'
    });
    pauseButton.interactive = true;
    pauseButton.buttonMode = true;
    pauseButton.x = 10;
    pauseButton.y = 10;
    pauseButton.on('pointerdown', () => {
      if (!isGameOver) {
        isPausedManually = !isPausedManually;
        isGamePaused = isPausedManually;
        pauseButton.text = isGamePaused ? '▶ 재개' : '⏸ 일시정지';
        
        if (isGamePaused) {
          showPlayerStats();
        } else {
          hidePlayerStats();
        }
      }
    });
    app.stage.addChild(pauseButton);

    window.removeEventListener('keydown', startGameFromMenu);
    window.removeEventListener('pointerdown', startGameFromMenu);
    window.removeEventListener('touchstart', startGameFromMenu);
  
    fadeOutAndStartGame(menuContainer, () => {


      // ✅ 게임 시작 전 남아 있는 카드 전부 제거
levelUpCardUI.forEach(card => {
  if (card && app.stage.children.includes(card)) {
    app.stage.removeChild(card);
  }
});
levelUpCardUI = [];

      // 여기에 원하는 함수 호출 가능
      // 예: 게임 로딩, 인트로 연출 등
    });
  }
  // ← ❗이 `}` 중괄호가 빠져 있어야 하는데 없음
  





  window.addEventListener('keydown', startGameFromMenu);
  window.addEventListener('pointerdown', startGameFromMenu);
  window.addEventListener('touchstart', startGameFromMenu);

  app.stage.setChildIndex(menuContainer, app.stage.children.length - 1);

  if (CHEAT_UI_ENABLED) {
    app.ticker.add(() => {
      updateLevelText();
    });
  }
  


}














function getFinalFistCooldown() {
  const reduction = playerStats.skillCooldownReduction || 0;
  return baseFinalFistCooldown / (1 + reduction * 0.2);
}



function spawnFinalFist() {
  const fist = PIXI.Sprite.from("images/final_fist.png");
  fist.anchor.set(0.5, 1);
  fist.x = player.x + (Math.random() - 0.5) * 400;
  fist.y = player.y - 500;
  fist.scale.set(1.5);
  world.addChild(fist);

  const targetY = player.y - 50;
  const damage = getFinalFistDamage();

  const fallSpeed = 12;
  const fallTicker = new PIXI.Ticker();
  let shockwaveStarted = false;

  fallTicker.add(() => {
    if (fist.y < targetY) {
      fist.y += fallSpeed;

      if (!shockwaveStarted && fist.y >= targetY - 50) {
        shockwaveStarted = true;
        createFinalFistShockwave(fist.x, fist.y, damage);
      }
    } else {
      fist.y = targetY;
      fallTicker.stop();
      fallTicker.destroy();

      let shakeTick = 0;
      const baseY = fist.y;
      const shakeAmp = 4;
      const shakeDuration = 20;

      const shakeTicker = new PIXI.Ticker();
      shakeTicker.add(() => {
        shakeTick++;
        fist.y = baseY + Math.sin(shakeTick * 0.5) * shakeAmp;

        if (shakeTick > shakeDuration) {
          shakeTicker.stop();
          shakeTicker.destroy();

          // ✅ 0.3초 후에 주먹 제거
          setTimeout(() => {
            world.removeChild(fist);
          }, 300);
        }
      });
      shakeTicker.start();
    }
  });

  fallTicker.start();
}


function installMineAt(x, y) {
  const mine = PIXI.Sprite.from('images/mine.png');
  mine.anchor.set(0.5);
  mine.scale.set(0.1);
  mine.x = x;
  mine.y = y + 30;
  mine.zIndex = 0;   
  mine.exploded = false;
  mine.createdAt = Date.now(); // 지뢰 생성 시간 저장
  mine.duration = 10000; // 10초 지속
  
  world.addChild(mine);
  world.sortChildren();
  mines.push(mine);
}



function startTroublePassLoop() {
  setInterval(() => {
    if (isGameOver || isGamePaused || !hasSkill('트러블 패스')) return;
    spawnTroublePassProjectiles();
  }, 1000);
  
}


function spawnTroublePassProjectiles() {
  const baseScale = 0.2;  // ✅ 작게 조정
  const rangeScale = 1 + 0.2 * (playerStats.skillRange || 0);
  const projectileScale = baseScale * rangeScale;

  const directions = [{ x: 1, y: -1 }]; // 우상향 기본

  const lvl = playerStats.projectileCount || 0;
  if (lvl >= 1) directions.push({ x: -1, y: 1 });   // 좌하
  if (lvl >= 2) directions.push({ x: -1, y: -1 });  // 좌상
  if (lvl >= 3) directions.push({ x: 1, y: 1 });    // 우하
  if (lvl >= 4) directions.push({ x: 0, y: 1 });    // 아래
  if (lvl >= 5) directions.push({ x: 0, y: -1 });   // 위

  directions.forEach(dir => {
    const bullet = PIXI.Sprite.from('images/trouble_pass.png');
    bullet.anchor.set(0.5);
    bullet.x = player.x;
    bullet.y = player.y;
    bullet.scale.set(projectileScale);

    bullet.vx = dir.x * 5;
    bullet.vy = dir.y * 5;

    bullet.rotation = Math.atan2(bullet.vy, bullet.vx);  // ✅ 회전 적용

    bullet.isTroublePass = true;

    world.addChild(bullet);
    bullets.push(bullet);
  });
}




function createFinalFistWave(x, y) {
  const wave = new PIXI.Graphics();
  wave.beginFill(0xffff00, 0.5);
  wave.drawCircle(0, 0, 0);
  wave.endFill();
  wave.x = x;
  wave.y = y;
  world.addChild(wave);

  const level = selectedSkills['파이널 피스트'] || 1;
  const damage = Math.floor(playerStats.maxHP * 0.1 * level);
  const radius = 100 + level * 30;

  const damagedEnemies = new Set(); // ✅ 같은 적 중복 피해 방지
  let frame = 0;
  const maxFrame = 20;

  const tick = () => {

    if (isGameOver || isGamePaused) {
      app.ticker.remove(tick);
      if (wave && wave.parent) world.removeChild(wave);
      return;
    }

    
    frame++;
    const progress = frame / maxFrame;
    const currentRadius = radius * progress;

    wave.clear();
    wave.beginFill(0xffff00, 0.6 * (1 - progress));
    wave.drawCircle(0, 0, currentRadius);
    wave.endFill();

    // ✅ 매 프레임마다 피격 판정 실행
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (damagedEnemies.has(e)) continue;

      const dx = x - e.x;
      const dy = y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= currentRadius) {
        e.currentHP -= damage;
        createDamageText(e.x, e.y - 30, damage, false);
        damagedEnemies.add(e);

        if (typeof e.onHit === 'function') e.onHit();
        
        
        applyHitEffect(e);


        if (e.currentHP <= 0) {
          if (e.hpBar) world.removeChild(e.hpBar);
        
          // ✅ EXP 오브 생성 추가
          const orb = new PIXI.Graphics();
          orb.beginFill(0x3399ff);
          orb.drawCircle(0, 0, 6);
          orb.endFill();
          orb.x = e.x;
          orb.y = e.y;
          orb.expValue = e.behavior === 'fast' ? 5 : 3;
          world.addChild(orb);
          expOrbs.push(orb);
        
          createDeathEffect(e);
          enemies.splice(i, 1);
          totalMonstersKilled++;
          score++; // Add score increment
        } else if (e.hpBar instanceof PIXI.Graphics) {
          const hpRatio = Math.max(0, e.currentHP / e.maxHP);
          e.hpBar.clear();
          e.hpBar.beginFill(0xff0000);
          e.hpBar.drawRect(0, 0, 30 * hpRatio, 4);
          e.hpBar.endFill();
          e.hpBar.x = e.x - 15;
          e.hpBar.y = e.y - 40;
        }
      }
    }

    if (frame >= maxFrame) {
      app.ticker.remove(tick);
      world.removeChild(wave);
    }
  };

  app.ticker.add(tick);
}






function startFinalFistLoop() {
  if (finalFistInterval) clearInterval(finalFistInterval);
  finalFistInterval = setInterval(() => {
    if (isGamePaused) return;
    spawnFinalFist();
  }, 2000);  // 2초로 고정
}


function getFinalFistDamage() {
  const level = selectedSkills["파이널 피스트"] || 1;
  return 25 + (level - 1) * 10;  // 레벨 1: 25, 레벨 2: 35, 레벨 3: 45, 레벨 4: 55, 레벨 5: 65
}



function createDestroyNailFlash() {
  const flash = new PIXI.Graphics();

  const scaleX = world.scale.x;
  const scaleY = world.scale.y;

  const screenWidth = app.screen.width / scaleX;
  const screenHeight = app.screen.height / scaleY;

  flash.beginFill(0xffffff, 0.3);
  flash.drawRect(0, 0, screenWidth, screenHeight);
  flash.endFill();

  flash.x = player.x - screenWidth / 2;
  flash.y = player.y - screenHeight / 2;

  flash.zIndex = 1000;
  world.addChild(flash);
  world.sortChildren();

  let alpha = 0.3;

  const fade = () => {
    alpha -= 0.05;
    flash.alpha = alpha;

    if (alpha <= 0) {
      app.ticker.remove(fade);
      world.removeChild(flash);
    }
  };

  app.ticker.add(fade);
}

let destroyNailTickerStarted = false;
function startDestroyNailLoop() {
  if (destroyNailTickerStarted) {
    // 이미 실행 중인 ticker가 있다면 제거
    app.ticker.remove(destroyNailTicker);
    destroyNailTickerStarted = false;
  }
  
  destroyNailTickerStarted = true;
  let lastTriggerTime = 0;

  const destroyNailTicker = () => {
    if (isGameOver || isGamePaused) return;

    const level = selectedSkills["디스트로네일"];
    if (!level) return;

    const cooldown = 10; // 10초로 고정
    const now = performance.now();
    const elapsed = (now - lastTriggerTime) / 1000;

    if (elapsed >= cooldown) {
      lastTriggerTime = now;

      createDestroyNailFlash();

      // 레벨별 데미지 계산 (기본 40 + 레벨당 20)
      const damage = 40 + (level - 1) * 20;
      const allTargets = [
        ...enemies,
        ...fastEnemies,
        ...shooters,
        ...(currentBoss ? [currentBoss] : [])
      ];

      for (const e of allTargets) {
        e.currentHP -= damage;
        
        createDamageText(e.x, e.y - 30, damage, false);
        applyHitEffect(e);

        if (e.currentHP <= 0 && e !== currentBoss) {
          if (e.hpBar) world.removeChild(e.hpBar);

          const orb = new PIXI.Graphics();
          orb.zIndex = 2;
          orb.beginFill(0x3399ff);
          orb.drawCircle(0, 0, 6);
          orb.endFill();
          orb.x = e.x;
          orb.y = e.y;
          orb.expValue = e.behavior === 'fast' ? 5 : 3;
          world.addChild(orb);
          expOrbs.push(orb);

          createDeathEffect(e);

          const arr = enemies.includes(e) ? enemies :
                      fastEnemies.includes(e) ? fastEnemies :
                      shooters.includes(e) ? shooters : null;
          if (arr) arr.splice(arr.indexOf(e), 1);

          totalMonstersKilled++;
          score++;
        }
      }
    }
  };

  app.ticker.add(destroyNailTicker);
}








function createMineExplosion(x, y) {
  const shockwave = new PIXI.Graphics();
  shockwave.beginFill(0x2a56a5, 0.6); // 깊은 파랑색
  shockwave.zIndex = 6;

  shockwave.drawCircle(0, 0, 1);
  shockwave.endFill();
  shockwave.x = x;
  shockwave.y = y;
  world.addChild(shockwave);

  let radius = 1;
  const maxRadius = 60;
  const expandSpeed = 4;

  const waveTicker = new PIXI.Ticker();
  waveTicker.add(() => {
    radius += expandSpeed;
    shockwave.clear();
    const alpha = Math.max(0, 0.6 * (1 - radius / (maxRadius * 1.5)));
    shockwave.beginFill(0x2a56a5, alpha);
    shockwave.drawCircle(0, 0, radius);
    shockwave.endFill();

    if (radius >= maxRadius) {
      waveTicker.stop();
      waveTicker.destroy();
      world.removeChild(shockwave);
    }
  });

  waveTicker.start();
}



function createFinalFistShockwave(x, y, damage) {
  const shockwave = new PIXI.Graphics();
  shockwave.beginFill(0xffff00, 0.6);
  shockwave.drawCircle(0, 0, 1);
  shockwave.endFill();
  shockwave.x = x;
  shockwave.y = y;
  world.addChild(shockwave);

  let radius = 1;
  const maxRadius = 140;
  const expandSpeed = 5;

  const waveTicker = new PIXI.Ticker();
  waveTicker.add(() => {
    radius += expandSpeed;
    shockwave.clear();
    const alpha = Math.max(0, 0.6 * (1 - radius / (maxRadius * 1.5)));
    shockwave.beginFill(0xffff00, alpha);
    shockwave.drawCircle(0, 0, radius);
    shockwave.endFill();

    // ✅ 반지름 절반 도달 시 한 번만 피해 적용
    if (radius >= maxRadius * 0.5 && !shockwave.hitDone) {
      shockwave.hitDone = true;
      //console.log("[파이널 피스트] 피해 시도 시작!");

      createFinalFistWave(x, y);



      for (const enemy of enemies) {
        const dx = shockwave.x - enemy.x;
        const dy = shockwave.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius) {
          //console.log("적 타격 성공!", enemy, "피해량:", damage);
          enemy.currentHP -= 1;

if (enemy.currentHP <= 0) {
  if (enemy.hpBar) world.removeChild(enemy.hpBar);
  createDeathEffect(enemy);
  enemies.splice(enemies.indexOf(enemy), 1);
  totalMonstersKilled++;
  score++; // Add score increment
} else if (enemy.hpBar instanceof PIXI.Graphics) {
  const hpRatio = Math.max(0, enemy.currentHP / enemy.maxHP);
  enemy.hpBar.clear();
  enemy.hpBar.beginFill(0xff0000);
  enemy.hpBar.drawRect(0, 0, 30 * hpRatio, 4);
  enemy.hpBar.endFill();
  enemy.hpBar.x = enemy.x - 15;
  enemy.hpBar.y = enemy.y - 40;
}

        }
      }
    }

    if (radius >= maxRadius) {
      waveTicker.stop();
      waveTicker.destroy();
      world.removeChild(shockwave);
    }
  });

  waveTicker.start();
}






function rebuildVisibleTiles() {
  for (const tile of visibleTiles) {
    tileContainer.removeChild(tile.sprite);
  }
  visibleTiles.length = 0;

  //TILE_VIEW_SIZE_X = Math.ceil(window.innerWidth / scaledTileSize);
  //TILE_VIEW_SIZE_Y = Math.ceil(window.innerHeight / scaledTileSize);

  // 🔥 넉넉하게 2배로 만들어서 부족함 없게
  const totalX = TILE_VIEW_SIZE_X + TILE_UPDATE_PADDING * 2;
  const totalY = TILE_VIEW_SIZE_Y + TILE_UPDATE_PADDING * 2;

  for (let y = 0; y < totalY; y++) {
    for (let x = 0; x < totalX; x++) {
      const sprite = new PIXI.Sprite();
      sprite.scale.set(tileScale);
      tileContainer.addChild(sprite);
      visibleTiles.push({ sprite, tx: -1, ty: -1 });
    }
  }

  //console.log(`✅ 타일 ${visibleTiles.length}개 생성 완료 (${totalX}x${totalY})`);
}



function resizeApp() {
  app.renderer.resize(window.innerWidth, window.innerHeight);
  app.view.style.width = '100vw';
  app.view.style.height = '100vh';

  rebuildVisibleTiles(); // 화면 크기에 맞춰 타일 재구성
}




document.addEventListener('fullscreenchange', resizeApp);

function rebuildVisibleTiles() {
  // 기존 타일 제거
  for (const tile of visibleTiles) {
    tileContainer.removeChild(tile.sprite);
  }
  visibleTiles.length = 0;

  // 현재 화면 크기로 다시 계산
  //TILE_VIEW_SIZE_X = Math.ceil(window.innerWidth / scaledTileSize);
  //TILE_VIEW_SIZE_Y = Math.ceil(window.innerHeight / scaledTileSize);

  const totalX = TILE_VIEW_SIZE_X + TILE_UPDATE_PADDING * 2;
  const totalY = TILE_VIEW_SIZE_Y + TILE_UPDATE_PADDING * 2;

  for (let y = 0; y < totalY; y++) {
    for (let x = 0; x < totalX; x++) {
      const sprite = new PIXI.Sprite();
      sprite.scale.set(tileScale);
      tileContainer.addChild(sprite);
      visibleTiles.push({ sprite, tx: -1, ty: -1 });
    }
  }
}





function showSkillSelectCards() {
  checkEvolveSkills(); // 🔥 카드 선택 진입 직전에 진화 조건 재확인

  let cardUI = [];

  isGamePaused = true;

  // 진화 스킬과 그 기본 스킬을 필터링
  const filteredSkills = availableSkills.filter(skill => {
    // 진화 스킬인지 확인
    const isEvolutionSkill = evolutionSkillConditions.some(evo => evo.name === skill.name);
    
    // 기본 스킬이 이미 진화되었는지 확인
    const isBaseOfEvolved = evolutionSkillConditions.some(evo => 
      evo.base === skill.name && selectedSkills[evo.name]
    );
    
    // 진화 스킬이 아니고, 진화된 기본 스킬도 아닌 경우만 선택
    return !isEvolutionSkill && !isBaseOfEvolved;
  });

  const shuffled = [...filteredSkills].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(3, shuffled.length));

  for (let i = 0; i < selected.length; i++) {
    const skillName = selected[i].name;
    const card = new PIXI.Text(skillName, {
      fontFamily: 'Arial',
      fontSize: 28,
      fill: 'lightgreen',
      stroke: 'black',
      strokeThickness: 4
    });

    card.skillName = skillName;
    card.interactive = true;
    card.buttonMode = true;
    card.anchor.set(0.5);
    card.x = app.screen.width / 2 + (i - 1) * 200;
    card.y = app.screen.height / 2;

    card.zIndex = 9999;
    app.stage.addChild(card);
    app.stage.sortChildren();

    card.on('pointerdown', () => {
      selectedSkills[skillName] = 1;
      const skillObj = availableSkills.find(s => s.name === skillName);
      if (skillObj?.onLearn) skillObj.onLearn();
      skillSelected = true;
      cardUI.forEach(c => app.stage.removeChild(c));
      isGamePaused = false; // 카드 선택 완료 후 한 번만 게임 재개
    });

    cardUI.push(card);
    levelUpCardUI.push(card);
  }
}



function recalculateTileViewSize() {
  TILE_VIEW_SIZE_X = Math.ceil(window.innerWidth / scaledTileSize);
  TILE_VIEW_SIZE_Y = Math.ceil(window.innerHeight / scaledTileSize);
}

window.addEventListener('resize', () => {
  recalculateTileViewSize();
});



function getFieldOctagonInterval() {
  return 3000; // 3초로 고정
}

function getFieldOctagonRadius() {
  const baseRadius = 250;
  const range = playerStats.skillRange || 0;
  return baseRadius + range * 10;
}


function attackEnemiesInFieldOctagon() {
  const radius = getFieldOctagonRadius();
  const level = selectedSkills["필드 옥타곤"] || 1;
  const damage = 12 + (level - 1) * 6; // 기본 12 + 레벨당 6

  for (const e of enemies) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= radius) {
      const isCrit = Math.random() < playerStats.critChance;
      const actualDamage = isCrit ? Math.floor(damage * playerStats.critDamage) : damage;
      e.currentHP -= actualDamage;

      createDamageText(e.x, e.y - 30, actualDamage, isCrit);
      applyHitEffect(e);

      if (e.currentHP <= 0) {
        if (e.hpBar) world.removeChild(e.hpBar);
// ✅ EXP 오브 생성 로직 추가
const orb = new PIXI.Graphics();
orb.beginFill(0x3399ff);
orb.drawCircle(0, 0, 6);
orb.endFill();
orb.x = e.x;
orb.y = e.y;
orb.expValue = e.behavior === 'fast' ? 5 : 3;
world.addChild(orb);
expOrbs.push(orb);


        createDeathEffect(e);                          // ✅ 자연스러운 연출
        enemies.splice(enemies.indexOf(e), 1);
        totalMonstersKilled++;
        score++; // Add score increment
      }
       else if (e.hpBar instanceof PIXI.Graphics) {
        const hpRatio = Math.max(0, e.currentHP / e.maxHP);
        e.hpBar.clear();
        e.hpBar.beginFill(0xff0000);
        e.hpBar.drawRect(0, 0, 30 * hpRatio, 4);
        e.hpBar.endFill();
        e.hpBar.x = e.x - 15;
        e.hpBar.y = e.y - 40;
        e.hpBar.visible = true;
      }
    }
  }
}

setInterval(() => {
  if (isGameOver || isGamePaused || !selectedSkills["필드 옥타곤"]) return;

  attackEnemiesInFieldOctagon();
}, getFieldOctagonInterval());

const octagonField = new PIXI.Graphics();
world.addChild(octagonField);

app.ticker.add(() => {
  if (!selectedSkills["필드 옥타곤"]) {
    octagonField.clear();
    return;
  }

  const radius = getFieldOctagonRadius();

  octagonField.clear();
  octagonField.lineStyle(3, 0x00ff00, 0.4); // 녹색 테두리
  octagonField.drawCircle(player.x, player.y, radius);
});

availableSkills.push({ name: '필드 옥타곤', type: 'skill' });

availableSkills.push({
  name: "엄청난 윈드브레이크",
  type: "skill",
  onLearn: () => startSuperWindBreakLoop()
});

availableSkills.push({
  name: "압도적인 발톱꺼내기",
  type: "skill",
  
  onLearn: () => {
    performOverwhelmingClaw(); // 이 함수가 반복 루프를 등록합니다.
  }
  
});


function startClawSlashLoop(isEvolved = false) {
  performClawSlash(isEvolved); // 즉시 발동
  setInterval(() => {
    if (isGameOver || isGamePaused || (!hasSkill('발톱 꺼내기') && !hasSkill('압도적인 발톱꺼내기'))) return;
    performClawSlash(isEvolved);
  }, getClawSlashCooldown());
}




function rectsIntersect(a, b) {
  return (
    a.x + a.width > b.x &&
    a.x < b.x + b.width &&
    a.y + a.height > b.y &&
    a.y < b.y + b.height
  );
}


function performClawSlash(isEvolved = false) {
  const skillName = isEvolved ? "압도적인 발톱꺼내기" : "발톱 꺼내기";
  const level = selectedSkills[skillName];
  if (!level) return;

  const damage = playerStats.attackPower * level;

  // 플레이어 방향으로 이펙트 생성 - 위치 계산 수정
  const playerRotation = player.rotation || 0;
  const distance = isEvolved ? 90 : 60; // 진화 버전은 더 멀리
  
  // 플레이어 앞쪽에 이펙트 생성
  const slashX = player.x + Math.cos(playerRotation) * distance;
  const slashY = player.y + Math.sin(playerRotation) * distance;
  
  // 이펙트 회전 - 플레이어 방향에 맞춤
  const rotation = playerRotation + Math.PI / 2;

  // 디버그 로그 추가
  //console.log(`[CLAW] Creating effect at (${Math.round(slashX)}, ${Math.round(slashY)}) with rotation ${Math.round(rotation * 180 / Math.PI)}°`);
  
  createClawEffect(slashX, slashY, rotation, isEvolved);
}

function createClawEffect(x, y, rotation, isEvolved = false) {
  // 타격 범위를 표시하는 컨테이너 생성
  const container = new PIXI.Container();
  container.x = x;
  container.y = y;
  container.rotation = rotation;
  container.zIndex = 9999;

  // 부채꼴 모양의 범위 표시
  const range = new PIXI.Graphics();
  
  const scale = isEvolved ? 2.0 : 1.5; // 진화 버전은 더 크게
    const outerRadius = 80 * scale;
    const innerRadius = 40 * scale;
    const startAngle = -Math.PI / 3;
    const endAngle = Math.PI / 3;
  
  // 부채꼴 모양 그리기 - 반투명한 빨간색으로 변경
  range.beginFill(0xff0000, 0.3); // 빨간색, 30% 투명도
  range.lineStyle(2, 0xff0000, 0.8); // 빨간색 테두리, 80% 투명도
  
  // 중심점에서 시작
  range.moveTo(0, 0);

  // 외부 곡선
    for (let angle = startAngle; angle <= endAngle; angle += 0.05) {
      const px = Math.cos(angle) * outerRadius;
      const py = Math.sin(angle) * outerRadius;
    range.lineTo(px, py);
    }
  
  // 내부 곡선
    for (let angle = endAngle; angle >= startAngle; angle -= 0.05) {
      const px = Math.cos(angle) * innerRadius;
      const py = Math.sin(angle) * innerRadius;
    range.lineTo(px, py);
  }

  range.endFill();
  
  // 컨테이너에 범위 추가
  container.addChild(range);

  // 월드에 추가
  world.addChild(container);
    world.sortChildren();

  const hitEnemies = new Set();
  const skillName = isEvolved ? "압도적인 발톱꺼내기" : "발톱 꺼내기";
  const damage = playerStats.attackPower * (selectedSkills[skillName] || 1);
  const radius = outerRadius;
  
    let tick = 0;
    const tickMax = 16;
  
  const updateEffect = () => {
    // 범위 내 몬스터 타격
    for (const enemy of enemies) {
      if (hitEnemies.has(enemy)) continue;

      const dx = enemy.x - x;
      const dy = enemy.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
  
      // 부채꼴 범위 체크
        const angleToEnemy = Math.atan2(dy, dx);
        const angleDiff = Math.abs((angleToEnemy - rotation + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      const inFanArea = dist <= radius && angleDiff <= Math.PI / 3;

      if (inFanArea) {
        hitEnemies.add(enemy);
          const isCrit = Math.random() < playerStats.critChance;
          const actualDamage = isCrit ? Math.floor(damage * playerStats.critDamage) : damage;
        enemy.currentHP -= actualDamage;
        createDamageText(enemy.x, enemy.y - 30, actualDamage, isCrit);
        applyHitEffect(enemy);
      }
    }
  };

  const ticker = () => {
    updateEffect();
    tick++;
    
    // 이펙트가 사라질 때 천천히 페이드아웃
    if (tick > tickMax * 0.7) {
      container.alpha = Math.max(0, 1 - (tick - tickMax * 0.7) / (tickMax * 0.3));
    }
    
    if (tick < tickMax) {
      app.ticker.add(ticker);
      } else {
      world.removeChild(container);
      }
    };
  
    app.ticker.add(ticker);
  }








  let volcanoLoopStarted = false;

  function startVolcanoLoop() {
    if (volcanoLoopStarted) return;
    volcanoLoopStarted = true;
  
    setTimeout(() => {
      if (!isGameOver) spawnVolcano();
    }, 200); // 카드 선택 종료 후 0.2초 뒤 화산 생성
    
  
    setInterval(() => {
      if (isGameOver || isGamePaused) return;
      spawnVolcano();
    }, 3000);
  }
  


// ✅ 화산 1회 생성 함수
function spawnVolcano() {
  if (isGamePaused || isGameOver) return;

  const isEvolved = selectedSkills["혼돈의 볼케이노"] > 0;
  const level = selectedSkills["어스퀘이크 볼케이노"] || selectedSkills["혼돈의 볼케이노"] || 1;
  
  const volcano = new PIXI.Sprite(PIXI.Texture.from("images/volcano.png"));
  volcano.anchor.set(0.5);
  
  // 혼돈의 볼케이노는 더 넓은 범위에 생성
  const range = isEvolved ? 300 : 150;
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * range;
  
  volcano.x = player.x + Math.cos(angle) * distance;
  volcano.y = player.y + Math.sin(angle) * distance + 60;
  volcano.scale.set(isEvolved ? 0.8 : 0.6);
  volcano.createdAt = Date.now();
  volcano.duration = 10000; // 10초로 고정
  volcano.pausedTime = 0; // 일시정지된 시간을 누적할 변수
  volcano.lastPauseTime = null; // 마지막으로 일시정지된 시간
  world.addChild(volcano);

  // 부드럽게 위로 솟아오르기
  let riseFrame = 0;
  const riseDuration = 60;
  const startY = volcano.y;
  const targetY = volcano.y - 60;

  const riseTicker = () => {
    if (isGamePaused || isGameOver) return;
    
    riseFrame++;
    const t = riseFrame / riseDuration;
    const easedT = 1 - Math.pow(1 - t, 3);
    volcano.y = startY + (targetY - startY) * easedT;

    if (riseFrame >= riseDuration) {
      volcano.y = targetY;
      app.ticker.remove(riseTicker);
    }
  };

  app.ticker.add(riseTicker);

  const fireInterval = Math.max(200, 800 - level * 100);
  const fireTimer = setInterval(() => {
    if (isGamePaused || isGameOver) {
      // 일시정지 시작 시간 기록
      if (!volcano.lastPauseTime) {
        volcano.lastPauseTime = Date.now();
      }
      return;
    }

    // 일시정지가 해제되었을 때
    if (volcano.lastPauseTime) {
      // 일시정지된 시간을 누적
      volcano.pausedTime += Date.now() - volcano.lastPauseTime;
      volcano.lastPauseTime = null;
    }
    
    // 실제 경과 시간 계산 (일시정지 시간 제외)
    const elapsedTime = Date.now() - volcano.createdAt - volcano.pausedTime;
    
    // 10초가 지났는지 확인
    if (elapsedTime >= volcano.duration) {
      clearInterval(fireTimer);
      if (volcano.parent) {
        world.removeChild(volcano);
      }
      const index = activeVolcanoes.indexOf(volcano);
      if (index > -1) {
        activeVolcanoes.splice(index, 1);
      }
      return;
    }

    const fireballCount = isEvolved ? 5 : 3;
    for (let i = 0; i < fireballCount; i++) {
      const fireball = new PIXI.Graphics();
      fireball.beginFill(isEvolved ? 0xff0000 : 0xff6600);
      fireball.drawCircle(0, 0, isEvolved ? 15 : 10);
      fireball.endFill();
      fireball.isVolcanoOrb = true;
      fireball.exploded = false;
    
      fireball.x = volcano.x;
      fireball.y = volcano.y;
      world.addChild(fireball);
    
      const angle = Math.random() * Math.PI * 2;
      const radius = (50 + Math.random() * 100) * (isEvolved ? 1.5 : 1);
      const targetX = volcano.x + Math.cos(angle) * radius;
      const targetY = volcano.y + Math.sin(angle) * radius;
    
      let t = 0;
      const speed = isEvolved ? 0.04 : 0.03;
      const start = { x: fireball.x, y: fireball.y };
      const end = { x: targetX, y: targetY };
    
      const fireballTicker = () => {
        if (isGamePaused || isGameOver) return;
        
        t += speed;
        if (t >= 1) {
          createExplosion(fireball.x, fireball.y);
    
          // 폭발 판정
          for (const e of [...enemies, ...fastEnemies, ...shooters]) {
            if (!e || !e.currentHP) continue;

            const dx = fireball.x - e.x;
            const dy = fireball.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const explosionRadius = isEvolved ? 100 : 80;
            
            if (dist < explosionRadius) {
              const baseDamage = isEvolved ? 
                (playerStats.maxHP * 0.25 + 10) : 
                (playerStats.maxHP * 0.2 + 5);
              const damage = Math.floor(baseDamage * (1 + (level - 1) * 0.2));
              
              const isCrit = Math.random() < playerStats.critChance;
              const finalDamage = isCrit ? Math.floor(damage * playerStats.critDamage) : damage;
              
              e.currentHP -= finalDamage;
              createDamageText(e.x, e.y, finalDamage, isCrit);
              applyHitEffect(e);
    
              if (e.currentHP <= 0) {
                handleEnemyDeath(e);
              } else if (e.hpBar instanceof PIXI.Graphics) {
                const hpRatio = Math.max(0, e.currentHP / e.maxHP);
                e.hpBar.clear();
                e.hpBar.beginFill(0xff0000);
                e.hpBar.drawRect(0, 0, 30 * hpRatio, 4);
                e.hpBar.endFill();
                e.hpBar.x = e.x - 15;
                e.hpBar.y = e.y - 40;
                e.hpBar.visible = true;
              }
            }
          }
    
          world.removeChild(fireball);
          app.ticker.remove(fireballTicker);
          return;
        }
    
        const interpX = start.x + (end.x - start.x) * t;
        const interpY = start.y + (end.y - start.y) * t - 80 * Math.sin(Math.PI * t);
        fireball.x = interpX;
        fireball.y = interpY;
      };
    
      app.ticker.add(fireballTicker);
    }
  }, fireInterval);

  // 타이머와 화산 객체를 함께 저장
  volcano.fireTimer = fireTimer;
  activeVolcanoes.push(volcano);
}




// 좌표 기반 난수로 고정된 랜덤 타일 생성
function getRandomTileIndex(x, y) {
  const seed = (x * 73856093 ^ y * 19349663) >>> 0;
  return seed % 9;
  if (hash < 0.35) return 0;
  else if (hash < 0.5) return 8;
  else if (hash < 0.65) return 2;
  else if (hash < 0.75) return 7;
  else if (hash < 0.82) return 1;
  else if (hash < 0.89) return 3;
  else if (hash < 0.95) return 4;
  else if (hash < 0.985) return 6;
  else return 5;
}


function startChainPierceLoop() {
  spawnChainPierce(); // ✅ 즉시 한 번 발사

  setInterval(() => {
    if (isGameOver || isGamePaused) return;
    if (!selectedSkills["체인 피어스"]) return;

    spawnChainPierce();
  }, getChainPierceInterval());
}


function spawnChainPierce() {
  const level = selectedSkills["체인 피어스"];
  if (!level) return;

  // 레벨별 데미지 설정
  const baseDamage = level === 1 ? 10 :
                    level === 2 ? 12 :
                    level === 3 ? 15 :
                    level === 4 ? 17 : 20;
  
  const speed = 8 + playerStats.bulletSpeed; // 기본 속도에 플레이어 보정

  const createSpear = (angle, offsetY) => {
    // ✅ 방향별 이미지 분기
    const textureName = offsetY < 0 ? 'images/chainpierce_up.png' : 'images/chainpierce_down.png';
    const spear = PIXI.Sprite.from(textureName);
  
    spear.anchor.set(0.5);
    spear.scale.set(0.4);
    spear.x = player.x;
    spear.y = player.y + offsetY;
    spear.rotation = angle;
  
    spear.vx = 0;
    spear.vy = offsetY > 0 ? speed : -speed;
    spear.isChainPierce = true;
    spear.piercing = true;
    spear.hitEnemies = new Set();
    spear.damage = baseDamage;
  
    world.addChild(spear);
    bullets.push(spear);
  };
  
  
  
  
  

  // 위쪽 창 (위로 발사)
  createSpear(-Math.PI / 2, -30);
  // 아래쪽 창 (아래로 발사)
  createSpear(Math.PI / 2, 30);
}

function getChainPierceInterval() {
  const level = selectedSkills["체인 피어스"];
  if (!level) return 9999; // 배우지 않았으면 발사 안 함
  return 1000; // 1초마다 발사
}






// ✅ 벽 생성 함수 및 배치
function createWallTile(x, y) {
  const tile = PIXI.Sprite.from('images/wall.png');
  tile.x = x;
  tile.y = y;
  tile.scale.set(wallScale);
  world.addChild(tile);
}

for (let x = 0; x < MAP_WIDTH; x += wallSize) {
  createWallTile(x, 0);
  createWallTile(x, MAP_HEIGHT - wallSize);
}
for (let y = wallSize; y < MAP_HEIGHT - wallSize; y += wallSize) {
  createWallTile(0, y);
  createWallTile(MAP_WIDTH - wallSize, y);
}

// ✅ 플레이어 생성
const heroTextures = [
  PIXI.Texture.from('images/hero_walk1.png'),
  PIXI.Texture.from('images/hero_walk2.png'),
];

let isMoving = false;





const player = new PIXI.AnimatedSprite(heroTextures);
player.animationSpeed = 0.1; // 느린 걷기 모션
player.play();

player.zIndex = 4;
player.shakeTimer = 0;
player.anchor.set(0.6, 0.5);
player.x = MAP_WIDTH / 2;
player.y = MAP_HEIGHT / 2;
player.scale.set(0.25);
world.addChild(player);

// ✅ 플레이어 HP 바 (캐릭터 하단에 따라다님)
playerHpBarBg = new PIXI.Graphics();
playerHpBarBg.beginFill(0x000000);
playerHpBarBg.drawRect(0, 0, 60, 10); // 배경: 검정
playerHpBarBg.endFill();
world.addChild(playerHpBarBg);

playerHpBar = new PIXI.Graphics();
playerHpBar.beginFill(0xffff00);
playerHpBar.drawRect(0, 0, 60, 10); // 채움: 노랑
playerHpBar.endFill();
world.addChild(playerHpBar);

// 초기 위치 & 크기 수동 설정 (1프레임 동안만 보이게 하기 위해)
playerHpBarBg.x = player.x - 20;
playerHpBarBg.y = player.y + player.height / 2 + 10;
playerHpBar.x = playerHpBarBg.x;
playerHpBar.y = playerHpBarBg.y;



let isGameOver = false;
let score = 0;






let invincible = false;
let invincibleTimer = 0;
const INVINCIBLE_DURATION = 20;
let elapsedTime = 0;
// ✅ 몬스터 스폰 간격 설정 (전역 상수)
const INITIAL_SPAWN_INTERVAL = 2500;      // 몬스터 등장 간격 (ms)
const SPAWN_INTERVAL_REDUCE_EVERY = 10;    // 몇 초마다 웨이브 증가 (초)
const SPAWN_INTERVAL_REDUCTION = 0;     // 간격이 줄어드는 정도 (ms)
const MIN_SPAWN_INTERVAL = 2500;           // 줄어들 수 있는 최소 간격 (ms)
//let spawnInterval = INITIAL_SPAWN_INTERVAL;
const BASE_SPAWN_INTERVAL = 2500;
//const MIN_SPAWN_INTERVAL = 300;
const SPAWN_INTERVAL_DECAY = 0;
let spawnInterval = BASE_SPAWN_INTERVAL;
let lastSpawnTime = 0;

const timerText = new PIXI.Text('Time: 0s', {
  fontFamily: 'Arial', fontSize: 24, fill: 'white'
});
timerText.x = 10;
timerText.y = 50;  // 10에서 50으로 수정
app.stage.addChild(timerText);


let playerLevel = 1;
let playerEXP = 0;
let nextEXP = 10;
let isGamePaused = false;

const levelText = new PIXI.Text(`LV: ${playerLevel}`, {
  fontFamily: 'Arial', fontSize: 24, fill: 'white'
});
levelText.x = 10;
levelText.y = 70;
app.stage.addChild(levelText);

const expText = new PIXI.Text(`EXP: ${playerEXP} / ${nextEXP}`, {
  fontFamily: 'Arial', fontSize: 24, fill: 'white'
});
expText.x = 10;
expText.y = 100;
app.stage.addChild(expText);

const skillOptions = [
  {
    name: "공격력",
    effect: () => {
      if (!playerStats["공격력_level"]) playerStats["공격력_level"] = 0;
      playerStats["공격력_level"]++;
      const level = playerStats["공격력_level"];
      const increase = Math.floor(playerStats.attackPower * 0.1);
      playerStats.attackPower += increase;
    }
  },
  {
    name: "공격 속도",
    effect: () => {
      if (!playerStats["공격 속도_level"]) playerStats["공격 속도_level"] = 0;
      playerStats["공격 속도_level"]++;
      playerStats.bulletSpeed += 2;
    }
  },
  {
    name: "이동 속도",
    effect: () => {
      if (!playerStats["이동 속도_level"]) playerStats["이동 속도_level"] = 0;
      playerStats["이동 속도_level"]++;
      playerStats.moveSpeed += 1;
    }
  },
  {
    name: "최대 체력",
    effect: () => {
      if (!playerStats["최대 체력_level"]) playerStats["최대 체력_level"] = 0;
      playerStats["최대 체력_level"]++;
      playerStats.maxHP += 10;
      playerStats.currentHP += 10;
    }
  },
  {
    name: "치명타 확률",
    effect: () => {
      if (!playerStats["치명타 확률_level"]) playerStats["치명타 확률_level"] = 0;
      playerStats["치명타 확률_level"]++;
      playerStats.critChance = Math.min(1, playerStats.critChance + 0.1);
    }
  },
  {
    name: "자력 범위",
    effect: () => {
      if (!playerStats["자력 범위_level"]) playerStats["자력 범위_level"] = 0;
      playerStats["자력 범위_level"]++;
      playerStats.magnetRadius += 20;
    }
  },
  {
    name: "체력 회복",
    effect: () => {
      if (!playerStats["체력 회복_level"]) playerStats["체력 회복_level"] = 0;
      playerStats["체력 회복_level"]++;
      playerStats.regenStat += 2;
    }
  },
  {
    name: "스킬 범위",
    effect: () => {
      if (!playerStats["스킬 범위_level"]) playerStats["스킬 범위_level"] = 0;
      playerStats["스킬 범위_level"]++;
      const level = playerStats["스킬 범위_level"];
      const increase = Math.floor(playerStats.skillRange * 0.2);
      playerStats.skillRange += increase;
    }
  },
  {
    name: "투사체 개수",
    effect: () => {
      if (!playerStats["투사체 개수_level"]) playerStats["투사체 개수_level"] = 0;
      playerStats["투사체 개수_level"]++;
      playerStats.projectileCount += 1;
    }
  },
  {
    name: "스킬 쿨타임",
    effect: () => {
      if (!playerStats["스킬 쿨타임_level"]) playerStats["스킬 쿨타임_level"] = 0;
      playerStats["스킬 쿨타임_level"]++;
      const level = playerStats["스킬 쿨타임_level"];
      playerStats.cooldownReduction = 0.1 * level;
    }
  }
];


function getChainPierceInterval() {
  const level = selectedSkills["체인 피어스"];
  if (!level) return 9999; // 아직 안 배운 경우 매우 긴 딜레이

  const base = 1500; // 기본 간격(ms)
  const aspd = playerStats.bulletSpeed || 0;
  const interval = base - aspd * 30 * level; // 공격속도 x 계수

  return Math.max(400, interval); // 최소 400ms 보장
}

function showLevelUpCards() {
  isGamePaused = true;
  checkEvolveSkills(); // 진화 조건 최신화

  const isEven = playerLevel % 2 === 0;
  const forceSkillCard = evolutionSkillPendingList.length > 0;

  const selectCards = (pool, label = '카드', isStat = false) => {
    // 스탯 카드인 경우 필터링 로직 건너뛰기
    const filteredPool = isStat ? pool : pool.filter(skill => {
      // 진화 스킬인지 확인
      const isEvolutionSkill = evolutionSkillConditions.some(evo => evo.name === skill.name);
      
      // 기본 스킬이 이미 진화되었는지 확인
      const isBaseOfEvolved = evolutionSkillConditions.some(evo => 
        evo.base === skill.name && (selectedSkills[evo.name] || evolutionSkillPendingList.includes(evo.name))
      );
      
      // 진화 스킬이 아니고, 진화된 기본 스킬도 아닌 경우만 선택
      return !isEvolutionSkill && !isBaseOfEvolved;
    });

    const chosen = [];
    const usedNames = new Set();

    while (chosen.length < 3 && filteredPool.length > 0) {
      const randIndex = Math.floor(Math.random() * filteredPool.length);
      const candidate = filteredPool.splice(randIndex, 1)[0];
      if (!usedNames.has(candidate.name)) {
        usedNames.add(candidate.name);
        chosen.push(candidate);
      }
    }

    // 진화 카드는 스킬 카드일 때만 처리
    if (!isStat && evolutionSkillPendingList.length > 0) {
      const pendingEvos = evolutionSkillPendingList.filter(evo => !selectedSkills[evo]);
      if (pendingEvos.length > 0) {
        const evoName = pendingEvos[Math.floor(Math.random() * pendingEvos.length)];
        const evoData = availableSkills.find(s => s.name === evoName);
        if (evoData) {
          chosen.push({
            name: evoName,
            effect: function() {
              selectedSkills[evoName] = 1;
              const evoMeta = evolutionSkillConditions.find(e => e.name === evoName);
              if (evoMeta) delete selectedSkills[evoMeta.base];
              evolutionSkillPendingList = evolutionSkillPendingList.filter(n => n !== evoName);
              if (evoData.onLearn) evoData.onLearn();
              console.log(`🔥 진화 스킬 습득됨: ${evoName}`);
              isGamePaused = false;
            }
          });
        }
      }
    }

    // 카드 UI 생성
    const cardUI = [];
    for (let i = 0; i < chosen.length; i++) {
      const card = new PIXI.Text(chosen[i].name, {
        fontFamily: 'Arial',
        fontSize: 28,
        fill: 'yellow',
        stroke: 'black',
        strokeThickness: 4
      });

      card.interactive = true;
      card.buttonMode = true;
      card.anchor.set(0.5);
      const totalCards = chosen.length;
      const spacing = totalCards === 4 ? 180 : 200;
      card.x = app.screen.width / 2 + (i - (totalCards - 1) / 2) * spacing;
      card.y = app.screen.height / 2;

      card.on('pointerdown', () => {
        chosen[i].effect();
        cardUI.forEach(c => app.stage.removeChild(c));
        checkEvolveSkills();
        updateLevelText(); // 치트 UI 레벨 텍스트 업데이트
        isGamePaused = false;
      });

      card.zIndex = 9999;
      app.stage.addChild(card);
      app.stage.sortChildren();
      cardUI.push(card);
    }

    return chosen;
  };

  const skillPool = availableSkills.filter(skill => {
    const level = selectedSkills[skill.name] || 0;
    // 이미 5레벨인 스킬은 제외
    if (level >= 5) return false;
    // 진화 스킬인지 확인
    const isEvolutionSkill = evolutionSkillConditions.some(evo => evo.name === skill.name);
    if (isEvolutionSkill) return false;
    // 이미 진화된 기본 스킬인지 확인
    const isBaseOfEvolved = evolutionSkillConditions.some(evo => 
      evo.base === skill.name && (selectedSkills[evo.name] || evolutionSkillPendingList.includes(evo.name))
    );
    return !isBaseOfEvolved;
  }).map(skill => ({
    name: skill.name,
    effect: () => {
      if (selectedSkills[skill.name]) {
        selectedSkills[skill.name]++;
      } else {
        selectedSkills[skill.name] = 1;
        if (skill.onLearn) skill.onLearn();
      }
      isGamePaused = false;
    }
  }));

  const statPool = [
    { name: '공격력', effect: () => { 
      playerStats.attackPower += 1; 
      playerStats['공격력_level'] = (playerStats['공격력_level'] || 0) + 1;
      updateLevelText();
      isGamePaused = false;
    }},
    {
      name: '자력 범위', effect: () => {
        playerStats.magnetRadius = (playerStats.magnetRadius || 100) + 20;
        playerStats['자력 범위_level'] = (playerStats['자력 범위_level'] || 0) + 1;
        updateLevelText();
        isGamePaused = false;
      }
    },
    {
      name: '최대 체력', effect: () => {
        playerStats.maxHP += 10;
        playerStats.currentHP += 10;
        playerStats['최대 체력_level'] = (playerStats['최대 체력_level'] || 0) + 1;
        updateLevelText();
        isGamePaused = false;
      }
    },
    {
      name: '투사체 개수', effect: () => {
        playerStats.projectileCount = (playerStats.projectileCount || 1) + 1;
        playerStats['투사체 개수_level'] = (playerStats['투사체 개수_level'] || 0) + 1;
        updateLevelText();
        isGamePaused = false;
      }
    },
    {
      name: '스킬 범위', effect: () => {
        playerStats.skillRange = (playerStats.skillRange || 1) * 1.2;
        playerStats['스킬 범위_level'] = (playerStats['스킬 범위_level'] || 0) + 1;
        updateLevelText();
        isGamePaused = false;
      }
    },
    {
      name: '스킬 쿨타임', effect: () => {
        playerStats.cooldownMultiplier = (playerStats.cooldownMultiplier || 1) * 0.9;
        playerStats['스킬 쿨타임_level'] = (playerStats['스킬 쿨타임_level'] || 0) + 1;
        updateLevelText();
        isGamePaused = false;
      }
    },
    
    { name: '치명타 확률', effect: () => { 
      playerStats.critChance = Math.min(1, playerStats.critChance + 0.05);
      playerStats['치명타 확률_level'] = (playerStats['치명타 확률_level'] || 0) + 1;
      updateLevelText();
      isGamePaused = false;
    }},
    { name: '공격 속도', effect: () => { 
      playerStats.bulletSpeed += 2;
      playerStats['공격 속도_level'] = (playerStats['공격 속도_level'] || 0) + 1;
      updateLevelText();
      isGamePaused = false;
    }},
    { name: '이동 속도', effect: () => { 
      playerStats.moveSpeed += 1;
      playerStats['이동 속도_level'] = (playerStats['이동 속도_level'] || 0) + 1;
      updateLevelText();
      isGamePaused = false;
    }},
    { name: '체력 회복', effect: () => { 
      playerStats.regenStat += 1;
      playerStats['체력 회복_level'] = (playerStats['체력 회복_level'] || 0) + 1;
      updateLevelText();
      isGamePaused = false;
    }}
  ].filter(stat => {
    // 5레벨 스탯 필터링
    const statName = stat.name + '_level';
    const currentLevel = playerStats[statName] || 0;
    return currentLevel < 5;
  });

  if (!isEven || forceSkillCard) {  // 조건 반전: 홀수 레벨이거나 진화 스킬이 있을 때 스킬 카드
    selectCards(skillPool, '스킬', false);
  } else {  // 짝수 레벨일 때 스탯 카드
    selectCards(statPool, '스탯', true);
  }

  showEvolveCardBelow(); // 진화 카드 별도 표시
}


function showStatList() {
  statListText.text = `📊 스탯 목록\n\n` +
    `공격력: ${playerStats.attackPower}\n` +
    `크리티컬 확률: ${playerStats.critChance}\n` +
    `크리티컬 피해: ${playerStats.critDamage}\n` +
    `공격 속도: ${playerStats.attackSpeed}\n` +
    `이동 속도: ${playerStats.moveSpeed}\n` +
    `체력 회복: ${playerStats.hpRegen}\n` +
    `스킬 범위: ${playerStats.skillRange}\n` +
    `투사체 개수: ${playerStats.projectileCount}\n` +
    `쿨타임 감소: ${playerStats.skillCooldownReduction}`;
  statListText.visible = true;
}


// 더 이상 필요 없음 - 완전히 제거하세요!
function injectEvolveSkills(pool) {
  for (const evoName of evolutionSkillPendingList) {
    if (!selectedSkills[evoName]) {
      const evoData = availableSkills.find(s => s.name === evoName);
      if (evoData) {
        pool.unshift({
          name: evoName,
          effect: () => {
            selectedSkills[evoName] = 1;
            const evoMeta = evolutionSkillConditions.find(e => e.name === evoName);
            if (evoMeta) delete selectedSkills[evoMeta.base];
            evolutionSkillPendingList = evolutionSkillPendingList.filter(n => n !== evoName);
            if (evoData.onLearn) evoData.onLearn();
            console.log(`🔥 진화 스킬 습득됨: ${evoName}`);
          }
        });
      }
    }
  }
}





function gainEXP(amount) {
  playerEXP += amount;

  while (playerEXP >= nextEXP && playerLevel < 30) {
    playerEXP -= nextEXP;
    playerLevel++;
    nextEXP = Math.floor(nextEXP * 1.5);

    checkEvolveSkills(); // ✅ 진화 조건 매번 체크하도록 추가
    showLevelUpCards();
  }
}




// ✅ UI
const hpText = new PIXI.Text(`HP: ${playerStats.currentHP} / ${playerStats.maxHP}`, {
  fontFamily: 'Arial', fontSize: 24, fill: 'white'
});
hpText.x = 10;
hpText.y = 10;
//app.stage.addChild(hpText);

const scoreText = new PIXI.Text(`Score: ${score}`, {
  fontFamily: 'Arial', fontSize: 24, fill: 'white'
});
scoreText.x = 10;
scoreText.y = 80;  // 40에서 80으로 수정
app.stage.addChild(scoreText);

const restartButton = new PIXI.Text('RESTART', {
  fontFamily: 'Arial', fontSize: 36, fill: 'white'
});
restartButton.interactive = true;
restartButton.buttonMode = true;
restartButton.anchor.set(0.5);
restartButton.x = app.screen.width / 2;
restartButton.y = app.screen.height / 2 + 80;
restartButton.visible = false;
app.stage.addChild(restartButton);

restartButton.on('pointerdown', () => {
  resetGame();
  location.reload();
});




const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if (keys.hasOwnProperty(key)) keys[key] = true;
});
window.addEventListener('keyup', e => {
  const key = e.key.toLowerCase();
  if (keys.hasOwnProperty(key)) keys[key] = false;
});

let mouseX = player.x;
let mouseY = player.y;

if (isMobile) {
  const joystick = nipplejs.create({
    zone: document.getElementById('joystick-zone'), // 이게 null이면 오류!
    mode: 'static',
    position: { left: '60px', bottom: '60px' },
    color: 'white'
  });

  joystick.on('move', (evt, data) => {
    if (data && data.vector) {
      joystickDir.x = data.vector.x;
      joystickDir.y = data.vector.y;
    }
  });

  joystick.on('end', () => {
    joystickDir.x = 0;
    joystickDir.y = 0;
  });
}


window.addEventListener('mousemove', e => {
  const rect = app.view.getBoundingClientRect();
  mouseX = e.clientX - rect.left + world.pivot.x - app.screen.width / 2;
  mouseY = e.clientY - rect.top + world.pivot.y - app.screen.height / 2;
});

const enemies = [];


const bullets = [];

setInterval(() => {
  if (playerStats.currentHP < playerStats.maxHP && playerStats.regenStat > 0) {
    playerStats.currentHP = Math.min(
      playerStats.currentHP + playerStats.regenStat,
      playerStats.maxHP
    );
  }
}, 5000); // 5초마다 실행

setInterval(() => {
  if (isGameOver || isGamePaused) return;
  if (!selectedSkills["체인 피어스"]) return;
  spawnChainPierce();
}, getChainPierceInterval());

setInterval(() => {
  if (isGameOver || isGamePaused) return;
  if (!selectedSkills["체인 피어스"]) return;
  spawnChainPierce();
}, getChainPierceInterval());



setInterval(() => {
  if (isGameOver || isGamePaused || !PLAYER_SHOOT_ENABLED) return;
  if (!selectedSkills['윈드 브레이크']) return;

  spawnWindBreakProjectile(); // ✅ 다중 발사로 교체
}, 1000);  // 3초에서 1초로 변경



setInterval(() => {                              // 데스 그라인더 선언 부
  if (isGameOver || isGamePaused || !PLAYER_SHOOT_ENABLED) return;
  if (!selectedSkills['데스 그라인더']) return;

  const grinder = PIXI.Sprite.from('images/death_grinder.png');
  grinder.zIndex = 5;

  grinder.anchor.set(0.5);
  grinder.scale.set(0.15);
  grinder.x = player.x;
  grinder.y = player.y;

  const dx = player.x - mouseX;
  const dy = player.y - mouseY;
  const len = Math.sqrt(dx * dx + dy * dy);
  grinder.vx = (dx / len) * playerStats.moveSpeed * 2.5;
  grinder.vy = (dy / len) * playerStats.moveSpeed * 2.5;
  grinder.rotation = Math.atan2(dy, dx);

  grinder.isEnemy = false;
  grinder.isGrinder = true;
  grinder.hitEnemies = new Set();
  grinder.level = selectedSkills['데스 그라인더']; // 1~5
  
  // 레벨에 따른 데미지 계산
  const damage = grinder.level === 1 ? 20 : 20 + (grinder.level - 1) * 10;
  grinder.damage = damage;

  world.addChild(grinder);
  grinder.bounced = false;
  bullets.push(grinder);
}, 2000);  // 2초로 고정

// getGrinderInterval 함수는 더 이상 사용하지 않으므로 제거
// ... existing code ...







const gameOverText = new PIXI.Text('GAME OVER', {
  fontFamily: 'Arial', fontSize: 64, fill: 'red', align: 'center'
});
gameOverText.anchor.set(0.5);
gameOverText.x = world.position.x;
gameOverText.y = world.position.y - 40;

resizeApp(); // ← 최초 실행 시 1회 강제 적용
window.addEventListener('resize', resizeApp);
document.addEventListener('fullscreenchange', resizeApp);

showMainMenu(); // ← 메인 화면 진입

// ✅ 메인 루프 최적 구조 통합
app.ticker.add(gameLoop);

setTimeout(() => {
  
  // ✅ EXP 바 배경
    const expBarBg = new PIXI.Graphics();
    expBarBg.beginFill(0x000000);
    expBarBg.lineStyle(2, 0xffff66); // 노란 테두리
    expBarBg.drawRect(0, 0, 400, 20);
    expBarBg.endFill();
    expBarBg.x = (app.screen.width - 400) / 2;  // 중앙 정렬
    expBarBg.y = app.screen.height - 40;        // 하단 40px 위

    app.stage.addChild(expBarBg);

    // ✅ EXP 채우는 바
    expBarFill = new PIXI.Graphics();
    expBarFill.beginFill(0x3366ff);
    expBarFill.drawRect(0, 0, 0, 20); // 처음엔 0으로 시작
    expBarFill.endFill();
    expBarFill.x = expBarBg.x;
    expBarFill.y = expBarBg.y;
    app.stage.addChild(expBarFill);

   // ✅ 레벨 텍스트 (EXP 바 안쪽, 오른쪽 정렬)
  levelDisplay = new PIXI.Text(`LV ${playerLevel}`, {
  fontFamily: 'Arial',
  fontSize: 16,
  fill: 'white',
  stroke: 'black',
  strokeThickness: 2
});
levelDisplay.anchor.set(1, 0.5); // 오른쪽 정렬 + 수직 중앙 정렬
levelDisplay.x = expBarBg.x + 396; // 오른쪽 끝에서 4px 여백
levelDisplay.y = expBarBg.y + 10;  // 바의 수직 중앙 (20px 높이의 절반)
app.stage.addChild(levelDisplay);





   // ✅ 기존 레벨/EXP 텍스트 제거
   if (levelText && levelText.parent) app.stage.removeChild(levelText);
   if (expText && expText.parent) app.stage.removeChild(expText);
 
  
  isGamePaused = true;
  
}, 100); // 100ms 후 카드 선택 표시







function updateBossWarning() {
  if (bossWarningTimer > 0) {
    bossWarningTimer--;
    
    // 느낌표 깜빡임 효과
    if (bossWarningMark) {
      bossWarningMark.alpha = Math.sin(bossWarningTimer * 0.2) * 0.5 + 0.5;
    }

    // 경고 시간이 끝나면
    if (bossWarningTimer <= 0) {
      isBossWarningActive = false;

      // 경고 UI 제거
      if (bossWarningText && bossWarningText.parent) {
        app.stage.removeChild(bossWarningText);
        bossWarningText = null;
      }

      // 보스 소환
      if (bossQueue.length > 0) {
        const nextBoss = bossQueue.shift();
        const spawnX = bossWarningMark?.x ?? player.x + 600;
        const spawnY = bossWarningMark?.y ?? player.y;

        
        // 느낌표 제거
        if (bossWarningMark && bossWarningMark.parent) {
          world.removeChild(bossWarningMark);
          bossWarningMark = null;
        }
        
        
        spawnBoss(nextBoss, spawnX, spawnY);

      }
    }
  }
}


let spawnX, spawnY;

if (isHiddenEventTriggered && hiddenSpawnPoint) {
  spawnX = hiddenSpawnPoint.x;
  spawnY = hiddenSpawnPoint.y;
} else {
  spawnX = Math.random() * MAP_WIDTH;
  spawnY = Math.random() * MAP_HEIGHT;
}


function onHiddenButtonClick() {
  isHiddenEventTriggered = true;

  // 여기서 느낌표 위치 지정
  hiddenSpawnPoint = { x: 500, y: 400 };

  const effect = createHiddenEffect(hiddenSpawnPoint.x, hiddenSpawnPoint.y);
  world.addChild(effect);

  // 숨겨진 이벤트로 등장할 적 예고 등 추가
}



function showBossWarning(bossName) {
  // 기존 텍스트/마크 제거
  if (isBossWarningActive) return; // ✅ 중복 호출 방지
  isBossWarningActive = true;

  if (bossWarningText) {
    app.stage.removeChild(bossWarningText);
    bossWarningText = null;
  }
  if (bossWarningMark) {
    world.removeChild(bossWarningMark);
    bossWarningMark = null;
  }

  // ✅ 보스가 출현할 맵 좌표 계산 (플레이어 주변 랜덤 위치)
  const spawnRadius = 600;
  const angle = Math.random() * Math.PI * 2;
  const bossSpawnX = player.x + Math.cos(angle) * spawnRadius;
  const bossSpawnY = player.y + Math.sin(angle) * spawnRadius;

  // ✅ 보스 위치에 느낌표 생성 (월드에 추가됨)
  bossWarningMark = new PIXI.Text('❗', {
    fontFamily: 'Arial',
    fontSize: 80,
    fill: 'red',
    stroke: 'black',
    strokeThickness: 6
  });
  bossWarningMark.anchor.set(0.5);
  bossWarningMark.x = bossSpawnX;
  bossWarningMark.y = bossSpawnY;

  // 👉 나중에 spawnBoss에서 사용하기 위해 위치 기억시킴
  bossWarningMark.spawnX = bossSpawnX;
  bossWarningMark.spawnY = bossSpawnY;

  world.addChild(bossWarningMark);

  // ✅ 중앙 상단에 텍스트 표시 (stage에 고정)
  bossWarningText = new PIXI.Text(`보스 몬스터 [${bossName}]이 곧 출현합니다`, {
    fontFamily: 'Arial',
    fontSize: 28,
    fill: 'yellow',
    stroke: 'black',
    strokeThickness: 4
  });
  bossWarningText.anchor.set(0.5);
  bossWarningText.x = app.screen.width / 2;
  bossWarningText.y = 100;
  app.stage.addChild(bossWarningText);

  // ✅ 타이머 시작 (5초)
  bossWarningTimer = 300; // 60fps 기준으로 약 5초
}




function handleExpOrbs() {
  for (let i = expOrbs.length - 1; i >= 0; i--) {
    const orb = expOrbs[i];
    const dx = player.x - orb.x;
    const dy = player.y - orb.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // ✅ 흡수 범위 내 → EXP 획득
    if (dist < playerStats.pickupRadius) {
      gainEXP(orb.expValue);
      world.removeChild(orb);
      expOrbs.splice(i, 1);
      continue;
    }

    // ✅ 자력 범위 내 → 플레이어 쪽으로 이동
    if (dist < playerStats.magnetRadius) {
      const pullSpeed = magnetRangeBoostActive ? 24 : 8; // 빨려오는 속도 (픽셀/frame)
      const pullX = (dx / dist) * pullSpeed;
      const pullY = (dy / dist) * pullSpeed;
      orb.x += pullX;
      orb.y += pullY;
    }
  }
}


function updateTimer() {
  elapsedTime += app.ticker.deltaMS / 1000;
  timerText.text = `Time: ${Math.floor(elapsedTime)}s`;
}

function spawnEnemiesIfNeeded() {
  // 게임 오버 상태일 때는 몬스터를 생성하지 않음
  if (isGameOver) return;
  
  if (performance.now() - lastSpawnTime < spawnInterval) return;

  const wave = Math.floor(elapsedTime / SPAWN_INTERVAL_REDUCE_EVERY);
  const spawnCount = 1 + wave;

  for (let i = 0; i < spawnCount; i++) spawnEnemy(wave);
  spawnInterval = Math.max(MIN_SPAWN_INTERVAL, INITIAL_SPAWN_INTERVAL - wave * SPAWN_INTERVAL_REDUCTION);
  lastSpawnTime = performance.now();
}

function spawnEnemy(wave) {
  // 게임 오버 상태일 때는 몬스터를 생성하지 않음
  if (isGameOver) return;

  const roll = Math.random();
  let type = 'normal';
  if (roll < PROB_SHOOTER_ENEMY) type = 'shooter';
  else if (roll < PROB_SHOOTER_ENEMY + PROB_FAST_ENEMY) type = 'fast';
  const texture = type === 'shooter' ? 'images/shooter_enemy.png' : (type === 'fast' ? 'images/fast_enemy.png' : 'images/enemy.png');

  // ✅ 플레이어 근처에 생성되도록 수정
  const SPAWN_RADIUS_MIN = 300;
  const SPAWN_RADIUS_MAX = 800;

  let angle = Math.random() * Math.PI * 2;
  let radius = SPAWN_RADIUS_MIN + Math.random() * (SPAWN_RADIUS_MAX - SPAWN_RADIUS_MIN);
  let enemyX = player.x + Math.cos(angle) * radius;
  let enemyY = player.y + Math.sin(angle) * radius;

  // 맵 밖으로 나가지 않도록 보정
  enemyX = Math.max(wallSize, Math.min(MAP_WIDTH - wallSize, enemyX));
  enemyY = Math.max(wallSize, Math.min(MAP_HEIGHT - wallSize, enemyY));

  let enemy;

  if (type === 'fast') {
    const fastTextures = [
      PIXI.Texture.from('images/fast_enemy_walk1.png'),
      PIXI.Texture.from('images/fast_enemy_walk2.png'),
    ];
    enemy = new PIXI.AnimatedSprite(fastTextures);
    enemy.animationSpeed = 0.1;
    enemy.play();
  } else if (type === 'normal') {
    const enemyTextures = [
      PIXI.Texture.from('images/enemy_walk1.png'),
      PIXI.Texture.from('images/enemy_walk2.png'),
    ];
    enemy = new PIXI.AnimatedSprite(enemyTextures);
    enemy.animationSpeed = 0.1;
    enemy.play();
  } else {
    enemy = PIXI.Sprite.from(texture);
  }

  enemy.zIndex = 3;
  enemy.x = enemyX;
  enemy.y = enemyY;
  enemy.anchor.set(0.5);
  enemy.scale.set(0.1);
  enemy.speed = type === 'fast' ? 2 : (type === 'shooter' ? 0.5 : 1);
  enemy.behavior = type;

  enemy.originalScale = { x: enemy.scale.x, y: enemy.scale.y };

  // 몬스터 타입별 체력 설정
  if (enemy.behavior === 'shooter') {
    enemy.maxHP = 35;
    enemy.attackPower = 1;  // 원거리 몬스터
    //enemy.originalScale = { x: 0.1, y: 0.1 }; // 슈터 기본 크기
    enemy.scale.set(enemy.originalScale.x, enemy.originalScale.y);
    enemy.shootCooldown = 0;  // 원거리 몬스터의 발사 쿨다운 초기화
  } else if (enemy.behavior === 'fast') {
    enemy.maxHP = 30;
    enemy.attackPower = 2;  // 돌진형 몬스터
  } else {
    enemy.maxHP = 40;
    enemy.attackPower = 1;  // 일반 몬스터
  }
  enemy.currentHP = enemy.maxHP;

  // HP 바 생성 (한 번만)
  enemy.hpBar = new PIXI.Graphics();
  enemy.hpBar.zIndex = 5;  // HP 바를 몬스터보다 위에 표시
  enemy.hpBar.beginFill(0xff0000);
  enemy.hpBar.drawRect(0, 0, 30, 4.8); // 두께를 4.8로 증가
  enemy.hpBar.endFill();
  enemy.hpBar.x = enemy.x - 15;
  enemy.hpBar.y = enemy.y + 20; // 몬스터 하단으로 위치 변경
  enemy.hpBar.visible = false; // 초기에는 보이지 않음
  enemy.lastHitTime = 0; // 마지막 피격 시간 추가

  world.addChild(enemy);
  world.addChild(enemy.hpBar);
  world.sortChildren();  // zIndex 정렬 적용
  enemies.push(enemy);
}

function movePlayer() {
  if (isGameOver || isGamePaused) {
    if (isMoving) {
      player.gotoAndStop(0);
      isMoving = false;
    }
    return;
  }

  let dx = joystickDir.x;
  let dy = -joystickDir.y;

  if (!dx && !dy) {
    if (keys.w) dy -= 1;
    if (keys.s) dy += 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;
  }

  if (dx || dy) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len; dy /= len;
  }

    player.x += dx * playerStats.moveSpeed;
    player.y += dy * playerStats.moveSpeed;

  // 이동 방향에 따라 플레이어 이미지 방향 변경
    if (Math.abs(dx) > 0.1) {
      player.scale.x = dx > 0 ? -Math.abs(player.scale.x) : Math.abs(player.scale.x);
  }

  // 이동 중일 때 애니메이션 재생
  if ((dx !== 0 || dy !== 0) && !isMoving) {
    player.play();
    isMoving = true;
  } else if (dx === 0 && dy === 0 && isMoving) {
    player.gotoAndStop(0);
    isMoving = false;
  }

  if (selectedSkills["지뢰 설치"]) {
    const dx = player.x - lastMineX;
    const dy = player.y - lastMineY;
    const moveDist = Math.sqrt(dx * dx + dy * dy);
  
    const level = selectedSkills["지뢰 설치"];
    const distanceThreshold = 300; // 300으로 고정
  
    if (moveDist >= distanceThreshold) {
      installMineAt(player.x, player.y);
      lastMineX = player.x;
      lastMineY = player.y;
    }
  }

  player.x = Math.max(wallSize, Math.min(MAP_WIDTH - wallSize, player.x));
  player.y = Math.max(wallSize, Math.min(MAP_HEIGHT - wallSize, player.y));
}




function updateCamera() {
  world.pivot.set(player.x, player.y);
  world.position.set(app.screen.width / 2, app.screen.height / 2);
  world.scale.set(isMobile ? 1.2 : WORLD_SCALE);
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function createDamageText(x, y, amount, isCrit) {
  const dmgText = new PIXI.Text(`${Math.floor(amount)}`, {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: isCrit ? 'red' : 'white',
    stroke: 'black',
    strokeThickness: 3
  });

  dmgText.anchor.set(0.5);
  dmgText.x = x;
  dmgText.y = y;
  dmgText.alpha = 1;

  dmgText.zIndex = 9999; // ✅ 제일 위로
  world.addChild(dmgText);
  world.sortChildren(); // ✅ zIndex 정렬 강제 적용

  let lifetime = 30;
  const tick = () => {
    lifetime--;
    dmgText.y -= 1;
    dmgText.alpha -= 0.03;
    if (lifetime <= 0) {
      app.ticker.remove(tick);
      world.removeChild(dmgText);
    }
  };

  app.ticker.add(tick);
}



function applyHitEffect(enemy) {
  if (!enemy || enemy.behavior === 'boss') return;

  enemy.hitEffectTimer = 12;

  if (!enemy.originalScale) {
    enemy.originalScale = { x: enemy.scale.x, y: enemy.scale.y };
  }
}


function createDeathEffect(sprite) {
  let lifetime = 20; // 약 0.33초 (60fps 기준)

  const tick = () => {
    lifetime--;

    // 점점 작아지고, 투명해짐
    sprite.alpha -= 0.05;
    sprite.scale.x *= 0.9;
    sprite.scale.y *= 0.9;

    if (lifetime <= 0) {
      app.ticker.remove(tick);
      world.removeChild(sprite);
    }
  };

  app.ticker.add(tick);
}

function createExplosion(x, y) {
  const explosion = new PIXI.Graphics();
  explosion.zIndex = 6;

  explosion.beginFill(0xffaa00, 0.8);  // 주황빛 반투명
  explosion.drawCircle(0, 0, 0);       // 반지름 0부터 시작
  explosion.endFill();
  explosion.x = x;
  explosion.y = y;
  world.addChild(explosion);

  let frame = 0;
  const maxFrame = 20;
  const tick = () => {
    frame++;
    const progress = frame / maxFrame;
    explosion.clear();
    explosion.beginFill(0xffaa00, 1 - progress); // 점점 투명
    explosion.drawCircle(0, 0, 40 * progress);   // 점점 커짐
    explosion.endFill();

    if (frame >= maxFrame) {
      app.ticker.remove(tick);
      world.removeChild(explosion);
    }
  };

  app.ticker.add(tick);
}


function updateBossPatterns() {
  if (!currentBoss || !window.BossPatterns[currentBoss.bossType]) return;

  const patternList = window.BossPatterns[currentBoss.bossType].patterns;

  if (!currentBoss.patternCooldowns) {
    currentBoss.patternCooldowns = {};
    patternList.forEach(p => {
      if (p && p.name) {
        currentBoss.patternCooldowns[p.name] = 0;
      }
    });
  }

  const now = Date.now();
  patternList.forEach(p => {
    if (now >= currentBoss.patternCooldowns[p.name]) {
      executeBossPattern(currentBoss, p.name);
      currentBoss.patternCooldowns[p.name] = now + p.cooldown;
    }
  });
}



function moveEnemies() {
  if (!Array.isArray(enemies)) return;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    if (enemy.isBoss && enemy.currentHP > 0) {
      // 보스 이동 로직 (플레이어 쪽으로 이동)
      const bossDx = player.x - enemy.x;
      const bossDy = player.y - enemy.y;
      const bossDist = Math.sqrt(bossDx * bossDx + bossDy * bossDy);
      const bossSpeed = enemy.speed || 1.2;

      if (bossDist > 50) {
        enemy.x += (bossDx / bossDist) * bossSpeed;
        enemy.y += (bossDy / bossDist) * bossSpeed;
      }

      // 보스 패턴 쿨다운 체크 및 실행
      if (!enemy.patternCooldowns) enemy.patternCooldowns = {};

      const now = Date.now();
      const patterns = window.BossPatterns[enemy.bossType]?.patterns || [];

      patterns.forEach(pattern => {
        if (!enemy.patternCooldowns[pattern.name]) enemy.patternCooldowns[pattern.name] = 0;

        if (now >= enemy.patternCooldowns[pattern.name]) {
          executeBossPattern(enemy, pattern.name);
          enemy.patternCooldowns[pattern.name] = now + pattern.cooldown;
        }
      });

      continue; // 보스의 경우 일반 몬스터 로직은 생략
    }

    if (enemy.isBoss && enemy.currentHP <= 0) {
      // 보스 제거 처리
      if (enemy.hpBar) world.removeChild(enemy.hpBar);
      world.removeChild(enemy);
      enemies.splice(i, 1);
    
      // HP 바 UI 제거
      if (bossHpBar) app.stage.removeChild(bossHpBar);
      if (bossHpBarBackground) app.stage.removeChild(bossHpBarBackground);
      if (bossNameText) app.stage.removeChild(bossNameText);
    
      bossHpBar = null;
      bossHpBarBackground = null;
      bossNameText = null;
    
      currentBoss = null;
      isBossActive = false;

      delete enemy.patternCooldowns;

    
      console.log(`[보스 제거됨] ${enemy.bossType}`);
    
      continue; // 다음 enemy 처리
    }
    



    // 노크백 적용
if (enemy.knockback && enemy.knockback.remaining > 0) {
  const pushAmount = Math.min(enemy.knockback.remaining, enemy.knockback.speed);
  enemy.x += enemy.knockback.dx * pushAmount;
  enemy.y += enemy.knockback.dy * pushAmount;
  enemy.knockback.remaining -= pushAmount;

  // 끝났으면 제거
  if (enemy.knockback.remaining <= 0) {
    enemy.knockback = null;
  }

  continue; // 노크백 중엔 이동 로직 스킵
}


    // 일반 몬스터 이동 로직 유지
    if (enemy.behavior === 'shooter') {
      if (enemy.shootCooldown === undefined) enemy.shootCooldown = 0;
      enemy.shootCooldown--;
      
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > SHOOTER_STOP_DISTANCE) {
        enemy.x += (dx / dist) * (enemy.speed || 1);
        enemy.y += (dy / dist) * (enemy.speed || 1);
      }
      
      if (dist <= 400 && enemy.shootCooldown <= 0) {
        spawnEnemyBullet(enemy.x, enemy.y, player.x, player.y);
        enemy.shootCooldown = 120;
      }
    } else if (!enemy.isBoss) {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        enemy.x += (dx / dist) * (enemy.speed || 1);
        enemy.y += (dy / dist) * (enemy.speed || 1);
      }
    }

    // HP바 업데이트 및 나머지 로직...
    if (enemy.hpBar && typeof enemy.hpBar.clear === 'function') {
      const hpRatio = Math.max(0, enemy.currentHP / enemy.maxHP);
      enemy.hpBar.clear();
      enemy.hpBar.beginFill(0xff0000);
      enemy.hpBar.drawRect(0, 0, 30 * hpRatio, 4.8);
      enemy.hpBar.endFill();
      enemy.hpBar.x = enemy.x - 15;
      enemy.hpBar.y = enemy.y + 20;

      enemy.hpBar.visible = Date.now() - (enemy.lastHitTime || 0) < 2000;
    }

    if (enemy.hitEffectTimer > 0) {
      enemy.hitEffectTimer--;
      const ratio = 1 - enemy.hitEffectTimer / 12;
      const bounce = easeOutBack(ratio);
      if (enemy.originalScale) {
        enemy.scale.x = enemy.originalScale.x * (1 - 0.2 * bounce);
        enemy.scale.y = enemy.originalScale.y * (1 + 0.3 * bounce);
      }
      enemy.tint = 0xFF4444;
      if (enemy.hitEffectTimer <= 0 && enemy.originalScale) {
        enemy.scale.set(enemy.originalScale.x, enemy.originalScale.y);
        enemy.tint = 0xFFFFFF;
      }
    }

    if (!enemy.isBoss && enemy.originalScale) {
      const dx = player.x - enemy.x;
      enemy.scale.x = dx > 0 ? -Math.abs(enemy.originalScale.x) : Math.abs(enemy.originalScale.x);
    }
  }
}





function checkCollisionWithEnemiesOrBullets(bullet, enemyList) {
  if (!bullet || !enemyList || !Array.isArray(enemyList)) return null;

  for (let i = 0; i < enemyList.length; i++) {
    const enemy = enemyList[i];
    if (!enemy || !enemy.x || !enemy.y) continue;

    const dx = bullet.x - enemy.x;
    const dy = bullet.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const collisionDistance = (bullet.width + enemy.width) / 2;

    if (distance < collisionDistance) {
      return enemy; // 충돌한 적 객체 반환
    }
  }

  return null;
}






function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (!b) continue;

    b.x += b.vx;
    b.y += b.vy;

    if (b.isGrinder) {
      b.rotation += 0.3;
    }

    if (b.isEnemy) {
      const dx = b.x - player.x;
      const dy = b.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 30) {
        if (!invincible) {
          const bulletDamage = b.attackPower || 1;
          const reducedDamage = Math.max(1, bulletDamage - playerStats.defense);
          playerStats.currentHP -= reducedDamage;
          invincible = true;
          player.shakeTimer = 10;
          invincibleTimer = INVINCIBLE_DURATION;
        }
        world.removeChild(b);
        bullets.splice(i, 1);
        continue;
      }
    } else {
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (!e) continue;

        const dx = b.x - e.x;
        const dy = b.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 60) {
          if (!b.hitEnemies) b.hitEnemies = new Set();
          if (b.hitEnemies.has(e)) continue;
        
          b.hitEnemies.add(e);
        
          const baseDamage = b.isWindBreak ? (b.damage || playerStats.attackPower)
            : b.isGrinder ? (b.damage || 20)
            : b.isTroublePass ? (15 + (playerStats.projectileCount - 1) * 10)
            : playerStats.attackPower;
        
          const isCrit = Math.random() < playerStats.critChance;
          const actualDamage = isCrit ? Math.floor(baseDamage * playerStats.critDamage) : baseDamage;
        
          e.currentHP -= actualDamage;
          createDamageText(e.x, e.y - 30, actualDamage, isCrit);
          applyHitEffect(e);
        
          if (e.currentHP <= 0) {
            if (e.hpBar) world.removeChild(e.hpBar);
            createDeathEffect(e);
            enemies.splice(j, 1);
        
            if (!e.isBoss) {
              totalMonstersKilled++;
              score++;
            }
        
            // 힐팩 드롭 & EXP 생성
            tryDropHealPack(e.x, e.y);
            tryDropMagnetItem(e.x, e.y);
            const orb = new PIXI.Graphics();
            orb.beginFill(0x3399ff);
            orb.drawCircle(0, 0, 6);
            orb.endFill();
            orb.x = e.x;
            orb.y = e.y;
            orb.expValue = 5;
            world.addChild(orb);
            expOrbs.push(orb);
          } else {
            if (e.hpBar instanceof PIXI.Graphics) {
              const hpRatio = Math.max(0, e.currentHP / e.maxHP);
              e.hpBar.clear();
              e.hpBar.beginFill(0xff0000);
              e.hpBar.drawRect(0, 0, 30 * hpRatio, 4);
              e.hpBar.endFill();
              e.hpBar.x = e.x - 15;
              e.hpBar.y = e.y - 40;
            }
          }
        
          // piercing이 아니면 총알 제거
          if (!(b.isGrinder || b.piercing)) {
            world.removeChild(b);
            bullets.splice(i, 1);
            break;
          }
        }
        
      }
    }

    const screenWidth = app.screen.width / world.scale.x;
    const screenHeight = app.screen.height / world.scale.y;
    const camLeft = player.x - screenWidth / 2;
    const camRight = player.x + screenWidth / 2;
    const camTop = player.y - screenHeight / 2;
    const camBottom = player.y + screenHeight / 2;

    const outOfCamera = b.x < camLeft || b.x > camRight || b.y < camTop || b.y > camBottom;

    if (outOfCamera) {
      if (b.isGrinder && !b.bounced) {
        b.vx *= -1;
        b.vy *= -1;
        b.bounced = true;
        if (b.hitEnemies) b.hitEnemies.clear();
      } else if (b.isGrinder && b.bounced) {
        const dx = b.x - player.x;
        const dy = b.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 1200) {
          world.removeChild(b);
          bullets.splice(i, 1);
        }
      } else {
        world.removeChild(b);
        bullets.splice(i, 1);
      }
    }
  }

  // 우당탕탕 데스 그라인더 업데이트
  for (let i = deathGrinderEvolvedBullets.length - 1; i >= 0; i--) {
    const grinder = deathGrinderEvolvedBullets[i];
    
    // 이동
    grinder.x += grinder.vx;
    grinder.y += grinder.vy;
    
    // 회전
    grinder.rotation += 0.3;
    
    // 화면 밖으로 나갔는지 체크
    const screenWidth = app.screen.width / world.scale.x;
    const screenHeight = app.screen.height / world.scale.y;
    const camLeft = player.x - screenWidth / 2;
    const camRight = player.x + screenWidth / 2;
    const camTop = player.y - screenHeight / 2;
    const camBottom = player.y + screenHeight / 2;
    
    const outOfBounds =
      grinder.x < camLeft - 120 || grinder.x > camRight + 120 ||
      grinder.y < camTop - 120 || grinder.y > camBottom + 120;
    
    if (outOfBounds) {
      grinder.vx *= -1;
      grinder.vy *= -1;
      grinder.bounceCount++;
      
      if (grinder.bounceCount >= grinder.maxBounce) {
        world.removeChild(grinder);
        deathGrinderEvolvedBullets.splice(i, 1);
        continue;
      }
    }
    
    // 적과의 충돌 체크
    for (const enemy of enemies) {
      if (!enemy.hitByGrinders) enemy.hitByGrinders = new Set();
      if (enemy.hitByGrinders.has(grinder)) continue;
      
      const dx = grinder.x - enemy.x;
      const dy = grinder.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < grinder.hitboxSize) {
        enemy.hitByGrinders.add(grinder);
        
        // 크리티컬 및 데미지 계산
        const isCrit = Math.random() < playerStats.critChance;
        const damage = isCrit ? Math.floor(grinder.damage * playerStats.critDamage) : grinder.damage;
        
        enemy.currentHP -= damage;
        createDamageText(enemy.x, enemy.y - 30, damage, isCrit);
        applyHitEffect(enemy);
        
        if (enemy.currentHP <= 0) {
          handleEnemyDeath(enemy);
        } else if (enemy.hpBar instanceof PIXI.Graphics) {
          const hpRatio = Math.max(0, enemy.currentHP / enemy.maxHP);
          enemy.hpBar.clear();
          enemy.hpBar.beginFill(0xff0000);
          enemy.hpBar.drawRect(0, 0, 30 * hpRatio, 4);
          enemy.hpBar.endFill();
          enemy.hpBar.x = enemy.x - 15;
          enemy.hpBar.y = enemy.y - 40;
          enemy.hpBar.visible = true;
        }
      }
    }
  }
}




function updateUI() {
  if (!expBarFill || !levelDisplay || !playerHpBar || !playerHpBarBg) {
    // UI 요소가 없으면 재생성
    createUIElements();
    return;
  }

  // HP 바 업데이트
  const hpRatio = Math.max(0, playerStats.currentHP / playerStats.maxHP);
  playerHpBar.clear();
  playerHpBar.beginFill(0xffff00);
  playerHpBar.drawRect(0, 0, 60 * hpRatio, 10);
  playerHpBar.endFill();

  // HP 바 위치 업데이트
  playerHpBarBg.x = player.x - 30;
  playerHpBarBg.y = player.y + player.height / 2 + 12;
  playerHpBar.x = playerHpBarBg.x;
  playerHpBar.y = playerHpBarBg.y;

  // 경험치 바 업데이트
  const expRatio = Math.min(1, playerEXP / nextEXP);
  expBarFill.clear();
  expBarFill.beginFill(0x3366ff);
  expBarFill.drawRect(0, 0, 400 * expRatio, 20);
  expBarFill.endFill();

  // 레벨 텍스트 업데이트
  levelDisplay.text = `LV ${playerLevel}`;

  // 보스 HP 바 업데이트
  if (currentBoss && bossHpBar) {
    const bossRatio = Math.max(0, currentBoss.currentHP / currentBoss.maxHP);
    bossHpBar.clear();
    bossHpBar.beginFill(0xff0000);
    bossHpBar.drawRect(0, 0, 400 * bossRatio, 20);
    bossHpBar.endFill();
  }

  // 스코어 텍스트 업데이트
  if (scoreText) {
    scoreText.text = `Score: ${score}`;
  }
}

function createUIElements() {
  // 경험치 바 배경
  const expBarBg = new PIXI.Graphics();
  expBarBg.beginFill(0x000000);
  expBarBg.lineStyle(2, 0xffff66);
  expBarBg.drawRect(0, 0, 400, 20);
  expBarBg.endFill();
  expBarBg.x = (app.screen.width - 400) / 2;
  expBarBg.y = app.screen.height - 40;
  app.stage.addChild(expBarBg);

  // 경험치 바
  expBarFill = new PIXI.Graphics();
  expBarFill.x = expBarBg.x;
  expBarFill.y = expBarBg.y;
  app.stage.addChild(expBarFill);

  // 레벨 텍스트
  levelDisplay = new PIXI.Text(`LV ${playerLevel}`, {
    fontFamily: 'Arial',
    fontSize: 16,
    fill: 'white',
    stroke: 'black',
    strokeThickness: 2
  });
  levelDisplay.anchor.set(1, 0.5);
  levelDisplay.x = expBarBg.x + 396;
  levelDisplay.y = expBarBg.y + 10;
  app.stage.addChild(levelDisplay);

  // 플레이어 HP 바 배경
  playerHpBarBg = new PIXI.Graphics();
  playerHpBarBg.beginFill(0x000000);
  playerHpBarBg.drawRect(0, 0, 60, 10);
  playerHpBarBg.endFill();
  world.addChild(playerHpBarBg);

  // 플레이어 HP 바
  playerHpBar = new PIXI.Graphics();
  world.addChild(playerHpBar);

  // 스코어 텍스트
  if (!scoreText) {
    scoreText = new PIXI.Text(`Score: ${score}`, {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 'white'
    });
    scoreText.x = 10;
    scoreText.y = 80;
    app.stage.addChild(scoreText);
  }
}

// 화면 크기 변경 시 UI 재배치
function resizeUI() {
  if (expBarFill && levelDisplay) {
    const expBarBg = expBarFill.parent.getChildAt(expBarFill.parent.children.indexOf(expBarFill) - 1);
    expBarBg.x = (app.screen.width - 400) / 2;
    expBarBg.y = app.screen.height - 40;
    expBarFill.x = expBarBg.x;
    expBarFill.y = expBarBg.y;
    levelDisplay.x = expBarBg.x + 396;
    levelDisplay.y = expBarBg.y + 10;
  }
}

// 리사이즈 이벤트에 UI 재배치 추가
window.addEventListener('resize', () => {
  resizeApp();
  resizeUI();
});

function handlePlayerShake() {
  if (player.shakeTimer > 0) {
    player.shakeTimer--;
    player.x += (Math.random() - 0.5) * 4;
    player.y += (Math.random() - 0.5) * 4;
  }
}


function showGameOver() {
  // 게임오버 UI 컨테이너
  const uiContainer = new PIXI.Container();
  
  // 반투명 오버레이
  const overlay = new PIXI.Graphics();
  overlay.beginFill(0x000000, 0.7);
  overlay.drawRect(0, 0, app.screen.width, app.screen.height);
  overlay.endFill();
  uiContainer.addChild(overlay);

  // 게임오버 텍스트
  const gameOverText = new PIXI.Text('GAME OVER', {
    fontFamily: 'Arial',
    fontSize: 64,
    fill: 0xff0000,
    stroke: '#000000',
    strokeThickness: 6,
    align: 'center'
  });
  gameOverText.anchor.set(0.5);
  gameOverText.position.set(app.screen.width / 2, app.screen.height / 2 - 50);
  uiContainer.addChild(gameOverText);
  
  // 재시작 버튼
  const restart = new PIXI.Text('[ RESTART ]', {
    fontFamily: 'Arial',
    fontSize: 32,
    fill: 0xffffff,
    stroke: '#000000',
    strokeThickness: 4,
    align: 'center'
  });
  restart.anchor.set(0.5);
  restart.position.set(app.screen.width / 2, app.screen.height / 2 + 50);
  restart.interactive = true;
  restart.buttonMode = true;
  restart.on('pointerdown', () => location.reload());
  uiContainer.addChild(restart);

  // UI를 stage에 추가하고 최상단에 표시
  app.stage.addChild(uiContainer);
  uiContainer.zIndex = 10000;
  app.stage.sortChildren();

  // 게임오버 상태 설정
  isGameOver = true;
}
function spawnEnemyBullet(x, y, tx, ty) {
  const bullet = new PIXI.Graphics();
  bullet.beginFill(0xff4444);
  bullet.drawCircle(0, 0, 10);
  bullet.endFill();
  bullet.x = x;
  bullet.y = y;
  const dx = tx - x;
  const dy = ty - y;
  const len = Math.sqrt(dx * dx + dy * dy);
  bullet.vx = (dx / len) * 4;
  bullet.vy = (dy / len) * 4;
  bullet.isEnemy = true;
  bullet.attackPower = 1;  // 투사체 공격력 설정
  world.addChild(bullet);
  bullets.push(bullet);
  //console.log("투사체 생성됨:", x, y, "->", tx, ty);
} 



// 반응형 캔버스 설정
function resizeApp() {
  app.renderer.resize(window.innerWidth, window.innerHeight);
  app.view.style.width = '100vw';
  app.view.style.height = '100vh';

  world.scale.set(WORLD_SCALE); // ✅ 줌아웃 적용

  // ✅ 줌아웃을 고려한 타일 계산
  TILE_VIEW_SIZE_X = Math.ceil((window.innerWidth / WORLD_SCALE) / scaledTileSize);
  TILE_VIEW_SIZE_Y = Math.ceil((window.innerHeight / WORLD_SCALE) / scaledTileSize);

  // ✅ 타일 수 재계산 및 재생성
  rebuildVisibleTiles();

  // ✅ 플레이어를 화면 중앙에 맞추도록 카메라 위치 조정
  world.position.x = app.renderer.width / 2 - player.x * WORLD_SCALE;
  world.position.y = app.renderer.height / 2 - player.y * WORLD_SCALE;
}




window.addEventListener('resize', resizeApp);


const joystick = nipplejs.create({
  zone: document.getElementById('joystick-zone'),
  mode: 'static',
  position: { left: '60px', bottom: '60px' },
  color: 'white'
});





joystick.on('move', (evt, data) => {
  if (data && data.vector) {
    joystickDir.x = data.vector.x;
    joystickDir.y = data.vector.y;
  }
});

joystick.on('end', () => {
  joystickDir.x = 0;
  joystickDir.y = 0;
});

function spawnWindBreakProjectile() {
  const level = selectedSkills['윈드 브레이크'] || 0;
  const totalShots = 1 + (playerStats.projectileCount || 0);
  const delayPerShot = 200;

  // 레벨에 따른 데미지 계산
  const damage = level === 1 ? 40 : 40 + (level - 1) * 10;

  for (let i = 0; i < totalShots; i++) {
    setTimeout(() => {
      if (isGameOver || isGamePaused || !PLAYER_SHOOT_ENABLED) return;
      if (!selectedSkills['윈드 브레이크']) return;

      const bullet = PIXI.Sprite.from('images/wind_break.png');
      bullet.zIndex = 20;

      bullet.anchor.set(0.5);
      bullet.scale.set(0.4);
      bullet.x = player.x;
      bullet.y = player.y;

      const dx = mouseX - player.x;
      const dy = mouseY - player.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      bullet.vx = (dx / len) * playerStats.bulletSpeed;
      bullet.vy = (dy / len) * playerStats.bulletSpeed;
      bullet.rotation = Math.atan2(dy, dx);

      bullet.isWindBreak = true;
      bullet.isEnemy = false;
      bullet.piercing = false;
      bullet.hitEnemies = new Set();
      bullet.damage = damage;  // 계산된 데미지 설정

      world.addChild(bullet);
      bullets.push(bullet);
    }, i * delayPerShot);
  }
}

// [기존의 기타 함수들 아래에 추가]
function createSlashEffect(x, y, rotation = 0, scale = 1) {
  const slash = new PIXI.Graphics();

  slash.beginFill(0xffffff, 0.6);
  slash.moveTo(0, 0);

  const outerRadius = 80 * scale;
  const innerRadius = 40 * scale;
  const startAngle = -Math.PI / 2;
  const endAngle = Math.PI / 2;

  for (let angle = startAngle; angle <= endAngle; angle += 0.05) {
    const px = Math.cos(angle) * outerRadius;
    const py = Math.sin(angle) * outerRadius;
    slash.lineTo(px, py);
  }

  for (let angle = endAngle; angle >= startAngle; angle -= 0.05) {
    const px = Math.cos(angle) * innerRadius;
    const py = Math.sin(angle) * innerRadius;
    slash.lineTo(px, py);
  }

  slash.endFill();
  slash.x = x;
  slash.y = y;
  slash.rotation = rotation;
  slash.zIndex = 1000;

  app.stage.addChild(slash);

  setTimeout(() => {
    app.ticker.add(function fade() {
      slash.alpha -= 0.05;
      if (slash.alpha <= 0) {
        app.ticker.remove(fade);
        app.stage.removeChild(slash);
        slash.destroy();
      }
    });
  }, 100);
}


function getClosestEnemy() {
  if (enemies.length === 0) return null;

  let closest = null;
  let minDist = Infinity;

  for (const e of enemies) {
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) {
      minDist = dist;
      closest = e;
    }
  }
  return closest;
}

let gamePaused = false;


pauseButton = new PIXI.Text('⏸ 일시정지', {
  fontFamily: 'Arial',
  fontSize: 20,
  fill: 'white',
  stroke: 'black',
  strokeThickness: 3
});
pauseButton.interactive = true;
pauseButton.buttonMode = true;
pauseButton.anchor.set(1, 0);
pauseButton.x = app.screen.width - 20;
pauseButton.y = 10;
pauseButton.zIndex = 9999;
app.stage.addChild(pauseButton);

pauseButton.on('pointerdown', () => {
  if (!isGameOver) {
    isPausedManually = !isPausedManually;
    isGamePaused = isPausedManually;
    pauseButton.text = isGamePaused ? '▶ 재개' : '⏸ 일시정지';
    
    if (isGamePaused) {
      showPlayerStats();
    } else {
      hidePlayerStats();
    }
  }
});


function showPlayerStats() {
  const infoList = [];

  infoList.push(`🔹 [스킬 목록]`);

  const evolvedBaseSkills = evolutionSkillConditions
    .filter(evo => selectedSkills[evo.name])
    .map(evo => evo.base);

  for (const [skillName, level] of Object.entries(selectedSkills)) {
    if (evolvedBaseSkills.includes(skillName)) continue;
    infoList.push(`- ${skillName} Lv.${level}`);
  }

  infoList.push(``);
  infoList.push(`🔹 [스탯 목록]`);

  // 스탯 목록을 직접 정의
  const statList = [
    '공격력',
    '치명타 확률',
    '크리티컬 피해 증가',
    '공격 속도',
    '이동 속도',
    '체력 회복',
    '스킬 범위',
    '투사체 개수',
    '방어력 증가',
    '최대 체력',
    '스킬 쿨타임'
  ];

  for (const statName of statList) {
    const level = playerStats[statName + '_level'] || 0;
    if (level > 0) {
      infoList.push(`- ${statName} Lv.${level}`);
    }
  }

  // 기존 컨테이너 제거
  if (statsContainer) {
    app.stage.removeChild(statsContainer);
    statsContainer = null;
  }

  // 새 컨테이너 생성
  statsContainer = new PIXI.Container();
  statsContainer.zIndex = 10000;

  for (let i = 0; i < infoList.length; i++) {
    const line = new PIXI.Text(infoList[i], {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 'yellow',
      stroke: 'black',
      strokeThickness: 3
    });
    line.anchor.set(0, 0);
    line.x = 20;
    line.y = 60 + i * 26;
    statsContainer.addChild(line);
  }

  app.stage.addChild(statsContainer);
}






function hidePlayerStats() {
  if (statsContainer) {
    app.stage.removeChild(statsContainer);
    statsContainer = null;
  }
}


let overwhelmingClawStarted = false;

app.ticker.add(() => {
  if (!overwhelmingClawStarted && hasSkill("압도적인 발톱꺼내기")) {
    startOverwhelmingClawLoop();
    overwhelmingClawStarted = true;
    console.log("[루프 시작] 압도적인 발톱꺼내기 루프 시작됨");
  }
});



function checkEvolveSkills() {
  for (const evo of evolutionSkillConditions) {
    const { base, name, requiredStat } = evo;

    // 이미 진화된 스킬은 건너뛰기
    if (selectedSkills[name]) continue;

    const baseLevel = selectedSkills[base] || 0;
    const statLevel = playerStats[requiredStat + '_level'] || 0;

    // 진화 조건 체크
    if (baseLevel >= 5 && statLevel >= 5) {
      // 아직 진화 대기열에 없다면 추가
      if (!evolutionSkillPendingList.includes(name)) {
        evolutionSkillPendingList.push(name);
        console.log(`🧬 진화 조건 충족: ${name}`);
      }

      // 진화 스킬 데이터 찾기
      const evoSkillData = availableSkills.find(s => s.name === name);
      if (!evoSkillData) continue;

      // 진화 처리
      selectedSkills[name] = selectedSkills[base];
      delete selectedSkills[base];
      evolutionSkillPendingList = evolutionSkillPendingList.filter(n => n !== name);

      // 스킬별 특수 처리
      switch (name) {
        case "엄청난 윈드브레이크":
          startSuperWindBreakLoop();
          break;
        case "압도적인 발톱꺼내기":
          if (!overwhelmingClawStarted) {
            startOverwhelmingClawLoop();
            overwhelmingClawStarted = true;
          }
          break;
        case "우당탕탕 데스 그라인더":
          if (deathGrinderInterval) {
            clearInterval(deathGrinderInterval);
            deathGrinderInterval = null;
          }
          startDeathGrinderEvolvedLoop();
          console.log("우당탕탕 데스 그라인더 진화 완료!");
          break;
        case "무시무시한 파이널 피스트":
          // 기존 파이널 피스트 강화
          break;
        case "혼돈의 볼케이노":
          // 볼케이노 강화 효과 적용
          break;
        case "예측불허 트러블 패스":
          // 트러블 패스 강화
          break;
        case "다뚫어 체인 피어스":
          // 체인 피어스 강화
          break;
        case "완전 끝내주는 디스트로네일":
          // 디스트로네일 강화
          break;
        case "일촉즉발 지뢰":
          // 지뢰 강화
          break;
        case "짱큰 옥타곤 필드":
          // 옥타곤 필드 강화
          break;
      }

      // onLearn 콜백 실행
      if (evoSkillData.onLearn) {
        evoSkillData.onLearn();
        console.log(`🔥 진화 완료: ${base} → ${name}`);
      }
    }
  }
}

// 스킬 데미지 계산 함수 추가
function calculateSkillDamage(baseDamage, skillName, isCrit = false) {
  let damage = baseDamage;
  
  // 스킬 레벨에 따른 증가
  const level = selectedSkills[skillName] || 1;
  damage *= (1 + (level - 1) * 0.2);  // 레벨당 20% 증가
  
  // 크리티컬 데미지
  if (isCrit) {
    damage *= playerStats.critDamage || 1.5;
  }
  
  // 공격력 스탯 반영
  damage *= (1 + (playerStats.attackPower - 1) * 0.1);  // 공격력 1당 10% 증가
  
  return Math.floor(damage);
}





function showEvolveCardBelow() {
  const pendingEvos = evolutionSkillPendingList.filter(evo => !selectedSkills[evo]);
  if (pendingEvos.length === 0) return;

  const evoName = pendingEvos[Math.floor(Math.random() * pendingEvos.length)];
  const evoData = availableSkills.find(s => s.name === evoName);
  if (!evoData) return;

  const evoCard = new PIXI.Text(`🌟 ${evoName}`, {
    fontFamily: 'Arial',
    fontSize: 28,
    fill: 'aqua',
    stroke: 'black',
    strokeThickness: 4
  });

  evoCard.interactive = true;
  evoCard.buttonMode = true;
  evoCard.anchor.set(0.5);
  evoCard.x = app.screen.width / 2;
  evoCard.y = app.screen.height / 2 + 150; // 기존 카드보다 아래

  evoCard.on('pointerdown', () => {
    selectedSkills[evoName] = true;
    evolutionSkillPendingList = evolutionSkillPendingList.filter(evo => evo !== evoName);
    app.stage.removeChild(evoCard);
    isGamePaused = false;
  });

  app.stage.addChild(evoCard);
}

function updateVisibleTiles() {
  const totalNeeded = (TILE_VIEW_SIZE_X + TILE_UPDATE_PADDING * 2) * (TILE_VIEW_SIZE_Y + TILE_UPDATE_PADDING * 2);

  // 타일 수가 부족한 경우에만 새로 생성
  while (visibleTiles.length < totalNeeded) {
    const sprite = new PIXI.Sprite();
    sprite.scale.set(tileScale);
    tileContainer.addChild(sprite);
    visibleTiles.push({ sprite, tx: -1, ty: -1 });
  }

  // 불필요한 타일 제거
  while (visibleTiles.length > totalNeeded) {
    const tile = visibleTiles.pop();
    if (tile && tile.sprite) {
      tileContainer.removeChild(tile.sprite);
      tile.sprite.destroy();
    }
  }

  const cameraX = Math.floor(player.x / scaledTileSize);
  const cameraY = Math.floor(player.y / scaledTileSize);
  const startX = cameraX - Math.floor(TILE_VIEW_SIZE_X / 2) - TILE_UPDATE_PADDING;
  const startY = cameraY - Math.floor(TILE_VIEW_SIZE_Y / 2) - TILE_UPDATE_PADDING;

  let i = 0;
  for (let y = 0; y < TILE_VIEW_SIZE_Y + TILE_UPDATE_PADDING * 2; y++) {
    for (let x = 0; x < TILE_VIEW_SIZE_X + TILE_UPDATE_PADDING * 2; x++) {
      const tx = startX + x;
      const ty = startY + y;
      const tile = visibleTiles[i];

      if (tile && tile.sprite) {
        if (tile.tx !== tx || tile.ty !== ty) {
          tile.tx = tx;
          tile.ty = ty;
          const index = getRandomTileIndex(tx, ty);
          const tex = getTileTexture(index);
          if (tile.sprite.texture !== tex) {
            tile.sprite.texture = tex;
          }
          tile.sprite.x = tx * scaledTileSize;
          tile.sprite.y = ty * scaledTileSize;
        }
      }
      i++;
    }
  }
}

// 일시정지 시간 추적을 위한 변수들

let pauseStartTime = null;

// 실제 경과 시간을 계산하는 함수 (일시정지 시간 제외)
function getActualElapsedTime(startTime) {
  let elapsedTime = Date.now() - startTime;
  
  // 누적된 일시정지 시간 제외
  elapsedTime -= totalPauseTime;
  
  // 현재 일시정지 중이라면 해당 시간도 제외
  if (isGamePaused && pauseStartTime) {
    elapsedTime -= (Date.now() - pauseStartTime);
  }
  
  return elapsedTime;
}

function getClawSlashCooldown() {
  const baseCooldown = 1000; // 기본 1초
  const reduction = playerStats.skillCooldownReduction || 0;
  return baseCooldown / (1 + reduction * 0.2);
}

// 조이스틱 초기화를 DOMContentLoaded 이벤트에서 처리
window.addEventListener('DOMContentLoaded', () => {
  const joystickZone = document.getElementById('joystick-zone');
  if (joystickZone && isMobile) {  // isMobile 조건 추가
    const joystick = nipplejs.create({
      zone: joystickZone,
      mode: 'static',
      position: { left: '60px', bottom: '60px' },
      color: 'white'
    });
  } else if (joystickZone) {  // 모바일이 아닌 경우 조이스틱 영역 숨김
    joystickZone.style.display = 'none';
  }
});

function startSuperWindBreakLoop() {
  setInterval(() => {
    if (isGameOver || isGamePaused || !hasSkill("엄청난 윈드브레이크")) return;

    const count = (playerStats.projectileCount || 0) + 1;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const bullet = PIXI.Sprite.from("images/wind_break_ex.png");
        bullet.anchor.set(0.5);
        bullet.scale.set(0.8);
        bullet.x = player.x;
        bullet.y = player.y;

        const dx = mouseX - player.x;
        const dy = mouseY - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        bullet.vx = (dx / dist) * playerStats.bulletSpeed;
        bullet.vy = (dy / dist) * playerStats.bulletSpeed;
        bullet.rotation = Math.atan2(dy, dx);

        bullet.isWindBreak = true;
        bullet.piercing = true;
        bullet.hitEnemies = new Set();
        bullet.zIndex = 20;

        world.addChild(bullet);
        bullets.push(bullet);
      }, i * 120);
    }
  }, 1000);  // 2초에서 1초로 변경
}

let statsContainer = null;

function cleanupGameObjects() {
  // 화면 밖 총알 제거
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (!b) continue;
    
    const dx = b.x - player.x;
    const dy = b.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 2000) {  // 너무 멀리 있는 총알 제거
      world.removeChild(b);
      bullets.splice(i, 1);
    }
  }

  // 화면 밖 경험치 오브 제거
  for (let i = expOrbs.length - 1; i >= 0; i--) {
    const orb = expOrbs[i];
    if (!orb) continue;
    
    const dx = orb.x - player.x;
    const dy = orb.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 1000) {  // 너무 멀리 있는 오브 제거
      world.removeChild(orb);
      expOrbs.splice(i, 1);
    }
  }
}



// 힐팩 관련 상수 추가
const HEAL_PACK_TYPES = {
  SMALL: {
    texture: 'images/Small_HealPack.png',
    healAmount: 10,
    scale: 0.075,
    probability: 0.6
  },
  MEDIUM: {
    texture: 'images/Medium_HealPack.png',
    healAmount: 25,
    scale: 0.075,
    probability: 0.3
  },
  LARGE: {
    texture: 'images/Large_HealPack.png',
    healAmount: 50,
    scale: 0.075,
    probability: 0.1
  }
};


// 힐팩 드롭 함수
function tryDropHealPack(x, y) {
  if (Math.random() < 0.1) {  // 10% 확률로 힐팩 드롭
    const rand = Math.random();
    let type;
    
    if (rand < HEAL_PACK_TYPES.SMALL.probability) {
      type = 'SMALL';
    } else if (rand < HEAL_PACK_TYPES.SMALL.probability + HEAL_PACK_TYPES.MEDIUM.probability) {
      type = 'MEDIUM';
    } else {
      type = 'LARGE';
    }

     //console.log(`[힐팩] ${type} 생성됨 at (${x}, ${y})`);
    
    const healPack = PIXI.Sprite.from(HEAL_PACK_TYPES[type].texture);
    healPack.anchor.set(0.5);
    healPack.scale.set(HEAL_PACK_TYPES[type].scale);
    // 오브와 겹치지 않도록 위치를 살짝 오프셋 (예: 오른쪽 위로 살짝 이동)
const offsetX = 20;
const offsetY = -20;
healPack.x = x + offsetX;
healPack.y = y + offsetY;
healPack.alpha = 0;
healPack.scale.set(0); // 처음에는 안 보이게

world.addChild(healPack);
healPacks.push(healPack);

// 애니메이션 효과 - 크기 & 투명도 부드럽게 증가
let frame = 0;
const maxFrame = 15;
const animTicker = () => {
  frame++;
  const t = frame / maxFrame;
  healPack.alpha = t;
  healPack.scale.set(HEAL_PACK_TYPES[type].scale * t);

  if (frame >= maxFrame) {
    app.ticker.remove(animTicker);
    healPack.alpha = 1;
    healPack.scale.set(HEAL_PACK_TYPES[type].scale);
  }
};
app.ticker.add(animTicker);

    healPack.type = type;
    healPack.zIndex = 2;
    healPack.createdAt = Date.now();
    world.addChild(healPack);
    healPacks.push(healPack);
  }
}

// 힐팩 업데이트 함수
function updateHealPacks() {
  if (healPacks.length > 0) {
    //console.log(`[힐팩] ${healPacks.length}개 존재, 플레이어 위치: (${Math.floor(player.x)}, ${Math.floor(player.y)})`);
  }

  for (let i = healPacks.length - 1; i >= 0; i--) {
    const healPack = healPacks[i];
    
    if (!healPack || !healPack.parent) {
      healPacks.splice(i, 1);
      continue;
    }

    // 30초 이상 지난 힐팩 제거
    if (Date.now() - healPack.createdAt > 30000) {
      world.removeChild(healPack);
      healPacks.splice(i, 1);
      //console.log("[힐팩] 시간 초과로 제거됨");
      continue;
    }
    
    // 플레이어와의 거리 체크
    const dx = player.x - healPack.x;
    const dy = player.y - healPack.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // 디버깅용 로그
    //console.log(`[힐팩] ${healPack.type} - 거리: ${Math.floor(dist)}, 위치: (${Math.floor(healPack.x)}, ${Math.floor(healPack.y)})`);
    
    // 자력 범위 내에 있으면 플레이어 쪽으로 이동
    if (dist < playerStats.magnetRadius) {
      const speed = 8;
      const moveX = (dx / dist) * speed;
      const moveY = (dy / dist) * speed;
      healPack.x += moveX;
      healPack.y += moveY;
      //console.log("[힐팩] 자력으로 이동 중");
    }
    
    // 획득 범위 내에 있으면 힐팩 효과 적용
    if (dist < playerStats.pickupRadius) {
      const healAmount = HEAL_PACK_TYPES[healPack.type].healAmount;
      const actualHeal = Math.min(
        healAmount,
        playerStats.maxHP - playerStats.currentHP
      );
      
      if (actualHeal > 0) {
        playerStats.currentHP += actualHeal;
        createHealText(player.x, player.y - 50, actualHeal);
        //console.log(`[힐팩] ${actualHeal} 만큼 회복`);
      }
      
      world.removeChild(healPack);
      healPacks.splice(i, 1);
      //console.log("[힐팩] 획득 완료");
    }
  }
}

// 힐량 표시 텍스트 생성 함수
function createHealText(x, y, amount) {
  const healText = new PIXI.Text(`+${amount}`, {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 0x00ff00,
    stroke: 'black',
    strokeThickness: 4
  });
  
  healText.anchor.set(0.5);
  healText.x = x;
  healText.y = y;
  healText.zIndex = 1000;
  world.addChild(healText);
  
  let lifetime = 30;
  const tick = () => {
    lifetime--;
    healText.y -= 2;
    healText.alpha = lifetime / 30;
    
    if (lifetime <= 0) {
      app.ticker.remove(tick);
      world.removeChild(healText);
    }
  };
  
  app.ticker.add(tick);
}

// 몬스터 처치 함수 수정
function handleEnemyDeath(enemy) {

  console.log(`[처치됨] ${enemy.behavior}, x:${enemy.x}, y:${enemy.y}`);


  if (enemy.hpBar) world.removeChild(enemy.hpBar);
  
  // 경험치 오브 생성
  const orb = new PIXI.Graphics();
  orb.beginFill(0x3399ff);
  orb.drawCircle(0, 0, 6);
  orb.endFill();
  orb.x = enemy.x;
  orb.y = enemy.y;
  orb.expValue = enemy.behavior === 'fast' ? 5 : 3;
  world.addChild(orb);
  expOrbs.push(orb);
  
  // 힐팩 드롭 시도
  tryDropHealPack(enemy.x, enemy.y);
  // 자석 드롭 시도
  tryDropMagnetItem(enemy.x, enemy.y);
  
  createDeathEffect(enemy);
  const index = enemies.indexOf(enemy);
  if (index > -1) {
    enemies.splice(index, 1);
    if (enemy.behavior !== 'boss') {  // 보스가 아닌 경우에만 카운트 증가
      totalMonstersKilled++;
      score++;
      
      // 보스 소환 조건 체크
      if (totalMonstersKilled >= BOSS_KILL_THRESHOLD && !isBossActive && !isBossWarningActive && bossQueue.length > 0) {
        showBossWarning(bossQueue[0]);
      }
    }
  }
}


function resetGame() {
  // 기존 게임 오브젝트들 제거
  for (const enemy of enemies) {
    if (enemy.hpBar) {
      world.removeChild(enemy.hpBar);
      enemy.hpBar = null;
    }
    world.removeChild(enemy);
  }
  enemies.length = 0;

  for (const bullet of bullets) {
    world.removeChild(bullet);
  }
  bullets.length = 0;

  for (const orb of expOrbs) {
    world.removeChild(orb);
  }
  expOrbs.length = 0;

  for (const healPack of healPacks) {
    world.removeChild(healPack);
  }
  healPacks.length = 0;

  // HP바 초기화
  if (playerHpBar) {
    world.removeChild(playerHpBar);
    playerHpBar = null;
  }
  if (playerHpBarBg) {
    world.removeChild(playerHpBarBg);
    playerHpBarBg = null;
  }

  // 플레이어 상태 초기화
  playerStats = JSON.parse(JSON.stringify(defaultPlayerStats));
  playerLevel = 1;
  playerEXP = 0;
  nextEXP = 10;
  score = 0;
  totalMonstersKilled = 0;
  selectedSkills = {};
}

function startDeathGrinderEvolvedLoop() {
  setInterval(() => {
    if (isGameOver || isGamePaused || !selectedSkills["우당탕탕 데스 그라인더"]) return;

    const level = selectedSkills["우당탕탕 데스 그라인더"];
    const count = Math.min(5, 2 + level); // 레벨에 따라 2~5개 발사

    for (let i = 0; i < count; i++) {
      const grinder = PIXI.Sprite.from('images/death_grinder_evolved.png');
      grinder.anchor.set(0.5);
      grinder.scale.set(0.3);
      grinder.x = player.x;
      grinder.y = player.y;
      grinder.zIndex = 20;

      // 랜덤한 방향으로 발사
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 8 + level;
      grinder.vx = Math.cos(angle) * speed;
      grinder.vy = Math.sin(angle) * speed;

      grinder.maxBounce = 3 + level; // 레벨에 따라 3~8번 바운스
      grinder.bounceCount = 0;
      grinder.damage = 30 + level * 10; // 기본 30 + 레벨당 10
      grinder.hitboxSize = 40; // 판정 범위

      world.addChild(grinder);
      deathGrinderEvolvedBullets.push(grinder);
    }
  }, 2000); // 2초마다 발사
}

// availableSkills에 우당탕탕 데스 그라인더 추가
availableSkills.push({
  name: "우당탕탕 데스 그라인더",
  type: "skill",
  onLearn: () => startDeathGrinderEvolvedLoop()
});

// evolutionSkillConditions에 우당탕탕 데스 그라인더 진화 조건 추가 (이미 있는지 확인 후)
const existingEvoCondition = evolutionSkillConditions.find(evo => evo.name === "우당탕탕 데스 그라인더");
if (!existingEvoCondition) {
  evolutionSkillConditions.push({
    name: "우당탕탕 데스 그라인더",
    base: "데스 그라인더",
    requiredStat: "공격 속도"
  });
}

function checkBossStatus() {
  // 1. 보스가 죽었는지 체크
  if (isBossActive && !enemies.some(e => e.behavior === 'boss')) {
    isBossActive = false;

    // 보스 대기 중이면 다음 보스를 예고
    if (bossSpawnPending && bossQueue.length > 0) {
      const next = bossQueue[0];
      showBossWarning(next);
      bossSpawnPending = false;
    }
  }

  // 2. 보스 예고가 아직 진행되지 않았을 경우만 showBossWarning 호출
  if (
    totalMonstersKilled >= BOSS_KILL_THRESHOLD &&
    bossQueue.length > 0 &&
    !isBossActive &&
    !isBossWarningActive
  ) {
    showBossWarning(bossQueue[0]);
    bossSpawnPending = false;
    totalMonstersKilled = 0;
  }

  // 3. 이미 보스가 있거나 경고 중이라면 → 대기만 시켜놓음
  else if (
    totalMonstersKilled >= BOSS_KILL_THRESHOLD &&
    (isBossActive || isBossWarningActive)
  ) {
    bossSpawnPending = true;
    totalMonstersKilled = 0;
  }
}

function updateBossWarning() {
  if (bossWarningTimer > 0) {
    bossWarningTimer--;
    
    // 느낌표 깜빡임 효과
    if (bossWarningMark) {
      bossWarningMark.alpha = Math.sin(bossWarningTimer * 0.2) * 0.5 + 0.5;
    }

    // 경고 시간이 끝나면
    if (bossWarningTimer <= 0) {
      isBossWarningActive = false;

      // 경고 UI 제거
      if (bossWarningText && bossWarningText.parent) {
        app.stage.removeChild(bossWarningText);
        bossWarningText = null;
      }

      // 보스 소환
      if (bossQueue.length > 0) {
        const nextBoss = bossQueue.shift();
        const spawnX = bossWarningMark ? bossWarningMark.x : player.x + 600;
        const spawnY = bossWarningMark ? bossWarningMark.y : player.y;
        
        // 느낌표 제거
        if (bossWarningMark && bossWarningMark.parent) {
          world.removeChild(bossWarningMark);
          bossWarningMark = null;
        }
        
        spawnBoss(nextBoss, spawnX, spawnY);
      }
    }
  }
}

function showBossWarning(bossName) {
  // 기존 텍스트/마크 제거
  if (isBossWarningActive) return; // ✅ 중복 호출 방지
  isBossWarningActive = true;

  if (bossWarningText) {
    app.stage.removeChild(bossWarningText);
    bossWarningText = null;
  }
  if (bossWarningMark) {
    world.removeChild(bossWarningMark);
    bossWarningMark = null;
  }

  // ✅ 보스가 출현할 맵 좌표 계산 (플레이어 주변 랜덤 위치)
  const spawnRadius = 600;
  const angle = Math.random() * Math.PI * 2;
  const bossSpawnX = player.x + Math.cos(angle) * spawnRadius;
  const bossSpawnY = player.y + Math.sin(angle) * spawnRadius;

  // ✅ 보스 위치에 느낌표 생성 (월드에 추가됨)
  bossWarningMark = new PIXI.Text('❗', {
    fontFamily: 'Arial',
    fontSize: 80,
    fill: 'red',
    stroke: 'black',
    strokeThickness: 6
  });
  bossWarningMark.anchor.set(0.5);
  bossWarningMark.x = bossSpawnX;
  bossWarningMark.y = bossSpawnY;

  // 👉 나중에 spawnBoss에서 사용하기 위해 위치 기억시킴
  bossWarningMark.spawnX = bossSpawnX;
  bossWarningMark.spawnY = bossSpawnY;

  world.addChild(bossWarningMark);

  // ✅ 중앙 상단에 텍스트 표시 (stage에 고정)
  bossWarningText = new PIXI.Text(`보스 몬스터 [${bossName}]이 곧 출현합니다`, {
    fontFamily: 'Arial',
    fontSize: 28,
    fill: 'yellow',
    stroke: 'black',
    strokeThickness: 4
  });
  bossWarningText.anchor.set(0.5);
  bossWarningText.x = app.screen.width / 2;
  bossWarningText.y = 100;
  app.stage.addChild(bossWarningText);

  // ✅ 타이머 시작 (5초)
  bossWarningTimer = 300; // 60fps 기준으로 약 5초
}

function spawnBoss(name, x, y) {
  if (!name || !bossTypes[name]) {
    console.warn("[보스 소환 실패] 보스 이름이 정의되지 않았습니다:", name);
    return;
  }
  
  
  // HP바 배경
  bossHpBarBackground = new PIXI.Graphics();
  bossHpBarBackground.beginFill(0x222222);
  bossHpBarBackground.drawRect(0, 0, 400, 20);
  bossHpBarBackground.endFill();
  bossHpBarBackground.x = (app.screen.width - 400) / 2;
  bossHpBarBackground.y = 30;
  app.stage.addChild(bossHpBarBackground);

  // HP바 본체
  bossHpBar = new PIXI.Graphics();
  bossHpBar.x = bossHpBarBackground.x;
  bossHpBar.y = bossHpBarBackground.y;
  app.stage.addChild(bossHpBar);

  // 보스 이름 텍스트 (HP바 내부 좌측 정렬)
  bossNameText = new PIXI.Text(name, {
    fontFamily: 'Arial',
    fontSize: 14,
    fill: 'white',
    stroke: 'black',
    strokeThickness: 2
  });
  bossNameText.anchor.set(0, 0.5);
  bossNameText.x = bossHpBar.x + 10; // HP바 내부 여백
  bossNameText.y = bossHpBar.y + 10;
  app.stage.addChild(bossNameText);

  const bossInfo = bossTypes[name];
  const boss = PIXI.Sprite.from(bossInfo.texture);
  boss.anchor.set(0.5);
  boss.scale.set(0.9);
  boss.zIndex = 10;  // ✅ 일반 몬스터보다 위에 오도록 설정
  
  
  boss.x = x;
  boss.y = y;

  boss.behavior = 'boss';
  boss.maxHP = bossInfo.maxHP;
  boss.currentHP = bossInfo.maxHP;
  boss.speed = bossInfo.speed;
  boss.orbCount = bossInfo.orbCount;
  boss.orbValue = bossInfo.orbValue;
  boss.bossType = name;
  boss.shootCooldown = 0;
  boss.isBoss = true;  // ✅ 이 한 줄만 추가

  world.addChild(boss);
  enemies.push(boss);

  currentBoss = boss;
  currentBoss.patternCooldowns = {};
  currentBoss.lastPatternTime = null;
  isBossActive = true;
  


  console.log("[보스 생성]", boss.bossType, "→ currentBoss 설정됨");

  isBossActive = true;

  // 느낌표 제거
  if (bossWarningMark) {
    world.removeChild(bossWarningMark);
    bossWarningMark = null;
  }


  
  // 현재 보스를 전역으로 기억
  currentBoss = boss;

  // 패턴 쿨다운 초기화 추가
  boss.patternCooldowns = {};
  boss.lastPatternTime = null;




}

// 보스 시스템 ticker 추가
app.ticker.add(() => {
  // 보스 관련 로직은 일시정지와 무관하게 실행
  updateBossWarning();
  checkBossStatus();
});

const HIT_RADIUS = 70; // 피격 판정 범위
const PUSH_BACK_DISTANCE = 200; // 넉벅 거리


function handleCollisions() {  // 피격 처리 부분. 플레이어. 몬스터. 보스 전부 다
  if (!invincible) {
    for (const enemy of enemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < HIT_RADIUS) {
        const knockbackSpeed = 20;
        enemy.knockback = {
          dx: dx / dist,
          dy: dy / dist,
          remaining: PUSH_BACK_DISTANCE,
          speed: knockbackSpeed
        };

        const rawDamage = enemy.attackPower || 1;
        const reducedDamage = Math.max(1, rawDamage - playerStats.defense);
        playerStats.currentHP -= reducedDamage;
        invincible = true;
        player.shakeTimer = 10;
        invincibleTimer = INVINCIBLE_DURATION;
        break;
      }
    }
  }

  if (invincible) {
    invincibleTimer--;
    player.alpha = invincibleTimer % 10 < 5 ? 0.3 : 1;
    if (invincibleTimer <= 0) {
      invincible = false;
      player.alpha = 1;
    }
  }

  if (playerStats.currentHP <= 0 && !isGameOver) {
    isGameOver = true;
    showGameOver();
  }
}

let waveElapsedTime = 0;
let lastWaveTickTime = Date.now();

app.ticker.add(() => {
  if (magnetRangeBoostActive) {
    playerStats.magnetRadius = 99999;

    if (!isGamePaused) {
      magnetRangeBoostTimer--;

      if (magnetRangeBoostTimer <= 0) {
        magnetRangeBoostActive = false;
        playerStats.magnetRadius = 150;
        console.log("🧲 자석 효과 종료");
      }
    }
  }
});



// 기존 게임 루프
function gameLoop() {


  
  
  
  
  
  if (isGamePaused || isGameOver) return;

  const now = Date.now();
  const deltaTime = now - lastWaveTickTime;
  lastWaveTickTime = now;

  // ✅ 일시정지가 아닐 때만 누적
  if (!isGamePaused) {
    waveElapsedTime += deltaTime;

    if (waveElapsedTime >= 60000) { // 몬스터 대량 스폰 초 ( 1초 1000)
      spawnEnemyWavePattern();
      waveElapsedTime = 0;
    }
  }

  // 본 게임 루프
  updateVisibleTiles();
  updateTimer();
  spawnEnemiesIfNeeded();
  movePlayer();
  updateCamera();
  moveEnemies();
  handleCollisions();
  handleExpOrbs();
  updateHealPacks();  // ✅ 이게 포함됨!
  updateBullets();
  updateUI();
  handlePlayerShake();
  updateBossPatterns(); // ✅ 이 라인을 명확하게 추가
  updateMagnetItems();
  

  for (const mine of mines) {
    if (mine.exploded) continue;
  
    for (const enemy of enemies) {
      const dx = mine.x - enemy.x;
      const dy = mine.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
  
      const hitRadius = 40;
      if (dist < hitRadius) {
        mine.exploded = true;
        createMineExplosion(mine.x, mine.y);
  
        const level = selectedSkills["지뢰 설치"] || 1;
        const damage = playerStats.attackPower * (1 + 0.3 * level);
  
        enemy.currentHP -= damage;
        createDamageText(enemy.x, enemy.y - 30, damage, false);
        applyHitEffect(enemy);

        if (enemy.currentHP <= 0) {
          if (enemy.hpBar) world.removeChild(enemy.hpBar);
        
          const orb = new PIXI.Graphics();
          orb.zIndex = 2;
          orb.beginFill(0x3399ff);
          orb.drawCircle(0, 0, 6);
          orb.endFill();
          orb.x = enemy.x;
          orb.y = enemy.y;
          orb.expValue = enemy.behavior === 'fast' ? 5 : 3;
          world.addChild(orb);
          expOrbs.push(orb);
        
          createDeathEffect(enemy);
          enemies.splice(enemies.indexOf(enemy), 1);
          totalMonstersKilled++;
        }
        
        setTimeout(() => {
          world.removeChild(mine);
          mines.splice(mines.indexOf(mine), 1);
        }, 5 * (1000 / 60));
        break;
      }
    }
  }

  

}



function spawnEnemyWavePattern() {
  const patterns = [spawnCirclePattern, spawnDiamondPattern, spawnSquarePattern, spawnTrianglePattern];
  const patternFunc = patterns[Math.floor(Math.random() * patterns.length)];
  patternFunc();
}

function spawnCirclePattern() {
  const centerX = player.x;
  const centerY = player.y;
  const radius = 250;
  const count = 12;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    spawnEnemyAt(x, y);
  }
}

function spawnSquarePattern() {
  const cx = player.x, cy = player.y;
  const size = 200;
  const step = 50;

  for (let x = -size / 2; x <= size / 2; x += step) {
    spawnEnemyAt(cx + x, cy - size / 2);
    spawnEnemyAt(cx + x, cy + size / 2);
  }

  for (let y = -size / 2 + step; y < size / 2; y += step) {
    spawnEnemyAt(cx - size / 2, cy + y);
    spawnEnemyAt(cx + size / 2, cy + y);
  }
}

function spawnTrianglePattern() {
  const cx = player.x;
  const cy = player.y;
  const size = 200;

  for (let i = 0; i < 7; i++) {
    const x1 = cx - size / 2 + (size / 6) * i;
    const y1 = cy + size / 2;
    spawnEnemyAt(x1, y1);

    if (i <= 3) {
      const x2 = cx;
      const y2 = cy - size / 2 + (size / 3) * i;
      spawnEnemyAt(x2 + i * 25, y2);
    }
  }
}

function spawnDiamondPattern() {
  const cx = player.x;
  const cy = player.y;
  const size = 200;

  for (let i = -3; i <= 3; i++) {
    const absI = Math.abs(i);
    for (let j = -absI; j <= absI; j++) {
      spawnEnemyAt(cx + j * 30, cy + i * 30);
    }
  }
}

function spawnEnemyAt(x, y) {
  // 최소 거리 설정
  const MIN_DISTANCE = 300; //	플레이어 기준 최소 거리
  const MAX_ATTEMPTS = 10; //  무한 루프 방지

  let spawnX = x;
  let spawnY = y;
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    const dx = spawnX - player.x;
    const dy = spawnY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= MIN_DISTANCE) break;

    const angle = Math.random() * Math.PI * 2;
    const radius = MIN_DISTANCE + Math.random() * 300;
    spawnX = player.x + Math.cos(angle) * radius;
    spawnY = player.y + Math.sin(angle) * radius;

    attempts++;
  }

  // ✅ 랜덤 타입 선택
  const enemyTypes = ["normal", "fast", "shooter"];
  const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

  const enemy = createEnemy(randomType);
  enemy.x = spawnX;
  enemy.y = spawnY;

  world.addChild(enemy);
  enemies.push(enemy);

  // HP 바도 위치 초기화
  if (enemy.hpBar) {
    world.addChild(enemy.hpBar);
    enemy.hpBar.x = enemy.x - 15;
    enemy.hpBar.y = enemy.y + 20;
  }

  if (enemy.behavior === 'shooter') {
    // 슈터 크기 별도 유지
    enemy.scale.set(enemy.originalScale.x, enemy.originalScale.y);
  } else {
    // 일반, 패스트는 기존대로
    enemy.scale.set(0.1);
  }

}



function createEnemy(type = "normal") {
  const texture = type === 'shooter' ? 'images/shooter_enemy.png'
    : type === 'fast' ? 'images/fast_enemy.png'
    : 'images/enemy.png';

  let enemy;
  if (type === 'fast') {
    const fastTextures = [
      PIXI.Texture.from('images/fast_enemy_walk1.png'),
      PIXI.Texture.from('images/fast_enemy_walk2.png'),
    ];
    enemy = new PIXI.AnimatedSprite(fastTextures);
    enemy.animationSpeed = 0.1;
    enemy.play();
  } else if (type === 'normal') {
    const enemyTextures = [
      PIXI.Texture.from('images/enemy_walk1.png'),
      PIXI.Texture.from('images/enemy_walk2.png'),
    ];
    enemy = new PIXI.AnimatedSprite(enemyTextures);
    enemy.animationSpeed = 0.1;
    enemy.play();
  } else {
    enemy = PIXI.Sprite.from(texture);
  }

  enemy.anchor.set(0.5);
  enemy.scale.set(0.1);
  enemy.behavior = type;
  enemy.speed = type === 'fast' ? 2 : type === 'shooter' ? 0.5 : 1;
  enemy.originalScale = { x: enemy.scale.x, y: enemy.scale.y };

  // 체력 및 기타 설정
  enemy.maxHP = type === 'shooter' ? 35 : type === 'fast' ? 30 : 40;
  enemy.currentHP = enemy.maxHP;
  enemy.attackPower = type === 'shooter' ? 1 : type === 'fast' ? 2 : 1;

  // HP 바
  enemy.hpBar = new PIXI.Graphics();
  enemy.hpBar.zIndex = 5;
  enemy.hpBar.beginFill(0xff0000);
  enemy.hpBar.drawRect(0, 0, 30, 4.8);
  enemy.hpBar.endFill();
  enemy.hpBar.visible = false;

  return enemy;
}




// BossPatterns 객체가 없는 경우에만 선언
if (typeof window.BossPatterns === 'undefined') {
  window.BossPatterns = {
    '팔콘': {
      patterns: [
        { name: '빠른 돌진', cooldown: 5000 },
        { name: '원형 탄막', cooldown: 8000 }
      ]
    },
    '스카': {
      patterns: [
        { name: '십자 탄막', cooldown: 6000 },
        { name: '광역 공격', cooldown: 10000 }
      ]
    },
    '요르하카': {
      patterns: [
        { name: '소환 공격', cooldown: 12000 },
        { name: '레이저 공격', cooldown: 8000 }
      ]
    },
    '러그만': {
      patterns: [
        { name: '지진파', cooldown: 10000 },
        { name: '분신 공격', cooldown: 15000 }
      ]
    },
    '테네브리스': {
      patterns: [
        { name: '암흑 폭발', cooldown: 12000 },
        { name: '영혼 흡수', cooldown: 18000 }
      ]
    }
  };
}

function executeBossPattern(boss, patternName) {
	console.log(`[패턴 사용] ${boss.bossType} → ${patternName}`);
  if (!boss || !patternName) return;

  switch (patternName) {
    case '빠른 돌진':
      const dx = player.x - boss.x;
      const dy = player.y - boss.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      boss.vx = (dx / dist) * 15;
      boss.vy = (dy / dist) * 15;
      setTimeout(() => {
        boss.vx = 0;
        boss.vy = 0;
      }, 1000);
      break;

    case '원형 탄막':
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        spawnEnemyBullet(
          boss.x,
          boss.y,
          boss.x + Math.cos(angle) * 100,
          boss.y + Math.sin(angle) * 100
        );
      }
      break;

    case '십자 탄막':
      const directions = [[1,0], [-1,0], [0,1], [0,-1]];
      directions.forEach(([dx, dy]) => {
        spawnEnemyBullet(boss.x, boss.y, boss.x + dx * 100, boss.y + dy * 100);
      });
      break;

    case '광역 공격':
      createExplosion(boss.x, boss.y);
      break;

    case '소환 공격':
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 100;
        spawnEnemy(0, boss.x + Math.cos(angle) * distance, boss.y + Math.sin(angle) * distance);
      }
      break;

    case '레이저 공격':
      const laserAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
      spawnEnemyBullet(boss.x, boss.y, boss.x + Math.cos(laserAngle) * 1000, boss.y + Math.sin(laserAngle) * 1000);
      break;

    case '지진파':
      createExplosion(boss.x, boss.y);
      setTimeout(() => createExplosion(boss.x + 100, boss.y), 200);
      setTimeout(() => createExplosion(boss.x - 100, boss.y), 400);
      break;

    case '분신 공격':
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI * 2 * i) / 4;
        spawnEnemyBullet(
          boss.x + Math.cos(angle) * 50,
          boss.y + Math.sin(angle) * 50,
          boss.x + Math.cos(angle) * 150,
          boss.y + Math.sin(angle) * 150
        );
      }
      break;

    case '암흑 폭발':
      createExplosion(boss.x, boss.y);
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        spawnEnemyBullet(
          boss.x,
          boss.y,
          boss.x + Math.cos(angle) * 200,
          boss.y + Math.sin(angle) * 200
        );
      }
      break;

    case '영혼 흡수':
      const healAmount = Math.min(50, boss.maxHP - boss.currentHP);
      if (healAmount > 0) {
        boss.currentHP += healAmount;
        createHealText(boss.x, boss.y - 50, healAmount);
      }
      break;


      default:
        console.log(`[경고] ${patternName} 패턴이 정의되지 않았습니다.`);
        break;
  }
}

// BossPatterns를 전역 객체로 설정
window.BossPatterns = {
  '팔콘': {
    patterns: [
      { name: '빠른 돌진', cooldown: 5000 },
      { name: '원형 탄막', cooldown: 8000 }
    ]
  },
  '스카': {
    patterns: [
      { name: '십자 탄막', cooldown: 6000 },
      { name: '광역 공격', cooldown: 10000 }
    ]
  },
  '요르하카': {
    patterns: [
      { name: '소환 공격', cooldown: 12000 },
      { name: '레이저 공격', cooldown: 8000 }
    ]
  },
  '러그만': {
    patterns: [
      { name: '지진파', cooldown: 10000 },
      { name: '분신 공격', cooldown: 15000 }
    ]
  },
  '테네브리스': {
    patterns: [
      { name: '암흑 폭발', cooldown: 12000 },
      { name: '영혼 흡수', cooldown: 18000 }
    ]
  }
};

let magnetRangeBoostActive = false;
let magnetRangeBoostTimer = 0;


function tryDropMagnetItem(x, y) {
  
  if (Math.random() < 0.001) { // 1% 확률
    console.log('[자석 드랍 시도]');
    const magnet = PIXI.Sprite.from('images/magnet.png');
    magnet.anchor.set(0.5);
    magnet.scale.set(0.5);
    magnet.x = x + 10;
    magnet.y = y - 10;
    magnet.zIndex = 15;
    magnet.alpha = 0;
    magnet.scale.set(0);

    world.addChild(magnet);
    magnetItems.push(magnet);

    // 애니메이션 효과
    let frame = 0;
    const maxFrame = 15;
    const animTicker = () => {
      frame++;
      const t = frame / maxFrame;
      magnet.alpha = t;
      magnet.scale.set(0.5 * t);
      if (frame >= maxFrame) {
        app.ticker.remove(animTicker);
        magnet.alpha = 1;
        magnet.scale.set(0.5);
      }
    };
    app.ticker.add(animTicker);
  }
}

function updateMagnetItems() {
  for (let i = magnetItems.length - 1; i >= 0; i--) {
    const magnet = magnetItems[i];
    const dx = player.x - magnet.x;
    const dy = player.y - magnet.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 자력 범위 내 접근
    if (dist < playerStats.magnetRadius) {
      const pullSpeed = magnetRangeBoostActive ? 24 : 8;
      magnet.x += (dx / dist) * pullSpeed;
      magnet.y += (dy / dist) * pullSpeed;
    }

    // 획득
    if (dist < playerStats.pickupRadius) {
      world.removeChild(magnet);
      magnetItems.splice(i, 1);

      // 효과 발동
      magnetRangeBoostActive = true;
      magnetRangeBoostTimer = 120; // 2초 (60fps 기준)

      console.log("🧲 자석 아이템 획득! 2초간 전맵 흡수 활성화");
    }
  }
}



