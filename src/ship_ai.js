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

  this.selected = false;
  this.commands = [];

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
  var cmd = this.commands[0];

  if (cmd) {
    cmd.execute(this, dt, dx);
    if (cmd.done) this.commands.shift();
    return;
  }

  // un-target dead ships
  if (this.target && !this.target.alive) this.target = null;

  if (! this.target) this.chooseTarget(this.state);
  if (! this.target) {
    this.ship.shootInput = 0;
    this.ship.rotateInput = 0;
    return;
  }

  var targetAngle = this.target.ship.pos.minus(this.ship.pos).angle();
  var delta = angleSubtract(targetAngle, this.ship.rotation);
  var goodShot = Math.abs(delta) < Math.PI / 10;

  // shoot at target
  this.ship.shootInput = goodShot ? 1 : 0;

  // aim at target
  this.ship.setRotateInput(delta / this.ship.rotationSpeed);
}

ShipAi.prototype.pointTowardDirection = function(targetDir) {
  var targetAngle = targetDir.angle();
  var delta = angleSubtract(targetAngle, this.ship.rotation);
  this.ship.setRotateInput(delta / this.ship.rotationSpeed);
};

ShipAi.prototype.decelerate = function() {
  this.ship.setThrustInput(0, true);
  var speed = this.ship.vel.length();
  if (speed === 0) return;

  // point against the velocity
  var targetDir = this.ship.vel.normalized().neg();
  var targetAngle = targetDir.angle();
  var delta = angleSubtract(targetAngle, this.ship.rotation);
  if (Math.abs(delta) !== 0) {
    this.ship.setRotateInput(delta / this.ship.rotationSpeed);
    return;
  }

  var thrustInput = Math.min(speed / this.ship.thrustAmt, 1);
  this.ship.setThrustInput(thrustInput, true);
};

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

ShipAi.prototype.draw = function(context) {
  var drawHealth = this.selected || this.ship.health < 1;
  if (drawHealth) this.ship.drawHealthBar(context);
  if (this.selected) {
    this.ship.drawSelectionCircle(context);

    for (var i = 0; i < this.commands.length; i += 1) {
      this.commands[i].draw(this, context);
    }
  }
};

ShipAi.prototype.select = function() {
  this.selected = true;
};

ShipAi.prototype.deselect = function() {
  this.selected = false;
};

ShipAi.prototype.commandToPoint = function(dir) {
  this.commands.push(new PointCommand(dir));
};

ShipAi.prototype.commandToMove = function(pt) {
  this.commands.push(new MoveCommand(pt));
};

ShipAi.prototype.calcTimeToStop = function() {
  // returns the amount of time it would take to stop at current velocity
  var timeTo180 = this.hasBackwardsThrusters ? 0 : Math.PI / this.ship.rotationSpeed;
  var speed = this.ship.vel.length();
  var decelTime = speed / this.ship.thrustAmt;
  return timeTo180 + decelTime;
};

ShipAi.prototype.calcStopDistance = function() {
  // returns the distance the ship will travel before it comes to a rest if we
  // try to stop right now.
  if (this.ship.vel.lengthSqrd() === 0) return 0;
  var timeTo180 = this.hasBackwardsThrusters ? 0 : Math.PI / this.ship.rotationSpeed;
  var speed = this.ship.vel.length();
  var distance = timeTo180 * speed;
  var decelTime = speed / this.ship.thrustAmt;
  distance += decelTime * speed - decelTime * this.ship.thrustAmt * this.ship.thrustAmt;
  return distance;
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

function angleSubtract(left, right) {
  // subtract right from left and return the smallest absolute correct answer
  // 359 - 1 should equal -2 (except in radians)
  var delta = left - right;
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta < -Math.PI) delta += 2 * Math.PI;
  return delta;
}

function PointCommand(dir) {
  this.dir = dir;
  this.done = false;
}

PointCommand.prototype.execute = function(ai, dt, dx) {
  var targetAngle = this.dir.angle();
  var delta = angleSubtract(targetAngle, ai.ship.rotation);
  ai.ship.setRotateInput(delta / ai.ship.rotationSpeed);
  this.done = Math.abs(delta) < Math.PI / 20;
};

PointCommand.prototype.draw = function(ai, context) { };

function MoveCommand(dest) {
  this.dest = dest;
  this.done = false;
  this.threshold = 40; // stop when distanceSqrd < this
}

MoveCommand.prototype.execute = function(ai, dt, dx) {
  var targetDir = this.dest.minus(ai.ship.pos).normalize();
  var actualDir = v.unit(ai.ship.rotation);
  var closeEnough = ai.ship.pos.distanceSqrd(this.dest) < this.threshold;

  // consider the distance we would travel if we tried to stop right now.
  // if that distance is further than the destination, stop now.
  var stopDistance = ai.calcStopDistance();
  if (stopDistance > ai.ship.pos.distance(this.dest)) {
    ai.decelerate();
  } else if (closeEnough) {
    ai.decelerate();
  } else if (actualDir.dot(targetDir) > 0) {
    // thrusting would get us closer to our target
    ai.ship.setThrustInput(1);
    ai.pointTowardDirection(targetDir);
  } else {
    ai.pointTowardDirection(targetDir);
  }
  var stopped = ai.ship.vel.lengthSqrd() === 0;
  this.done = stopped && closeEnough;
};

MoveCommand.prototype.draw = function(ai, context) {
  context.fillStyle = "#ffffff";
  context.fillRect(this.dest.x - 4, this.dest.y - 4, 8, 8);
};

