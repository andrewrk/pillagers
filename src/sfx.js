var chem = require('chem');

var boom = new chem.Sound('sfx/boom.ogg');

var weakShots = initializeWeakShots();

function initializeWeakShots() {
  var arr = [];
  for (var i = 1; i <= 5; i += 1) {
    var snd = new chem.Sound('sfx/weak_shot' + i + '.ogg');
    snd.setVolume(0.2);
    arr.push(snd);
  }
  return arr;
}

exports.explosion = function() {
  return boom.play();
}

exports.electricAttack = function() {
  // TODO
}

exports.shootWeakBullet = function() {
  var index = Math.floor(Math.random() * weakShots.length);
  return weakShots[index].play();
};
