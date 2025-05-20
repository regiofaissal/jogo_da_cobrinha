// Configurações do jogo
const gridSize = 20;

// Temas do jogo
const themes = {
    classic: {
        background: ['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.7)'],
        snake: ['#4ecdc4', '#45b7af'],
        food: ['#ff6b6b', '#ff4757']
    },
    neon: {
        background: ['#1a1a2e', '#16213e'],
        snake: ['#00ff00', '#00cc00'],
        food: ['#ff00ff', '#cc00cc']
    },
    retro: {
        background: ['#2c3e50', '#34495e'],
        snake: ['#f1c40f', '#f39c12'],
        food: ['#e74c3c', '#c0392b']
    },
    ocean: {
        background: ['#1e3799', '#0c2461'],
        snake: ['#00a8ff', '#0097e6'],
        food: ['#ffd32a', '#ffb142']
    }
};

let currentTheme = localStorage.getItem('selectedTheme') || 'classic';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const themeSelect = document.getElementById("themeSelect");
const tutorialButton = document.getElementById("tutorialButton");
const tutorialModal = document.getElementById("tutorialModal");
const tutorialCloseButton = document.getElementById("tutorialCloseButton");

// Inicialização das variáveis do jogo
let snake = [{ x: canvas.width / 2, y: canvas.height / 2 }];
let direction = { x: gridSize, y: 0 };
let food = getRandomFoodPosition();
let score = 0;
let speed = 200;
let gameInterval = null;
let touchStartX = 0;
let touchStartY = 0;

// Sistema de níveis e power-ups
let currentLevel = 1;
let powerUpActive = false;
let powerUpType = null;
let powerUpPosition = null;
let powerUpTimer = null;
let highScore = localStorage.getItem('highScore') || 0;

// Sons do jogo
const sounds = {
    eat: document.getElementById('eatSound'),
    powerUp: document.getElementById('powerupSound'),
    gameOver: document.getElementById('gameoverSound'),
    levelUp: document.getElementById('levelupSound'),
    background: document.getElementById('backgroundMusic')
};

// Controles de som
const soundToggle = document.getElementById('soundToggle');
const volumeControl = document.getElementById('volumeControl');

// Configurar volume inicial
const initialVolume = localStorage.getItem('volume') || 0.3;
const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';

soundToggle.checked = soundEnabled;
volumeControl.value = initialVolume * 100;

Object.values(sounds).forEach(sound => {
    sound.volume = initialVolume;
});

// Eventos dos controles de som
soundToggle.addEventListener('change', () => {
    const enabled = soundToggle.checked;
    localStorage.setItem('soundEnabled', enabled);
    
    Object.values(sounds).forEach(sound => {
        if (!enabled) {
            sound.pause();
            if (sound === sounds.background) {
                sound.currentTime = 0;
            }
        } else if (sound === sounds.background && gameInterval) {
            sound.play();
        }
    });
});

volumeControl.addEventListener('input', () => {
    const volume = volumeControl.value / 100;
    localStorage.setItem('volume', volume);
    
    Object.values(sounds).forEach(sound => {
        sound.volume = volume;
    });
});

// Função auxiliar para tocar sons
function playSound(soundName) {
    if (soundToggle.checked && sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play();
    }
}

// Tipos de power-ups e suas cores
const powerUpTypes = {
    speed: { color: '#FFD700', effect: 'Velocidade Extra' },
    points: { color: '#FF1493', effect: 'Pontos Duplos' },
    invincible: { color: '#4169E1', effect: 'Invencível' }
};

themeSelect.value = currentTheme;

// Eventos do tutorial
tutorialButton.addEventListener('click', () => {
    tutorialModal.classList.add('show');
});

// Configurações dos botões de controle no canvas
function updateControlButtonsPosition() {
    const buttonSize = 25;
    const spacing = 4;
    const containerPadding = 13;
    const containerWidth = buttonSize * 3 + spacing * 2;
    const containerHeight = buttonSize * 3 + spacing * 2;
    const containerX = canvas.width - containerWidth - containerPadding;
    const containerY = canvas.height - containerHeight - containerPadding;

    return {
        up: {
            x: containerX + buttonSize + spacing,
            y: containerY + spacing,
            w: buttonSize,
            h: buttonSize,
            direction: { x: 0, y: -gridSize },
            symbol: '↑'
        },
        left: {
            x: containerX + spacing,
            y: containerY + buttonSize + spacing,
            w: buttonSize,
            h: buttonSize,
            direction: { x: -gridSize, y: 0 },
            symbol: '←'
        },
        right: {
            x: containerX + buttonSize * 2 + spacing * 2,
            y: containerY + buttonSize + spacing,
            w: buttonSize,
            h: buttonSize,
            direction: { x: gridSize, y: 0 },
            symbol: '→'
        },
        down: {
            x: containerX + buttonSize + spacing,
            y: containerY + buttonSize * 2 + spacing * 2,
            w: buttonSize,
            h: buttonSize,
            direction: { x: 0, y: gridSize },
            symbol: '↓'
        }
    };
}

let controlButtons = updateControlButtonsPosition();

// Função para desenhar os botões de controle
function drawControlButtons() {
    controlButtons = updateControlButtonsPosition();
    const buttonSize = 25;
    const spacing = 5;
    const containerPadding = 10;
    const containerWidth = buttonSize * 3 + spacing * 2;
    const containerHeight = buttonSize * 3 + spacing * 2;
    const containerX = canvas.width - containerWidth - containerPadding;
    const containerY = canvas.height - containerHeight - containerPadding;

    // Desenhar o fundo do container com efeito glassmorphism
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(containerX, containerY, containerWidth, containerHeight, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    Object.values(controlButtons).forEach(button => {
        // Fundo do botão com efeito glassmorphism
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.roundRect(button.x, button.y, button.w, button.h, 6);
        ctx.fill();
        
        // Borda do botão
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Símbolo da seta
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '14px Segoe UI';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(button.symbol, button.x + button.w/2, button.y + button.h/2);
    });
}

// Função para verificar clique nos botões
function handleControlClick(x, y) {
    Object.values(controlButtons).forEach(button => {
        if (x >= button.x && x <= button.x + button.w &&
            y >= button.y && y <= button.y + button.h) {
            if ((button.direction.y === -gridSize && direction.y !== gridSize) ||
                (button.direction.y === gridSize && direction.y !== -gridSize) ||
                (button.direction.x === -gridSize && direction.x !== gridSize) ||
                (button.direction.x === gridSize && direction.x !== -gridSize)) {
                direction = { ...button.direction };
            }
        }
    });
}

// Evento de clique no canvas
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handleControlClick(x, y);
});

// Evento de toque no canvas
canvas.addEventListener('touchstart', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    handleControlClick(x, y);
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

tutorialCloseButton.addEventListener('click', () => {
    tutorialModal.classList.remove('show');
});

// Evento de mudança de tema
themeSelect.addEventListener('change', (e) => {
    currentTheme = e.target.value;
    localStorage.setItem('selectedTheme', currentTheme);
    drawGame();
});

// Configuração responsiva do canvas
function setCanvasSize() {
    const maxSize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.6);
    canvas.width = Math.floor(maxSize / 20) * 20;
    canvas.height = canvas.width;
}

setCanvasSize();
window.addEventListener('resize', () => {
    setCanvasSize();
    drawGame();
});

const modal = document.getElementById('gameOverModal');
const modalOkButton = document.getElementById('modalOkButton');
const finalScore = document.getElementById('finalScore');

function showGameOverModal() {
    sounds.background.pause();
    playSound('gameOver');
    finalScore.textContent = `Pontuação: ${score}`;
    modal.classList.add('show');
}

modalOkButton.addEventListener('click', () => {
    modal.classList.remove('show');
    startGame();
});

startButton.addEventListener("click", startGame);

function startGame() {
    snake = [{ x: canvas.width / 2, y: canvas.height / 2 }];
    direction = { x: gridSize, y: 0 };
    food = getRandomFoodPosition();
    score = 0;
    currentLevel = 1;
    speed = 200;
    powerUpActive = false;
    powerUpType = null;
    if (powerUpTimer) clearTimeout(powerUpTimer);
    powerUpPosition = null;

    // Iniciar música de fundo
    if (soundToggle.checked) {
        sounds.background.currentTime = 0;
        sounds.background.play();
    }
    
    clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, speed);
}

function updateGame() {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Gerar power-up aleatoriamente
    if (!powerUpPosition && Math.random() < 0.01) {
        powerUpType = Object.keys(powerUpTypes)[Math.floor(Math.random() * Object.keys(powerUpTypes).length)];
        powerUpPosition = getRandomFoodPosition();
    }

    // Teletransporte nas bordas
    if (head.x >= canvas.width) head.x = 0;
    if (head.x < 0) head.x = canvas.width - gridSize;
    if (head.y >= canvas.height) head.y = 0;
    if (head.y < 0) head.y = canvas.height - gridSize;

    // Colisão com o próprio corpo
    if (!powerUpActive || powerUpType !== 'invincible') {
        if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            clearInterval(gameInterval);
            showGameOverModal();
            return;
        }
    }

    snake.unshift(head);

    // Comer a comida - verificação de colisão com tolerância
    const distanceX = Math.abs(head.x - food.x);
    const distanceY = Math.abs(head.y - food.y);
    if (distanceX < gridSize && distanceY < gridSize) {
        const points = powerUpActive && powerUpType === 'points' ? 2 : 1;
        score += points;
        playSound('eat');
        food = getRandomFoodPosition();
        
        // Atualizar nível e velocidade
        if (score > currentLevel * 5) {
            currentLevel++;
            playSound('levelUp');
            speed = Math.max(50, 200 - (currentLevel * 10));
        }
        
        // Atualizar recorde
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }
        
        clearInterval(gameInterval);
        gameInterval = setInterval(updateGame, speed);
    } else {
        snake.pop();
    }

    // Verificar colisão com power-up
    if (powerUpPosition) {
        const powerUpDistanceX = Math.abs(head.x - powerUpPosition.x);
        const powerUpDistanceY = Math.abs(head.y - powerUpPosition.y);
        
        if (powerUpDistanceX < gridSize && powerUpDistanceY < gridSize) {
            playSound('powerUp');
            activatePowerUp();
            powerUpPosition = null;
        }
    }

    drawGame();
}

function activatePowerUp() {
    powerUpActive = true;
    
    switch(powerUpType) {
        case 'speed':
            speed = Math.max(30, speed - 30);
            clearInterval(gameInterval);
            gameInterval = setInterval(updateGame, speed);
            break;
        case 'invincible':
            // Lógica de invencibilidade implementada na verificação de colisão
            break;
    }
    
    // Desativar power-up após 5 segundos
    if (powerUpTimer) clearTimeout(powerUpTimer);
    powerUpTimer = setTimeout(() => {
        powerUpActive = false;
        if (powerUpType === 'speed') {
            speed = Math.max(50, 200 - (currentLevel * 10));
            clearInterval(gameInterval);
            gameInterval = setInterval(updateGame, speed);
        }
        powerUpType = null;
    }, 5000);
}

function drawGame() {
    // Fundo com gradiente
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, themes[currentTheme].background[0]);
    gradient.addColorStop(1, themes[currentTheme].background[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha a comida com gradiente
    const foodGradient = ctx.createRadialGradient(
        food.x + gridSize/2, food.y + gridSize/2, 0,
        food.x + gridSize/2, food.y + gridSize/2, gridSize
    );
    foodGradient.addColorStop(0, themes[currentTheme].food[0]);
    foodGradient.addColorStop(1, themes[currentTheme].food[1]);
    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(food.x + gridSize/2, food.y + gridSize/2, gridSize/2, 0, Math.PI * 2);
    ctx.fill();

    // Desenha a cobra com gradiente
    snake.forEach((segment, index) => {
        const snakeGradient = ctx.createLinearGradient(
            segment.x, segment.y,
            segment.x + gridSize, segment.y + gridSize
        );
        snakeGradient.addColorStop(0, themes[currentTheme].snake[0]);
        snakeGradient.addColorStop(1, themes[currentTheme].snake[1]);
        ctx.fillStyle = snakeGradient;
        ctx.beginPath();
        ctx.roundRect(segment.x, segment.y, gridSize, gridSize, index === 0 ? 8 : 4);
        ctx.fill();
    });

    // Desenhar power-up se existir
    if (powerUpPosition && powerUpType && powerUpTypes[powerUpType] && powerUpTypes[powerUpType].color) {
        ctx.fillStyle = powerUpTypes[powerUpType].color;
        ctx.beginPath();
        ctx.arc(powerUpPosition.x + gridSize/2, powerUpPosition.y + gridSize/2, gridSize/2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Desenha as informações do jogo
    ctx.fillStyle = '#fff';
    ctx.font = '20px Segoe UI';
    ctx.textAlign = 'right';
    ctx.fillText(`Pontuação: ${score}`, canvas.width - 10, 30);
    ctx.fillText(`Nível: ${currentLevel}`, canvas.width - 10, 60);
    ctx.fillText(`Recorde: ${highScore}`, canvas.width - 10, 90);
    
    // Mostrar power-up ativo
    if (powerUpActive && powerUpType && powerUpTypes[powerUpType] && powerUpTypes[powerUpType].color && powerUpTypes[powerUpType].effect) {
        ctx.fillStyle = powerUpTypes[powerUpType].color;
        ctx.textAlign = 'left';
        ctx.fillText(`${powerUpTypes[powerUpType].effect}!`, 10, 30);
    }

    // Desenha os controles direcionais
    drawControlButtons();
}

function getRandomFoodPosition() {
    return {
        x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
        y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize
    };
}

// Controles de teclado
document.addEventListener("keydown", (event) => {
    if (!gameInterval) return; // Previne movimento antes do início do jogo
    
    const currentDirection = { x: direction.x, y: direction.y };
    
    if (event.key === "ArrowUp" && direction.y !== gridSize) {
        direction = { x: 0, y: -gridSize };
    } else if (event.key === "ArrowDown" && direction.y !== -gridSize) {
        direction = { x: 0, y: gridSize };
    } else if (event.key === "ArrowLeft" && direction.x !== gridSize) {
        direction = { x: -gridSize, y: 0 };
    } else if (event.key === "ArrowRight" && direction.x !== -gridSize) {
        direction = { x: gridSize, y: 0 };
    }
});

// Controles touch
canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (!gameInterval) return; // Previne movimento antes do início do jogo
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    const minSwipeDistance = 30; // Distância mínima para considerar como swipe
    
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipeDistance) {
        if (dx > 0 && direction.x !== -gridSize) direction = { x: gridSize, y: 0 };
        if (dx < 0 && direction.x !== gridSize) direction = { x: -gridSize, y: 0 };
    } else if (Math.abs(dy) > minSwipeDistance) {
        if (dy > 0 && direction.y !== -gridSize) direction = { x: 0, y: gridSize };
        if (dy < 0 && direction.y !== gridSize) direction = { x: 0, y: -gridSize };
    }
});
