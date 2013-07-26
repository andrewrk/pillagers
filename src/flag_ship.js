var util = require('util');
var Ship = require('./ship');
var chem = require('chem');
var RangerShip = require('./ranger_ship');
var MilitiaShip = require('./militia_ship');
var TurretShip = require('./turret_ship');
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
  this.uiButtons = [
    {
      shipTypeLock: "Ranger",
      caption: "Create Ranger",
      fn: createShipFn(this, RangerShip),
      cost: 10
    },
    {
      shipTypeLock: "Militia",
      caption: "Create Militia",
      fn: createShipFn(this, MilitiaShip),
      cost: 20
    },
    {
      shipTypeLock: "Turret",
      caption: "Create Turret",
      fn: createShipFn(this, TurretShip),
      cost: 15
    },
  ];
}

function createShipFn(self, ShipType) {
  return function() {
    var radians = Math.random() * Math.PI * 2;
    var ejectSpeed = 0.80;
    var ship = new ShipType(self.state, {
      team: self.team,
      pos: self.pos.plus(v.unit(radians).scale(self.radius)),
      vel: self.vel.plus(v.unit(radians).scale(ejectSpeed)),
      rotation: radians,
    });
    self.state.addShip(ship);
  };
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
