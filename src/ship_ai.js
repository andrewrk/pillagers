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
  if (! this.target) this.chooseTarget(state);
  if (! this.target) {
    this.ship.shootInput = 0;
    return;
  }

  var targetAngle = this.target.ship.pos.minus(this.ship.pos).angle();
  var delta = targetAngle - this.ship.rotation;
  var goodShot = Math.abs(delta) < Math.PI / 10;
  var reallyGoodShot = Math.abs(delta) < Math.PI / 20;

  // shoot at target
  this.ship.shootInput = goodShot ? 1 : 0;

  // aim at target
  this.ship.rotateInput = reallyGoodShot ? 0 : sign(delta);
}

ShipAi.prototype.chooseTarget = function(state) {
  for (var id in state.aiObjects) {
    var ai = state.aiObjects[id];
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
