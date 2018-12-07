var expect = chai.expect;

describe('Game', function() {
  it('Should create a new game object', function() {
    expect(game).to.be.an('object');
  });

  it('Should update positive score player 1', function() {
    let player = game.players[0];
    player.updateScore(1);
    expect(player.score).to.equal(1);
  });

  it('Should update positive score player 2', function() {
    let player = game.players[1];
    player.updateScore(1);
    expect(player.score).to.equal(1);
  });

  it('Should update negative score player 1', function() {
    let player = game.players[0];
    player.updateScore(-1);
    expect(player.score).to.equal(0);
  });

  it('Should reset game', function() {
    game = new Game();
    game.init();
    let player1 = game.players[0];
    let player2 = game.players[1];
    expect(player1.score).to.equal(0);
    expect(player2.score).to.equal(0);
  });

  it('Should normally have 2 serves before gamepoint (10).', function() {
    let player1 = game.players[0];
    let player2 = game.players[1];
    player1.score = 9;
    player2.score = 9;

    expect(game.serveFreq).to.equal(2);
  });

  it('Should switch to every other serve at gamepoint (10)', function() {
    let player1 = game.players[0];
    let player2 = game.players[1];
    player1.updateScore(1);
    player2.updateScore(1);

    expect(game.serveFreq).to.equal(1);
  });
});