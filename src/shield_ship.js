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
  context.beginPath();
  context.arc(this.sprite.pos.x, this.sprite.pos.y, this.shieldRadius, 0, 2 * Math.PI);
  context.closePath();
  context.strokeStyle = this.team.color;
  context.stroke();
};

ShieldShip.prototype.update = function(dt, dx) {
  Ship.prototype.update.call(this, dt, dx);

  if (this.deleted) return;
  for (var i = 0; i < this.state.physicsObjects.length; i += 1) {
    var obj = this.state.physicsObjects[i];
    if (obj.deleted) continue;
    if (!obj.canHitShield) continue;
    if (obj.team === this.team) continue;
    var withinRangeDistSqrd = obj.radius * obj.radius + this.shieldRadius * this.shieldRadius;
    if (obj.pos.distanceSqrd(this.pos) > withinRangeDistSqrd) continue;
    obj.collide(this);
    obj.hitShield(this);
  }
};
