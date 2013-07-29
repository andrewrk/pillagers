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

  this.bulletSpeed = 8;
  this.bulletLife = 0.8;
  this.bulletDamage = 4;
  this.rechargeAmt = 2;
  this.bulletAnimationName = 'bullet/large';
}

ArtilleryShip.prototype.name = "Artillery";

ArtilleryShip.prototype.animationNames = {
  accel: 'ship_artillery_accel',
  decel: 'ship_artillery_decel',
  still: 'ship_artillery_still',
};

ArtilleryShip.prototype.createProjectile = function() {
  sfx.shootStrongBullet();
  var unit = v.unit(this.rotation);
  var positions = [
    this.pos.plus(v.unit(this.rotation + Math.PI / 2).scaled(22)),
    this.pos.plus(v.unit(this.rotation - Math.PI / 2).scaled(22)),
  ];
  for (var i = 0; i < 2; i += 1) {
    var pos = positions[i];
    var bullet = new Bullet(this.state, {
      pos: pos,
      vel: unit.scaled(this.bulletSpeed).add(this.vel),
      team: this.team,
      damage: this.bulletDamage,
      life: this.bulletLife,
      animationName: this.bulletAnimationName,
    });
    this.state.addBullet(bullet);
  }
}
