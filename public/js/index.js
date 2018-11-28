// Player
const Player = function (element) {
  this.el = element;
  this.score = 0;
  this.streak = 0;
  this.prevStreak = 0;
};

Player.prototype.updateScore = function (val) {
  if (this.score + 1 * val >= 0) {
    this.score += 1 * val;

    if (val > 0) {
      game.updateServeCounter(1 * val);
    }
  }
  this.el.classList.add('animated');
  this.updateStreak(val);
  renderScore(this);
  renderServe(game.players);
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

// GAME
const Game = function () {
  this.screen = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  this.players = [
    new Player(document.querySelector('.player_one')),
    new Player(document.querySelector('.player_two')),
  ];

  this.playerServing = this.players[Math.round(Math.random())];
  this.serveFreq = 2;
  this.serveCounter = 0;
  this.gamePoint = 10;

  this.init = () => {
    renderServe(this.players);
  }

  this.updateServeCounter = (val) => {
    this.serveCounter += val;

    if (this.getScores().length >= 2) {
      this.serveFreq = 1;
    }

    if (this.serveCounter % this.serveFreq === 0) {
      this.playerServing = this.playerServing.getOtherPlayer();
    }
  }

  this.getScores = () => {
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
  console.log(`new score player ${score.player}`);

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