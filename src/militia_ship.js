var util = require('util');
var Ship = require('./ship');

module.exports = MilitiaShip;


util.inherits(MilitiaShip, Ship);
function MilitiaShip(state, o) {
  this.animationNames = {
    accel: 'ship_militia_accel',
    decel: 'ship_militia_decel',
    still: 'ship_militia_still',
  };
  Ship.call(this, state, o);
  this.radius = 24;
  this.hasBackwardsThrusters = false;
  this.bulletRange = 10;
  this.bulletDamage = 0.1;
  this.rotationSpeed = Math.PI * 0.03;
  this.thrustAmt = 0.1;
  this.rankOrder = 0;
}
