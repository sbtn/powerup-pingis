// Player
const Player = function (element, sound) {
  this.el = element;
  this.score = 0;
  this.streak = 0;
  this.prevStreak = 0;
  this.scoreSound = sound;
};

Player.prototype.updateScore = function (val) {
  if (this.score + 1 * val >= 0) {
    this.score += 1 * val;

    if (1 * val > 0) {
      this.scoreSound.play();
    }

    game.updateServeCounter(val);
  }
  this.el.classList.add('animated');
  this.updateStreak(val);
  renderScore(this);
  renderServe(game.players);
  renderGui();
};

Player.prototype.updateStreak = function (val) {
  if (this.streak + 1 * val >= 0 && this.streak + 1 * val <= 3) {
    this.streak += 1 * val;
    const otherPlayer = this.getOtherPlayer();
    if (val > 0) {
      otherPlayer.loseStreak();
    } else {
      otherPlayer.restoreStreak();
    }
    renderStreak(otherPlayer);
  }
  renderStreak(this, this.getOtherPlayer());
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
      player.el.querySelector('p').classList.add('serving');
    } else {
      player.el.querySelector('p').classList.remove('serving');
    }
  });
};

const renderGui = () => {
  document.querySelector('div.toggle-serve').textContent = "•".repeat(game.serveFreq);
}

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
  }

  this.updateServeCounter = (val) => {
    this.serveCounter += 1 * val;

    // Check for game point
    if (this.getScores().length >= 2 || this.manualServeFreq) {
      this.serveFreq = 1;
    } else {
      this.serveFreq = 2;
    }

    // This needs some work
    if (this.serveFreq === 1) {
      if (this.serveCounter % this.serveFreq === 0) {
        this.playerServing = this.playerServing.getOtherPlayer();
      }
    } else {
      if (this.serveCounter % this.serveFreq === 0 && 1 * val > 0) {
        this.playerServing = this.playerServing.getOtherPlayer();
      }
      if (1 * val < 0 && this.serveCounter % this.serveFreq !== 0) {
        this.playerServing = this.playerServing.getOtherPlayer();
      }
    }
  }

  this.toggleServeFreq = () => {
    this.serveFreq = this.serveFreq === 2 ? 1 : 2;
  }

  this.getScores = () => {
    return this.players.filter((player) => {
      return player.score >= this.gamePoint;
    });
  };
};

const game = new Game();
game.init();
renderGui();




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

document.addEventListener('keydown', (e) => {
  if (e.keyCode === 38 || e.keyCode === 40) {
    game.toggleServeFreq();
    game.manualServeFreq = game.manualServeFreq === true ? false : true;
    renderGui();
  }
});

window.addEventListener('touchstart', (e) => {
  // console.log(e.touches[0].screenX, e.touches[0].screenY)
  const point = getQuadrant(e.touches[0].screenX, e.touches[0].screenY);

  const player = point[0];
  const val = point[1];

  socket.emit('score', { player, val });
});

game.players.forEach((player) => {
  player.el.addEventListener('animationend', (e) => {
    player.el.classList.remove('animated');
  });
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