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
  this.meleeRadius = 32;
  this.meleeDamage = 0.5;
  this.rechargeAmt = 0.40;
  this.recharge = 0;

  this.name = "Militia";
}

MilitiaShip.prototype.animationNames = {
  accel: 'ship_militia_accel',
  decel: 'ship_militia_decel',
  still: 'ship_militia_still',
};

MilitiaShip.prototype.clearInput = function() {
  Ship.prototype.clearInput.apply(this, arguments);

  this.meleeInput = null;
}

MilitiaShip.prototype.update = function(dt, dx) {
  Ship.prototype.update.apply(this, arguments);

  this.recharge -= dt;
  if (this.meleeInput && this.recharge <= 0 &&
     (this.meleeInput.pos.distance(this.pos) < this.meleeRadius + this.meleeInput.radius))
  {
    // make sure the angle looks good
    var actualDir = v.unit(this.rotation);
    var targetDir = this.meleeInput.pos.minus(this.pos).normalize();
    if (actualDir.dot(targetDir) > 0.80) {
      this.recharge = this.rechargeAmt;
      this.state.createElectricFx(this.pos.clone(), this.vel.clone(), this.rotation);
      this.meleeInput.hit(this.meleeDamage, "disintegrate");
    }
  }
}
