const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 800;
const collisionCanvas = document.getElementById('collisionCanvas');
const collisionCtx = collisionCanvas.getContext('2d');
collisionCanvas.width = canvas.width;
collisionCanvas.height = canvas.height;

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
document.addEventListener('mousedown', mouseDownHandler);
document.addEventListener('mouseup', mouseUpHandler);
document.addEventListener('auxclick', mouseClickHandler);

//helper variables
let timeToNextFrame = 0;
let lastTime = 0;
let randomX = Math.floor(Math.random() * (canvas.width - 50));
let randomY = Math.floor(Math.random() * (canvas.height - 50));

//ui variables
let currentWave = 1;
let wavesThisLevel = 3;
let enemiesDefeated = 0;
let enemiesThisWave = 5;
let abilityIcon; //for ability icon class and initialize function
let shootIcon;
let dashImage = 'dash.png';
let flipTurnImage = 'flipturn.png';
let rollImage = 'roll.png';
let bulletImage = 'bullet.png'
let laserImage = 'laser.png'
let biteImage = 'bite.png'
let moveAbilityX = 75;
let moveAbilityY = 725;
let shootAbilityX = 25;
let shootAbilityY = 725;

//player variables
let startingX = canvas.width / 2;
let startingY = canvas.height / 2;
let moveSpeed = 3;
let killCount = 0;
let playerHealth = 10;
let knockbackForce = 25;
let invulnTimer = 1500;
let nextInvuln = 0;
let isInvuln = false;

//dash variables (for jet Propulsion)
let jetChosen = false;
let dashCooldown = 3000;
let dashModifier = 2;
let dashDistance = 20;
let canDash = false; //turns true if player chooses jet propulsion
let jetTurnSpeed = 0.025
let jetMoveSpeed = 4;

//flipTurn variables (for Flagella)
let flagellaChosen = true;
let canFlipTurn = false;
let flipCooldown = 3000;
let flipModifier = 1.5;
let flipDistance = 10;

//dodgeRoll vairables (for Fins)
let finsChosen = false;
let finDegree = 0.1;
let finTurnSpeed = 0.1;
let finMoveSpeed = 2;
let canRoll = false;
let rollCooldown = 3000;

//turning variables
let degree = 0.5;
let rotation = (degree * Math.PI) / 180;
let angle = 0;
let turnSpeed = 0.05;

//player bullet variables
let filterMouth = true;
let bulletSpeed = 1.75;
let bulletRadius = 20;
let bulletDistance = 200;
let bulletDamage = 1;
let bulletForgiveness = 10; //increases hitbox of bullets.
let bulletSpawnTimer = null;
let nextShootTime = 0;
let bulletCooldown = 400;
let isShooting = false;

//player laser variables
let proboscusMouth = false;

//player bite variables
let mandibleMouth = false;

//controls
let moveRight = ['ArrowRight', 'KeyD'];
let moveLeft = ['ArrowLeft', 'KeyA'];
let moveUp = ['ArrowUp', 'KeyW'];
let moveDown = ['ArrowDown', 'KeyS'];
let shootButton = 0; //main mouse button
let dashMouse = 1; //middle mouse button
let pauseButton = 'KeyP';

//control switches
let rightPressed = false;
let leftPressed = false;
let upPressed = false;
let downPressed = false;
let shootPressed = false;
let dashPressed = false;
let isPaused = false;

//Pause handling
let pauseStartTime = 0;

//enemy handling
let spawnTimer = 3000;
let enemyMax = 3;
let enemiesSpawned = 0;

function keyDownHandler(event) {
    if (moveRight.includes(event.code)) {
        rightPressed = true;
    } else if (moveLeft.includes(event.code)) {
        leftPressed = true;
    }
    if (moveDown.includes(event.code)) {
        downPressed = true;
    } else if (moveUp.includes(event.code)) {
        upPressed = true;
    }
    if (event.code === pauseButton && !isPaused) {
        isPaused = true;
        pauseStartTime = performance.now();
    } else if (event.code === pauseButton && isPaused) {
        isPaused = false;
        let pauseDuration = performance.now() - pauseStartTime;
        player.nextMoveTime += pauseDuration;
        nextInvuln += pauseDuration;
        enemies.forEach(enemy => {
            enemy.nextMoveTime += pauseDuration;
            enemy.nextShootTime += pauseDuration;
            enemy.nextBulletTime += pauseDuration;
        })
    }
}

function keyUpHandler(event) {
    if (moveRight.includes(event.code)) {
        rightPressed = false;
    } else if (moveLeft.includes(event.code)) {
        leftPressed = false;
    }
    if (moveDown.includes(event.code)) {
        downPressed = false;
    } else if (moveUp.includes(event.code)) {
        upPressed = false;
    }
}

function mouseDownHandler(event) {
    if (event.button === 0) {
        if (filterMouth) {
            if (performance.now() >= nextShootTime) {
                let bullet = new Bullet;
                bullets.push(bullet)
                bullet.draw(ctx);
                nextShootTime = performance.now() + bulletCooldown;
                bulletSpawnTimer = setInterval(function () {
                    let bullet = new Bullet;
                    bullets.push(bullet)
                    bullet.draw(ctx);
                    nextShootTime = performance.now() + bulletCooldown;
                }, bulletCooldown)
            }
        }
        if (proboscusMouth) {
            return;
        }
        if (mandibleMouth) {
            return;
        }
        
    }
}

function mouseUpHandler(event) {
    if (event.button === 0) {
        clearInterval(bulletSpawnTimer)
    }
}

function drawPause() {
    //draws Pause overlay
}

class AbilityIcon {
    constructor(x, y, image, progressFunction){
        this.x = x;
        this.y = y;
        this.image = new Image();
        this.image.src = image;
        this.width = 50;
        this.height = 50;
        this.getProgress = progressFunction;
        this.centerX = this.x + 25;
        this.centerY = this.y + 25;
        this.startAngle = -Math.PI / 2;
        this.radius = this.width / 2;
    }
    update(){

    }
    draw(){
        let progress = Math.max(0, Math.min(1, this.getProgress()));
        let endAngle = -Math.PI / 2 + (2 * Math.PI * progress)
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height)
        ctx.globalAlpha = progress;
        ctx.fillStyle = 'black';
        ctx.beginPath()
        ctx.moveTo(this.centerX, this.centerY)
        ctx.arc(this.centerX, this.centerY, this.radius, this.startAngle, endAngle)
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Player {
    constructor(x, y){
        this.height = 50;
        this.width = 50;
        this.x = startingX;
        this.y = startingY;
        this.angle = angle;
        this.directionX = Math.cos(this.angle);
        this.directionY = Math.sin(this.angle);
        this.image = new Image();
        this.image.src = 'fish.png'
        this.centerX = (this.x + this.width) - 25
        this.centerY = (this.y + this.height) - 25
        this.moveX = Math.cos(this.angle) * moveSpeed;
        this.moveY = Math.sin(this.angle) * moveSpeed;
        this.nextMoveTime = 0;
    }
    update(){
        if (performance.now() >= nextInvuln) isInvuln = false;

        if (playerHealth <= 0) {
            //gameover
            
        }
        //movement logic
        if (rightPressed && !leftPressed) {
            if (!finsChosen){
                this.angle += turnSpeed;
            } else if (finsChosen){
                this.angle += finTurnSpeed;
            }
        } else if (leftPressed && !rightPressed) {
            if (!finsChosen){
                this.angle -= turnSpeed;
            } else if (finsChosen){
                this.angle -= finTurnSpeed;
            }
        }

        this.moveX = Math.sin(this.angle) * moveSpeed;
        this.moveY = -Math.cos(this.angle) * moveSpeed;

        this.directionX = Math.cos(this.angle);
        this.directionY = Math.sin(this.angle);

        
        if (downPressed && jetChosen) {
            if ((this.x - this.moveX) > 0 
            && (this.x - this.moveX) < canvas.width - this.width 
            && (this.y - this.moveY) > 0 
            && (this.y - this.moveY) < canvas.height - this.height) {
                this.y -= this.moveY / dashModifier;
                this.x -= this.moveX / dashModifier;
                this.centerX -= this.moveX / dashModifier;
                this.centerY -= this.moveY / dashModifier;
            }
        } 
        
        if (downPressed) {
            if ((this.x - this.moveX) > 0 
            && (this.x - this.moveX) < canvas.width - this.width 
            && (this.y - this.moveY) > 0 
            && (this.y - this.moveY) < canvas.height - this.height) {  
                this.y -= this.moveY;
                this.x -= this.moveX;
                this.centerX -= this.moveX;
                this.centerY -= this.moveY;
        }} else if (upPressed) {
            if ((this.x + this.moveX) > 0 
            && (this.x + this.moveX) < canvas.width - this.width 
            && (this.y + this.moveY) > 0 
            && (this.y + this.moveY) < canvas.height - this.height) {
                this.y += this.moveY;
                this.x += this.moveX;
                this.centerX += this.moveX;
                this.centerY += this.moveY;
        }}

        //movement skill timing logic
        if (jetChosen) {
            if (!canDash) {
                if (performance.now() >= this.nextMoveTime){
                    canDash = true;
                }
            }
        }

        if (finsChosen) {
            if (!canRoll) {
                if (performance.now() >= this.nextMoveTime){
                    canRoll = true;
                }
            }
        }

        if (flagellaChosen) {
            if (!canFlipTurn) {
                if (performance.now() >= this.nextMoveTime){
                    canFlipTurn = true;
                }
            }
        }


    }
    draw(ctx){
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.angle);
        ctx.translate(-this.centerX, -this.centerY);
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        ctx.restore();
    }
    takeDamage(x, y, damage) {
        if (isInvuln) return;
        playerHealth -= damage;
        let dx = x - this.centerX;
        let dy = y - this.centerY;
        let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
        if (distance === 0) return;
        let towardX = dx / distance;
        let towardY = dy / distance;

        if ((this.x - towardX * knockbackForce) > 0 
            && (this.x - towardX * knockbackForce) < canvas.width - this.width 
            && (this.y - towardY * knockbackForce) > 0 
            && (this.y - towardY * knockbackForce) < canvas.height - this.height) {
            this.x -= towardX * knockbackForce
            this.y -= towardY * knockbackForce
            this.centerX = (this.x + this.width) - 25;
            this.centerY = (this.y + this.height) - 25;
        }

        isInvuln = true;
        nextInvuln = performance.now() + invulnTimer;
    }
}

let player = new Player();
let bullets = [];

const enemyPresets = {
    normal: {health: 2, moveSpeed: 2, image: 'normal.png', moveInterval: 2000, range: 200, bulletInterval: 400, bulletAmount: 1, bulletWaves: 3, shootInterval: 4000, bulletTravel: bulletDistance, damage: 1}, //normal shooting pattern and movement.
    barracuda: {health: 1, moveSpeed: 6, image: 'barracuda.png', moveInterval: 2000, range: 600, bulletInterval: 0, bulletAmount: 0, bulletWaves: 0, shootInterval: 0, bulletTravel: 0, damage: 5}, //fast, charges, no shooting.
    puffer: {health: 5, moveSpeed: 1, image: 'puffer.png', moveInterval: 3000, range: 100, bulletInterval: 800, bulletAmount: 8, bulletWaves: 4, shootInterval: 5000, bulletTravel: 400, damage: 3}, //doesn't move, turns to player and shoots when within distance
}

const bulletPresets = {
    normal: {damage: 1, moveSpeed: 4, image: 'bubble.png'},
    puffer: {damage: 2, moveSpeed: 1.5, image: 'needle.png'},
}
let enemies = [];
let enemyBullets = [];

class Bullet {
    constructor() {
        this.width = 20;
        this.height = 20;
        this.damage = bulletDamage;
        this.x = player.centerX - this.width/2
        this.y = player.centerY - this.height/2
        this.moveSpeed = player.moveSpeed * bulletSpeed;
        this.radius = bulletRadius;
        this.image = new Image()
        this.image.src = 'bubble.png'
        this.angle = player.angle;
        this.moveX = player.moveX;
        this.moveY = player.moveY;
        this.distance = bulletDistance;
        this.markedForDeletion = false;
        this.startX = player.centerX;
        this.startY = player.centerY;
        this.centerX = (this.x + this.width/2);
        this.centerY = (this.y + this.height/2);
        this.distanceX = Math.abs(this.x - this.startX);
        this.distanceY = Math.abs(this.y - this.startY);
    }
    update(){
        this.x += this.moveX * bulletSpeed;
        this.y += this.moveY * bulletSpeed;
        this.centerX = (this.x + this.width/2);
        this.centerY = (this.y + this.height/2);
        if (this.distanceX >= this.distance || this.distanceY >= this.distance) this.markedForDeletion = true
        if (this.x < 0 - this.width || this.x > canvas.width - this.width) this.markedForDeletion = true;
        if (this.y < 0 - this.height || this.y > canvas.height - this.height) this.markedForDeletion = true;
    }
    draw(ctx){
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        this.distanceX = Math.abs(this.x - this.startX);
        this.distanceY = Math.abs(this.y - this.startY);
    }
}

class EnemyBullet {
    constructor(x, y, bulletTravel, type, angle, moveX, moveY) {
        const preset = bulletPresets[type] || bulletPresets.normal

        this.width = 20;
        this.height = 20;
        this.x = x
        this.y = y
        this.damage = preset.damage;
        this.moveSpeed = preset.moveSpeed;
        this.radius = bulletRadius;
        this.image = new Image()
        this.image.src = preset.image;
        this.angle = angle;
        this.moveX = moveX;
        this.moveY = moveY;
        this.bulletTravel = bulletTravel;
        this.markedForDeletion = false;
        this.startX = this.x;
        this.startY = this.y;
        this.centerX = (this.x + this.width/2);
        this.centerY = (this.y + this.height/2);
        this.distanceX = Math.abs(this.x - this.startX);
        this.distanceY = Math.abs(this.y - this.startY);
    }
    update(){
        this.x += this.moveX * this.moveSpeed;
        this.y += this.moveY * this.moveSpeed;
        this.centerX = (this.x + this.width/2);
        this.centerY = (this.y + this.height/2);
        if (this.distanceX >= this.bulletTravel || this.distanceY >= this.bulletTravel) this.markedForDeletion = true
        if (this.x < 0 - this.width || this.x > canvas.width - this.width) this.markedForDeletion = true;
        if (this.y < 0 - this.height || this.y > canvas.height - this.height) this.markedForDeletion = true;
    }
    draw(ctx){
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.angle);
        ctx.translate(-this.centerX, -this.centerY);
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        ctx.restore();
        this.distanceX = Math.abs(this.x - this.startX);
        this.distanceY = Math.abs(this.y - this.startY);
    }
}

class Enemy {
    constructor(type, x, y){
        const preset = enemyPresets[type] || enemyPresets.normal

        this.type = type;
        this.health = preset.health;
        this.moveSpeed = preset.moveSpeed;
        this.moveInterval = preset.moveInterval; 
        this.range = preset.range;
        this.bulletInterval = preset.bulletInterval;
        this.bulletAmount = preset.bulletAmount;
        this.bulletWaves = preset.bulletWaves;
        this.bulletTravel = preset.bulletTravel;
        this.shootInterval = preset.shootInterval;
        this.nextBulletTime = 0;
        this.nextShootTime = 0;
        this.wavesFired = 0;
        this.damage = preset.damage;

        this.state = this.type === 'puffer' ? 'shooting' : 'patrolling'; //patrolling, attacking, shooting

        this.width = 50;
        this.height = 50;
        this.x = x;
        this.y = y;
        this.centerX = (this.x + this.width) - 25;
        this.centerY = (this.y + this.height) - 25;
        this.targetX = player.centerX;
        this.targetY = player.centerY;
        this.dx = this.targetX - this.centerX;
        this.dy = this.targetY - this.centerY;
        this.angle = (Math.atan2(this.dy, this.dx)) + (Math.PI / 2);
        this.facingAngle = (Math.atan2(this.dy, this.dx)); //For bullet calculations
        this.directionX = Math.cos(this.angle);
        this.directionY = Math.sin(this.angle);
        this.image = new Image();
        this.image.src = preset.image;
        this.moveX = Math.cos(this.angle) * this.moveSpeed;
        this.moveY = Math.sin(this.angle) * this.moveSpeed;
        this.nextMoveTime = this.moveInterval;
        this.distance = Math.floor(Math.sqrt(this.dx * this.dx + this.dy * this.dy));
        this.towardX = this.dx / this.distance;
        this.towardY = this.dy / this.distance;
        this.randomX = Math.floor(Math.random() * (canvas.width - 50));
        this.randomY = Math.floor(Math.random() * (canvas.height - 50));

        this.isAlive = true;
        this.isMoving = false;
        this.inRange = false;
        this.inShootRange = false;
        this.isShooting = false;
        this.isPatrolling = false;
    }
    update(){
        // this.dx = this.targetX - this.centerX;
        // this.dy = this.targetY - this.centerY;

        //health check
        if (this.health <= 0) {
            this.isAlive = false;
        }

        this.updateRangeChecks();

        if (this.state === 'attacking') {
            if (this.type !== 'barracuda') {
                this.turnTowardPlayer();
            }
            this.updateAttacking();
        }
        if (this.state === 'shooting') {
            this.turnTowardPlayer();
            this.updateShooting();
        }
        if (this.state === 'patrolling' && this.type !== 'puffer') this.updatePatrolling();

    }
    draw(ctx){
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.angle);
        ctx.translate(-this.centerX, -this.centerY);
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        ctx.restore();
    }
    moveTowardPlayer(){
        if ((this.x - this.towardX) > 0 
        && (this.x - this.towardX) < canvas.width - this.width 
        && (this.y - this.towardY) > 0 
        && (this.y - this.towardY) < canvas.height - this.height) {
            let dx = this.targetX - this.centerX;
            let dy = this.targetY - this.centerY;
            this.angle = (Math.atan2(dy, dx)) + (Math.PI / 2);
            this.facingAngle = (Math.atan2(this.dy, this.dx));
            this.distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
            if (this.distance === 0) return;
            this.towardX = dx / this.distance;
            this.towardY = dy / this.distance;

            if ((this.distance < 100 && this.type === 'normal') || (this.distance < 10 && this.type === 'barracuda')) {
                this.inRange = false;
            } else if ((this.distance >= 100 && this.type === 'normal') || (this.distance >= 10 && this.type === 'barracuda')) {
                this.x += this.towardX * this.moveSpeed;
                this.y += this.towardY * this.moveSpeed;
                this.centerX = (this.x + this.width) - 25;
                this.centerY = (this.y + this.height) - 25;
            } 
        } else {
            this.nextMoveTime = performance.now() + this.moveInterval;
        }
    }
    turnTowardPlayer(){
        this.targetX = player.centerX;
        this.targetY = player.centerY;
        this.dx = this.targetX - this.centerX;
        this.dy = this.targetY - this.centerY;
        this.angle = (Math.atan2(this.dy, this.dx)) + (Math.PI / 2);
        this.facingAngle = (Math.atan2(this.dy, this.dx));
    }
    shootBullet(){
        this.turnTowardPlayer()
        let dx = this.targetX - this.centerX;
        let dy = this.targetY - this.centerY;
        let angle = (Math.atan2(dy, dx))// + (Math.PI / 2);
        this.distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
        this.towardX = dx / this.distance;
        this.towardY = dy / this.distance;
        if (this.bulletAmount === 1) {
            let bullet = new EnemyBullet(this.centerX - 10, this.centerY - 10, this.bulletTravel, this.type, angle, this.towardX, this.towardY);
            enemyBullets.push(bullet)
            bullet.draw(ctx)
        } else {
            for (let i = 0; i < this.bulletAmount; i++) {
                angle = ((2 * Math.PI / this.bulletAmount) * i) + this.facingAngle;
                this.towardX = Math.cos(angle);
                this.towardY = Math.sin(angle);
                let bullet = new EnemyBullet(this.centerX - 10, this.centerY - 10, this.bulletTravel, this.type, angle, this.towardX, this.towardY);
                enemyBullets.push(bullet)
                bullet.draw(ctx)
            }
        }
        this.wavesFired += 1
        this.nextBulletTime = performance.now() + this.bulletInterval
        if (this.wavesFired >= this.bulletWaves) {
            this.wavesFired = 0;
            this.nextShootTime = performance.now() + this.shootInterval;
            if (this.type !== 'puffer') this.state = 'patrolling'
        }
    }
    updateRangeChecks(){
        this.dx = player.centerX - this.centerX;
        this.dy = player.centerY - this.centerY;
        this.inRange = Math.abs(this.dx) <= this.range && Math.abs(this.dy) <= this.range;
        this.inShootRange = Math.abs(this.dx) <= this.bulletTravel && Math.abs(this.dy) <= this.bulletTravel;
    }
    updatePatrolling(){
        //transition to shooting
        if (this.inShootRange && this.type !== 'barracuda') {
            this.state = 'shooting';
            return;
        }
        //transition to attacking
        if ((this.inRange || this.type === 'barracuda') && this.type !== 'puffer') {
            this.state = 'attacking';
            return;
        }
        //pick a target
        if (performance.now() >= this.nextMoveTime) {
            this.randomX = Math.floor(Math.random() * (canvas.width - 50));
            this.randomY = Math.floor(Math.random() * (canvas.height - 50));
            this.targetX = this.randomX;
            this.targetY = this.randomY;
            this.nextMoveTime = performance.now() + this.moveInterval
        }
        this.moveTowardPlayer();
    }
    updateShooting(){
        //transition to patrolling
        if (!this.inShootRange && this.wavesFired === 0){
            if (this.type === 'puffer') return;
            this.state = 'patrolling';
            return;
        }
        if (performance.now() < this.nextShootTime) {
            return;
        }
        if (performance.now() >= this.nextBulletTime) {
            this.shootBullet();
        }
    }
    updateAttacking(){
        //transition to patrolling
        if (!this.inRange){
            this.state = 'patrolling';
            return;
        }
        //transition to shooting
        if (this.inShootRange && this.type !== 'barracuda') {
            this.state = 'shooting';
            return;
        }
        //chase player
        if (performance.now() >= this.nextMoveTime) {
            this.targetX = player.centerX;
            this.targetY = player.centerY;
            this.nextMoveTime = performance.now() + this.moveInterval
        }
        this.moveTowardPlayer();
        
    }
}

function triggerDash() {
    if (canDash && jetChosen) {
        if (upPressed) {
            if ((player.x + player.moveX * dashDistance) > 0 
                && (player.x + player.moveX * dashDistance) < canvas.width - player.width 
                && (player.y + player.moveY * dashDistance) > 0 
                && (player.y + player.moveY * dashDistance) < canvas.height - player.height) {
                player.y += (player.moveY * dashModifier) * dashDistance;
                player.x += (player.moveX * dashModifier) * dashDistance;
                player.centerX += (player.moveX * dashModifier) * dashDistance;
                player.centerY += (player.moveY * dashModifier) * dashDistance;
            }
        } else if (downPressed) {
            if ((player.x - player.moveX * dashDistance) > 0 
                && (player.x - player.moveX * dashDistance) < canvas.width - player.width 
                && (player.y - player.moveY * dashDistance) > 0 
                && (player.y - player.moveY * dashDistance) < canvas.height - player.height) {
                player.y -= (player.moveY * dashModifier) * dashDistance;
                player.x -= (player.moveX * dashModifier) * dashDistance;
                player.centerX -= (player.moveX * dashModifier) * dashDistance;
                player.centerY -= (player.moveY * dashModifier) * dashDistance;
            }
        } else {
            if ((player.x + player.moveX * dashDistance) > 0 
                && (player.x + player.moveX * dashDistance) < canvas.width - player.width 
                && (player.y + player.moveY * dashDistance) > 0 
                && (player.y + player.moveY * dashDistance) < canvas.height - player.height) {
                player.y += (player.moveY * dashModifier) * dashDistance;
                player.x += (player.moveX * dashModifier) * dashDistance;
                player.centerX += (player.moveX * dashModifier) * dashDistance;
                player.centerY += (player.moveY * dashModifier) * dashDistance;
            }
        }
        canDash = false;
        player.nextMoveTime = performance.now() + dashCooldown;
    }
    if (canFlipTurn && flagellaChosen) {
        if (upPressed || downPressed) {
            if ((player.x - player.moveX * flipDistance) > 0 
                && (player.x - player.moveX * flipDistance) < canvas.width - player.width 
                && (player.y - player.moveY * flipDistance) > 0 
                && (player.y - player.moveY * flipDistance) < canvas.height - player.height) {
                player.y -= (player.moveY * flipModifier) * flipDistance;
                player.x -= (player.moveX * flipModifier) * flipDistance;
                player.centerX -= (player.moveX * flipModifier) * flipDistance;
                player.centerY -= (player.moveY * flipModifier) * flipDistance;
                player.angle += Math.PI;
                player.moveX = Math.sin(player.angle) * moveSpeed;
                player.moveY = Math.cos(player.angle) * moveSpeed;
            }
        } else {
            if ((player.x - player.moveX * flipDistance) > 0 
                && (player.x - player.moveX * flipDistance) < canvas.width - player.width 
                && (player.y - player.moveY * flipDistance) > 0 
                && (player.y - player.moveY * flipDistance) < canvas.height - player.height) {
                player.y -= (player.moveY * flipModifier) * flipDistance;
                player.x -= (player.moveX * flipModifier) * flipDistance;
                player.centerX -= (player.moveX * flipModifier) * flipDistance;
                player.centerY -= (player.moveY * flipModifier) * flipDistance;
                player.angle += Math.PI;
                player.moveX = Math.sin(player.angle) * moveSpeed;
                player.moveY = Math.cos(player.angle) * moveSpeed;
            }
        }
        canFlipTurn = false;
        player.nextMoveTime = performance.now() + dashCooldown;
    }
    if (canRoll && finsChosen) {
        if (upPressed) {
            if ((player.x + player.moveX * dashDistance) > 0 
                && (player.x + player.moveX * dashDistance) < canvas.width - player.width 
                && (player.y + player.moveY * dashDistance) > 0 
                && (player.y + player.moveY * dashDistance) < canvas.height - player.height) {
                player.y += (player.moveY * dashModifier) * dashDistance;
                player.x += (player.moveX * dashModifier) * dashDistance;
                player.centerX += (player.moveX * dashModifier) * dashDistance;
                player.centerY += (player.moveY * dashModifier) * dashDistance;
            }
        } else if (downPressed) {
            if ((player.x - player.moveX * dashDistance) > 0 
                && (player.x - player.moveX * dashDistance) < canvas.width - player.width 
                && (player.y - player.moveY * dashDistance) > 0 
                && (player.y - player.moveY * dashDistance) < canvas.height - player.height) {
                player.y -= (player.moveY * dashModifier) * dashDistance;
                player.x -= (player.moveX * dashModifier) * dashDistance;
                player.centerX -= (player.moveX * dashModifier) * dashDistance;
                player.centerY -= (player.moveY * dashModifier) * dashDistance;
            }
        } else {
            if ((player.x + player.moveX * dashDistance) > 0 
                && (player.x + player.moveX * dashDistance) < canvas.width - player.width 
                && (player.y + player.moveY * dashDistance) > 0 
                && (player.y + player.moveY * dashDistance) < canvas.height - player.height) {
                player.y += (player.moveY * dashModifier) * dashDistance;
                player.x += (player.moveX * dashModifier) * dashDistance;
                player.centerX += (player.moveX * dashModifier) * dashDistance;
                player.centerY += (player.moveY * dashModifier) * dashDistance;
            }
        }
        canRoll = false;
        player.nextMoveTime = performance.now() + dashCooldown;
    }
}

function mouseClickHandler(event) {
    if (event.button === 1) {
        triggerDash();
    }
}

function enemySpawner(){
    if (enemiesSpawned >= enemiesThisWave) return
    if (performance.now() >= spawnTimer && enemies.length < enemyMax) {
    let randEnemy = Math.floor(Math.random() * 3);
    randomX = Math.floor(Math.random() * (canvas.width - 50));
    randomY = Math.floor(Math.random() * (canvas.height - 50));
    let enemyChoice = '';
    if (randEnemy === 0) {
        enemyChoice = 'normal';
    } else if (randEnemy === 1 && (enemies.length > 2 || enemiesSpawned > 3)) {
        enemyChoice = 'barracuda';
    } else if (randEnemy === 2 && (enemies.length > 1 || enemiesSpawned > 2)) {
        enemyChoice = 'puffer';
    } else {
        enemyChoice = 'normal';
    }
    let enemy = new Enemy(enemyChoice, randomX, randomY);
    enemiesSpawned += 1;
    enemies.push(enemy);
    enemy.draw(ctx);
    }
}

function checkPlayerBullets(){
    //check if player's bullets hit an enemy and subtract damage from health
    for (bullet of bullets) {
        for (enemy of enemies) {
            let dx = bullet.centerX - enemy.centerX;
            let dy = bullet.centerY - enemy.centerY;
            let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
            if (distance < bullet.radius + bulletForgiveness) {
                bullet.markedForDeletion = true;
                enemy.health -= bullet.damage;
            }
        }
    }
}

function checkEnemyBullets(){
    for (bullet of enemyBullets) {
        let dx = bullet.centerX - player.centerX;
        let dy = bullet.centerY - player.centerY;
        let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
        if (distance < bullet.radius) {
            bullet.markedForDeletion = true;
            if (isInvuln) return
            player.takeDamage(bullet.centerX, bullet.centerY, bullet.damage);
        }
    }
}

function checkCollision(){
    for (enemy of enemies) {
        let dx = enemy.centerX - player.centerX;
        let dy = enemy.centerY - player.centerY;
        let distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
        if (distance <= player.width / 2) {
            if (isInvuln) return;
            player.takeDamage(enemy.centerX, enemy.centerY, enemy.damage);
        }
    }
}

function animate(timestamp){
    if (isPaused) {
        //draw pause overlay;
        requestAnimationFrame(animate);
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let deltatime = timestamp - lastTime;
    lastTime = timestamp;
    timeToNextFrame += deltatime;
    if (timeToNextFrame > spawnTimer){
        enemySpawner();
        timeToNextFrame = 0;
    }
    player.draw(ctx);
    player.update();
    [...bullets, ...enemyBullets, ...enemies].forEach(object => object.update());
    [...bullets, ...enemyBullets, ...enemies].forEach(object => object.draw(ctx));
    checkPlayerBullets();
    checkEnemyBullets();
    checkCollision();
    bullets = bullets.filter(object => !object.markedForDeletion);
    enemyBullets = enemyBullets.filter(object => !object.markedForDeletion);
    enemies = enemies.filter(object => object.isAlive);
    abilityIcon.draw();
    shootIcon.draw();
    requestAnimationFrame(animate);
}

function initialize(){
    if (finsChosen){
        moveSpeed = finMoveSpeed;
        turnSpeed = finTurnSpeed;
        abilityIcon = new AbilityIcon(moveAbilityX, moveAbilityY, rollImage, () => {
            return (player.nextMoveTime - performance.now()) / rollCooldown;
        });
    } else if (jetChosen){
        moveSpeed = jetMoveSpeed;
        turnSpeed = jetTurnSpeed;
        abilityIcon = new AbilityIcon(moveAbilityX, moveAbilityY, dashImage, () => {
            return (player.nextMoveTime - performance.now()) / dashCooldown;
        });
    } else if (flagellaChosen){
        abilityIcon = new AbilityIcon(moveAbilityX, moveAbilityY, flipTurnImage, () => {
            return (player.nextMoveTime - performance.now()) / flipCooldown;
        });
    }
    if (filterMouth){
        shootIcon = new AbilityIcon(shootAbilityX, shootAbilityY, bulletImage, () => {
            return (nextShootTime - performance.now()) / bulletCooldown;
        });
    } else if (proboscusMouth){
        shootIcon = new AbilityIcon(shootAbilityX, shootAbilityY, laserImage, () => {
            return (nextShootTime - performance.now()) / bulletCooldown;
        });
    } else if (mandibleMouth){
        shootIcon = new AbilityIcon(shootAbilityX, shootAbilityY, biteImage, () => {
            return (nextShootTime - performance.now()) / bulletCooldown;
        });
    }
}
initialize()
animate(0)
