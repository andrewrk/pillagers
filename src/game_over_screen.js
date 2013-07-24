var chem = require('chem');
var v = chem.vec2d;

module.exports = GameOverScreen;

function GameOverScreen(game) {
  this.game = game;
  this.engine = game.engine;
  this.bg = chem.resources.images['game-over-screen.png'];
}

GameOverScreen.prototype.start = function() {
  this.engine.on('draw', onDraw.bind(this));
  this.engine.on('buttonup', onButtonUp.bind(this));
};

GameOverScreen.prototype.delete = function() {
  this.engine.removeAllListeners();
};

function onDraw(context) {
  context.setTransform(1, 0, 0, 1, 0, 0); // load identity
  context.drawImage(this.bg, 0, 0);
}

function onButtonUp(button) {
  backToTitleScreen(this);
}

function backToTitleScreen(self) {
  self.delete();
  self.game.showTitleScreen();
}
