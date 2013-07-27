var chem = require('chem');
var Campaign = require('./campaign');
var SandboxMode = require('./sandbox_mode');
var TitleScreen = require('./title_screen');
var CreditsScreen = require('./credits_screen');

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

Game.prototype.showTitleScreen = function() {
  var title = new TitleScreen(this);
  title.start();
};

Game.prototype.showCredits = function() {
  var credits = new CreditsScreen(this);
  credits.start();
};

Game.prototype.startNewCampaign = function() {
  var campaign = new Campaign(this);
  campaign.start();
};

Game.prototype.startSandboxMode = function() {
  var sandbox = new SandboxMode(this);
  sandbox.start();
};
