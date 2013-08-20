var util = require('util');
var Ship = require('./ship');
var chem = require('chem');
var v = chem.vec2d;

module.exports = MilitiaShip;


util.inherits(MilitiaShip, Ship);
function MilitiaShip(state, o) {
  Ship.call(this, state, o);
  this.radius = 24;
  this.hasBackwardsThrusters = false;
  this.rotationSpeed = Math.PI * 0.03;
  this.thrustAmt = 0.1;
  this.rankOrder = 0;
  this.sensorRange = 500;

  this.hasMelee = true;
  this.meleeInput = null; // set to a ship to attack it
  this.meleeInputOn = false; // so you can fire even when it's pointless. silly humans like to do it.
  this.meleeRadius = 40;
  this.meleeDamage = 0.5;
  this.meleeAngleWideness = 0.80; // in terms of the dot product of the actual direction and the target
  this.rechargeAmt = 0.40;
  this.recharge = 0;

}

MilitiaShip.prototype.name = "Militia";

MilitiaShip.prototype.animationNames = {
  accel: 'ship_militia_accel',
  decel: 'ship_militia_decel',
  still: 'ship_militia_still',
};

MilitiaShip.prototype.clearInput = function() {
  Ship.prototype.clearInput.apply(this, arguments);

  this.meleeInput = null;
  this.meleeInputOn = false;
}

MilitiaShip.prototype.update = function(dt, dx) {
  Ship.prototype.update.apply(this, arguments);

  this.recharge -= dt;
  if (this.meleeInput && this.meleeInput.deleted) this.meleeInput = null;
  if (this.recharge <= 0) {
    if (this.meleeInput && this.isTargetInRange(this.meleeInput)) {
      this.fireMelee(this.meleeInput);
    } else if (this.meleeInputOn) {
      // shoot for no reason and miss everything.
      this.fireMelee(null);
    }
  }
}

MilitiaShip.prototype.fireMelee = function(target) {
  this.recharge = this.rechargeAmt;
  this.state.createElectricFx(this.pos.clone(), this.vel.clone(), this.rotation);
  if (target) target.damage(this.meleeDamage, "disintegrate");
}

MilitiaShip.prototype.isTargetInRange = function(target) {
  // make sure distance looks good
  var r = this.meleeRadius + target.radius;
  if (target.pos.distanceSqrd(this.pos) >= r * r) return false;
  // make sure the angle looks good
  var actualDir = v.unit(this.rotation);
  var targetDir = target.pos.minus(this.pos).normalize();
  return actualDir.dot(targetDir) >= this.meleeAngleWideness;
};

MilitiaShip.prototype.drawState = function(context) {
  // draw the attack area
  if (this.recharge <= 0) {
    var halfAngle = Math.acos(this.meleeAngleWideness);
    var beginRadians = this.rotation - halfAngle;
    var endRadians = this.rotation + halfAngle;
    var beginPos = v.unit(beginRadians).scale(this.meleeRadius);
    context.beginPath();
    context.moveTo(this.pos.x, this.pos.y);
    //context.lineTo(beginPos.x, beginPos.y);
    context.arc(this.pos.x, this.pos.y, this.meleeRadius, beginRadians, endRadians);
    context.lineTo(this.pos.x, this.pos.y);
    context.closePath();
    context.fillStyle = "#ffffff";
    context.globalAlpha = 0.4;
    context.fill();
    context.globalAlpha = 1;
  }
};
