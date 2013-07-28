var chem = require('chem');
var State = require('./state');
var TitleScreen = require('./title_screen');

module.exports = SandboxMode;

function SandboxMode(game) {
  this.game = game;
  this.engine = game.engine;
}

SandboxMode.prototype.toggleMusic = function() {
  this.game.toggleMusic();
};

SandboxMode.prototype.showTitleScreen = function() {
  var title = new TitleScreen(this.game);
  title.start();
};

SandboxMode.prototype.start = function() {
  var state = new State(this);
  state.startSandboxMode();
};

SandboxMode.prototype.endBattleMusic = function() {
  this.game.endBattleMusic();
};

SandboxMode.prototype.beginBattleMusic = function() {
  this.game.beginBattleMusic();
};

