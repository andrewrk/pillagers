var util = require('util');
var sfx = require('./sfx');
var RangerShip = require('./ranger_ship');
var Bullet = require('./bullet');
var chem = require('chem');
var v = chem.vec2d;

module.exports = ArtilleryShip;

util.inherits(ArtilleryShip, RangerShip);
function ArtilleryShip(state, o) {
  RangerShip.call(this, state, o);
  this.radius = 36;
  this.hasBackwardsThrusters = false;
  this.rotationSpeed = Math.PI * 0.01;
  this.thrustAmt = 0.01;
  this.rankOrder = 3;
  this.sensorRange = 400;
  this.defense = 2;

  this.bulletSpeed = 8;
  this.bulletLife = 0.8;
  this.bulletDamage = 4;
  this.rechargeAmt = 2;
  this.bulletDensity = 0.02;
  this.bulletAnimationName = 'bullet/large';
  this.bulletSfx = sfx.shootStrongBullet;
}

ArtilleryShip.prototype.name = "Artillery";

ArtilleryShip.prototype.animationNames = {
  accel: 'ship_artillery_accel',
  decel: 'ship_artillery_decel',
  still: 'ship_artillery_still',
};

ArtilleryShip.prototype.gunPositions = function() {
  return [
    this.pos.plus(v.unit(this.rotation + Math.PI / 2).scaled(22)),
    this.pos.plus(v.unit(this.rotation - Math.PI / 2).scaled(22)),
  ];
};
