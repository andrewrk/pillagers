var chem = require('chem');

var strongShot = new chem.Sound('sfx/strong_shot.ogg');
strongShot.maxPoolSize = 5;
var enterPortal = new chem.Sound('sfx/portal_enter.ogg');
enterPortal.maxPoolSize = 4;
var missionComplete = new chem.Sound('sfx/mission_complete_music.ogg');
missionComplete.setVolume(0.5);
missionComplete.maxPoolSize = 1;
var headingToDest = new chem.Sound('sfx/heading_to_destination.ogg');
headingToDest.maxPoolSize = 2;

var weakShots = initList('sfx/weak_shot', 5, 0.2);
var weakHits = initList('sfx/weak_hit', 5, 0.8);
var disintegrateList = initList('sfx/electric_explosion', 5, 0.2);
var explosions = initList('sfx/ship_explosion', 5, 0.8);
var electricShots = initList('sfx/electric_shot', 5, 1.0);
var attackingTargetList = initList('sfx/attacking_target', 2, 1.0);
var youWantMeToList = initList('sfx/you_want_me_to', 2, 1.0);
var yesSirList = initList('sfx/yes_sir', 6, 1.0);

exports.yesSir = function() {
  return playRandom(yesSirList);
};

exports.headingToDest = function() {
  return headingToDest.play();
};

exports.youWantMeTo = function() {
  return playRandom(youWantMeToList);
};

exports.attackingTarget = function() {
  return playRandom(attackingTargetList);
};

exports.explosion = function() {
  return playRandom(explosions);
}

exports.electricAttack = function() {
  return playRandom(electricShots);
}

exports.disintegrate = function() {
  return playRandom(disintegrateList);
};

exports.enterPortal = function() {
  return enterPortal.play();
};

exports.missionComplete = function() {
  return missionComplete.play();
};

exports.shootStrongBullet = function() {
  return strongShot.play();
};

exports.shootWeakBullet = function() {
  return playRandom(weakShots);
};

exports.weakHit = function() {
  return playRandom(weakHits);
};

function initList(prefix, count, volume) {
  var arr = [];
  for (var i = 1; i <= count; i += 1) {
    var snd = new chem.Sound(prefix + i + '.ogg');
    snd.maxPoolSize = 3;
    snd.setVolume(volume);
    arr.push(snd);
  }
  return arr;
}

function playRandom(list) {
  var index = Math.floor(Math.random() * list.length);
  return list[index].play();
}
