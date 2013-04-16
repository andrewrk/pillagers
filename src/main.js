//depend "chem"
//depend "ship"
//depend "ship_ai"
//depend "explosion"
//depend "bullet"
var Chem = window.Chem
  , v = Chem.Vec2d
  , SS = window.SS
  , Ship = SS.Ship
  , ShipAi = SS.ShipAi
  , BULLET_SPEED = 10

Chem.onReady(function () {
  var canvas = document.getElementById("game");
  var engine = new Chem.Engine(canvas);
  engine.setSize(v(1067, 600));

  var state = new State(engine);
  var paused = false;

  // add ship on the left
  state.createShip(0, v(200, 200));
  state.createShip(1, v(500, 200));

  engine.on('update', onUpdate);
  
  engine.on('buttondown', function(button) {
    if (button === Chem.Button.Mouse_Left) {
      // manual override ship
      var aiShip = clickedAiShip(engine.mouse_pos);
      if (aiShip) {
        state.beginManualOverride(aiShip);
      } else {
        state.endManualOverride();
      }
    } else if (button === Chem.Button.Mouse_Right) {
      // place ship
      var team = engine.buttonState(Chem.Button.Key_2) ? 1 : 0;
      state.createShip(team, engine.mouse_pos.clone());
    } else if (button === Chem.Button.Key_P) {
      paused = !paused;
      if (paused) {
        engine.removeListener('update', onUpdate);
      } else {
        engine.on('update', onUpdate);
      }
    }
  });
  engine.on('draw', function (context) {
    // clear canvas to black
    context.fillStyle = '#000000'
    context.fillRect(0, 0, engine.size.x, engine.size.y);

    // draw all sprites in batch
    engine.draw(state.batch);
    for (var id in state.aiObjects) {
      var ai = state.aiObjects[id];
      ai.draw(context);
    }

    if (paused) {
      context.fillStyle = '#ffffff';
      context.font = "20pt monospace";
      context.fillText("PAUSED", engine.size.x / 2, engine.size.y / 2);
    }

    // draw a little fps counter in the corner
    context.fillStyle = '#ffffff'
    context.font = "12pt monospace";
    engine.drawFps();
  });
  engine.start();
  canvas.focus();

  function onUpdate (dt, dx) {
    var id;
    for (id in state.physicsObjects) {
      var obj = state.physicsObjects[id];
      obj.update(dt, dx, state);
    }

    for (id in state.aiObjects) {
      var ai = state.aiObjects[id];
      if (state.manualOverride === ai.id) {
        var ship = ai.ship;
        // rotate the ship with left and right arrow keys
        ship.rotateInput = 0;
        if (engine.buttonState(Chem.Button.Key_Left)) ship.rotateInput -= 1;
        if (engine.buttonState(Chem.Button.Key_Right)) ship.rotateInput += 1;

        // apply forward and backward thrust with up and down arrow keys
        var thrust = 0;
        if (engine.buttonState(Chem.Button.Key_Up)) thrust += 1;
        if (engine.buttonState(Chem.Button.Key_Down)) thrust -= 1;
        ship.setThrustInput(thrust);

        ship.shootInput = engine.buttonState(Chem.Button.Key_Space) ? 1 : 0;
      } else {
        ai.update(dt, dx, state);
      }
    }
  }

  function clickedAiShip(pos) {
    for (var id in state.aiObjects) {
      var ai = state.aiObjects[id];
      if (ai.ship.pos.distanceTo(pos) < 25) {
        return ai;
      }
    }
    return null;
  }
});

function State(engine) {
  this.physicsObjects = {};
  this.aiObjects = {};
  this.manualOverride = null;
  this.engine = engine;
  this.batch = new Chem.Batch();
}

State.prototype.beginManualOverride = function(ai) {
  assert(ai.id);
  this.manualOverride = ai.id;
}

State.prototype.endManualOverride = function() {
  this.manualOverride = null;
}

State.prototype.addPhysicsObject = function(o) {
  assert(o.id);
  this.physicsObjects[o.id] = o;
};

State.prototype.deletePhysicsObject = function(o) {
  assert(o.id);
  delete this.physicsObjects[o.id];
}

State.prototype.addAiObject = function(o) {
  assert(o.id);
  this.aiObjects[o.id] = o;
};

State.prototype.createShip = function(team, pos) {
  var ship = new Ship({team: team, pos: pos});
  this.batch.add(ship.sprite);
  this.addPhysicsObject(ship);
  var shipAi = new ShipAi(ship);
  this.addAiObject(shipAi);
};

State.prototype.deleteShip = function(ai) {
  delete this.aiObjects[ai.id];
  delete this.physicsObjects[ai.ship.id];
  ai.delete();
};

State.prototype.createExplosion = function(pos, vel) {
  var explosion = new SS.Explosion(pos, vel);
  this.addPhysicsObject(explosion);
  this.batch.add(explosion.sprite);
};

State.prototype.deleteExplosion = function(explosion) {
  delete this.physicsObjects[explosion.id];
  explosion.delete();
};

State.prototype.createBullet = function(pos, dir, team) {
  var vel = dir.scaled(BULLET_SPEED);
  var bullet = new SS.Bullet(pos, vel, team);
  this.batch.add(bullet.sprite);
  this.addPhysicsObject(bullet);
};

State.prototype.isOffscreen = function(pos) {
  return (pos.x < 0 || pos.x > this.engine.size.x || pos.y < 0 || pos.y > this.engine.size.y);
};

function assert(value) {
  if (!value) throw new Error("Assertion Failure: " + value);
}
