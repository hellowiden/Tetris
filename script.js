function initializeGame() {
    const canvas = document.getElementById('tetris');
    const context = canvas.getContext('2d');
    context.scale(20, 20);

    const nextCanvas1 = document.getElementById('nextTetromino1');
    const nextContext1 = nextCanvas1.getContext('2d');
    nextContext1.scale(15, 15);

    const nextCanvas2 = document.getElementById('nextTetromino2');
    const nextContext2 = nextCanvas2.getContext('2d');
    nextContext2.scale(15, 15);

    const nextCanvas3 = document.getElementById('nextTetromino3');
    const nextContext3 = nextCanvas3.getContext('2d');
    nextContext3.scale(15, 15);

    let gameStarted = false;
    let gamePaused = false;
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartTime = 0;

    const colors = [
        null,
        '#FF0D72',
        '#0DC2FF',
        '#0DFF72',
        '#F538FF',
        '#FF8E0D',
        '#FFE138',
        '#3877FF'
    ];

    const arena = createMatrix(12, 20);

    const player = {
        pos: { x: 0, y: 0 },
        matrix: null,
        score: 0,
    };

    const ghost = {
        pos: { x: 0, y: 0 },
        matrix: null,
    };

    const tetrominoQueue = [];
    const queueSize = 3;

    function fillQueue() {
        const pieces = 'TJLOSZI';
        while (tetrominoQueue.length < queueSize) {
            const piece = pieces[Math.floor(Math.random() * pieces.length)];
            tetrominoQueue.push(createPiece(piece));
        }
    }

    function drawNextTetrominoes() {
        nextContext1.clearRect(0, 0, nextCanvas1.width, nextCanvas1.height);
        nextContext2.clearRect(0, 0, nextCanvas2.width, nextCanvas2.height);
        nextContext3.clearRect(0, 0, nextCanvas3.width, nextCanvas3.height);

        if (tetrominoQueue[0]) drawMatrix(tetrominoQueue[0], { x: 1, y: 1 }, nextContext1);
        if (tetrominoQueue[1]) drawMatrix(tetrominoQueue[1], { x: 1, y: 1 }, nextContext2);
        if (tetrominoQueue[2]) drawMatrix(tetrominoQueue[2], { x: 1, y: 1 }, nextContext3);
    }

    function playerReset() {
        if (tetrominoQueue.length === 0) fillQueue();
        player.matrix = tetrominoQueue.shift(); 
        fillQueue(); 
        player.pos.y = 0;
        player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

        if (collide(arena, player)) {
            resetGame();
        } else {
            player.score += 50;
            updateScore();
        }
        updateGhostPosition();
        drawNextTetrominoes(); 
    }

    function updateGhostPosition() {
        ghost.matrix = player.matrix;
        ghost.pos.x = player.pos.x;
        ghost.pos.y = player.pos.y;

        while (!collide(arena, ghost)) {
            ghost.pos.y++;
        }
        ghost.pos.y--; // Move back to the last valid position
    }

    function playerDrop() {
        player.pos.y++;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            playerReset();
            arenaSweep();
            updateScore();
        }
        dropCounter = 0;
        updateGhostPosition();
    }

    function playerMove(offset) {
        player.pos.x += offset;
        if (collide(arena, player)) {
            player.pos.x -= offset;
        }
        updateGhostPosition();
    }

    function playerRotate(dir) {
        const posX = player.pos.x;
        let offset = 1;
        rotate(player.matrix, dir);
        while (collide(arena, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -dir);
                player.pos.x = posX;
                return;
            }
        }
        updateGhostPosition();
    }

    function togglePause() {
        gamePaused = !gamePaused;
        document.getElementById('pauseButton').innerText = gamePaused ? 'Resume' : 'Pause';
    }

    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
    }

    function handleTouchEnd(e) {
        touchEndX = e.changedTouches[0].clientX;
        const touchDuration = Date.now() - touchStartTime;

        if (touchDuration < 200) {
            playerRotate(1);
        } else {
            handleSwipe();
        }
        e.preventDefault();
    }

    function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;
        const swipeThreshold = 30;

        if (swipeDistance > swipeThreshold) {
            playerMove(1);
        } else if (swipeDistance < -swipeThreshold) {
            playerMove(-1);
        }
    }

    function update(time = 0) {
        if (!gamePaused) {
            const deltaTime = time - lastTime;
            dropCounter += deltaTime;
            if (dropCounter > dropInterval) {
                playerDrop();
            }
            lastTime = time;
            draw();
        }
        requestAnimationFrame(update);
    }

    function draw() {
        clearCanvas();
        drawMatrix(arena, { x: 0, y: 0 }, context);
        drawGhost();
        drawMatrix(player.matrix, player.pos, context);
        drawNextTetrominoes();
    }

    function drawMatrix(matrix, offset, ctx = context) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = colors[value];
                    ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 0.05;
                    ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    }

    function drawGhost() {
        context.globalAlpha = 0.3; 
        drawMatrix(ghost.matrix, ghost.pos, context);
        context.globalAlpha = 1; 
    }

    function merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const posX = x + player.pos.x;
                    const posY = y + player.pos.y;

                    arena[posY][posX] = value;
                }
            });
        });
    }

    function arenaSweep() {
        let rowCount = 0;
        let lineClearPoints = 0;

        for (let y = arena.length - 1; y >= 0; --y) {
            if (arena[y].every(cell => cell !== 0)) {
                const removedRow = arena.splice(y, 1)[0].fill(0);
                arena.unshift(removedRow);
                rowCount++;
                y++;

                lineClearPoints = rowCount === 1 ? 500 : rowCount === 2 ? 1000 : 0;
            }
        }

        player.score += lineClearPoints;
    }

    function collide(arena, player) {
        const matrix = player.matrix;
        const { x, y } = player.pos;
        for (let row = 0; row < matrix.length; ++row) {
            for (let col = 0; col < matrix[row].length; ++col) {
                if (matrix[row][col] !== 0 && (arena[row + y] && arena[row + y][col + x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    function rotate(matrix, dir) {
        for (let row = 0; row < matrix.length; ++row) {
            for (let col = 0; col < row; ++col) {
                [matrix[col][row], matrix[row][col]] = [matrix[row][col], matrix[col][row]];
            }
        }
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    function createMatrix(width, height) {
        return Array.from({ length: height }, () => new Array(width).fill(0));
    }

    function createPiece(type) {
        const pieces = {
            'I': [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0]
            ],
            'L': [
                [0, 2, 0],
                [0, 2, 0],
                [0, 2, 2]
            ],
            'J': [
                [0, 3, 0],
                [0, 3, 0],
                [3, 3, 0]
            ],
            'O': [
                [4, 4],
                [4, 4]
            ],
            'Z': [
                [5, 5, 0],
                [0, 5, 5],
                [0, 0, 0]
            ],
            'S': [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0]
            ],
            'T': [
                [0, 7, 0],
                [7, 7, 7],
                [0, 0, 0]
            ]
        };
        return pieces[type];
    }


    const highScore = parseInt(localStorage.getItem('high_score')) || 0;
    const highScoreElement = document.getElementById('highScore');
    highScoreElement.innerText = highScore;

    document.getElementById('startButton').addEventListener('click', () => {
        if (gameStarted) {
            resetGame();
        } else {
            gameStarted = true;
            startGame();
        }
    });

    document.getElementById('pauseButton').addEventListener('click', togglePause);
    document.addEventListener('keydown', event => {
        if (gameStarted) {
            switch (event.key) {
                case 'ArrowLeft':
                    playerMove(-1);
                    break;
                case 'ArrowRight':
                    playerMove(1);
                    break;
                case 'ArrowDown':
                    playerDrop();
                    break;
                case 'ArrowUp':
                    playerRotate(-1);
                    break;
            }
        }
    });

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    let dropCounter = 0;
    const dropInterval = 1000;
    let lastTime = 0;

    function updateScore() {
        const currentScoreElement = document.getElementById('currentScore');
        currentScoreElement.innerText = player.score;

        if (player.score > highScore) {
            highScoreElement.innerText = player.score;
            localStorage.setItem('high_score', player.score);
        }
    }

    function clearCanvas() {
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    function startGame() {
        resetGame();
        updateScore();
        update();
    }

    function resetGame() {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
        playerReset();
    }

    fillQueue();
    drawNextTetrominoes();
}

initializeGame();
