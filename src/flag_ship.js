var util = require('util');
var Ship = require('./ship');
var chem = require('chem');
var RangerShip = require('./ranger_ship');
var MilitiaShip = require('./militia_ship');
var TurretShip = require('./turret_ship');
var ArtilleryShip = require('./artillery_ship');
var ShieldShip = require('./shield_ship');
var CannonShip = require('./cannon_ship');
var HeavyTurretShip = require('./heavy_turret_ship');
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
  this.bounty = 50;
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
      cost: 15
    },
    {
      shipTypeLock: "Turret",
      caption: "Create Turret",
      fn: createShipFn(this, TurretShip),
      cost: 15
    },
    {
      shipTypeLock: "Artillery",
      caption: "Create Artillery",
      fn: createShipFn(this, ArtilleryShip),
      cost: 30
    },
    {
      shipTypeLock: "Shield",
      caption: "Create Shield",
      fn: createShipFn(this, ShieldShip),
      cost: 35
    },
    {
      shipTypeLock: "Cannon",
      caption: "Create Cannon",
      fn: createShipFn(this, CannonShip),
      cost: 35
    },
    {
      shipTypeLock: "HeavyTurret",
      caption: "Create Heavy Turret",
      fn: createShipFn(this, HeavyTurretShip),
      cost: 25
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
    self.state.stats.shipsGained += 1;
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
