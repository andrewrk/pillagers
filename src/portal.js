var PhysicsObject = require('./physics_object');
var util = require('util');
var chem = require('chem');
var v = chem.vec2d;

module.exports = Portal;

util.inherits(Portal, PhysicsObject);
function Portal(state, o) {
  PhysicsObject.apply(this, arguments);
  this.sprite = new chem.Sprite('portal');
  this.sprite.pos = this.pos.floored();
  this.state.batch.add(this.sprite);
  this.canBeSelected = true;
  this.radius = 64;
  this.miniMapColor = "#6A9EA8";
  this.canBeEntered = true;
  this.shipsInside = {};
  this.name = "Portal";
  this.uiAnimationName = "portal";
  this.uiButtons = [
    {
      caption: "Activate Portal",
      fn: this.activatePortal.bind(this),
    },
    {
      caption: "Send Ships Out",
      fn: this.sendShipsOut.bind(this),
    }
  ];
}

Portal.prototype.sendShipsOut = function() {
  var minRadius = 10;
  var maxRadius = this.radius;
  var count = 0;
  for (var id in this.shipsInside) {
    var ship = this.shipsInside[id];
    var radians = Math.random() * Math.PI * 2;
    var radius = (maxRadius - minRadius) * Math.random() + minRadius;
    var offset = v.unit(radians).scale(radius);
    ship.pos = this.pos.plus(offset);
    ship.vel = v(0, 0);
    ship.undelete(this.state);
    this.state.addShip(ship);
    count += 1;
  }
  this.shipsInside = {};
  this.state.updateUiPane();
  if (count === 0) {
    this.state.announce("There are no ships inside the Portal.");
  }
};

Portal.prototype.isFlagshipInside = function() {
  for (var id in this.shipsInside) {
    var ship = this.shipsInside[id];
    if (ship.isFlagship) return true;
  }
  return false;
};

Portal.prototype.activatePortal = function() {
  if (!this.isFlagshipInside()) {
    this.state.announce("Your Flagship must be inside the Portal to activate it.");
    return;
  }
  this.state.finishLevel(this.shipsInside);
};

Portal.prototype.update = function(dt, dx) {
  // http://25.media.tumblr.com/tumblr_m4hi5ygdtg1qa491po1_1280.jpg
  this.sprite.rotation = Math.random() * Math.PI * 2
};

Portal.prototype.delete = function() {
  this.sprite.delete();
}

Portal.prototype.enter = function(ship) {
  this.shipsInside[ship.id] = ship;
};
