var util = require('util');
var Ship = require('./ship');
var Shield = require('./shield');

var chem = require('chem');
var v = chem.vec2d;

module.exports = ShieldShip;

util.inherits(ShieldShip, Ship);
function ShieldShip(state, o) {
  Ship.call(this, state, o);

  this.radius = 27;
  this.hasBackwardsThrusters = true;
  this.rotationSpeed = Math.PI * 0.019;
  this.thrustAmt = 0.04;
  this.rankOrder = 2;
  this.defense = 2;
  this.sensorRange = 600;

  this.shield = new Shield(state, {
    vel: this.vel.clone(),
    pos: this.pos.clone(),
    radius: 120,
    team: this.team,
  });
  this.shield.on('reflect', onShieldReflect.bind(this));
  this.state.addPhysicsObject(this.shield);
}

ShieldShip.prototype.name = "ShieldGenerator";

ShieldShip.prototype.animationNames = {
  accel: 'ship_shield_accel',
  decel: 'ship_shield_decel',
  still: 'ship_shield_still',
  backwardsAccel: 'ship_shield_accel_back',
  backwardsDecel: 'ship_shield_decel_back',
};

ShieldShip.prototype.update = function(dt, dx) {
  Ship.prototype.update.call(this, dt, dx);

  this.shield.pos = this.pos.clone();
  this.shield.vel = this.vel.clone();
};

ShieldShip.prototype._delete = function() {
  Ship.prototype._delete.call(this);
  this.state.deletePhysicsObject(this.shield);
  this.shield.delete();
};

function onShieldReflect(obj) {
  // when an object bounces off a shield generator's shield, apply the
  // collision to the shield generator
  obj.collide(this);
}

