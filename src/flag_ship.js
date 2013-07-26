var util = require('util');
var Ship = require('./ship');
var chem = require('chem');
var v = chem.vec2d;

module.exports = FlagShip;

util.inherits(FlagShip, Ship);
function FlagShip(state, o) {
  Ship.call(this, state, o);
  this.radius = 60;
  this.hasBackwardsThrusters = true;
  this.rotationSpeed = Math.PI * 0.005;
  this.thrustAmt = 0.005;
  this.rankOrder = 10;
  this.sensorRange = 400;
  this.density = 0.04;
  this.collisionDamping = 0.10;

  this.defense = 20;

  this.isFlagship = true;
}

FlagShip.prototype.name = "Flagship";

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

FlagShip.prototype.initResources = function(state) {
  Ship.prototype.initResources.apply(this, arguments);
  initListeners(this);
};
