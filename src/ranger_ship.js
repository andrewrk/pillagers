var util = require('util');
var Ship = require('./ship');
var Bullet = require('./bullet');
var chem = require('chem');
var v = chem.vec2d;

module.exports = RangerShip;


util.inherits(RangerShip, Ship);
function RangerShip(state, o) {
  this.animationNames = {
    accel: 'ship_ranger_accel',
    decel: 'ship_ranger_decel',
    still: 'ship_ranger_still',
  };
  Ship.call(this, state, o);
  this.radius = 16;
  this.hasBackwardsThrusters = false;
  this.rotationSpeed = Math.PI * 0.02;
  this.thrustAmt = 0.05;
  this.rankOrder = 1;
  this.sensorRange = 400;

  this.shootInput = false;
  this.hasBullets = true;
  this.bulletSpeed = 10;
  this.bulletLife = 0.5;
  this.bulletDamage = 0.05;
  this.rechargeAmt = 0.20;
  this.recharge = 0;
}

RangerShip.prototype.update = function(dt, dx) {
  Ship.prototype.update.apply(this, arguments);
  this.recharge -= dt;
  if (this.shootInput && this.recharge <= 0) {
    this.recharge = this.rechargeAmt;
    // create projectile
    var unit = v.unit(this.rotation);
    var bullet = new Bullet(this.state, {
      pos: this.pos.plus(unit.scaled(this.radius)),
      vel: unit.scaled(this.bulletSpeed).add(this.vel),
      team: this.team,
      damage: this.bulletDamage,
      life: this.bulletLife,
    });
    this.state.addBullet(bullet);
  }
}

RangerShip.prototype.clearInput = function() {
  Ship.prototype.clearInput.apply(this, arguments);

  this.shootInput = false;
}
