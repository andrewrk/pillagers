var util = require('util');
var Ship = require('./ship');
var chem = require('chem');
var v = chem.vec2d;

module.exports = FlagShip;

util.inherits(FlagShip, Ship);
function FlagShip(state, o) {
  Ship.call(this, state, o);
  this.radius = 60;
  this.sprite.scale = v(2, 2);
  this.hasBackwardsThrusters = true;
  this.rotationSpeed = Math.PI * 0.005;
  this.thrustAmt = 0.005;
  this.rankOrder = 10;
  this.sensorRange = 400;
  this.density = 0.04;

  this.defense = 20;

  this.name = "Flagship";

  initListeners(this);
}

FlagShip.prototype.animationNames = {
  accel: 'ship_flag_accel',
  decel: 'ship_flag_decel',
  backwardsAccel: 'ship_flag_accel_back',
  backwardsDecel: 'ship_flag_decel_back',
  still: 'ship_flag_still',
};

function initListeners(self) {
  self.on('destroyed', function() {
    self.state.flagShipDestroyed(self);
  });
}
