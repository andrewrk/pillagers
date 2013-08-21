var util = require('util');
var TurretShip = require('./turret_ship');
var chem = require('chem');
var v = chem.vec2d;

module.exports = HeavyTurretShip;

util.inherits(HeavyTurretShip, TurretShip);
function HeavyTurretShip(state, o) {
  TurretShip.call(this, state, o);
  this.radius = 24;
  this.rotationSpeed = Math.PI * 0.01;
  this.thrustAmt = 0.01;

  this.defense = 2;
  this.bulletSpeed = 8;
  this.bulletLife = 0.8;
  this.bulletDamage = 4;
  this.rechargeAmt = 2;
  this.bulletDensity = 0.02;
  this.bulletAnimationName = 'bullet/large';
}

HeavyTurretShip.prototype.name = "HeavyTurret";

HeavyTurretShip.prototype.animationNames = {
  accel: 'ship_heavyturret_accel',
  decel: 'ship_heavyturret_decel',
  still: 'ship_heavyturret_still',
};
