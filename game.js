const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreCanvas = document.getElementById('scoreCanvas');
const scoreCtx = scoreCanvas.getContext('2d');
let score = 0;


function drawScore() {
    scoreCtx.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height);
    scoreCtx.fillStyle = '#000000';
    scoreCtx.font = '24px Arial';
    scoreCtx.fillText(`Score ${score}`, 10, 30); 
}

const player = {
    x: 50,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    velocityY: -100, // toucher ce parametre et celui en dessous pour verifier si le saut parait correct ou non
    gravity: 1.4,
    isJumping: false
};

// dessine le joueur comme un rectangle rouge
function drawPlayer(){
    ctx.fillStyle ='#FF0000';
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function updatePlayer(deltaTime) {
    player.y += player.velocityY * deltaTime * 0.016; // change la hauteur max du saut
    player.velocityY += player.gravity * deltaTime * 0.016; // change le temps dans les airs

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
    ctx.fillStyle = '#FF00FF';
    obstacles.forEach(obstacles => { ctx.fillRect(obstacles.x, obstacles.y, obstacles.width, obstacles.height);

    });
}

function updateObstacles(deltaTime) {
    obstacles.forEach( (obstacle, index) => { 
        obstacle.x -= obstacle.speed * deltaTime * 0.016;

        // Retirer l'obstacle quand il sort de l'écran
        if(obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
            score += 1;
        }
    });
}

function gameOver() {
    alert(`Game Over ! You scored ${score} points!`)
    // Reset le jeu : 
    obstacles.length = 0;
    score = 0;
    player.y = canvas.height - player.height - 10;
    player.velocityY = 0;
}

function checkCollision(){
    obstacles.forEach(obstacle => {
        if ( 
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y
        ) {
            gameOver();
        }
    })
}




// Methode delta time : 

let lastTime = 0;

function gameLoop(timestamp) {
    if(!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updatePlayer(deltaTime);
    updateObstacles(deltaTime);
    drawPlayer();
    drawObstacles();
    checkCollision();
    drawScore();

    if(Math.random() < 0.005) {
        createObstacle();
    }
    
    lastTime = timestamp;
    requestAnimationFrame(gameLoop);
}

/* methode 60 Fps

let lastTime = 0;
const fps = 60;
const fpsInterval = 1000 / fps;

function gameLoop(timestamp) {
    if(!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;

    if(elapsed > fpsInterval) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        updatePlayer(); 
        updateObstacles();

        drawPlayer();
        drawObstacles();

        checkCollision();

        if(Math.random() < 0.01) { // 1% de chance d'apparition d'obstacle par frame
           createObstacle(); 
        }

        lastTime = timestamp;
    }   
    
    requestAnimationFrame(gameLoop);
}
*/

requestAnimationFrame(gameLoop);
