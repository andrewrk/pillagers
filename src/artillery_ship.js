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

  this.calcGunPositions();
}

ArtilleryShip.prototype.name = "Artillery";

ArtilleryShip.prototype.animationNames = {
  accel: 'ship_artillery_accel',
  decel: 'ship_artillery_decel',
  still: 'ship_artillery_still',
};

ArtilleryShip.prototype.update = function(dt, dx) {
  RangerShip.prototype.update.apply(this, arguments);
  this.calcGunPositions();
};

ArtilleryShip.prototype.drawState = function(context) {
  // draw a line representing where we're aiming
  context.beginPath();
  for (var i = 0; i < this.gunPositions.length; i += 1) {
    context.moveTo(this.gunPositions[i].x, this.gunPositions[i].y);
    context.lineTo(this.bulletEndPos[i].x, this.bulletEndPos[i].y);
  }
  context.closePath();
  context.globalAlpha = this.recharge <= 0 ? 0.3 : 0.05;
  context.lineWidth = 1;
  context.fillStyle = "#ffffff";
  context.stroke();
  context.globalAlpha = 1;
}


ArtilleryShip.prototype.createProjectile = function() {
  sfx.shootStrongBullet();
  this.calcGunPositions();
  for (var i = 0; i < 2; i += 1) {
    var pos = this.gunPositions[i];
    var bullet = new Bullet(this.state, {
      pos: pos,
      vel: this.actualDir.scaled(this.bulletSpeed).add(this.vel),
      team: this.team,
      damage: this.bulletDamage,
      life: this.bulletLife,
      animationName: this.bulletAnimationName,
    });
    this.state.addBullet(bullet);
  }
}

ArtilleryShip.prototype.calcGunPositions = function() {
  this.actualDir = v.unit(this.rotation);
  this.gunPositions = [
    this.pos.plus(v.unit(this.rotation + Math.PI / 2).scaled(22)),
    this.pos.plus(v.unit(this.rotation - Math.PI / 2).scaled(22)),
  ];
  var adjustedBulletVel = this.actualDir.scaled(this.bulletSpeed);
  var bulletRange = adjustedBulletVel.length() * this.bulletLife * 60;
  this.bulletEndPos = new Array(this.gunPositions.length);
  for (var i = 0; i < this.gunPositions.length; i += 1) {
    var beginPos = this.gunPositions[i];
    this.bulletEndPos[i] = beginPos.plus(this.actualDir.scaled(bulletRange));
  }
};
