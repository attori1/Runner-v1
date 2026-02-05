const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d')

const player = {
    x: 50,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    velocityY: 0,
    gravity: 1.5,
    isJumping: false
};

// dessine le joueur comme un rectangle rouge
function drawPlayer(){
    ctx.fillStyle ='#FF0000';
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function updatePlayer() {
    player.y += player.velocityY;
    player.velocityY += player.gravity;

    // pour empecher le joueur de sortir du canvas
    if(player.y + player.height >= canvas.height - 10) {
        player.y = canvas.height - player.height - 10;
        player.isJumping = false;
        player.velocityY = 0;
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updatePlayer();
    drawPlayer();

    requestAnimationFrame(gameLoop);
}