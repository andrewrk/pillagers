var chem = require('chem');
var LevelCompleteScreen = require('./level_complete_screen');
var Campaign = require('./campaign');
var SandboxMode = require('./sandbox_mode');
var DogfightingMode = require('./dogfighting_mode');
var TitleScreen = require('./title_screen');
var CreditsScreen = require('./credits_screen');

module.exports = Game;

var BG_MUSIC_VOL = 0.80;
var BATTLE_MUSIC_VOL = 0.80;
var MUSIC_TRANSITION_TIME = 5 * 1000;

function Game(engine) {
  this.engine = engine;

  initMusic(this);
}

function initMusic(self) {
  self.musicOn = JSON.parse(localStorage.getItem("musicOn") || "true");

  self.bgMusic = new Audio('music/BG_music.ogg');
  self.bgMusic.loop = true;
  self.bgMusic.play();

  // play battle music too to load it
  self.battleMusic = new Audio('music/battle_music.ogg');
  self.battleMusic.loop = true;
  self.battleMusic.play();

  self.whichMusic = 'bg';
  self.musicUpdateInterval = setInterval(self.updateMusicVolume.bind(self), 20);
}

Game.prototype.beginBattleMusic = function() {
  if (this.whichMusic === 'toBattle' || this.whichMusic === 'battle') return;
  if (this.whichMusic === 'toBg') {
    this.whichMusic = "toBattle";
    this.flipTransitionDate();
    return;
  }
  this.whichMusic = "toBattle";
  this.transitionDate = new Date();
};

Game.prototype.flipTransitionDate = function() {
  var now = new Date();
  var percent = (now - this.transitionDate) / MUSIC_TRANSITION_TIME;
  percent = 1 - percent;
  var newNow = new Date();
  newNow.setTime(this.transitionDate.getTime() + percent * MUSIC_TRANSITION_TIME);
  this.transitionDate.setTime(this.transitionDate.getTime() - (newNow - now));
}

Game.prototype.endBattleMusic = function() {
  if (this.whichMusic === 'toBg' || this.whichMusic === 'bg') return;
  if (this.whichMusic === 'toBattle') {
    this.whichMusic = 'toBg';
    this.flipTransitionDate();
    return;
  }
  this.whichMusic = "toBg";
  this.transitionDate = new Date();
};

Game.prototype.updateMusicVolume = function() {
  if (!this.musicOn) {
    this.bgMusic.volume = 0;
    this.battleMusic.volume = 0;
    return;
  }
  var now, percent;
  switch (this.whichMusic) {
    case "bg":
      this.bgMusic.volume = BG_MUSIC_VOL;
      this.battleMusic.volume = 0;
      break;
    case "toBattle":
      now = new Date();
      percent = (now - this.transitionDate) / MUSIC_TRANSITION_TIME;
      if (percent >= 1) {
        this.whichMusic = "battle";
        this.updateMusicVolume();
        return;
      }
      this.battleMusic.volume = percent * BATTLE_MUSIC_VOL;
      this.bgMusic.volume = (1 - percent) * BG_MUSIC_VOL;
      break;
    case "toBg":
      now = new Date();
      percent = (now - this.transitionDate) / MUSIC_TRANSITION_TIME;
      if (percent >= 1) {
        this.whichMusic = "bg";
        this.updateMusicVolume();
        return;
      }
      this.bgMusic.volume = percent * BG_MUSIC_VOL;
      this.battleMusic.volume = (1 - percent) * BATTLE_MUSIC_VOL;
      break;
    case "battle":
      this.bgMusic.volume = 0;
      this.battleMusic.volume = BATTLE_MUSIC_VOL;
      break;
  }
};

Game.prototype.toggleMusic = function() {
  this.musicOn = !this.musicOn;
  localStorage.setItem("musicOn", JSON.stringify(this.musicOn));
};

Game.prototype.showTitleScreen = function() {
  this.endBattleMusic();
  var title = new TitleScreen(this);
  title.start();
};

Game.prototype.showCredits = function() {
  this.endBattleMusic();
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

Game.prototype.startDogfighting = function() {
  var dogfighting = new DogfightingMode(this);
  dogfighting.start();
};

Game.prototype.showLevelComplete = function(gameMode, o) {
  this.endBattleMusic();
  var levelCompleteScreen = new LevelCompleteScreen(gameMode, o);
  levelCompleteScreen.start();
}
