var chem = require('chem');
var State = require('./state');
var team = require('./team');
var FlagShip = require('./flag_ship');
var TitleScreen = require('./title_screen');
var CreditsScreen = require('./credits_screen');
var GameOverScreen = require('./game_over_screen');

var playerTeam = team.get(0);
var enemyTeam = team.get(1);

module.exports = Campaign;

function Campaign(game) {
  this.game = game;
  this.engine = game.engine;
}

Campaign.prototype.toggleMusic = function() {
  this.game.toggleMusic();
};

Campaign.prototype.endBattleMusic = function() {
  this.game.endBattleMusic();
};

Campaign.prototype.beginBattleMusic = function() {
  this.game.beginBattleMusic();
};

Campaign.prototype.showGameOverScreen = function() {
  var gameOverScreen = new GameOverScreen(this);
  gameOverScreen.start();
};

Campaign.prototype.showTitleScreen = function() {
  this.game.showTitleScreen();
};

Campaign.prototype.start = function() {
  this.levelIndex = 0;
  this.cash = 0;
  this.unlockedShips = {};

  // start campaign with only a flagship
  var flagship = new FlagShip(null, {
    team: playerTeam,
    group: "PlayerFlagship",
  });
  this.playLevel([flagship]);
};

Campaign.prototype.playLevel = function(convoy) {
  var state = new State(this);
  var levelText = chem.resources.text["level" + this.levelIndex + ".json"];
  if (levelText == null) {
    // user beat all the levels
    this.game.showCredits();
    return;
  }
  var level;
  try {
    level = JSON.parse(levelText);
  } catch (err) {
    throw new Error("Error parsing level. Invalid JSON: " + err.stack);
  }

  state.load(level, convoy);
  state.start();
};

Campaign.prototype.showLevelComplete = function(o) {
  this.game.showLevelComplete(this, o);
};

Campaign.prototype.stallMusic = function(seconds) {
  this.game.stallMusic(seconds);
};
