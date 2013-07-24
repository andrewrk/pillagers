var util = require('util');
var RangerShip = require('./ranger_ship');
var chem = require('chem');
var v = chem.vec2d;

module.exports = TurretShip;

util.inherits(TurretShip, RangerShip);
function TurretShip(state, o) {
  RangerShip.call(this, state, o);
  this.radius = 16;
  this.hasBackwardsThrusters = false;
  this.rotationSpeed = Math.PI * 0.02;
  this.thrustAmt = 0.05;
  this.rankOrder = 1;
  this.sensorRange = 400;

  this.bulletSpeed = 10;
  this.bulletLife = 0.7;
  this.bulletDamage = 0.08;
  this.rechargeAmt = 0.20;
  this.recharge = 0;

  this.standGround = true;
}

TurretShip.prototype.animationNames = {
  accel: 'ship_turret_accel',
  decel: 'ship_turret_decel',
  still: 'ship_turret_still',
};

