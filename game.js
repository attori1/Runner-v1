const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d')


function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // game stuff later

    requestAnimationFrame(gameLoop);
}

const player = {
    x: 50,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    velocityY: 0,
    gravity: 1.5,
    isJumping: false
};

