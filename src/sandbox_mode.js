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

SandboxMode.prototype.loadSavedLevel = function() {
  var level;
  try {
    level = JSON.parse(localStorage.getItem("sandboxSavedLevel"));
  } catch (err) {
    console.error("Error parsing sandbox saved level:", err.stack);
  }
  var state = new State(this);
  state.sandboxMode = true;
  state.load(level);
  state.start();
};
