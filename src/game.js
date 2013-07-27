var chem = require('chem');
var State = require('./state');
var Team = require('./team');
var FlagShip = require('./flag_ship');
var TitleScreen = require('./title_screen');
var LevelCompleteScreen = require('./level_complete_screen');
var CreditsScreen = require('./credits_screen');
var GameOverScreen = require('./game_over_screen');

var playerTeam = new Team();
var enemyTeam = new Team();

module.exports = Game;


function Game(engine) {
  this.engine = engine;

  initMusic(this);
}

function initMusic(self) {
  self.musicOn = JSON.parse(localStorage.getItem("musicOn") || "true");
  self.bgMusic = new Audio('music/BG_music.ogg');
  self.bgMusic.loop = true;
  self.bgMusic.volume = 0.90;
  if (self.musicOn) self.bgMusic.play();
}

Game.prototype.toggleMusic = function() {
  this.musicOn = !this.musicOn;
  if (this.musicOn) {
    this.bgMusic.play();
  } else {
    this.bgMusic.pause();
  }
  localStorage.setItem("musicOn", JSON.stringify(this.musicOn));
};

Game.prototype.showGameOverScreen = function() {
  var gameOverScreen = new GameOverScreen(this);
  gameOverScreen.start();
};

Game.prototype.showTitleScreen = function() {
  var title = new TitleScreen(this);
  title.start();
};

Game.prototype.showCredits = function() {
  var credits = new CreditsScreen(this);
  credits.start();
};

Game.prototype.startNewGame = function() {
  this.levelIndex = 0;
  this.cash = 0;
  this.unlockedShips = {};

  // start game with only a flagship
  var flagship = new FlagShip(null, {
    team: playerTeam,
  });
  this.playLevel([flagship]);
};

Game.prototype.playLevel = function(convoy) {
  var state = new State(this);
  var levelText = chem.resources.text["level" + this.levelIndex + ".json"];
  if (levelText == null) {
    // user beat all the levels
    this.showCredits();
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

Game.prototype.showLevelComplete = function(o) {
  var levelCompleteScreen = new LevelCompleteScreen(this, o);
  levelCompleteScreen.start();
};
