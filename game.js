'use strict';
const cvs = document.querySelector('canvas');
const ctx = cvs.getContext('2d');

let frames = 0;
const degree = Math.PI/180;

// load sprite image
const sprite = new Image();
sprite.src='/img/sprite.png';

// sound
const scoreSnd = new Audio();
scoreSnd.src = 'audio/sfx_point.wav';

const flapSnd = new Audio();
flapSnd.src = 'audio/sfx_flap.wav';

const hit = new Audio();
hit.src = 'audio/sfx_hit.wav';

const swooshing = new Audio();
swooshing.src = 'audio/sfx_swooshing.wav';

const die = new Audio();
die.src = 'audio/sfx_die.wav'

// game state
const state = {
    current: 0,
    getReady: 0,
    game: 1,
    over: 2
};

const startBtn = {
    x: 120,
    y: 263, 
    w: 83,
    h:29
}

//control the game
cvs.addEventListener('click', function(evt) {
    switch(state.current) {
        case state.getReady:
            state.current = state.game;
            swooshing.play();
            break;
        case state.game:
            if(bird.y - bird.radius <= 0) return;
            bird.flap();
            flapSnd.play();
            break;
        case state.over:
            let rect = cvs.getBoundingClientRect();
            let clickX = evt.clientX - rect.left;
            let clickY = evt.clientY - rect.top;
    

            if(clickX >= startBtn.x && clickX <= startBtn.x + startBtn.w 
                && clickY >= startBtn.y && clickY <= startBtn.y + startBtn.h) {
                    pipes.reset();
                    bird.speedReset();
                    score.reset();

                    state.current = state.getReady;
                }
            break;          
    }
});

// add a game class
class GameBackground {
    constructor(sX, sY, w, h, x, y, dx = null) {
        this.sX = sX;
        this.sY = sY,
        this.w = w;
        this.h = h;
        this.x = x;
        this.y = y;
        this.dx = dx;
    }
    draw() {
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h); 
    }
    update() {
        if(state.current == state.game) {
            this.x = (this.x - this.dx) % (this.w/2);
        }
    }
}

// background
const bg = new GameBackground(0, 0, 275, 226, 0, cvs.height - 226);

//foreground
const fg = new GameBackground(276, 0, 224, 112, 0, cvs.height - 112, 2);
//bird
const bird = {
    animation: [
        {sX: 276, sY: 112},
        {sX: 276, sY: 139},
        {sX: 276, sY: 164},
        {sX: 276, sY: 139},
    ],

    x: 50,
    y: 150,
    w: 34,
    h: 26,

    radius: 12,
    
    frame: 0,

    gravity: 0.25,
    jump: 4.6,
    speed: 0,
    rotation:0,

    draw: function() {
        let bird = this.animation[this.frame];
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);        
        ctx.drawImage(sprite, bird.sX, bird.sY, this.w, this.h,  - this.w/2,  - this.h/2, this.w, this.h);
        ctx.restore();
    },
    
    flap: function() {
        this.speed = -this.jump;
    },
    update: function() {
        this.period = state.current == state.getReady? 10: 5;
        this.frame += frames%this.period == 0? 1: 0;
        this.frame = this.frame%this.animation.length;

        if(state.current == state.getReady) {
            this.y = 150;
            this.rotation = 0 * degree
        } else {
            this.speed += this.gravity; 
            this.y += this.speed;
            if(this.y + this.h/2 >= cvs.height - fg.h){
                this.y = cvs.height - fg.h - this.h/2;
                if(state.current == state.game) {
                    state.current = state.over;
                    die.play();
                }
            }
            if(this.speed >= this.jump) {
                this.rotation = 90 * degree;
                this.frame = 1;
            }else {
                this.rotation = -25 * degree;
            }
        }
        
    },
    speedReset: function() {
        this.speed = 0;
    }

}

// getReady and game over
const getReady = new GameBackground(0, 228, 173, 152, cvs.width/2 - 173/2, 80);
getReady.draw = function() {
    if(state.current == state.getReady) {
    ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
    };
};

const gameOver = new GameBackground(175, 228, 225, 202, cvs.width/2 - 225/2, 90);
gameOver.draw = function() {
    if(state.current == state.over) {
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        }
};


const pipes = {
    position: [],

    top: {
        sX: 553,
        sY: 0
    },
    bottom: {
        sX: 502,
        sY: 0
    },

    w: 53,
    h: 400,
    gap: 85,
    maxYpos: -150,
    dx: 2,

    draw: function() {
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];

            let topYpos = p.y;
            let bottomYpos = p.y + this.h + this.gap; 

            // top pipe
            ctx.drawImage(sprite, this.top.sX, this.top.sY, this.w, this.h, p.x, topYpos, this.w, this.h);

            // bottom pipe
            ctx.drawImage(sprite, this.bottom.sX, this.bottom.sY, this.w, this.h, p.x, bottomYpos, this.w, this.h);
        }
        },

    update: function() {
        if(state.current !== state.game) return;

        if(frames%100 == 0) {
            this.position.push({
                x: cvs.width,
                y: this.maxYpos * (Math.random() + 1)
            });
        }
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            
            let bottomPipeYpos = p.y + this.h + this.gap;

            // top pipe
            if(bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w 
               && bird.y + bird.radius > p.y && bird.y - bird.radius < p.y + this.h) {
                   state.current = state.over;
                   hit.play();
               }

            // bottom pipe    
            if(bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w 
                && bird.y + bird.radius > bottomPipeYpos && bird.y - bird.radius < bottomPipeYpos + this.h) {
                    state.current = state.over;
                    hit.play();
                }
            
            p.x -= this.dx;    
            
            // pipes pass over
            if(p.x + this.w <= 0) {
                this.position.shift();
                score.value += 1; 
                scoreSnd.play();
                score.best = Math.max(score.value, score.best);
                localStorage.setItem('best', score.best);
            }
        }
    },
    
    reset: function() {
        this.position = [];
    }
}

const score = {
    best: parseInt(localStorage.getItem('best')) || 0,
    value: 0,

    draw: function() {
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        
        if(state.current == state.game) {
            ctx.lineWidth = 2;
            ctx.font = '35px Teko';
            ctx.fillText(this.value, cvs.width/2, 50);
            ctx.strokeText(this.value, cvs.width/2, 50);
        }else if(state.current == state.over){
            // score
            ctx.font = '25px Teko';
            ctx.fillText(this.value, 225, 186);
            ctx.strokeText(this.value, 225, 186);
            // best score
            ctx.fillText(this.best, 225, 228);
            ctx.strokeText(this.best, 225, 228);
        }
    },
    reset: function() {
        this.value = 0;
    }
}


function draw() {
    ctx.fillStyle = '#70c5ce'
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    bg.draw();
    pipes.draw();
    fg.draw();
    bird.draw();
    getReady.draw();
    gameOver.draw();
    score.draw();
}

function update() {
    bird.update();
    fg.update();
    pipes.update();
}

function loop() {
    update();
    draw();
    frames++;

    requestAnimationFrame(loop);
}

loop();