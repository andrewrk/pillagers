var createId = require('./uuid').createId;
var chem = require('chem');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var v = chem.vec2d;

var MINIMUM_VELOCITY_SQRD = 0.001 * 0.001;
var MIN_BRAKE_VEL = 0.2;

module.exports = Ship;

util.inherits(Ship, EventEmitter);
function Ship(state, o) {
  EventEmitter.call(this);
  o = o || {};
  this.state = state;
  this.canBeShot = true;
  this.vel = o.vel || v();
  this.pos = o.pos || v();
  this.rotation = o.rotation == null ? Math.PI / 2 : o.rotation;
  this.id = createId();
  // tells where it shows up in the squad
  this.rankOrder = 0;

  this.sprite = new chem.Sprite(this.animationNames.still);
  this.state.batch.add(this.sprite);
  this.thrustAudio = new Audio("sfx/thruster.ogg");
  this.thrustAudio.loop = true;

  this.defense = 1;
  this.sensorRange = 400; // radius of ability to detect ships
  this.thrustInput = 0;
  this.brakeInput = false; // lets you brake at low velocities
  this.rotateInput = 0;
  this.team = o.team;
  this.health = o.health || 1;
  this.hasBackwardsThrusters = true;
  this.radius = 16;
  this.rotationSpeed = Math.PI * 0.03;
  this.thrustAmt = 0.1;
  this.hasBullets = false;
  this.deleted = false;
  this.density = 0.02;
  this.collisionDamping = 0.40;
  this.canCauseCollision = false;
  this.canBeStruck = true;
}

Ship.prototype.mass = function() {
  return this.density * Math.PI * this.radius * this.radius;
};

Ship.prototype.clearInput = function() {
  this.setThrustInput(0);
  this.setRotateInput(0);
  this.brakeInput = false;
};

Ship.prototype.setThrustInput = function(value, brake) {
  assert(Math.abs(value) <= 1);
  assert(value >= 0 || this.hasBackwardsThrusters);
  this.brakeInput = brake == null ? false : brake;
  if (this.thrustInput === value) return;
  if (value === 0) {
    this.thrustAudio.pause();
    if (this.thrustInput > 0) {
      this.sprite.setAnimationName(this.animationNames.decel);
    } else {
      this.sprite.setAnimationName(this.animationNames.backwardsDecel);
    }
  } else if (value > 0) {
    this.thrustAudio.play();
    this.sprite.setAnimationName(this.animationNames.accel);
  } else if (value < 0) {
    this.thrustAudio.play();
    this.sprite.setAnimationName(this.animationNames.backwardsAccel);
  }
  this.sprite.setFrameIndex(0);
  this.thrustInput = value;
};

Ship.prototype.setRotateInput = function(value) {
  this.rotateInput = value;
  if (this.rotateInput > 1) this.rotateInput = 1;
  if (this.rotateInput < -1) this.rotateInput = -1;
};

Ship.prototype.draw = function(context) {}

Ship.prototype.drawHealthBar = function(context) {
  var healthBarSize = v(32, 4);
  var start = this.sprite.pos.minus(healthBarSize.scaled(0.5)).floor();
  context.fillStyle = '#ffffff';
  context.fillRect(start.x - 1, start.y - this.sprite.size.y * 0.60 - 1, healthBarSize.x + 2, healthBarSize.y + 2);
  context.fillStyle = this.health > 0.45 ? '#009413' : '#E20003';
  context.fillRect(start.x, start.y - this.sprite.size.y * 0.60, healthBarSize.x * this.health, healthBarSize.y);
};

Ship.prototype.drawSelectionCircle = function(context) {
  context.beginPath();
  context.arc(this.sprite.pos.x, this.sprite.pos.y, this.radius, 0, 2 * Math.PI);
  context.closePath();
  context.strokeStyle = "#ffffff";
  context.lineWidth = 1;
  context.stroke();
};

Ship.prototype.drawTeamColor = function(context) {
  context.beginPath();
  context.arc(this.sprite.pos.x, this.sprite.pos.y, 4, 0, 2 * Math.PI);
  context.closePath();
  context.fillStyle = this.team.color;
  context.fill();
};

Ship.prototype.checkOutOfBounds = function() {
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

Ship.prototype.update = function(dt, dx) {
  this.pos.add(this.vel.scaled(dx));
  this.checkOutOfBounds();
  this.rotation += this.rotateInput * this.rotationSpeed * dx;
  // clamp rotation
  this.rotation = this.rotation % (2 * Math.PI);
  var thrust = v.unit(this.rotation);
  this.vel.add(thrust.scaled(this.thrustInput * this.thrustAmt * dx));
  // if vel is close enough to 0, set it to 0
  var speedSqrd = this.vel.lengthSqrd();
  var minBrakeVel = Math.max(MIN_BRAKE_VEL, 2 * this.thrustAmt * this.thrustAmt);
  if (speedSqrd < MINIMUM_VELOCITY_SQRD || (this.brakeInput && speedSqrd < minBrakeVel))
  {
    this.vel.x = 0;
    this.vel.y = 0;
  }

  this.sprite.rotation = this.rotation + Math.PI / 2;
  this.sprite.pos = this.pos.floored();
};

Ship.prototype.hit = function(damage, explosionAnimationName) {
  this.health -= damage / this.defense;
  this.emit('hit');
  if (this.health <= 0) {
    this.emit('destroyed');
    this.state.createExplosion(this.pos, this.vel, explosionAnimationName);
    this.state.deletePhysicsObject(this);
    this.delete();
  }
};

Ship.prototype.delete = function() {
  if (this.deleted) return;
  this.emit('deleted');
  this.deleted = true;
  this.sprite.delete();
  this.thrustAudio.pause();
  this.thrustAudio = null;
};

function assert(value) {
  if (!value) throw new Error("Assertion Failure: " + value);
}
