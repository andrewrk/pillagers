var util = require('util');
var Ship = require('./ship');
var chem = require('chem');
var v = chem.vec2d;

module.exports = FlagShip;

util.inherits(FlagShip, Ship);
function FlagShip(state, o) {
  Ship.call(this, state, o);
  this.radius = 30;
  this.hasBackwardsThrusters = true;
  this.rotationSpeed = Math.PI * 0.005;
  this.thrustAmt = 0.005;
  this.rankOrder = 10;
  this.sensorRange = 400;

  this.defense = 20;
}

FlagShip.prototype.animationNames = {
  accel: 'ship_flag_accel',
  decel: 'ship_flag_decel',
  backwardsAccel: 'ship_flag_accel_back',
  backwardsDecel: 'ship_flag_decel_back',
  still: 'ship_flag_still',
};
