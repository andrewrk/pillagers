var chem = require('chem');

var weakShots = initList('sfx/weak_shot', 5, 0.2);
var strongShot = new chem.Sound('sfx/strong_shot.ogg');
var weakHits = initList('sfx/weak_hit', 5, 0.8);
var disintegrateList = initList('sfx/electric_explosion', 5, 0.2);
var explosions = initList('sfx/ship_explosion', 5, 0.8);
var electricShots = initList('sfx/electric_shot', 5, 1.0);

exports.explosion = function() {
  return playRandom(explosions);
}

exports.electricAttack = function() {
  return playRandom(electricShots);
}

exports.disintegrate = function() {
  return playRandom(disintegrateList);
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
    snd.maxPoolSize = 8;
    snd.setVolume(volume);
    arr.push(snd);
  }
  return arr;
}

function playRandom(list) {
  var index = Math.floor(Math.random() * list.length);
  return list[index].play();
}
