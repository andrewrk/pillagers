var util = require('util');
var Ship = require('./ship');

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
  this.bulletRange = 10;
  this.bulletDamage = 0.1;
  this.rotationSpeed = Math.PI * 0.02;
  this.thrustAmt = 0.05;
  this.rankOrder = 1;
}

