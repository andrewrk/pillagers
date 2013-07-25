var PhysicsObject = require('./physics_object');
var util = require('util');
var chem = require('chem');
var v = chem.vec2d;

module.exports = Fx;

util.inherits(Fx, PhysicsObject);
function Fx(state, o) {
  PhysicsObject.apply(this, arguments);
  this.sprite = new chem.Sprite(o.animationName);
  if (this.rotation != null) this.sprite.rotation = this.rotation;
  this.state.batch.add(this.sprite);
  this.timeLeft = o.duration;
}

Fx.prototype.update = function(dt, dx) {
  PhysicsObject.prototype.update.apply(this, arguments);
  this.sprite.pos = this.pos.floored();
  this.timeLeft -= dt;
  if (this.timeLeft <= 0) {
    this.state.deletePhysicsObject(this);
    this.delete();
  }
};

Fx.prototype.delete = function() {
  this.deleted = true;
  this.sprite.delete();
}
