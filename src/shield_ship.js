var util = require('util');
var Ship = require('./ship');

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

  this.hasShield = true;
  this.shieldRadius = 120;
  this.sensorRange = 600;

  this.shieldPower = 1;
  this.shieldPowerRechargeAmt = 0.002;
}

ShieldShip.prototype.name = "Shield";

ShieldShip.prototype.animationNames = {
  accel: 'ship_shield_accel',
  decel: 'ship_shield_decel',
  still: 'ship_shield_still',
  backwardsAccel: 'ship_shield_accel_back',
  backwardsDecel: 'ship_shield_decel_back',
};

ShieldShip.prototype.draw = function(context) {
  Ship.prototype.draw.call(this, context);

  context.globalAlpha = (this.shieldPower > 0.3) ? 1 : (this.shieldPower / 0.3);
  context.beginPath();
  context.arc(this.sprite.pos.x, this.sprite.pos.y, this.shieldRadius, 0, 2 * Math.PI);
  context.closePath();
  context.strokeStyle = this.team.color;
  context.stroke();
  context.globalAlpha = 1;

  var shieldPowerBarSize = v(32, 4);
  var start = this.pos.minus(shieldPowerBarSize.scaled(0.5)).floor();
  start.y -= this.shieldRadius + shieldPowerBarSize.y;
  context.fillStyle = "#000000";
  context.fillRect(start.x - 1, start.y - 1, shieldPowerBarSize.x + 2, shieldPowerBarSize.y + 2);
  context.fillStyle = this.team.color;
  context.fillRect(start.x, start.y, shieldPowerBarSize.x * this.shieldPower, shieldPowerBarSize.y);
};

ShieldShip.prototype.update = function(dt, dx) {
  Ship.prototype.update.call(this, dt, dx);

  this.shieldPower = Math.min(1, this.shieldPower + dx * this.shieldPowerRechargeAmt);

  if (this.deleted) return;
  for (var i = 0; i < this.state.physicsObjects.length; i += 1) {
    var obj = this.state.physicsObjects[i];
    if (obj.deleted) continue;
    if (!obj.canHitShield) continue;
    if (obj.team === this.team) continue;
    var downShieldAmt = obj.damageAmount / 20;
    if (this.shieldPower < downShieldAmt) continue;
    var withinRangeDistSqrd = obj.radius * obj.radius + this.shieldRadius * this.shieldRadius;
    if (obj.pos.distanceSqrd(this.pos) > withinRangeDistSqrd) continue;
    obj.collide(this);
    obj.hitShield(this);
    this.shieldPower = Math.max(0, this.shieldPower - downShieldAmt);
  }
};
