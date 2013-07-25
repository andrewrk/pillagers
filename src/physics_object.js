var createId = require('./uuid').createId;
var chem = require('chem');
var v = chem.vec2d;
module.exports = PhysicsObject;

function PhysicsObject(state, o) {
  o = o || {};
  this.state = state;
  this.canBeShot = false;
  this.vel = o.vel || v();
  this.pos = o.pos || v();
  this.rotation = o.rotation == null ? Math.PI / 2 : o.rotation;
  this.id = createId();
  this.selected = false;
  this.canBeSelected = false;

  this.canGoOffscreen = false;
  this.defense = 1;
  this.health = o.health || 1;
  this.radius = o.radius || 16;
  this.deleted = false;
  this.density = 0.02;
  this.collisionDamping = 0.40;

  // an object which canBeStruck can collide when hit by an object that canCauseCollision.
  this.canCauseCollision = false;
  this.canBeStruck = false;

  this.miniMapColor = null;
}

PhysicsObject.prototype.mass = function() {
  return this.density * Math.PI * this.radius * this.radius;
};

PhysicsObject.prototype.draw = function(context) {
  if (this.health < 1 || this.selected) this.drawHealthBar(context);
  if (this.selected) this.drawSelectionCircle(context);
}

PhysicsObject.prototype.drawHealthBar = function(context) {
  var healthBarSize = v(32, 4);
  var start = this.pos.minus(healthBarSize.scaled(0.5)).floor();
  start.y -= this.radius + healthBarSize.y;
  context.fillStyle = '#ffffff';
  context.fillRect(start.x - 1, start.y - 1, healthBarSize.x + 2, healthBarSize.y + 2);
  context.fillStyle = this.health > 0.45 ? '#009413' : '#E20003';
  context.fillRect(start.x, start.y, healthBarSize.x * this.health, healthBarSize.y);
}

PhysicsObject.prototype.drawSelectionCircle = function(context) {
  context.beginPath();
  context.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
  context.closePath();
  context.strokeStyle = "#ffffff";
  context.lineWidth = 1;
  context.stroke();
};

PhysicsObject.prototype.checkOutOfBounds = function() {
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

PhysicsObject.prototype.update = function(dt, dx) {
  this.pos.add(this.vel.scaled(dx));
  if (!this.canGoOffscreen) this.checkOutOfBounds();
};

PhysicsObject.prototype.hit = function(damage, explosionAnimationName) {}

PhysicsObject.prototype.delete = function() {
  this.deleted = true;
}
