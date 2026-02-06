const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d')

const player = {
    x: 50,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    velocityY: 0, // toucher ce parametre et celui en dessous pour verifier si le saut parait correct ou non
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



document.addEventListener('keydown', function(event) {
    if(event.code == 'Space' && !player.isJumping) {
        player.velocityY = -20;
        player.isJumping = true;
    } 
});

const obstacles = [];

function createObstacle(){
    const obstacle = {
        x: canvas.width,
        y: canvas.height - 60,
        width: 50,
        height: 50, 
        speed: 6 + score * 0.05
    };
    obstacles.push(obstacle);
}

function drawObstacles() {
    ctx.fillStyle = '#0000000';
    obstacles.forEach(obstacles => { ctx.fillRect(obstacles.x, obstacles.y, obstacles.width, obstacles.height);

    });
}

function updateObstacles() {
    obstacles.forEach( (obstacle, index) => { 
        obstacle.x -= obstacle.speed;

        // Retirer l'obstacle quand il sort de l'écran
        if(obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
            score += 1;
        }
    });
}





function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updatePlayer();
    drawPlayer();

    drawPlayer();
    drawObstacles();

    if(Math.random() < 0.01) { // 1% de chance d'apparition d'obstacle par frame
        createObstacle();
    }

    requestAnimationFrame(gameLoop);
}