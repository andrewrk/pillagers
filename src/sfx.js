var chem = require('chem');

var boom = new chem.Sound('sfx/boom.ogg');

var weakShots = initList('sfx/weak_shot', 5, 0.2);
var weakHits = initList('sfx/weak_hit', 5, 0.8);
var disintegrateList = initList('sfx/electric_explosion', 5, 0.2);

exports.explosion = function() {
  return boom.play();
}

exports.electricAttack = function() {
  // TODO
}

exports.disintegrate = function() {
  return playRandom(disintegrateList);
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
    snd.setVolume(volume);
    arr.push(snd);
  }
  return arr;
}

function playRandom(list) {
  var index = Math.floor(Math.random() * list.length);
  return list[index].play();
}
