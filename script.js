function initializeGame() {
    const canvas = document.getElementById('tetris');
    const context = canvas.getContext('2d');
    context.scale(20, 20);
    let gameStarted = false;
    let gamePaused = false;

    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartTime = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
    });

    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        const touchDuration = Date.now() - touchStartTime;

        if (touchDuration < 200) {
            playerRotate(1);
        } else {
            handleSwipe();
        }
    });

    function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;
        const swipeThreshold = 30;

        if (swipeDistance > swipeThreshold) {
            playerMove(1);
        } else if (swipeDistance < -swipeThreshold) {
            playerMove(-1);
        }
    }

    function pauseGame() {
        if (gamePaused) {
            gamePaused = false;
            document.getElementById('pauseButton').innerText = 'Pause';
        } else {
            gamePaused = true;
            document.getElementById('pauseButton').innerText = 'Resume';
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

    function arenaSweep() {
        let rowCount = 0;
        let lineClearPoints = 0;

        for (let y = arena.length - 1; y >= 0; --y) {
            if (arena[y].every(cell => cell !== 0)) {
                const removedRow = arena.splice(y, 1)[0].fill(0);
                arena.unshift(removedRow);
                rowCount++;
                y++;

                if (rowCount == 1) {
                    lineClearPoints = 500;
                } else if (rowCount == 2) {
                    lineClearPoints = 1000;
                }
            }
        }

        player.score += lineClearPoints;
    }

    function collide(arena, player) {
        const m = player.matrix;
        const o = player.pos;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    function createPiece(type) {
        if (type === 'I') {
            return [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
            ];
        } else if (type === 'L') {
            return [
                [0, 2, 0],
                [0, 2, 0],
                [0, 2, 2],
            ];
        } else if (type === 'J') {
            return [
                [0, 3, 0],
                [0, 3, 0],
                [3, 3, 0],
            ];
        } else if (type === 'O') {
            return [
                [4, 4],
                [4, 4],
            ];
        } else if (type === 'Z') {
            return [
                [5, 5, 0],
                [0, 5, 5],
                [0, 0, 0],
            ];
        } else if (type === 'S') {
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ];
        } else if (type === 'T') {
            return [
                [0, 7, 0],
                [7, 7, 7],
                [0, 0, 0],
            ];
        }
    }

    document.getElementById('startButton').addEventListener('click', () => {
        if (gameStarted) {
            arena.forEach(row => row.fill(0));
            player.score = 0;
            updateScore();
            playerReset();
        } else {
            gameStarted = true;
            startGame();
        }
    });

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

    function createMatrix(w, h) {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    }

    function draw() {
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        drawMatrix(arena, { x: 0, y: 0 });
        drawMatrix(player.matrix, player.pos);
    }

    function clearCanvas() {
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    context.fillStyle = colors[value];
                    context.fillRect(x + offset.x, y + offset.y, 1, 1);

                    if ((x + y) % 2 === 0) {
                        context.fillStyle = shadeColor(colors[value], -10);
                        context.fillRect(x + offset.x, y + offset.y, 1, 1);
                    }

                    context.strokeStyle = '#333';
                    context.lineWidth = 0.05;
                    context.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    }

    function shadeColor(color, percent) {
        var R = parseInt(color.substring(1, 3), 16);
        var G = parseInt(color.substring(3, 5), 16);
        var B = parseInt(color.substring(5, 7), 16);

        R = parseInt((R * (100 + percent)) / 100);
        G = parseInt((G * (100 + percent)) / 100);
        B = parseInt((B * (100 + percent)) / 100);

        R = R < 255 ? R : 255;
        G = G < 255 ? G : 255;
        B = B < 255 ? B : 255;

        var RR = (R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16);
        var GG = (G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16);
        var BB = (B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16);

        return "#" + RR + GG + BB;
    }

    function merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
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
    }

    function playerMove(offset) {
        player.pos.x += offset;
        if (collide(arena, player)) {
            player.pos.x -= offset;
        }
    }

    function playerReset() {
        const pieces = 'TJLOSZI';
        player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
        player.pos.y = 0;
        player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

        if (collide(arena, player)) {
            arena.forEach(row => row.fill(0));
            player.score = 0;
            updateScore();
        } else {
            player.score += 50;
            updateScore();
        }
    }

    function playerRotate(dir) {
        const pos = player.pos.x;
        let offset = 1;
        rotate(player.matrix, dir);
        while (collide(arena, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -dir);
                player.pos.x = pos;
                return;
            }
        }
    }

    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;

    function updateScore() {
        document.getElementById('score').innerText = player.score;
    }

    function rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

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

    document.getElementById('pauseButton').addEventListener('click', pauseGame);

    function startGame() {
        playerReset();
        updateScore();
        update();
    }
}

initializeGame();
