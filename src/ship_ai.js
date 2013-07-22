var chem = require('chem');
var v = chem.vec2d;
var createId = require('./uuid').createId;

module.exports = ShipAi;

function ShipAi(state, ship) {
  this.state = state;
  this.id = createId();
  this.ship = ship;
  this.target = null;
  this.alive = true;

  subscribeToShipEvents(this);
}

function subscribeToShipEvents(self) {
  self.ship.on('deleted', function() {
    self.delete();
  });
}

ShipAi.prototype.delete = function() {
  this.alive = false;
  this.state.deleteAi(this);
};

ShipAi.prototype.update = function (dt, dx) {
  // un-target dead ships
  if (this.target && !this.target.alive) this.target = null;

  if (! this.target) this.chooseTarget(this.state);
  if (! this.target) {
    this.ship.shootInput = 0;
    this.ship.rotateInput = 0;
    return;
  }

  var targetAngle = this.target.ship.pos.minus(this.ship.pos).angle();
  var delta = targetAngle - this.ship.rotation;
  var goodShot = Math.abs(delta) < Math.PI / 10;

  // shoot at target
  this.ship.shootInput = goodShot ? 1 : 0;

  // aim at target
  this.ship.setRotateInput(delta / this.ship.rotationSpeed);
}

ShipAi.prototype.chooseTarget = function() {
  for (var id in this.state.aiObjects) {
    var ai = this.state.aiObjects[id];
    if (ai.ship.team !== this.ship.team) {
      this.target = ai;
      return;
    }
  }
  this.target = null;
};

function sign(x) {
  if (x > 0) {
    return 1;
  } else if (x < 0) {
    return -1;
  } else {
    return 0;
  }
}
