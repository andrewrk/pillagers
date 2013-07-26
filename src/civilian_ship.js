var util = require('util');
var Ship = require('./ship');
var chem = require('chem');
var v = chem.vec2d;

module.exports = CivilianShip;

util.inherits(CivilianShip, Ship);
function CivilianShip(state, o) {
  Ship.call(this, state, o);
  this.radius = 34;
  this.hasBackwardsThrusters = false;
  this.rotationSpeed = Math.PI * 0.008;
  this.thrustAmt = 0.01;
  this.rankOrder = 9;
  this.sensorRange = 300;
  this.bounty = 20;
  this.hostile = false;
}

CivilianShip.prototype.name = "Civilian";

CivilianShip.prototype.animationNames = {
  accel: 'ship_civilian_accel',
  decel: 'ship_civilian_decel',
  still: 'ship_civilian_still',
};

