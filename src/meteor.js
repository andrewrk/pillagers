var PhysicsObject = require('./physics_object');
var util = require('util');
var chem = require('chem');
var v = chem.vec2d;
var ani = chem.resources.animations;

module.exports = Meteor;

util.inherits(Meteor, PhysicsObject);
function Meteor(state, o) {
  PhysicsObject.apply(this, arguments);

  var animationName = o.animationName || 'rock-a';
  this.sprite = new chem.Sprite(ani[animationName]);
  this.setRadius(this.radius);
  this.sprite.rotation = this.rotation;
  this.state.batch.add(this.sprite);

  this.rotVel = o.rotVel || 0;

  this.collisionDamping = 1;
  this.density = 0.20;
  this.canBeShot = true;
  this.health = 1;
  this.defense = this.mass();

  this.canCauseCollision = true;
  this.canBeStruck = true;

  this.miniMapColor = "#B59277";
  this.uiAnimationName = "rock-a";

  this.canBeSelected = true;
}

Meteor.prototype.serialize = function() {
  return {
    type: "Meteor",
    properties: {
      animationName: this.sprite.animationName,
      pos: this.pos.clone(),
      vel: this.vel.clone(),
      rotVel : this.rotVel,
      radius: this.radius,
    },
  };
};

Meteor.prototype.setRadius = function(radius) {
  this.radius = radius;
  var graphicRadius = (this.sprite.size.x + this.sprite.size.y) / 4;
  this.sprite.scale.x = this.sprite.scale.y = this.radius / graphicRadius;
};

Meteor.prototype.name = "Meteor";

Meteor.prototype.damage = function(damage, explosionAnimationName) {
  this.health -= damage / this.defense;
  if (this.health <= 0) {
    this.state.createExplosion(this.pos, this.vel, explosionAnimationName);
    this.state.deletePhysicsObject(this);
    this.delete();
  }
};

Meteor.prototype.update = function(dt, dx) {
  PhysicsObject.prototype.update.apply(this, arguments);

  // collision detection
  for (var i = 0; i < this.state.physicsObjects.length; i += 1) {
    var obj = this.state.physicsObjects[i];
    if (obj === this) continue;
    if (!obj.canBeStruck) continue;
    var addedRadii = this.radius + obj.radius;
    if (obj.pos.distanceSqrd(this.pos) > addedRadii * addedRadii) continue;
    this.collide(obj);
  }

  this.sprite.pos = this.pos.floored();
  this.sprite.rotation += this.rotVel;
};

Meteor.prototype._delete = function() {
  this.sprite.delete();
}
