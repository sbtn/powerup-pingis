// SOCKET.IO
var socket = io();

socket.on('connect', function () {
    console.log("Connected to server");
})

socket.on('disconnect', function () {
    console.log("Disconnected from server");
});

socket.on('newScore', function (score) {
    console.log("new score player " + score.player);

    var player = players[score.player - 1];

    updateStreak(player);
    player.score += 1;
    player.el.children[0].textContent = player.score;
    player.el.classList.add('animated');
});

socket.on('resetStreak', function () {
    players.forEach(function (player) { 
        player.streak = 0; 
        player.el.querySelector('progress').setAttribute('value', player.streak); 
    });
});

socket.on('restart', function () {
    window.location.reload();
});

// Player
var playerOneEl = document.querySelector('.player_one');
var playerTwoEl = document.querySelector('.player_two');

var players = [
    {
        el: playerOneEl,
        score: 0,
        streak: 0
    },
    {
        el: playerTwoEl,
        score: 0,
        streak: 0
    }
];

players.forEach(function (player) {
    player.el.addEventListener('animationend', function (e) {
        player.el.classList.remove('animated');
    });
});

function updateStreak(player) {
    player.streak += 1;
    const otherPlayer = getOtherPlayer(player);

    otherPlayer.streak = 0;
    otherPlayer.el.querySelector('progress').setAttribute('value', otherPlayer.streak);
    player.el.querySelector('progress').setAttribute('value', player.streak);
}

function getOtherPlayer(player) {
    return player === players[0] ? players[1] : players[0];
}