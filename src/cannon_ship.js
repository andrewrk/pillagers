var util = require('util');
var RangerShip = require('./ranger_ship');
var Bullet = require('./bullet');

var chem = require('chem');
var v = chem.vec2d;

module.exports = CannonShip;

util.inherits(CannonShip, RangerShip);
function CannonShip(state, o) {
  RangerShip.call(this, state, o);

  this.radius = 27;
  this.hasBackwardsThrusters = false;
  this.rotationSpeed = Math.PI * 0.012;
  this.thrustAmt = 0.012;
  this.rankOrder = 3;
  this.defense = 2;
  this.bulletDamage = 0.05;
  this.bulletSpeed = 8;
  this.bulletLife = 2;
  this.bulletAnimationName = 'bullet/cannonball';
  this.rechargeAmt = 1.5;

  this.standGround = true;
}

CannonShip.prototype.name = "Cannon";

CannonShip.prototype.animationNames = {
  accel: 'ship_cannon_accel',
  decel: 'ship_cannon_decel',
  still: 'ship_cannon_still',
};

CannonShip.prototype.createProjectile = function() {
  var unit = v.unit(this.rotation);
  var bullet = new Bullet(this.state, {
    pos: this.pos.plus(unit.scaled(this.radius)),
    vel: unit.scaled(this.bulletSpeed).add(this.vel),
    team: this.team,
    damageAmount: this.bulletDamage,
    life: this.bulletLife,
    canHitShield: false,
    density: 0.10,
    radius: 16,
    animationName: this.bulletAnimationName,
    collisionDamping: 0.4,
    surviveHit: true,
    canBeStruck: true,
    canBeShot: true,
  });
  this.state.addBullet(bullet);
}
