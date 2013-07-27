var PhysicsObject = require('./physics_object');
var util = require('util');
var chem = require('chem');
var v = chem.vec2d;

module.exports = Meteor;

util.inherits(Meteor, PhysicsObject);
function Meteor(state, o) {
  PhysicsObject.apply(this, arguments);

  this.sprite = new chem.Sprite(o.animationName);
  var graphicRadius = (this.sprite.size.x + this.sprite.size.y) / 4;
  this.sprite.scale.scale(this.radius / graphicRadius);
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
}

Meteor.prototype.name = "Meteor";

Meteor.prototype.hit = function(damage, explosionAnimationName) {
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
    // calculate normal
    var normal = obj.pos.minus(this.pos).normalize();
    // calculate relative velocity
    var rv = obj.vel.minus(this.vel);
    // calculate relative velocity in terms of the normal direction
    var velAlongNormal = rv.dot(normal);
    // do not resolve if velocities are separating
    if (velAlongNormal > 0) continue;
    // calculate restitution
    var e = Math.min(this.collisionDamping, obj.collisionDamping);
    // calculate impulse scalar
    var j = -(1 + e) * velAlongNormal;
    var myMass = this.mass();
    var otherMass = obj.mass();
    j /= 1 / myMass + 1 / otherMass;
    // apply impulse
    var impulse = normal.scale(j);
    this.vel.sub(impulse.scaled(1 / myMass));
    obj.vel.add(impulse.scaled(1 / otherMass));
  }

  this.sprite.pos = this.pos.floored();
  this.sprite.rotation += this.rotVel;
};

Meteor.prototype.delete = function() {
  if (this.deleted) return;
  this.deleted = true;
  this.sprite.delete();
}
