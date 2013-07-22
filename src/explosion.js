var createId = require('./uuid').createId;
var chem = require('chem');
var v = chem.vec2d;

module.exports = Explosion;

function Explosion(state, pos, vel) {
  this.state = state;
  this.pos = pos;
  this.vel = vel;
  this.sprite = new chem.Sprite('explosion');
  this.timeLeft = 1;
  this.id = createId();
  this.boomSfx = new chem.Sound('sfx/boom.ogg');
  this.boomSfx.play();
}

Explosion.prototype.draw = function(context) {}

Explosion.prototype.update = function(dt, dx) {
  this.pos.add(this.vel.scaled(dx));
  this.sprite.pos = this.pos.floored();
  this.timeLeft -= dt;
  if (this.timeLeft <= 0) {
    this.state.deleteExplosion(this);
  }
};

Explosion.prototype.delete = function() {
  this.sprite.delete();
}
