// SOCKET.IO
var socket = io();

socket.on('connect', function () {
    console.log("Connected to server");
})

socket.on('disconnect', function () {
    console.log("Disconnected from server");
});

socket.on('score', function (score) {
    console.log("new score player " + score.player);

    var player = players[score.player - 1];
    updateScore(player, 1);
});

socket.on('resetStreak', function () {
    players.forEach(function (player) {
        player.streak = 0;
        renderStreak(player);
    });
});

socket.on('restart', function () {
    players.forEach(function (player) {
        player.score = 0;
        player.streak = 0;
        renderStreak(player);
        player.el.children[0].textContent = 0;
    });
});


// PLAYERS
var screen = {
    width: window.innerWidth,
    height: window.innerHeight,
}

var playerOneEl = document.querySelector('.player_one');
var playerTwoEl = document.querySelector('.player_two');

var players = [
    {
        el: playerOneEl,
        score: 0,
        streak: 0,
        prevStreak: 0
    },
    {
        el: playerTwoEl,
        score: 0,
        streak: 0,
        prevStreak: 0
    }
];

window.addEventListener('touchstart', function (e) {
    console.log(e.touches[0].screenX, e.touches[0].screenY)
    
    var point = getQuadrant(e.touches[0].screenX, e.touches[0].screenY);
    var player = players[point[0]];
    updateScore(player, point[1]);
});

players.forEach(function (player) {
    player.el.addEventListener('animationend', function (e) {
        player.el.classList.remove('animated');
    });
});

function updateScore(player, modifier) {
    if (player.score + 1 * modifier >= 0) {
        player.score += 1 * modifier;
        player.el.children[0].textContent = player.score;
    }
    player.el.classList.add('animated');
    updateStreak(player, modifier);
};

function updateStreak(player, modifier) {
    const otherPlayer = getOtherPlayer(player);

    if (player.streak + 1 * modifier >= 0 && player.streak + 1 * modifier <= 3) {
        player.streak += 1 * modifier;

        if (modifier === 1) {
            otherPlayer.prevStreak = otherPlayer.streak;  // Restore streak to other player if point given wrongly to player.
            otherPlayer.streak = 0;
        } else {
            otherPlayer.streak = otherPlayer.prevStreak;
        }  
    }

    renderStreak(otherPlayer);
    renderStreak(player);
}

function getOtherPlayer(player) {
    return player === players[0] ? players[1] : players[0];
}

function renderStreak(player) {
    player.el.querySelector('progress').setAttribute('value', player.streak);
}

function getQuadrant(x, y) {
    if (x < screen.width / 2) {
        if (y < screen.height / 2) {
            return [0,1];
        } else {
            return [0,-1];
        }
    } else {
        if (y < screen.height / 2) {
            return [1,1];
        } else {
            return [1,-1];
        }
    }
}