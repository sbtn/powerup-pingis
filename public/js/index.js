// Player
const Player = function (element, sound) {
  this.el = element;
  this.score = 0;
  this.streak = 0;
  this.prevStreak = 0;
  this.scoreSound = sound;
};

Player.prototype.updateScore = function (val) {
  if (this.score + val >= 0) {
    this.score += 1 * val;

    if (val > 0) {
      this.scoreSound.play();
    }

    game.updateServeCounter(val);
  }

  this.el.classList.add('animated');
  this.updateStreak(val);
  renderScore(this);
  renderServe(game.players);
};

Player.prototype.updateStreak = function (val) {
  if (this.streak + val >= 0 && this.streak + val <= 3) {
    this.streak += val;
    const otherPlayer = this.getOtherPlayer();
    if (val > 0) {
      otherPlayer.loseStreak();
    } else {
      otherPlayer.restoreStreak();
    }
    renderStreak(otherPlayer);
  }
  renderStreak(this);
};

Player.prototype.getOtherPlayer = function () {
  return this === game.players[0] ? game.players[1] : game.players[0];
}

// Restore streak to other player if point given wrongly to player.
Player.prototype.loseStreak = function () {
  this.prevStreak = this.streak;
  this.streak = 0;
};

Player.prototype.restoreStreak = function () {
  this.streak = this.prevStreak;
};

const renderStreak = (player) => {
  player.el.querySelector('progress').setAttribute('value', player.streak);
};

const renderScore = (player) => {
  player.el.querySelector('h1').textContent = player.score;
};

const renderServe = (players) => {
  players.forEach((player) => {
    if (game.playerServing === player) {
      Array.from(player.el.querySelector('div.serve').children).forEach((child, i) => i < game.serveFreq ? child.classList.add('serving') : child.classList.remove('serving'));
    } else {
      Array.from(player.el.querySelector('div.serve').children).forEach((child) => child.classList.remove('serving'));
    }
  });
};

// GAME
const Game = function () {
  this.screen = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  this.players = [
    new Player(document.querySelector('.player_one'), document.getElementById('hadoken')),
    new Player(document.querySelector('.player_two'), document.getElementById('shoryuken')),
  ];

  this.playerServing = this.players[Math.round(Math.random())];
  this.serveFreq = 2;
  this.manualServeFreq = false;
  this.serveCounter = 0;
  this.gamePoint = 10;

  this.init = () => {
    renderServe(this.players);
    this.players.forEach((player) => {
      player.updateScore(0);
    });
  }

  this.updateServeCounter = (val) => {
    this.serveCounter += val;

    // If both players at game point then serve frequency should be set to 1
    if (this.playersAtGamePoint().length >= 2 || this.manualServeFreq) {
      this.serveFreq = 1;
    } else {
      this.serveFreq = 2;
    }

    if (this.serveFreq === 1) {
      // With 1-serve game every point is a serve change
      this.playerServing = this.playerServing.getOtherPlayer();
    } else {
      // Normal positive count up, change att serveFreq
      if (this.serveCounter % this.serveFreq === 0 && val > 0) {
        this.playerServing = this.playerServing.getOtherPlayer();
      }
      // Undo negative count (val < 0) Should change back to correct server if the erronous point caused a server change
      if (this.serveCounter % this.serveFreq !== 0 && val < 0) {
        this.playerServing = this.playerServing.getOtherPlayer();
      }
    }
  }

  this.toggleServeFreq = () => {
    this.serveFreq = this.serveFreq === 2 ? 1 : 2;
  }

  this.playersAtGamePoint = () => {
    return this.players.filter((player) => {
      return player.score >= this.gamePoint;
    });
  };
};

const game = new Game();
game.init();



// SOCKET.IO
const socket = io();

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('score', (score) => {
  const player = game.players[score.player - 1];
  player.updateScore(score.val);
});

socket.on('resetStreak', () => {
  game.players.forEach((player) => {
    player.loseStreak();
    renderStreak(player);
  });
});

socket.on('restart', () => {
  const game = new Game();
  game.init();
});


let timeKeyDown = null;
const repeat = 1000;
let lastRepeat = 0;

// Keypress arrow up or down toggles serving frequency between 1 and 2.
document.addEventListener('keydown', (e) => {
  if (e.keyCode === 38 || e.keyCode === 40) {
    game.toggleServeFreq();
    game.manualServeFreq = game.manualServeFreq === true ? false : true;
    renderServe(game.players);
  }

  if (e.keyCode === 37 || e.keyCode === 39) {
    if (timeKeyDown) {
      const newTimeKeyDown = new Date().getTime();
      if (newTimeKeyDown - timeKeyDown > 1000) {
        if (new Date().getTime() - lastRepeat > repeat) {
          const player = e.keyCode === 37 ? 1 : 2;
          const val = -1;
          socket.emit('score', { player, val });
          lastRepeat = new Date().getTime();
        }
      }
    } else {
      timeKeyDown = new Date().getTime();
    }
  }
}, false);

document.addEventListener('keyup', (e) => {
  if (e.keyCode === 37 || e.keyCode === 39) {
    const timeKeyUp = new Date().getTime()
    if (timeKeyUp - timeKeyDown < 1000) {
      const player = e.keyCode === 37 ? 1 : 2;
      const val = 1;
      socket.emit('score', { player, val });
    }
    timeKeyDown = null;
  }
}, false);

window.addEventListener('touchstart', (e) => {
  // console.log(e.touches[0].screenX, e.touches[0].screenY)
  const point = getQuadrant(e.touches[0].screenX, e.touches[0].screenY);

  const player = point[0];
  const val = point[1];

  socket.emit('score', { player, val });
}, false);

game.players.forEach((player) => {
  player.el.addEventListener('animationend', (e) => {
    player.el.classList.remove('animated');
  }, false);
});

function getQuadrant(x, y) {
  if (x < game.screen.width / 2) {
    if (y < game.screen.height / 2) {
      return [1, 1];
    } else {
      return [1, -1];
    }
  } else {
    if (y < screen.height / 2) {
      return [2, 1];
    } else {
      return [2, -1];
    }
  }
}