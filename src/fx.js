var createId = require('./uuid').createId;
var chem = require('chem');
var v = chem.vec2d;

module.exports = Fx;

function Fx(state, o) {
  this.state = state;
  this.pos = o.pos;
  this.vel = o.vel;
  this.sprite = new chem.Sprite(o.animationName);
  if (o.rotation != null) this.sprite.rotation = o.rotation;
  this.state.batch.add(this.sprite);
  this.timeLeft = o.duration;
  this.id = createId();
}

Fx.prototype.draw = function(context) {}

Fx.prototype.update = function(dt, dx) {
  this.pos.add(this.vel.scaled(dx));
  this.sprite.pos = this.pos.floored();
  this.timeLeft -= dt;
  if (this.timeLeft <= 0) {
    this.state.deletePhysicsObject(this);
    this.delete();
  }
};

Fx.prototype.delete = function() {
  this.sprite.delete();
}


