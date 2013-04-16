//depend "chem"
//depend "uuid"

var SS = window.SS
  , Chem = window.Chem
  , v = Chem.Vec2d
  , createId = SS.createId

SS.ShipAi = ShipAi;

function ShipAi(ship) {
  this.id = createId();
  this.ship = ship;
  this.target = null;
}

ShipAi.prototype.update = function (dt, dx, state) {
  if (! this.target) this.chooseTarget();
  this.ship.shootInput = this.goodShotAtTarget() ? 1 : 0;
}

ShipAi.prototype.chooseTarget = function() {
  // TODO
};

ShipAi.prototype.goodShotAtTarget = function() {
  // TODO
  return true;
};
