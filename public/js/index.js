// Player
const Player = function (element) {
  this.el = element;
  this.score = 0;
  this.streak = 0;
  this.prevStreak = 0;
};

let players = [
  new Player(document.querySelector('.player_one')),
  new Player(document.querySelector('.player_two')),
];

Player.prototype.updateScore = function (val) {
  if (this.score + 1 * val >= 0) {
    this.score += 1 * val;
    game.updateServeCounter(1 * val);    
  }
  this.el.classList.add('animated');
  this.updateStreak(val);
  renderScore(this);
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
  renderStreak(this);
};

Player.prototype.getOtherPlayer = function () {
  return this === players[0] ? players[1] : players[0];
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
  player.el.children[0].textContent = player.score;
};

// GAME
const Game = function () {
  this.screen = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  this.playerServing = Math.round(Math.random())+1;
  this.serveFreq = 2;
  this.serveCounter = 0;

  this.updateServeCounter = (val) => {    
    this.serveCounter += val;
    
    if (this.serveCounter%this.serveFreq === 0) {
      this.playerServing = this.switchPlayerServing();
    }
  }

  this.switchPlayerServing = () => {
    return this.playerServing === 1 ? 2 : 1;
  }
};

const game = new Game();

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

  const player = players[score.player - 1];
  player.updateScore(score.val);
});

socket.on('resetStreak', () => {
  players.forEach((player) => {
    player.loseStreak();
    renderStreak(player);
  });
});

socket.on('restart', () => {
  players = [
    new Player(document.querySelector('.player_one')),
    new Player(document.querySelector('.player_two')),
  ];

  players.forEach((player) => {
    player.updateScore(0);
  });
});

window.addEventListener('touchstart', (e) => {
  // console.log(e.touches[0].screenX, e.touches[0].screenY)
  const point = getQuadrant(e.touches[0].screenX, e.touches[0].screenY);

  const player = point[0];
  const val = point[1];

  socket.emit('score', { player, val });
});

players.forEach((player) => {
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