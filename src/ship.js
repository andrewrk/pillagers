var createId = require('./uuid').createId;
var chem = require('chem');
var Bullet = require('./bullet');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var v = chem.vec2d;

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
  this.sprite = new chem.Sprite(this.animationNames.still);
  this.state.batch.add(this.sprite);
  this.thrustInput = 0;
  this.rotateInput = 0;
  this.shootInput = 0;
  this.recharge = 0;
  this.team = o.team == null ? 0 : o.team;
  this.health = o.health || 1;
  this.hasBackwardsThrusters = true;

  this.collisionDamping = 0.40;
  this.radius = 16;
  this.rotationSpeed = Math.PI * 0.03;
  this.thrustAmt = 0.1;
  this.rechargeAmt = 0.20;
  this.bulletDamage = 0.1;
  this.bulletSpeed = 10;
  this.bulletLife = 3;
}

Ship.prototype.setThrustInput = function(value) {
  assert(Math.abs(value) <= 1);
  assert(value >= 0 || this.hasBackwardsThrusters);
  if (this.thrustInput === value) return;
  if (value === 0) {
    if (this.thrustInput > 0) {
      this.sprite.setAnimationName(this.animationNames.decel);
    } else {
      this.sprite.setAnimationName(this.animationNames.backwardsDecel);
    }
  } else if (value > 0) {
    this.sprite.setAnimationName(this.animationNames.accel);
  } else if (value < 0) {
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

Ship.prototype.drawHealthBar = function(context) {
  var healthBarSize = v(32, 4);
  var start = this.sprite.pos.minus(healthBarSize.scaled(0.5)).floor();
  context.fillStyle = '#ffffff';
  context.fillRect(start.x - 1, start.y - this.sprite.size.y - 1, healthBarSize.x + 2, healthBarSize.y + 2);
  context.fillStyle = this.health > 0.45 ? '#009413' : '#E20003';
  context.fillRect(start.x, start.y - this.sprite.size.y, healthBarSize.x * this.health, healthBarSize.y);
};

Ship.prototype.drawSelectionCircle = function(context) {
  context.beginPath();
  context.arc(this.sprite.pos.x, this.sprite.pos.y, this.radius, 0, 2 * Math.PI);
  context.closePath();
  context.strokeStyle = "#ffffff";
  context.lineWidth = 1;
  context.stroke();
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
  var thrust = v(Math.cos(this.rotation), Math.sin(this.rotation));
  this.vel.add(thrust.scaled(this.thrustInput * this.thrustAmt * dx));

  this.sprite.rotation = this.rotation + Math.PI / 2;
  this.sprite.pos = this.pos.floored();

  this.recharge -= dt;
  if (this.shootInput && this.recharge <= 0) {
    this.recharge = this.rechargeAmt;
    // create projectile
    var unit = unitFromAngle(this.rotation);
    var bullet = new Bullet(this.state, {
      pos: this.pos.plus(unit.scaled(this.radius)),
      vel: unit.scaled(this.bulletSpeed).add(this.vel),
      team: this.team,
      damage: this.bulletDamage,
      life: this.bulletLife,
    });
    this.state.addBullet(bullet);
  }
};

Ship.prototype.hit = function(bullet) {
  this.health -= bullet.damage;
  this.emit('hit', bullet);
  if (this.health <= 0) {
    this.emit('destroyed', bullet);
    this.state.createExplosion(this.pos, this.vel);
    this.state.deletePhysicsObject(this);
    this.delete();
  }
};

Ship.prototype.delete = function() {
  this.emit('deleted');
  this.sprite.delete();
};

function unitFromAngle(angle) {
  return v(Math.cos(angle), Math.sin(angle));
}

function assert(value) {
  if (!value) throw new Error("Assertion Failure: " + value);
}
