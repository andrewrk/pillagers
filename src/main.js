var chem = require('chem');
var v = chem.vec2d;
var State = require('./state');
var TitleScreen = require('./title_screen');
var CreditsScreen = require('./credits_screen');
var GameOverScreen = require('./game_over_screen');
var canvas = document.getElementById("game");
var engine = new chem.Engine(canvas);
engine.setSize(v(1067, 600));
engine.showLoadProgressBar();
engine.start();
canvas.focus();
chem.resources.on('ready', function () {
  var game = new Game(engine);
  game.showTitleScreen();
});

function Game(engine) {
  this.levelIndex = 0;
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

Game.prototype.playLevel = function() {
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

  state.load(level);
  state.start();
};
