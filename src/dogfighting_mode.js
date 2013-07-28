var chem = require('chem');
var State = require('./state');
var TitleScreen = require('./title_screen');
var LevelCompleteScreen = require('./level_complete_screen');
var CreditsScreen = require('./credits_screen');

module.exports = DogfightingMode;

function DogfightingMode(game) {
  this.game = game;
  this.engine = game.engine;
}

DogfightingMode.prototype.toggleMusic = function() {
  this.game.toggleMusic();
};

DogfightingMode.prototype.showTitleScreen = function() {
  var title = new TitleScreen(this.game);
  title.start();
};

DogfightingMode.prototype.start = function() {
  this.levelIndex = 0;
  this.playLevel();
};

DogfightingMode.prototype.playLevel = function() {
  var state = new State(this);
  state.campaignMode = false;
  var levelText = chem.resources.text["dogfight" + this.levelIndex + ".json"];
  if (levelText == null) {
    // user beat all the levels
    this.showCredits();
    return;
  }
  var level;
  try {
    level = JSON.parse(levelText);
  } catch (err) {
    throw new Error("Error parsing dogfighting level. Invalid JSON: " + err.stack);
  }

  state.load(level);
  state.start();
};

DogfightingMode.prototype.showLevelComplete = function(o) {
  this.game.endBattleMusic();
  var levelCompleteScreen = new LevelCompleteScreen(this, o);
  levelCompleteScreen.start();
};

DogfightingMode.prototype.showCredits = function() {
  var credits = new CreditsScreen(this.game);
  credits.start();
};

DogfightingMode.prototype.endBattleMusic = function() {
  this.game.endBattleMusic();
};

DogfightingMode.prototype.beginBattleMusic = function() {
  this.game.beginBattleMusic();
};

