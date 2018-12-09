"use strict";

// Player
var Player = function Player(element, sound) {
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
    var otherPlayer = this.getOtherPlayer();

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
}; // Restore streak to other player if point given wrongly to player.


Player.prototype.loseStreak = function () {
  this.prevStreak = this.streak;
  this.streak = 0;
};

Player.prototype.restoreStreak = function () {
  this.streak = this.prevStreak;
};

var renderStreak = function renderStreak(player) {
  player.el.querySelector('progress').setAttribute('value', player.streak);
};

var renderScore = function renderScore(player) {
  player.el.querySelector('h1').textContent = player.score;
};

var renderServe = function renderServe(players) {
  players.forEach(function (player) {
    if (game.playerServing === player) {
      Array.from(player.el.querySelector('div.serve').children).forEach(function (child, i) {
        return i < game.serveFreq ? child.classList.add('serving') : child.classList.remove('serving');
      });
    } else {
      Array.from(player.el.querySelector('div.serve').children).forEach(function (child) {
        return child.classList.remove('serving');
      });
    }
  });
}; // GAME


var Game = function Game() {
  var _this = this;

  this.screen = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  this.players = [new Player(document.querySelector('.player_one'), document.getElementById('hadoken')), new Player(document.querySelector('.player_two'), document.getElementById('shoryuken'))];
  this.playerServing = this.players[Math.round(Math.random())];
  this.serveFreq = 2;
  this.manualServeFreq = false;
  this.serveCounter = 0;
  this.gamePoint = 10;

  this.init = function () {
    renderServe(_this.players);

    _this.players.forEach(function (player) {
      player.updateScore(0);
    });
  };

  this.updateServeCounter = function (val) {
    _this.serveCounter += val; // If both players at game point then serve frequency should be set to 1

    if (_this.playersAtGamePoint().length >= 2 || _this.manualServeFreq) {
      _this.serveFreq = 1;
    } else {
      _this.serveFreq = 2;
    }

    if (_this.serveFreq === 1) {
      // With 1-serve game every point is a serve change
      _this.playerServing = _this.playerServing.getOtherPlayer();
    } else {
      // Normal positive count up, change att serveFreq
      if (_this.serveCounter % _this.serveFreq === 0 && val > 0) {
        _this.playerServing = _this.playerServing.getOtherPlayer();
      } // Undo negative count (val < 0) Should change back to correct server if the erronous point caused a server change


      if (_this.serveCounter % _this.serveFreq !== 0 && val < 0) {
        _this.playerServing = _this.playerServing.getOtherPlayer();
      }
    }
  };

  this.toggleServeFreq = function () {
    _this.serveFreq = _this.serveFreq === 2 ? 1 : 2;
  };

  this.playersAtGamePoint = function () {
    return _this.players.filter(function (player) {
      return player.score >= _this.gamePoint;
    });
  };
};

var game = new Game();
game.init(); // SOCKET.IO

var socket = io();
socket.on('connect', function () {
  console.log('Connected to server');
});
socket.on('disconnect', function () {
  console.log('Disconnected from server');
});
socket.on('score', function (score) {
  var player = game.players[score.player - 1];
  player.updateScore(score.val);
});
socket.on('resetStreak', function () {
  game.players.forEach(function (player) {
    player.loseStreak();
    renderStreak(player);
  });
});
socket.on('restart', function () {
  game = new Game();
  game.init();
});
var timeKeyDown = null;
var repeat = 1000;
var lastRepeat = 0; // Keypress arrow up or down toggles serving frequency between 1 and 2.

document.addEventListener('keydown', function (e) {
  if (e.keyCode === 38 || e.keyCode === 40) {
    game.toggleServeFreq();
    game.manualServeFreq = game.manualServeFreq === true ? false : true;
    renderServe(game.players);
  }

  if (e.keyCode === 37 || e.keyCode === 39) {
    if (timeKeyDown) {
      var newTimeKeyDown = new Date().getTime();

      if (newTimeKeyDown - timeKeyDown > 1000) {
        if (new Date().getTime() - lastRepeat > repeat) {
          var player = e.keyCode === 37 ? 1 : 2;
          var val = -1;
          socket.emit('score', {
            player: player,
            val: val
          });
          lastRepeat = new Date().getTime();
        }
      }
    } else {
      timeKeyDown = new Date().getTime();
    }
  }
}, false);
document.addEventListener('keyup', function (e) {
  if (e.keyCode === 37 || e.keyCode === 39) {
    var timeKeyUp = new Date().getTime();

    if (timeKeyUp - timeKeyDown < 1000) {
      var player = e.keyCode === 37 ? 1 : 2;
      var val = 1;
      socket.emit('score', {
        player: player,
        val: val
      });
    }

    timeKeyDown = null;
  }
}, false);
window.addEventListener('touchstart', function (e) {
  // console.log(e.touches[0].screenX, e.touches[0].screenY)
  var point = getQuadrant(e.touches[0].screenX, e.touches[0].screenY);
  var player = point[0];
  var val = point[1];
  socket.emit('score', {
    player: player,
    val: val
  });
}, false);
game.players.forEach(function (player) {
  player.el.addEventListener('animationend', function (e) {
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
