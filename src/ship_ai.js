var chem = require('chem');
var v = chem.vec2d;
var createId = require('./uuid').createId;
var Ship = require('./ship');

module.exports = ShipAi;

function ShipAi(ship) {
  this.id = createId();
  this.ship = ship;
  this.target = null;
  this.alive = true;
}

ShipAi.prototype.hit = function(state) {
  this.ship.hit(state);
  if (this.ship.health <= 0) {
    state.createExplosion(this.ship.pos, this.ship.vel);
    state.deleteShip(this);
  }
};

ShipAi.prototype.delete = function(state) {
  this.alive = false;
  this.ship.delete();
};

ShipAi.prototype.draw = function(context) {
  var healthBarSize = v(32, 4);
  var start = this.ship.sprite.pos.minus(healthBarSize.scaled(0.5)).floor();
  context.fillStyle = '#ffffff';
  context.fillRect(start.x - 1, start.y - this.ship.sprite.size.y - 1, healthBarSize.x + 2, healthBarSize.y + 2);
  context.fillStyle = this.ship.health > 0.45 ? '#009413' : '#E20003';
  context.fillRect(start.x, start.y - this.ship.sprite.size.y, healthBarSize.x * this.ship.health, healthBarSize.y);
};

ShipAi.prototype.update = function (dt, dx, state) {
  // un-target dead ships
  if (this.target && !this.target.alive) this.target = null;

  if (! this.target) this.chooseTarget(state);
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
  this.ship.setRotateInput(delta / Ship.ROTATION_SPEED);
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
