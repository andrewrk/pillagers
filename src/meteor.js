var createId = require('./uuid').createId;
var chem = require('chem');
var v = chem.vec2d;

module.exports = Meteor;

function Meteor(state, o) {
  this.state = state;
  this.pos = o.pos;
  this.vel = o.vel || v();
  this.radius = o.radius;

  this.sprite = new chem.Sprite(o.animationName);
  var graphicRadius = (this.sprite.size.x + this.sprite.size.y) / 4;
  this.sprite.scale.scale(this.radius / graphicRadius);

  if (o.rotation != null) this.sprite.rotation = o.rotation;
  this.rotVel = o.rotVel || 0;

  this.state.batch.add(this.sprite);
  this.id = createId();
  this.collisionDamping = 1;
  this.density = 0.20;
  this.canBeShot = true;
  this.health = 1;
  this.defense = this.mass();
  this.deleted = false;

  // an object which canBeStruck can collide when hit by an object that canCauseCollision.
  this.canCauseCollision = true;
  this.canBeStruck = true;
}

Meteor.prototype.hit = function(damage, explosionAnimationName) {
  this.health -= damage / this.defense;
  if (this.health <= 0) {
    this.state.createExplosion(this.pos, this.vel, explosionAnimationName);
    this.state.deletePhysicsObject(this);
    this.delete();
  }
};

Meteor.prototype.mass = function() {
  return this.density * Math.PI * this.radius * this.radius;
};

Meteor.prototype.draw = function(context) {
  if (this.health >= 1) return;
  var healthBarSize = v(32, 4);
  var start = this.sprite.pos.minus(healthBarSize.scaled(0.5)).floor();
  context.fillStyle = '#ffffff';
  context.fillRect(start.x - 1, start.y - this.sprite.size.y * 0.50 - 1, healthBarSize.x + 2, healthBarSize.y + 2);
  context.fillStyle = this.health > 0.45 ? '#009413' : '#E20003';
  context.fillRect(start.x, start.y - this.sprite.size.y * 0.50, healthBarSize.x * this.health, healthBarSize.y);
};


Meteor.prototype.update = function(dt, dx) {
  this.pos.add(this.vel.scaled(dx));

  // collision detection
  for (var id in this.state.physicsObjects) {
    if (id === this.id) continue;
    var obj = this.state.physicsObjects[id];
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
    break;
  }

  this.checkOutOfBounds();

  this.sprite.pos = this.pos.floored();
  this.sprite.rotation += this.rotVel;
};

Meteor.prototype.delete = function() {
  if (this.deleted) return;
  this.deleted = true;
  this.sprite.delete();
}

Meteor.prototype.checkOutOfBounds = function() {
  if (this.pos.x - this.radius < 0) {
    this.pos.x = this.radius;
    this.vel.x = Math.abs(this.vel.x) * this.collisionDamping;
  }
  if (this.pos.y - this.radius < 0) {
    this.pos.y = this.radius;
    this.vel.y = Math.abs(this.vel.y) * this.collisionDamping;
  }
  if (this.pos.x + this.radius >= this.state.mapSize.x) {
    this.pos.x = this.state.mapSize.x - this.radius;
    this.vel.x = -Math.abs(this.vel.x) * this.collisionDamping;
  }
  if (this.pos.y + this.radius >= this.state.mapSize.y) {
    this.pos.y = this.state.mapSize.y - this.radius;
    this.vel.y = -Math.abs(this.vel.y) * this.collisionDamping;
  }
}
